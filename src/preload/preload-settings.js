const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('settingsAPI', {
  getEntries: () => ipcRenderer.invoke('get-entries'),
  addEntry: (data) => ipcRenderer.invoke('add-entry', data),
  updateEntry: (id, fields) => ipcRenderer.invoke('update-entry', id, fields),
  deleteEntry: (id) => ipcRenderer.invoke('delete-entry', id),
  getRefreshInterval: () => ipcRenderer.invoke('get-refresh-interval'),
  setRefreshInterval: (minutes) => ipcRenderer.invoke('set-refresh-interval', minutes),
  getLanguage: () => ipcRenderer.invoke('get-language'),
  setLanguage: (lang) => ipcRenderer.invoke('set-language', lang),
  closeWindow: () => ipcRenderer.send('close-settings'),
  browseAuthFile: () => ipcRenderer.invoke('browse-auth-file'),
  getUpdateStatus: () => ipcRenderer.invoke('get-update-status'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  quitAndInstall: () => ipcRenderer.invoke('quit-and-install'),
  onUpdateEvent: (channel, callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on(channel, handler);
    return () => ipcRenderer.removeListener(channel, handler);
  },
});
