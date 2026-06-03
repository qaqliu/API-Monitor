const { ipcMain, app } = require('electron');
const { fetchBalanceByEntry } = require('../services/providers');
const {
  getEntries, getEntry, addEntry, updateEntry, deleteEntry,
  getCurrentIndex, setCurrentIndex,
  getRefreshInterval, setRefreshInterval,
  getLanguage, setLanguage,
} = require('../services/store');
const { restartAutoRefresh } = require('./auto-refresh');
const { updateTrayTooltip } = require('./tray');
let widgetWindow = null;
let settingsWindow = null;
let createSettingsWindowFn = null;

function notifyEntriesChanged() {
  if (widgetWindow && !widgetWindow.isDestroyed()) {
    widgetWindow.webContents.send('entries-changed');
  }
}

function getEntryRefreshMs() {
  const entries = getEntries();
  const idx = getCurrentIndex();
  const entry = entries[idx];
  const minutes = (entry && entry.refreshInterval != null)
    ? entry.refreshInterval
    : getRefreshInterval();
  return minutes * 60 * 1000;
}

function registerIpcHandlers(widgetWin, createSettingsFn) {
  widgetWindow = widgetWin;
  createSettingsWindowFn = createSettingsFn;

  // --- Balance ---
  ipcMain.handle('get-balance', async (_event, entryId) => {
    const entry = getEntry(entryId);
    if (!entry) {
      return { error: 'NOT_FOUND', message: 'Entry not found.' };
    }

    try {
      const balance = await fetchBalanceByEntry(entry);
      // update tray tooltip only if this is the current entry
      const idx = getCurrentIndex();
      const currEntries = getEntries();
      if (currEntries[idx] && currEntries[idx].id === entryId) {
        updateTrayTooltip(balance, entry);
      }
      return { success: true, data: balance };
    } catch (err) {
      return { error: err.code || 'UNKNOWN', message: err.message };
    }
  });

  // --- Entries CRUD ---
  ipcMain.handle('get-entries', () => {
    const entries = getEntries();
    // Return with masked keys
    return entries.map(e => ({
      id: e.id,
      name: e.name,
      provider: e.provider,
      apiKey: maskKey(e.apiKey),
      refreshInterval: e.refreshInterval,
    }));
  });

  ipcMain.handle('add-entry', (_event, data) => {
    const entry = addEntry({
      name: data.name || '',
      provider: data.provider,
      apiKey: data.apiKey,
      refreshInterval: data.refreshInterval ?? null,
    });
    if (getEntries().length === 1) setCurrentIndex(0);
    notifyEntriesChanged();
    return { success: true, entry: { ...entry, apiKey: maskKey(entry.apiKey) } };
  });

  ipcMain.handle('update-entry', (_event, id, fields) => {
    updateEntry(id, fields);
    // restart timer if current entry's interval changed
    const entries = getEntries();
    const idx = getCurrentIndex();
    if (entries[idx] && entries[idx].id === id) {
      restartAutoRefresh(widgetWindow, getEntryRefreshMs());
    }
    notifyEntriesChanged();
    return { success: true };
  });

  ipcMain.handle('delete-entry', (_event, id) => {
    deleteEntry(id);
    notifyEntriesChanged();
    return { success: true };
  });

  // --- Current Index ---
  ipcMain.handle('get-current-index', () => {
    return getCurrentIndex();
  });

  ipcMain.handle('set-current-index', (_event, index) => {
    const entries = getEntries();
    const clamped = Math.max(0, Math.min(index, entries.length - 1));
    setCurrentIndex(clamped);
    restartAutoRefresh(widgetWindow, getEntryRefreshMs());
    return clamped;
  });

  // --- Entry Refresh Interval ---
  ipcMain.handle('get-entry-refresh-ms', () => {
    return getEntryRefreshMs();
  });

  // --- Global Settings ---
  ipcMain.handle('get-refresh-interval', () => {
    return getRefreshInterval();
  });

  ipcMain.handle('set-refresh-interval', (_event, minutes) => {
    setRefreshInterval(minutes);
    restartAutoRefresh(widgetWindow, getEntryRefreshMs());
    return { success: true };
  });

  // --- Language ---
  ipcMain.handle('get-language', () => getLanguage());

  ipcMain.handle('set-language', (_event, lang) => {
    setLanguage(lang);
    if (widgetWindow && !widgetWindow.isDestroyed()) {
      widgetWindow.webContents.send('language-changed', lang);
    }
    return { success: true };
  });

  // --- Widget window actions ---
  ipcMain.on('minimize-widget', () => {
    if (widgetWindow && !widgetWindow.isDestroyed()) widgetWindow.hide();
  });

  ipcMain.on('resize-widget', (_event, provider) => {
    if (!widgetWindow || widgetWindow.isDestroyed()) return;
    const h = provider === 'codex' ? 390 : 340;
    const [x, y] = widgetWindow.getPosition();
    const newY = Math.max(0, y + (widgetWindow.getSize()[1] - h));
    widgetWindow.setBounds({ x, y: newY, width: 260, height: h });
  });

  ipcMain.on('quit-app', () => {
    app.quit();
  });

  ipcMain.on('open-settings', () => {
    if (createSettingsWindowFn) createSettingsWindowFn();
  });

  ipcMain.on('close-settings', () => {
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      settingsWindow.close();
      settingsWindow = null;
    }
  });

  // --- File browse ---
  const { dialog } = require('electron');
  ipcMain.handle('browse-auth-file', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Select auth.json',
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] },
      ],
      properties: ['openFile'],
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  });

  // --- Updater ---
  const { downloadUpdate, getUpdateStatus, quitAndInstall } = require('./updater');

  ipcMain.handle('get-update-status', () => getUpdateStatus());

  ipcMain.handle('check-for-updates', async () => {
    const { checkForUpdates } = require('./updater');
    await checkForUpdates({ manual: true });
    return { success: true };
  });

  ipcMain.handle('download-update', async () => {
    await downloadUpdate();
    return { success: true };
  });

  ipcMain.handle('quit-and-install', () => {
    quitAndInstall();
    return { success: true };
  });
}

function maskKey(key) {
  if (!key || key.length < 8) return key;
  return key.substring(0, 4) + '*'.repeat(Math.min(key.length - 8, 20)) + key.slice(-4);
}

function setSettingsWindow(win) { settingsWindow = win; }
function getSettingsWindow() { return settingsWindow; }

module.exports = { registerIpcHandlers, setSettingsWindow, getSettingsWindow };
