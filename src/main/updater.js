const { autoUpdater } = require('electron-updater');
const { BrowserWindow } = require('electron');

let widgetWindow = null;

function initUpdater(widgetWin) {
  widgetWindow = widgetWin;

  // Disable auto-download — let user decide
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-available', (info) => {
    if (widgetWindow && !widgetWindow.isDestroyed()) {
      widgetWindow.webContents.send('update-available', {
        version: info.version,
      });
    }
  });

  autoUpdater.on('update-not-available', () => {
    if (widgetWindow && !widgetWindow.isDestroyed()) {
      widgetWindow.webContents.send('update-not-available');
    }
  });

  autoUpdater.on('download-progress', (progress) => {
    if (widgetWindow && !widgetWindow.isDestroyed()) {
      widgetWindow.webContents.send('update-progress', {
        percent: Math.round(progress.percent),
      });
    }
  });

  autoUpdater.on('update-downloaded', () => {
    if (widgetWindow && !widgetWindow.isDestroyed()) {
      widgetWindow.webContents.send('update-downloaded');
    }
  });

  autoUpdater.on('error', (err) => {
    // 没有配置更新源时的报错不通知用户
    const msg = err ? err.message : '';
    if (msg.includes('Cannot find module') || msg.includes('ENOENT')) return;

    if (widgetWindow && !widgetWindow.isDestroyed()) {
      widgetWindow.webContents.send('update-error', {
        message: msg || 'Unknown update error',
      });
    }
  });
}

function checkForUpdates() {
  const { app } = require('electron');
  // 只有在打包后的正式版本并且配置了更新源时才检查
  if (!app.isPackaged) return;

  try {
    autoUpdater.checkForUpdates().catch(() => {});
  } catch {
    // 没有更新源配置，静默跳过
  }
}

function downloadUpdate() {
  autoUpdater.downloadUpdate();
}

function quitAndInstall() {
  autoUpdater.quitAndInstall();
}

module.exports = { initUpdater, checkForUpdates, downloadUpdate, quitAndInstall };
