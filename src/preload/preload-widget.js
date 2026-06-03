const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getBalance: (entryId) => ipcRenderer.invoke('get-balance', entryId),
  getEntries: () => ipcRenderer.invoke('get-entries'),
  getCurrentIndex: () => ipcRenderer.invoke('get-current-index'),
  setCurrentIndex: (index) => ipcRenderer.invoke('set-current-index', index),
  getRefreshInterval: () => ipcRenderer.invoke('get-refresh-interval'),
  getLanguage: () => ipcRenderer.invoke('get-language'),
  minimizeWindow: () => ipcRenderer.send('minimize-widget'),
  resizeWidget: (provider) => ipcRenderer.send('resize-widget', provider),
  openSettings: () => ipcRenderer.send('open-settings'),
  quitApp: () => ipcRenderer.send('quit-app'),

  // Auto-update
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  quitAndInstall: () => ipcRenderer.invoke('quit-and-install'),

  onTriggerRefresh: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('trigger-refresh', handler);
    return () => ipcRenderer.removeListener('trigger-refresh', handler);
  },

  onEntriesChanged: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('entries-changed', handler);
    return () => ipcRenderer.removeListener('entries-changed', handler);
  },

  onLanguageChanged: (callback) => {
    const handler = (_event, lang) => callback(lang);
    ipcRenderer.on('language-changed', handler);
    return () => ipcRenderer.removeListener('language-changed', handler);
  },

  onUpdateEvent: (channel, callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on(channel, handler);
    return () => ipcRenderer.removeListener(channel, handler);
  },
});
