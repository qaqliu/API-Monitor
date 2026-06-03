const { autoUpdater } = require('electron-updater');
const { BrowserWindow, app } = require('electron');
const path = require('path');

let widgetWindow = null;

const updateStatus = {
  state: 'idle',
  version: null,
  percent: 0,
  message: '',
  files: [],
};

function initUpdater(widgetWin) {
  widgetWindow = widgetWin;

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;
  if (app.isPackaged) {
    autoUpdater.installDirectory = path.dirname(process.execPath);
  }

  autoUpdater.on('update-available', (info) => {
    updateStatus.state = 'available';
    updateStatus.version = info.version;
    updateStatus.percent = 0;
    updateStatus.message = '';
    broadcastUpdateEvent('update-available', { version: info.version });
  });

  autoUpdater.on('update-not-available', () => {
    updateStatus.state = 'idle';
    updateStatus.version = null;
    updateStatus.percent = 0;
    updateStatus.message = '';
    broadcastUpdateEvent('update-not-available');
  });

  autoUpdater.on('download-progress', (progress) => {
    const percent = Math.round(progress.percent);
    updateStatus.state = 'downloading';
    updateStatus.percent = percent;
    broadcastUpdateEvent('update-progress', { percent });
  });

  autoUpdater.on('update-downloaded', (info) => {
    updateStatus.state = 'downloaded';
    updateStatus.version = info && info.version ? info.version : updateStatus.version;
    updateStatus.percent = 100;
    updateStatus.message = '';
    broadcastUpdateEvent('update-downloaded', { version: updateStatus.version });
  });

  autoUpdater.on('error', (err) => {
    const msg = err ? err.message : '';
    if (msg.includes('Cannot find module') || msg.includes('ENOENT')) return;

    updateStatus.state = 'error';
    updateStatus.message = msg || 'Unknown update error';
    broadcastUpdateEvent('update-error', { message: updateStatus.message });
  });
}

function broadcastUpdateEvent(channel, data) {
  BrowserWindow.getAllWindows()
    .filter(win => !win.isDestroyed())
    .forEach(win => win.webContents.send(channel, data));
}

function getUpdateStatus() {
  return {
    version: app.getVersion(),
    isPackaged: app.isPackaged,
    updateState: updateStatus.state,
    updateVersion: updateStatus.version,
    updatePercent: updateStatus.percent,
    updateMessage: updateStatus.message,
  };
}

function checkForUpdates(options = {}) {
  if (!app.isPackaged) {
    updateStatus.state = 'dev-mode';
    updateStatus.message = 'Updates are only available in packaged builds.';
    if (options.manual) {
      broadcastUpdateEvent('update-dev-mode', { message: updateStatus.message });
    }
    return Promise.resolve({ devMode: true });
  }

  try {
    updateStatus.state = 'checking';
    updateStatus.message = '';
    return autoUpdater.checkForUpdates().catch((err) => {
      updateStatus.state = 'error';
      updateStatus.message = err && err.message ? err.message : 'Unknown update error';
      broadcastUpdateEvent('update-error', { message: updateStatus.message });
      return null;
    });
  } catch {
    return Promise.resolve(null);
  }
}

function downloadUpdate() {
  if (!app.isPackaged) {
    updateStatus.state = 'dev-mode';
    updateStatus.message = 'Updates are only available in packaged builds.';
    broadcastUpdateEvent('update-dev-mode', { message: updateStatus.message });
    return Promise.resolve({ devMode: true });
  }

  updateStatus.state = 'downloading';
  updateStatus.percent = 0;
  return autoUpdater.downloadUpdate().then((files) => {
    updateStatus.files = Array.isArray(files) ? files : [];
    return files;
  });
}

function quitAndInstall() {
  app.isQuitting = true;
  BrowserWindow.getAllWindows()
    .filter(win => !win.isDestroyed())
    .forEach(win => win.removeAllListeners('close'));
  setImmediate(() => autoUpdater.quitAndInstall(false, true));
}

module.exports = { initUpdater, checkForUpdates, downloadUpdate, quitAndInstall, getUpdateStatus };
