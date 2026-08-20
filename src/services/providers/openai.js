// OpenAI organization usage provider

const { fetchJsonWithRetry } = require('./http');
const { logo: LOGO } = require('./codex');

const PROVIDER_ID = 'openai';
const PROVIDER_NAME = 'OpenAI';
const DASHBOARD_URL = 'https://platform.openai.com/usage';

function getCurrentMonthRange() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    startTime: Math.floor(monthStart.getTime() / 1000),
    endTime: Math.floor(now.getTime() / 1000),
  };
}

async function fetchOpenAIJson(apiKey, url) {
  const { response, data } = await fetchJsonWithRetry(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    },
  });

  if (response.status === 401 || response.status === 403) {
    throw Object.assign(
      new Error('Invalid Admin API Key or insufficient organization permissions.'),
      { code: 'INVALID_KEY', status: response.status }
    );
  }

  if (!response.ok) {
    throw Object.assign(
      new Error(`API error: ${response.status} ${response.statusText}`),
      { code: 'API_ERROR', status: response.status }
    );
  }

  return data;
}

function buildQuery(path, startTime, endTime) {
  const query = new URLSearchParams({
    start_time: String(startTime),
    end_time: String(endTime),
    bucket_width: '1d',
    limit: '31',
  });
  return `https://api.openai.com/v1/organization/${path}?${query}`;
}

function sumBuckets(data, readResult) {
  const buckets = Array.isArray(data && data.data) ? data.data : [];
  return buckets.reduce((total, bucket) => {
    const results = Array.isArray(bucket && bucket.results) ? bucket.results : [];
    return total + results.reduce((subtotal, result) => subtotal + readResult(result), 0);
  }, 0);
}

function toNumber(value) {
  if (value == null || value === '') return 0;
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

async function fetchBalance(apiKey) {
  if (!apiKey || !apiKey.trim()) {
    throw Object.assign(
      new Error('OpenAI requires an organization Admin API Key.'),
      { code: 'INVALID_KEY' }
    );
  }

  const { startTime, endTime } = getCurrentMonthRange();
  const [usage, costs] = await Promise.all([
    fetchOpenAIJson(apiKey, buildQuery('usage/completions', startTime, endTime)),
    fetchOpenAIJson(apiKey, buildQuery('costs', startTime, endTime)),
  ]);

  const inputTokens = sumBuckets(usage, result => toNumber(result.input_tokens));
  const outputTokens = sumBuckets(usage, result => toNumber(result.output_tokens));
  const requestCount = sumBuckets(usage, result => toNumber(result.num_model_requests));
  const spend = sumBuckets(costs, result => toNumber(result.amount && result.amount.value));

  return {
    provider: PROVIDER_ID,
    current_month_spend: spend,
    current_month_currency: 'USD',
    current_month_input_tokens: inputTokens,
    current_month_output_tokens: outputTokens,
    current_month_tokens: inputTokens + outputTokens,
    current_month_requests: requestCount,
    period_start: startTime,
    period_end: endTime,
    dashboard_url: DASHBOARD_URL,
  };
}

module.exports = {
  id: PROVIDER_ID,
  name: PROVIDER_NAME,
  logo: LOGO,
  fetchBalance,
};
