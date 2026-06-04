const DEFAULT_RETRIES = 2;
const DEFAULT_TIMEOUT_MS = 10000;
const DEFAULT_RETRY_DELAY_MS = 800;
const { net } = require('electron');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isRetryableStatus(status) {
  return status === 408 || status === 429 || status >= 500;
}

async function fetchJsonWithRetry(url, options = {}, retryOptions = {}) {
  const retries = retryOptions.retries ?? DEFAULT_RETRIES;
  const timeoutMs = retryOptions.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retryDelayMs = retryOptions.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;
  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await getFetchImpl()(url, {
        ...options,
        signal: controller.signal,
      });

      if (isRetryableStatus(response.status) && attempt < retries) {
        lastError = Object.assign(
          new Error(`API temporarily unavailable: ${response.status} ${response.statusText}`),
          { code: 'API_RETRYABLE', status: response.status }
        );
        await sleep(retryDelayMs * (attempt + 1));
        continue;
      }

      if (!response.ok) {
        return { response, data: null };
      }

      let data = null;
      try {
        data = await response.json();
      } catch {
        if (attempt < retries) {
          lastError = Object.assign(
            new Error('Unexpected API response format. Retrying...'),
            { code: 'PARSE_RETRYABLE', status: response.status }
          );
          await sleep(retryDelayMs * (attempt + 1));
          continue;
        }

        throw Object.assign(
          new Error('Unexpected API response format.'),
          { code: 'PARSE_ERROR', status: response.status }
        );
      }

      return { response, data };
    } catch (err) {
      lastError = normalizeFetchError(err);
      if (attempt >= retries || !isRetryableError(lastError)) {
        throw lastError;
      }
      await sleep(retryDelayMs * (attempt + 1));
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError || Object.assign(
    new Error('Network error. Check your connection.'),
    { code: 'NETWORK' }
  );
}

function normalizeFetchError(err) {
  if (err && err.code) return err;
  if (err && err.name === 'AbortError') {
    return Object.assign(
      new Error('Request timed out. Try again later.'),
      { code: 'TIMEOUT' }
    );
  }
  return Object.assign(
    new Error('Network error. Check your connection.'),
    { code: 'NETWORK' }
  );
}

function isRetryableError(err) {
  return err && (
    err.code === 'NETWORK' ||
    err.code === 'TIMEOUT' ||
    err.code === 'API_RETRYABLE' ||
    err.code === 'PARSE_RETRYABLE'
  );
}

function getFetchImpl() {
  if (net && typeof net.fetch === 'function') {
    return net.fetch.bind(net);
  }
  return fetch;
}

module.exports = { fetchJsonWithRetry };
