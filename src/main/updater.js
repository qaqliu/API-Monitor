const { autoUpdater } = require('electron-updater');
const { BrowserWindow, app } = require('electron');
const { spawn } = require('child_process');
const fs = require('fs');
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
  const installerPath = getDownloadedInstallerPath();
  if (!installerPath) {
    const message = 'Downloaded installer not found. Please download the update again.';
    updateStatus.state = 'error';
    updateStatus.message = message;
    broadcastUpdateEvent('update-error', { message });
    return;
  }

  app.isQuitting = true;
  BrowserWindow.getAllWindows()
    .filter(win => !win.isDestroyed())
    .forEach(win => win.removeAllListeners('close'));

  launchInstaller(installerPath);
}

function launchInstaller(installerPath) {
  const elevatePath = path.join(process.resourcesPath, 'elevate.exe');
  const command = fs.existsSync(elevatePath) ? elevatePath : installerPath;
  const args = fs.existsSync(elevatePath)
    ? [installerPath, '--updated', '--force-run']
    : ['--updated', '--force-run'];

  const child = spawn(command, args, {
    detached: true,
    stdio: 'ignore',
    windowsHide: false,
  });

  child.once('error', (err) => {
    app.isQuitting = false;
    const message = err && err.message ? err.message : 'Failed to launch update installer.';
    updateStatus.state = 'error';
    updateStatus.message = message;
    broadcastUpdateEvent('update-error', { message });
  });

  child.once('spawn', () => {
    child.unref();
    setImmediate(() => app.quit());
  });
}

function getDownloadedInstallerPath() {
  const file = updateStatus.files.find(item => typeof item === 'string' && item.toLowerCase().endsWith('.exe'));
  if (file && fs.existsSync(file)) return file;

  const updaterInstallerPath = autoUpdater.installerPath;
  if (updaterInstallerPath && fs.existsSync(updaterInstallerPath)) {
    return updaterInstallerPath;
  }

  return null;
}

module.exports = { initUpdater, checkForUpdates, downloadUpdate, quitAndInstall, getUpdateStatus };
