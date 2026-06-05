const Store = require('electron-store');
const crypto = require('crypto');
const { app } = require('electron');

let store;

function initStore() {
  const encryptionKey = crypto.createHash('sha256')
    .update('deepseek-api-monitor-v2' + app.getPath('userData'))
    .digest('hex');

  store = new Store({
    encryptionKey,
    schema: {
      entries: {
        type: 'array',
        default: [],
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string', default: '' },
            provider: { type: 'string' },
            apiKey: { type: 'string' },
            refreshInterval: { type: ['number', 'null'], default: null },
            simpleMode: { type: 'boolean', default: false },
          },
        },
      },
      customProviders: {
        type: 'array',
        default: [],
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            baseUrl: { type: 'string' },
            logo: { type: 'string' },
            monitors: { type: 'array', default: [] },
            widgetHeight: { type: 'number' },
            widgetCardHeight: { type: 'number' },
            widgetHtml: { type: 'string' },
          },
        },
      },
      currentIndex: { type: 'number', default: 0 },
      refreshInterval: { type: 'number', default: 5, minimum: 1, maximum: 60 },
      language: { type: 'string', default: 'zh-CN' },
      windowPosition: { type: ['object', 'null'], default: null },
    },
  });
  migrateCustomProviderWidgetHeights();
}

// --- Entries CRUD ---
function getEntries() { return store.get('entries', []); }

function getEntry(id) { return getEntries().find(e => e.id === id) || null; }

function addEntry(entry) {
  const entries = getEntries();
  entry.id = crypto.randomUUID();
  entry.refreshInterval = entry.refreshInterval ?? null;
  entry.simpleMode = Boolean(entry.simpleMode);
  entries.push(entry);
  store.set('entries', entries);
  return entry;
}

function updateEntry(id, fields) {
  const entries = getEntries();
  const idx = entries.findIndex(e => e.id === id);
  if (idx === -1) return null;
  if ('apiKey' in fields && fields.apiKey !== undefined) entries[idx].apiKey = fields.apiKey;
  if ('name' in fields) entries[idx].name = fields.name;
  if ('refreshInterval' in fields) entries[idx].refreshInterval = fields.refreshInterval;
  if ('provider' in fields) entries[idx].provider = fields.provider;
  if ('simpleMode' in fields) entries[idx].simpleMode = Boolean(fields.simpleMode);
  store.set('entries', entries);
  return entries[idx];
}

function deleteEntry(id) {
  const entries = getEntries();
  const filtered = entries.filter(e => e.id !== id);
  store.set('entries', filtered);

  let currentIndex = getCurrentIndex();
  if (currentIndex >= filtered.length) {
    currentIndex = Math.max(0, filtered.length - 1);
    setCurrentIndex(currentIndex);
  }
  return filtered;
}

// --- Current Index ---
function getCurrentIndex() { return store.get('currentIndex', 0); }
function setCurrentIndex(index) { store.set('currentIndex', index); }

// --- Global Refresh Interval ---
function getRefreshInterval() { return store.get('refreshInterval', 5); }
function setRefreshInterval(minutes) { store.set('refreshInterval', Number(minutes)); }

// --- Language ---
function getLanguage() { return store.get('language', 'zh-CN'); }
function setLanguage(lang) { store.set('language', lang); }

// --- Window Position ---
function getWindowPosition() { return store.get('windowPosition', null); }
function setWindowPosition(x, y) { store.set('windowPosition', { x, y }); }

// --- Custom Providers ---
function calculateCustomProviderWidgetHeight(monitors) {
  const count = Math.max(1, Array.isArray(monitors) ? monitors.length : 0);
  const widgetHeight = Math.min(300, Math.max(108, 76 + count * 34));
  return 140 + widgetHeight + 20;
}

function calculateCustomProviderWidgetCardHeight(monitors) {
  const count = Math.max(1, Array.isArray(monitors) ? monitors.length : 0);
  return Math.min(300, Math.max(108, 76 + count * 34));
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildCustomProviderWidgetHtml(monitors) {
  return (Array.isArray(monitors) ? monitors : []).map(block => {
    const id = escapeHtml(block.id || '');
    const label = escapeHtml(block.label || (block.type === 'dashboard' ? 'Dashboard' : 'Value'));
    if (block.type === 'dashboard') {
      const url = escapeHtml(block.url || '');
      return `<button class="custom-dashboard-btn" data-custom-dashboard-url="${url}">${label}</button>`;
    }
    return `<div class="balance-row" data-custom-monitor-id="${id}"><span class="label">${label}</span><span class="value custom-balance-value" data-custom-monitor-id="${id}">--</span></div>`;
  }).join('');
}

function buildCustomProviderWidgetUi(monitors) {
  return {
    widgetHeight: calculateCustomProviderWidgetHeight(monitors),
    widgetCardHeight: calculateCustomProviderWidgetCardHeight(monitors),
    widgetHtml: buildCustomProviderWidgetHtml(monitors),
  };
}

function normalizeCustomProvider(provider) {
  const monitors = Array.isArray(provider.monitors) ? provider.monitors : [];
  const ui = buildCustomProviderWidgetUi(monitors);
  return {
    ...provider,
    monitors,
    widgetHeight: Number.isFinite(provider.widgetHeight) ? provider.widgetHeight : ui.widgetHeight,
    widgetCardHeight: Number.isFinite(provider.widgetCardHeight) ? provider.widgetCardHeight : ui.widgetCardHeight,
    widgetHtml: provider.widgetHtml || ui.widgetHtml,
  };
}

function migrateCustomProviderWidgetHeights() {
  const providers = store.get('customProviders', []);
  let changed = false;
  const normalized = providers.map(provider => {
    const next = normalizeCustomProvider(provider);
    if (next.widgetHeight !== provider.widgetHeight) changed = true;
    if (next.widgetCardHeight !== provider.widgetCardHeight) changed = true;
    if (next.widgetHtml !== provider.widgetHtml) changed = true;
    return next;
  });
  if (changed) store.set('customProviders', normalized);
}

function getCustomProviders() { return store.get('customProviders', []).map(normalizeCustomProvider); }

function getCustomProvider(id) {
  return getCustomProviders().find(p => p.id === id) || null;
}

function addCustomProvider(provider) {
  const providers = getCustomProviders();
  const monitors = Array.isArray(provider.monitors) ? provider.monitors : [];
  const ui = buildCustomProviderWidgetUi(monitors);
  const created = {
    id: crypto.randomUUID(),
    name: provider.name || '',
    baseUrl: provider.baseUrl || '',
    logo: provider.logo || '',
    monitors,
    ...ui,
  };
  providers.push(created);
  store.set('customProviders', providers);
  return created;
}

function updateCustomProvider(id, fields) {
  const providers = getCustomProviders();
  const idx = providers.findIndex(p => p.id === id);
  if (idx === -1) return null;
  if ('name' in fields) providers[idx].name = fields.name;
  if ('baseUrl' in fields) providers[idx].baseUrl = fields.baseUrl;
  if ('logo' in fields) providers[idx].logo = fields.logo;
  if ('monitors' in fields) {
    providers[idx].monitors = Array.isArray(fields.monitors) ? fields.monitors : [];
    Object.assign(providers[idx], buildCustomProviderWidgetUi(providers[idx].monitors));
  }
  store.set('customProviders', providers);
  return providers[idx];
}

function deleteCustomProvider(id) {
  store.set('customProviders', getCustomProviders().filter(p => p.id !== id));
  const entries = getEntries().filter(e => e.provider !== id);
  store.set('entries', entries);
  if (getCurrentIndex() >= entries.length) setCurrentIndex(Math.max(0, entries.length - 1));
  return entries;
}

module.exports = {
  initStore,
  getEntries, getEntry, addEntry, updateEntry, deleteEntry,
  getCurrentIndex, setCurrentIndex,
  getRefreshInterval, setRefreshInterval,
  getLanguage, setLanguage,
  getWindowPosition, setWindowPosition,
  calculateCustomProviderWidgetHeight, calculateCustomProviderWidgetCardHeight, buildCustomProviderWidgetHtml,
  getCustomProviders, getCustomProvider, addCustomProvider, updateCustomProvider, deleteCustomProvider,
};
