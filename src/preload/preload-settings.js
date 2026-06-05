const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('settingsAPI', {
  getEntries: () => ipcRenderer.invoke('get-entries'),
  addEntry: (data) => ipcRenderer.invoke('add-entry', data),
  updateEntry: (id, fields) => ipcRenderer.invoke('update-entry', id, fields),
  deleteEntry: (id) => ipcRenderer.invoke('delete-entry', id),
  getProviders: () => ipcRenderer.invoke('get-providers'),
  getCustomProviders: () => ipcRenderer.invoke('get-custom-providers'),
  addCustomProvider: (data) => ipcRenderer.invoke('add-custom-provider', data),
  updateCustomProvider: (id, fields) => ipcRenderer.invoke('update-custom-provider', id, fields),
  deleteCustomProvider: (id) => ipcRenderer.invoke('delete-custom-provider', id),
  getRefreshInterval: () => ipcRenderer.invoke('get-refresh-interval'),
  setRefreshInterval: (minutes) => ipcRenderer.invoke('set-refresh-interval', minutes),
  getLanguage: () => ipcRenderer.invoke('get-language'),
  setLanguage: (lang) => ipcRenderer.invoke('set-language', lang),
  getEntryListEnabled: () => ipcRenderer.invoke('get-entry-list-enabled'),
  setEntryListEnabled: (enabled) => ipcRenderer.invoke('set-entry-list-enabled', enabled),
  closeWindow: () => ipcRenderer.send('close-settings'),
  browseAuthFile: () => ipcRenderer.invoke('browse-auth-file'),
  browseLogoFile: () => ipcRenderer.invoke('browse-logo-file'),
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
