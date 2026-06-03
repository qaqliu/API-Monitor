const { getRefreshInterval, getEntries, getCurrentIndex } = require('../services/store');

let refreshTimer = null;

function getEntryRefreshMs() {
  const entries = getEntries();
  const idx = getCurrentIndex();
  const entry = entries[idx];
  const minutes = (entry && entry.refreshInterval != null)
    ? entry.refreshInterval
    : getRefreshInterval();
  return minutes * 60 * 1000;
}

function initAutoRefresh(widgetWindow, intervalMs) {
  stopAutoRefresh();
  const ms = intervalMs ?? getEntryRefreshMs();
  refreshTimer = setInterval(() => {
    if (widgetWindow && !widgetWindow.isDestroyed()) {
      widgetWindow.webContents.send('trigger-refresh');
    }
  }, ms);
}

function restartAutoRefresh(widgetWindow, intervalMs) {
  initAutoRefresh(widgetWindow, intervalMs);
}

function stopAutoRefresh() {
  if (refreshTimer !== null) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
}

module.exports = { initAutoRefresh, restartAutoRefresh, stopAutoRefresh };
