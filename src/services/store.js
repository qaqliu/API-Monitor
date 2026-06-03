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
          },
        },
      },
      currentIndex: { type: 'number', default: 0 },
      refreshInterval: { type: 'number', default: 5, minimum: 1, maximum: 60 },
      language: { type: 'string', default: 'zh-CN' },
      windowPosition: { type: ['object', 'null'], default: null },
    },
  });
}

// --- Entries CRUD ---
function getEntries() { return store.get('entries', []); }

function getEntry(id) { return getEntries().find(e => e.id === id) || null; }

function addEntry(entry) {
  const entries = getEntries();
  entry.id = crypto.randomUUID();
  entry.refreshInterval = entry.refreshInterval ?? null;
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

module.exports = {
  initStore,
  getEntries, getEntry, addEntry, updateEntry, deleteEntry,
  getCurrentIndex, setCurrentIndex,
  getRefreshInterval, setRefreshInterval,
  getLanguage, setLanguage,
  getWindowPosition, setWindowPosition,
};
