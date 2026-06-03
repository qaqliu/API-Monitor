const { app, BrowserWindow, screen } = require('electron');
const path = require('path');
const { initStore, getWindowPosition, setWindowPosition } = require('../services/store');
const { createTray, updateTrayTooltip } = require('./tray');
const { registerIpcHandlers, setSettingsWindow } = require('./ipc-handlers');
const { initAutoRefresh, stopAutoRefresh } = require('./auto-refresh');
const { initUpdater, checkForUpdates } = require('./updater');

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

let widgetWindow = null;
let settingsWindow = null;
let isQuitting = false;
const appIconPath = path.join(__dirname, '..', '..', 'assets', 'icon.ico');

function createWidgetWindow() {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

  widgetWindow = new BrowserWindow({
    width: 260,
    height: 340,
    x: screenWidth - 280,
    y: screenHeight - 360,
    frame: false,
    transparent: true,
    alwaysOnTop: 'screen-saver',
    skipTaskbar: true,
    resizable: false,
    backgroundColor: '#00000000',
    icon: appIconPath,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload-widget.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  widgetWindow.loadFile(path.join(__dirname, '..', 'renderer', 'widget', 'widget.html'));

  widgetWindow.on('moved', () => {
    const [x, y] = widgetWindow.getPosition();
    setWindowPosition(x, y);
  });

  widgetWindow.on('show', () => {
    widgetWindow.setAlwaysOnTop(true, 'screen-saver');
  });

  widgetWindow.on('close', (event) => {
    if (!isQuitting && !app.isQuitting) {
      event.preventDefault();
      widgetWindow.hide();
    }
  });
}

function createSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 580,
    height: 500,
    resizable: false,
    center: true,
    title: 'API Monitor - Settings',
    icon: appIconPath,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload-settings.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  settingsWindow.loadFile(path.join(__dirname, '..', 'renderer', 'settings', 'settings.html'));
  settingsWindow.setMenu(null);
  setSettingsWindow(settingsWindow);

  // 打开设置窗口后重新断言悬浮窗置顶，防止焦点转移导致 z-order 丢失
  if (widgetWindow && !widgetWindow.isDestroyed()) {
    widgetWindow.setAlwaysOnTop(true, 'screen-saver');
  }

  settingsWindow.on('closed', () => {
    settingsWindow = null;
    setSettingsWindow(null);
  });
}

app.whenReady().then(() => {
  initStore();
  createWidgetWindow();
  registerIpcHandlers(widgetWindow, createSettingsWindow);
  createTray(widgetWindow, createSettingsWindow);
  initAutoRefresh(widgetWindow);
  initUpdater(widgetWindow);

  // Check for updates (silent — only notifies if update available)
  setTimeout(() => checkForUpdates(), 5000);
});

app.on('before-quit', () => {
  isQuitting = true;
  app.isQuitting = true;
  stopAutoRefresh();
});

app.on('activate', () => {
  if (widgetWindow && !widgetWindow.isDestroyed()) {
    widgetWindow.show();
    widgetWindow.focus();
  }
});
