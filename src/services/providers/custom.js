const { fetchJsonWithRetry } = require('./http');

function createCustomProvider(definition) {
  return {
    id: definition.id,
    name: definition.name,
    logo: definition.logo || defaultLogo(definition.name),
    custom: true,
    monitors: Array.isArray(definition.monitors) ? definition.monitors : [],
    fetchBalance: (entry) => fetchCustomBalance(entry, definition),
  };
}

async function fetchCustomBalance(entry, definition) {
  const monitors = Array.isArray(definition.monitors) ? definition.monitors : [];
  const customItems = [];
  for (const item of monitors) {
    if (item.type === 'dashboard') {
      customItems.push({ id: item.id || '', type: 'dashboard', label: item.label || 'Dashboard', url: item.url || '' });
      continue;
    }

    if (item.type !== 'balance') continue;

    const { response, data } = await fetchJsonWithRetry(buildUrl(definition.baseUrl, item.path), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${entry.apiKey}`,
        Accept: 'application/json',
      },
    });

    if (response.status === 401 || response.status === 403) {
      throw Object.assign(new Error('Invalid API key. Check your key in Settings.'), {
        code: 'INVALID_KEY',
        status: response.status,
      });
    }

    if (!response.ok) {
      throw Object.assign(new Error(`API error: ${response.status} ${response.statusText}`), {
        code: 'API_ERROR',
        status: response.status,
      });
    }

    customItems.push({
      id: item.id || '',
      type: 'balance',
      label: item.label || item.path || 'Value',
      value: safeNumber(readJsonPath(data, item.jsonPath)),
    });
  }

  return {
    provider: 'custom',
    providerId: definition.id,
    customItems,
  };
}

function buildUrl(baseUrl, relativePath) {
  const base = String(baseUrl || '').replace(/\/+$/, '');
  const path = String(relativePath || '').replace(/^\/+/, '');
  return path ? `${base}/${path}` : base;
}

function readJsonPath(data, jsonPath) {
  if (!jsonPath) return undefined;
  const parts = String(jsonPath).replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean);
  return parts.reduce((value, key) => (value == null ? undefined : value[key]), data);
}

function safeNumber(value) {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function defaultLogo(name) {
  const letter = (name || 'P').trim().charAt(0).toUpperCase() || 'P';
  return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="14" fill="#4caf84"/><text x="32" y="40" text-anchor="middle" font-size="28" font-family="Arial, sans-serif" fill="white" font-weight="700">${letter}</text></svg>`;
}

module.exports = { createCustomProvider, defaultLogo };
