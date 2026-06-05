const { ipcMain, app, shell, screen } = require('electron');
const { fetchBalanceByEntry } = require('../services/providers');
const { getAllProviders } = require('../services/providers');
const {
  getEntries, getEntry, addEntry, updateEntry, deleteEntry,
  getCurrentIndex, setCurrentIndex,
  getRefreshInterval, setRefreshInterval,
  getLanguage, setLanguage,
  getEntryListEnabled, setEntryListEnabled,
  getCustomProviders, addCustomProvider, updateCustomProvider, deleteCustomProvider,
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
    const providers = getAllProviders();
    // Return with masked keys
    return entries.map(e => {
      const provider = providers.find(p => p.id === e.provider) || {};
      return {
      id: e.id,
      name: e.name,
      provider: e.provider,
      providerName: provider.name || e.provider,
      providerLogo: provider.logo || '',
      providerCustom: Boolean(provider.custom),
      providerMonitors: provider.monitors || [],
      providerWidgetHeight: provider.widgetHeight,
      providerWidgetCardHeight: provider.widgetCardHeight,
      providerWidgetHtml: provider.widgetHtml || '',
      apiKey: maskKey(e.apiKey),
      refreshInterval: e.refreshInterval,
      simpleMode: Boolean(e.simpleMode),
    };
    });
  });

  ipcMain.handle('add-entry', (_event, data) => {
    const entry = addEntry({
      name: data.name || '',
      provider: data.provider,
      apiKey: data.apiKey,
      refreshInterval: data.refreshInterval ?? null,
      simpleMode: Boolean(data.simpleMode),
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

  ipcMain.handle('get-providers', () => getAllProviders());

  ipcMain.handle('get-custom-providers', () => getCustomProviders());

  ipcMain.handle('add-custom-provider', (_event, data) => {
    const provider = addCustomProvider(data);
    notifyEntriesChanged();
    return { success: true, provider };
  });

  ipcMain.handle('update-custom-provider', (_event, id, fields) => {
    updateCustomProvider(id, fields);
    notifyEntriesChanged();
    return { success: true };
  });

  ipcMain.handle('delete-custom-provider', (_event, id) => {
    deleteCustomProvider(id);
    notifyEntriesChanged();
    return { success: true };
  });

  // --- Current Index ---
  ipcMain.handle('get-current-index', () => {
    return getCurrentIndex();
  });

  ipcMain.handle('set-current-index', (_event, index) => {
    const entries = getEntries();
    if (entries.length === 0) {
      setCurrentIndex(0);
      return 0;
    }
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

  // --- Entry selector list ---
  ipcMain.handle('get-entry-list-enabled', () => getEntryListEnabled());

  ipcMain.handle('set-entry-list-enabled', (_event, enabled) => {
    const value = Boolean(enabled);
    setEntryListEnabled(value);
    if (widgetWindow && !widgetWindow.isDestroyed()) {
      widgetWindow.webContents.send('entry-list-enabled-changed', value);
    }
    return { success: true, enabled: value };
  });

  // --- Widget window actions ---
  ipcMain.on('minimize-widget', () => {
    if (widgetWindow && !widgetWindow.isDestroyed()) widgetWindow.hide();
  });

  ipcMain.on('resize-widget', (_event, requested) => {
    if (!widgetWindow || widgetWindow.isDestroyed()) return;
    const provider = typeof requested === 'object' && requested ? requested.provider : requested;
    const sizes = {
      codex: { width: 260, height: 230 },
      'deepseek-compact': { width: 154, height: 90 },
      deepseek: { width: 260, height: 212 },
      custom: { width: 260, height: 212 },
    };
    const size = { ...(sizes[provider] || sizes.deepseek) };
    const listEnabled = typeof requested === 'object' && requested && 'entryListEnabled' in requested
      ? Boolean(requested.entryListEnabled)
      : getEntryListEnabled();
    const reserve = listEnabled ? 160 : 0;
    if (typeof requested === 'object' && requested && requested.cardHeight) {
      size.height = requested.cardHeight;
    }
    size.height += reserve;
    const [x, y] = widgetWindow.getPosition();
    const [oldWidth, oldHeight] = widgetWindow.getSize();
    const display = screen.getDisplayMatching({ x, y, width: oldWidth, height: oldHeight });
    const area = display.workArea;
    const nextX = clamp(x, area.x, area.x + area.width - size.width);
    const nextY = clamp(y + oldHeight - size.height, area.y - reserve, area.y + area.height - size.height);
    widgetWindow.setBounds({ x: nextX, y: nextY, width: size.width, height: size.height });
  });

  ipcMain.on('quit-app', () => {
    app.quit();
  });

  ipcMain.on('open-settings', () => {
    if (createSettingsWindowFn) createSettingsWindowFn();
  });

  ipcMain.on('open-deepseek-dashboard', () => {
    shell.openExternal('https://platform.deepseek.com/usage');
  });

  ipcMain.on('open-external-url', (_event, url) => {
    if (/^https?:\/\//i.test(url || '')) shell.openExternal(url);
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

  ipcMain.handle('browse-logo-file', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Select provider logo',
      filters: [
        { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg'] },
      ],
      properties: ['openFile'],
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    const fs = require('fs');
    const path = require('path');
    const filePath = result.filePaths[0];
    const ext = path.extname(filePath).slice(1).toLowerCase();
    const mime = ext === 'svg' ? 'image/svg+xml' : `image/${ext === 'jpg' ? 'jpeg' : ext}`;
    return {
      name: path.basename(filePath),
      dataUrl: `data:${mime};base64,${fs.readFileSync(filePath).toString('base64')}`,
    };
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

function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

function setSettingsWindow(win) { settingsWindow = win; }
function getSettingsWindow() { return settingsWindow; }

module.exports = { registerIpcHandlers, setSettingsWindow, getSettingsWindow };
