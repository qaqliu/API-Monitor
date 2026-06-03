const { autoUpdater } = require('electron-updater');
const { BrowserWindow, app } = require('electron');

let widgetWindow = null;

function initUpdater(widgetWin) {
  widgetWindow = widgetWin;

  // Disable auto-download — let user decide
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-available', (info) => {
    broadcastUpdateEvent('update-available', { version: info.version });
  });

  autoUpdater.on('update-not-available', () => {
    broadcastUpdateEvent('update-not-available');
  });

  autoUpdater.on('download-progress', (progress) => {
    broadcastUpdateEvent('update-progress', { percent: Math.round(progress.percent) });
  });

  autoUpdater.on('update-downloaded', () => {
    broadcastUpdateEvent('update-downloaded');
  });

  autoUpdater.on('error', (err) => {
    // 没有配置更新源时的报错不通知用户
    const msg = err ? err.message : '';
    if (msg.includes('Cannot find module') || msg.includes('ENOENT')) return;

    broadcastUpdateEvent('update-error', { message: msg || 'Unknown update error' });
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
  };
}

function checkForUpdates(options = {}) {
  // 只有在打包后的正式版本并且配置了更新源时才检查
  if (!app.isPackaged) {
    if (options.manual) {
      broadcastUpdateEvent('update-dev-mode', {
        message: 'Updates are only available in packaged builds.',
      });
    }
    return Promise.resolve({ devMode: true });
  }

  try {
    return autoUpdater.checkForUpdates().catch((err) => {
      broadcastUpdateEvent('update-error', {
        message: err && err.message ? err.message : 'Unknown update error',
      });
      return null;
    });
  } catch {
    // 没有更新源配置，静默跳过
    return Promise.resolve(null);
  }
}

function downloadUpdate() {
  if (!app.isPackaged) {
    broadcastUpdateEvent('update-dev-mode', {
      message: 'Updates are only available in packaged builds.',
    });
    return Promise.resolve({ devMode: true });
  }
  return autoUpdater.downloadUpdate();
}

function quitAndInstall() {
  autoUpdater.quitAndInstall();
}

module.exports = { initUpdater, checkForUpdates, downloadUpdate, quitAndInstall, getUpdateStatus };
