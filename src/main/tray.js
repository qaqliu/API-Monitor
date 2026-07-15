const { Tray, Menu, app, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

let tray = null;

function createTrayIcon() {
  const pngPath = path.join(__dirname, '..', '..', 'assets', 'tray-icon.png');
  try {
    if (fs.existsSync(pngPath)) {
      const buf = fs.readFileSync(pngPath);
      return nativeImage.createFromBuffer(buf, { width: 16, height: 16 });
    }
  } catch (_) {}

  const icoPath = path.join(__dirname, '..', '..', 'assets', 'icon.ico');
  try {
    if (fs.existsSync(icoPath)) {
      const buf = fs.readFileSync(icoPath);
      return nativeImage.createFromBuffer(buf).resize({ width: 16, height: 16 });
    }
  } catch (_) {}

  const canvas = Buffer.alloc(16 * 16 * 4);
  for (let i = 0; i < 16 * 16; i++) {
    const idx = i * 4;
    canvas[idx] = 76;
    canvas[idx + 1] = 175;
    canvas[idx + 2] = 132;
    canvas[idx + 3] = 255;
  }
  return nativeImage.createFromBuffer(canvas, { width: 16, height: 16 });
}

let balloonShown = false;

function createTray(widgetWindow, createSettingsWindowFn) {
  const icon = createTrayIcon();
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    { label: 'API Monitor', enabled: false },
    { type: 'separator' },
    {
      label: 'Show/Hide Widget',
      click: () => {
        if (widgetWindow.isVisible()) {
          widgetWindow.hide();
          showMinimizeBalloon();
        } else {
          widgetWindow.show();
          widgetWindow.focus();
        }
      },
    },
    {
      label: 'Refresh',
      click: () => {
        widgetWindow.webContents.send('trigger-refresh');
      },
    },
    { type: 'separator' },
    {
      label: 'Settings...',
      click: () => createSettingsWindowFn(),
    },
    { type: 'separator' },
    {
      label: 'Exit',
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip('API Monitor — 点击托盘图标显示/隐藏窗口');

  tray.on('click', () => {
    if (widgetWindow.isVisible() && widgetWindow.isFocused()) {
      widgetWindow.hide();
      showMinimizeBalloon();
    } else {
      widgetWindow.show();
      widgetWindow.focus();
    }
  });
}

function showMinimizeBalloon() {
  if (balloonShown || !tray) return;
  tray.displayBalloon({
    title: 'API Monitor',
    content: '已最小化到系统托盘，双击托盘图标可重新打开',
  });
  balloonShown = true;
}

function updateTrayTooltip(balance, entry) {
  if (!tray) return;
  if (balance && entry) {
    const name = entry.name || entry.provider;
    if (entry.provider === 'codex') {
      const sPct = balance.weekly_used_percent ?? balance.secondary_used_percent;
      tray.setToolTip(
        `${name}\n7d: ${sPct != null ? sPct + '%' : '--'}`
      );
    } else if (balance.provider === 'custom') {
      const first = (balance.customItems || [])[0];
      tray.setToolTip(`${name}\n${first ? `${first.label}: ${Number(first.value || 0).toFixed(2)}` : 'Custom provider'}`);
    } else {
      tray.setToolTip(
        `${name}\n\xA5${balance.total_balance.toFixed(2)} (Granted: \xA5${balance.granted_balance.toFixed(2)})`
      );
    }
  } else {
    tray.setToolTip('API Monitor\nClick to show/hide widget');
  }
}

module.exports = { createTray, updateTrayTooltip };
