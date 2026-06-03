const elEntryList = document.getElementById('entry-list');
const elInterval = document.getElementById('refresh-interval');
const elModal = document.getElementById('modal-overlay');
const elModalTitle = document.getElementById('modal-title');
const elEntryName = document.getElementById('entry-name');
const elEntryProvider = document.getElementById('entry-provider');
const elEntryKey = document.getElementById('entry-key');
const elEntryInterval = document.getElementById('entry-interval');
const elToggleKey = document.getElementById('btn-toggle-key');
const elBrowseKey = document.getElementById('btn-browse-key');
const elLangSelect = document.getElementById('language-select');
const elCurrentVersion = document.getElementById('current-version');
const elUpdateStatus = document.getElementById('update-status');
const elCheckUpdate = document.getElementById('btn-check-update');
const elDownloadUpdate = document.getElementById('btn-download-update');
const elInstallUpdate = document.getElementById('btn-install-update');
let editingId = null;
let entriesCache = [];
let currentLang = 'zh-CN';
let updateCleanups = [];
let updateAvailable = false;
let updateStatusKey = 'updateReady';
let updateStatusValues = {};

// Lightweight i18n — loaded from main process
const T = {
  en: {
    settings: 'Settings', general: 'General', monitor: 'Monitor',
    language: 'Language', langEn: 'English', langZhCN: '简体中文',
    restartNote: 'Language change takes effect after restart.',
    monitorEntries: 'Monitor Entries', addEntry: '+ Add Entry',
    defaultRefresh: 'Default Auto-refresh',
    refresh1min: '1 minute', refresh5min: '5 minutes', refresh10min: '10 minutes',
    refresh15min: '15 minutes', refresh30min: '30 minutes', refresh60min: '60 minutes',
    addTitle: 'Add Entry', editTitle: 'Edit Entry',
    name: 'Name', provider: 'Provider', apiKey: 'API Key', authPath: 'Auth File Path',
    authPathHint: 'Leave empty to use default: ~/.codex/auth.json',
    refreshInterval: 'Refresh Interval', useDefault: 'Use default',
    cancel: 'Cancel', save: 'Save', edit: 'Edit', delete: 'Delete',
    unnamed: 'Unnamed', defaultLower: 'default',
    updates: 'Updates', currentVersion: 'Current Version',
    updateReady: 'Ready to check for updates.',
    updateChecking: 'Checking for updates...',
    updateAvailable: 'Version {version} is available.',
    updateNotAvailable: 'You are using the latest version.',
    updateDownloading: 'Downloading... {percent}%',
    updateDownloaded: 'Update downloaded. Restart to install.',
    updateDevMode: 'Updates are only available in packaged builds.',
    updateFailed: 'Update failed: {message}',
    checkUpdates: 'Check for Updates', download: 'Download', restart: 'Restart',
  },
  'zh-CN': {
    settings: '设置', general: '通用', monitor: '监控',
    language: '语言', langEn: 'English', langZhCN: '简体中文',
    restartNote: '语言修改将在重启后生效。',
    monitorEntries: '监控条目', addEntry: '+ 添加条目',
    defaultRefresh: '默认自动刷新',
    refresh1min: '1 分钟', refresh5min: '5 分钟', refresh10min: '10 分钟',
    refresh15min: '15 分钟', refresh30min: '30 分钟', refresh60min: '60 分钟',
    addTitle: '添加条目', editTitle: '编辑条目',
    name: '名称', provider: '提供商', apiKey: 'API Key', authPath: 'Auth 文件路径',
    authPathHint: '留空则使用默认路径：~/.codex/auth.json',
    refreshInterval: '刷新间隔', useDefault: '使用默认',
    cancel: '取消', save: '保存', edit: '编辑', delete: '删除',
    unnamed: '未命名', defaultLower: '默认',
    updates: '更新', currentVersion: '当前版本',
    updateReady: '可手动检查更新。',
    updateChecking: '正在检查更新...',
    updateAvailable: '发现新版本 {version}。',
    updateNotAvailable: '当前已是最新版本。',
    updateDownloading: '正在下载... {percent}%',
    updateDownloaded: '更新已下载，重启后安装。',
    updateDevMode: '仅打包后的正式版本支持检查更新。',
    updateFailed: '更新失败：{message}',
    checkUpdates: '检查更新', download: '下载', restart: '重启安装',
  },
};

function t(key) { return (T[currentLang] && T[currentLang][key]) || T.en[key] || key; }

function tf(key, values) {
  return Object.entries(values || {}).reduce(
    (text, [name, value]) => text.replace(`{${name}}`, value),
    t(key)
  );
}

function applyTranslations() {
  document.getElementById('header-title').textContent = t('settings');
  document.getElementById('cat-general').textContent = t('general');
  document.getElementById('cat-monitor').textContent = t('monitor');
  document.getElementById('lbl-language').textContent = t('language');
  document.getElementById('lang-hint').textContent = t('restartNote');
  document.getElementById('lbl-updates').textContent = t('updates');
  document.getElementById('lbl-current-version').textContent = t('currentVersion');
  elCheckUpdate.textContent = t('checkUpdates');
  elDownloadUpdate.textContent = t('download');
  elInstallUpdate.textContent = t('restart');
  elUpdateStatus.textContent = tf(updateStatusKey, updateStatusValues);
  document.getElementById('lbl-entries').textContent = t('monitorEntries');
  document.getElementById('btn-add').textContent = t('addEntry');
  document.getElementById('lbl-defresh').textContent = t('defaultRefresh');
  document.getElementById('opt-r1').textContent = t('refresh1min');
  document.getElementById('opt-r5').textContent = t('refresh5min');
  document.getElementById('opt-r10').textContent = t('refresh10min');
  document.getElementById('opt-r15').textContent = t('refresh15min');
  document.getElementById('opt-r30').textContent = t('refresh30min');
  document.getElementById('opt-r60').textContent = t('refresh60min');
  document.getElementById('lbl-name').textContent = t('name');
  document.getElementById('lbl-provider').textContent = t('provider');
  updateKeyField();
  document.getElementById('lbl-interval').textContent = t('refreshInterval');
  document.getElementById('opt-def').textContent = t('useDefault');
  document.getElementById('modal-cancel').textContent = t('cancel');
  document.getElementById('modal-save').textContent = t('save');
  document.querySelectorAll('#entry-interval option[value="1"]').forEach(o => o.textContent = t('refresh1min'));
  const eiOpts = document.querySelectorAll('#entry-interval option');
  if (eiOpts.length > 2) { eiOpts[2].textContent = t('refresh5min'); eiOpts[3].textContent = t('refresh10min'); eiOpts[4].textContent = t('refresh15min'); eiOpts[5].textContent = t('refresh30min'); eiOpts[6].textContent = t('refresh60min'); }
  renderEntries();
}

function setUpdateStatus(key, values) {
  updateStatusKey = key;
  updateStatusValues = values || {};
  elUpdateStatus.textContent = tf(updateStatusKey, updateStatusValues);
}

function setUpdateButtons(state) {
  elCheckUpdate.disabled = state === 'checking' || state === 'downloading';
  elDownloadUpdate.classList.toggle('hidden', state !== 'available');
  elDownloadUpdate.disabled = state === 'downloading';
  elInstallUpdate.classList.toggle('hidden', state !== 'downloaded');
}

async function loadUpdateStatus() {
  const status = await window.settingsAPI.getUpdateStatus();
  elCurrentVersion.textContent = status.version || '--';
  if (!status.isPackaged) {
    setUpdateButtons('idle');
    setUpdateStatus('updateDevMode');
    return;
  }

  if (status.updateState === 'available') {
    setUpdateButtons('available');
    setUpdateStatus('updateAvailable', { version: status.updateVersion || '--' });
  } else if (status.updateState === 'downloading') {
    setUpdateButtons('downloading');
    setUpdateStatus('updateDownloading', { percent: status.updatePercent || 0 });
  } else if (status.updateState === 'downloaded') {
    setUpdateButtons('downloaded');
    setUpdateStatus('updateDownloaded');
  } else if (status.updateState === 'error') {
    setUpdateButtons('idle');
    setUpdateStatus('updateFailed', { message: status.updateMessage || 'Unknown' });
  } else if (status.updateState === 'checking') {
    setUpdateButtons('checking');
    setUpdateStatus('updateChecking');
  } else {
    setUpdateButtons('idle');
    setUpdateStatus('updateReady');
  }
}

async function checkForUpdates() {
  updateAvailable = false;
  setUpdateButtons('checking');
  setUpdateStatus('updateChecking');
  await window.settingsAPI.checkForUpdates();
}

async function downloadUpdate() {
  setUpdateButtons('downloading');
  setUpdateStatus('updateDownloading', { percent: 0 });
  await window.settingsAPI.downloadUpdate();
}

function bindUpdateEvents() {
  updateCleanups.push(window.settingsAPI.onUpdateEvent('update-available', (data) => {
    updateAvailable = true;
    setUpdateButtons('available');
    setUpdateStatus('updateAvailable', { version: data && data.version ? data.version : '--' });
  }));

  updateCleanups.push(window.settingsAPI.onUpdateEvent('update-not-available', () => {
    updateAvailable = false;
    setUpdateButtons('idle');
    setUpdateStatus('updateNotAvailable');
  }));

  updateCleanups.push(window.settingsAPI.onUpdateEvent('update-progress', (data) => {
    updateAvailable = true;
    setUpdateButtons('downloading');
    setUpdateStatus('updateDownloading', { percent: data && data.percent != null ? data.percent : 0 });
  }));

  updateCleanups.push(window.settingsAPI.onUpdateEvent('update-downloaded', () => {
    updateAvailable = true;
    setUpdateButtons('downloaded');
    setUpdateStatus('updateDownloaded');
  }));

  updateCleanups.push(window.settingsAPI.onUpdateEvent('update-error', (data) => {
    setUpdateButtons('idle');
    setUpdateStatus('updateFailed', { message: data && data.message ? data.message : 'Unknown' });
  }));

  updateCleanups.push(window.settingsAPI.onUpdateEvent('update-dev-mode', () => {
    setUpdateButtons('idle');
    setUpdateStatus('updateDevMode');
  }));
}

function updateKeyField() {
  const isCodex = elEntryProvider.value === 'codex';
  document.getElementById('lbl-apikey').textContent = isCodex ? t('authPath') : t('apiKey');
  elEntryKey.placeholder = isCodex ? 'C:\\Users\\...\\.auth.json' : 'sk-...';
  const hint = document.getElementById('key-hint');
  if (isCodex) {
    hint.textContent = t('authPathHint');
    hint.style.display = '';
    elBrowseKey.style.display = '';
    elToggleKey.style.display = 'none';
  } else {
    hint.style.display = 'none';
    elBrowseKey.style.display = 'none';
    elToggleKey.style.display = '';
  }
}

const PROVIDER_LOGOS = {
  deepseek: `<svg viewBox="0 0 64 47" xmlns="http://www.w3.org/2000/svg"><path d="M62.4575 3.89441C61.7888 3.56726 61.501 4.1908 61.1101 4.50769C60.9763 4.60999 60.863 4.7428 60.75 4.86548C59.7727 5.9082 58.6311 6.59302 57.1394 6.51123C54.9587 6.38855 53.0969 7.07349 51.4512 8.73975C51.1013 6.68506 49.939 5.45837 48.1699 4.67126C47.2441 4.26233 46.3081 3.85352 45.6599 2.96411C45.2073 2.33032 45.084 1.625 44.8577 0.929932C44.7136 0.510864 44.5696 0.081543 44.0862 0.0098877C43.5615 -0.0718994 43.3557 0.367676 43.1501 0.735718C42.3271 2.2384 42.0083 3.89441 42.0391 5.5708C42.1111 9.34277 43.7056 12.3481 46.8738 14.4846C47.2336 14.73 47.3264 14.9753 47.2131 15.333C46.9971 16.0691 46.74 16.7847 46.5137 17.5206C46.3696 17.9908 46.1538 18.093 45.6497 17.8887C43.9114 17.1628 42.4094 16.0895 41.0825 14.7913C38.8298 12.6139 36.7932 10.2117 34.2524 8.33081C33.6558 7.89124 33.0593 7.48242 32.4421 7.09399C29.8499 4.57922 32.7815 2.5144 33.4604 2.26904C34.1702 2.01343 33.7073 1.1344 31.4133 1.14465C29.1196 1.15479 27.0212 1.92151 24.3467 2.94373C23.9558 3.09705 23.5444 3.20947 23.1226 3.30151C20.6951 2.84143 18.1748 2.73926 15.5415 3.03577C10.5835 3.58777 6.62329 5.92859 3.7124 9.92554C0.215088 14.73 -0.60791 20.1886 0.400146 25.8824C1.45972 31.8828 4.5249 36.8508 9.23608 40.7354C14.1221 44.7629 19.7488 46.7357 26.1675 46.3575C30.0659 46.1327 34.4067 45.6113 39.303 41.4713C40.5374 42.0847 41.8335 42.33 43.9834 42.514C45.6394 42.6674 47.2336 42.4323 48.468 42.1766C50.4019 41.7678 50.2683 39.9789 49.5688 39.6517C43.9009 37.0144 45.1455 38.0878 44.0142 37.2189C46.8943 33.8148 51.2351 30.278 52.9324 18.8188C53.0662 17.9091 52.9529 17.3367 52.9324 16.6006C52.9221 16.1509 53.0249 15.9771 53.5393 15.9259C54.9587 15.7625 56.3372 15.3739 57.6023 14.6788C61.2747 12.6753 62.7559 9.38367 63.1055 5.43799C63.157 4.83484 63.0952 4.2113 62.4575 3.89441ZM30.4568 39.4065C24.9639 35.0927 22.2998 33.6718 21.199 33.7332C20.1704 33.7944 20.3557 34.97 20.5818 35.7367C20.8186 36.493 21.1272 37.0144 21.5591 37.6788C21.8574 38.1184 22.0632 38.7727 21.2607 39.2633C19.4915 40.3571 16.416 38.8953 16.272 38.8237C12.6924 36.718 9.69897 33.9375 7.59033 30.1349C5.55347 26.4753 4.37061 22.5499 4.17529 18.3589C4.12378 17.3468 4.42212 16.989 5.43018 16.8051C6.75708 16.5597 8.12524 16.5087 9.45215 16.7029C15.0581 17.5206 19.8311 20.025 23.8323 23.9913C26.116 26.2504 27.844 28.9491 29.6235 31.5864C31.5164 34.3873 33.553 37.0553 36.145 39.2429C37.0605 40.0095 37.791 40.5922 38.4905 41.0215C36.3816 41.2567 32.8638 41.3077 30.4568 39.4065ZM33.0901 22.4886C33.0901 22.0388 33.4502 21.681 33.9026 21.681C34.0056 21.681 34.0981 21.7015 34.1804 21.7322C34.2935 21.7731 34.3965 21.8344 34.4788 21.9264C34.6228 22.0695 34.7051 22.2739 34.7051 22.4886C34.7051 22.9384 34.345 23.2961 33.8923 23.2961C33.4397 23.2961 33.0901 22.9384 33.0901 22.4886ZM41.2676 26.6798C40.7432 26.8944 40.2185 27.0784 39.7144 27.0989C38.9326 27.1398 38.0789 26.8229 37.616 26.4344C36.896 25.8313 36.3816 25.494 36.1658 24.441C36.073 23.9913 36.1245 23.2961 36.2068 22.8975C36.3921 22.0388 36.1863 21.4868 35.5793 20.986C35.0857 20.577 34.4583 20.4646 33.769 20.4646C33.5117 20.4646 33.2751 20.3522 33.1003 20.2601C32.8123 20.1171 32.5757 19.7593 32.802 19.3197C32.874 19.1766 33.2239 18.8291 33.3062 18.7677C34.2422 18.2362 35.3223 18.4099 36.3201 18.8086C37.2458 19.1869 37.9453 19.882 38.9534 20.8633C39.9819 22.0491 40.167 22.3762 40.7534 23.2655C41.2163 23.9607 41.6379 24.6761 41.926 25.494C42.1008 26.0051 41.8745 26.4242 41.2676 26.6798Z" fill="#4D6BFE" fill-rule="nonzero"/></svg>`,
  codex: `<svg viewBox="0 0 320 320" xmlns="http://www.w3.org/2000/svg" aria-label="ChatGPT"><path fill="#10A37F" d="m297.06 130.97c7.26-21.79 4.76-45.66-6.85-65.48-17.46-30.4-52.56-46.04-86.84-38.68-15.25-17.18-37.16-26.95-60.13-26.81-35.04-.08-66.13 22.48-76.91 55.82-22.51 4.61-41.94 18.7-53.31 38.67-17.59 30.32-13.58 68.54 9.92 94.54-7.26 21.79-4.76 45.66 6.85 65.48 17.46 30.4 52.56 46.04 86.84 38.68 15.24 17.18 37.16 26.95 60.13 26.8 35.06.09 66.16-22.49 76.94-55.86 22.51-4.61 41.94-18.7 53.31-38.67 17.57-30.32 13.55-68.51-9.94-94.51zm-120.28 168.11c-14.03.02-27.62-4.89-38.39-13.88.49-.26 1.34-.73 1.89-1.07l63.72-36.8c3.26-1.85 5.26-5.32 5.24-9.07v-89.83l26.93 15.55c.29.14.48.42.52.74v74.39c-.04 33.08-26.83 59.9-59.91 59.97zm-128.84-55.03c-7.03-12.14-9.56-26.37-7.15-40.18.47.28 1.3.79 1.89 1.13l63.72 36.8c3.23 1.89 7.23 1.89 10.47 0l77.79-44.92v31.1c.02.32-.13.63-.38.83l-64.41 37.19c-28.69 16.52-65.33 6.7-81.92-21.95zm-16.77-139.09c7-12.16 18.05-21.46 31.21-26.29 0 .55-.03 1.52-.03 2.2v73.61c-.02 3.74 1.98 7.21 5.23 9.06l77.79 44.91-26.93 15.55c-.27.18-.61.21-.91.08l-64.42-37.22c-28.63-16.58-38.45-53.21-21.95-81.89zm221.26 51.49-77.79-44.92 26.93-15.54c.27-.18.61-.21.91-.08l64.42 37.19c28.68 16.57 38.51 53.26 21.94 81.94-7.01 12.14-18.05 21.44-31.2 26.28v-75.81c.03-3.74-1.96-7.2-5.2-9.06zm26.8-40.34c-.47-.29-1.3-.79-1.89-1.13l-63.72-36.8c-3.23-1.89-7.23-1.89-10.47 0l-77.79 44.92v-31.1c-.02-.32.13-.63.38-.83l64.41-37.16c28.69-16.55 65.37-6.7 81.91 22 6.99 12.12 9.52 26.31 7.15 40.1zm-168.51 55.43-26.94-15.55c-.29-.14-.48-.42-.52-.74v-74.39c.02-33.12 26.89-59.96 60.01-59.94 14.01 0 27.57 4.92 38.34 13.88-.49.26-1.33.73-1.89 1.07l-63.72 36.8c-3.26 1.85-5.26 5.31-5.24 9.06l-.04 89.79zm14.63-31.54 34.65-20.01 34.65 20v40.01l-34.65 20-34.65-20z"/></svg>`,
};

function intervalLabel(v) {
  if (v == null || v === -1) return t('defaultLower');
  return v + ' min';
}

async function renderEntries() {
  entriesCache = await window.settingsAPI.getEntries();
  elEntryList.innerHTML = '';

  entriesCache.forEach(entry => {
    const card = document.createElement('div');
    card.className = 'entry-card';
    card.innerHTML = `
      <div class="logo">${PROVIDER_LOGOS[entry.provider] || ''}</div>
      <div class="info">
        <div class="entry-name">${escapeHtml(entry.name || t('unnamed'))}</div>
        <div class="entry-meta">${entry.provider} &middot; ${escapeHtml(entry.apiKey)} &middot; Refresh: ${intervalLabel(entry.refreshInterval)}</div>
      </div>
      <div class="actions">
        <button class="btn-edit" data-id="${entry.id}">${t('edit')}</button>
        <button class="btn-del" data-id="${entry.id}">${t('delete')}</button>
      </div>
    `;
    elEntryList.appendChild(card);
  });

  elEntryList.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => openEditModal(btn.dataset.id));
  });
  elEntryList.querySelectorAll('.btn-del').forEach(btn => {
    btn.addEventListener('click', () => deleteEntry(btn.dataset.id));
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// --- Sidebar navigation ---
document.querySelectorAll('.cat-btn').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.cat));
});

function switchTab(cat) {
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.getElementById('cat-' + cat).classList.add('active');
  document.getElementById('panel-' + cat).classList.add('active');
}

// --- Modal ---
function openAddModal() {
  editingId = null;
  elModalTitle.textContent = t('addTitle');
  elEntryName.value = '';
  elEntryProvider.value = 'deepseek';
  elEntryKey.value = '';
  elEntryKey.type = 'password';
  elEntryKey.dataset.masked = 'false';
  updateEyeIcon();
  elEntryInterval.value = '-1';
  updateKeyField();
  elModal.classList.remove('hidden');
  elEntryName.focus();
}

function openEditModal(id) {
  const entry = entriesCache.find(e => e.id === id);
  if (!entry) return;

  editingId = id;
  elModalTitle.textContent = t('editTitle');
  elEntryName.value = entry.name;
  elEntryProvider.value = entry.provider;
  elEntryKey.value = entry.apiKey;
  updateKeyField();
  elEntryKey.type = 'password';
  elEntryKey.dataset.masked = 'true';
  updateEyeIcon();
  elEntryInterval.value = entry.refreshInterval == null ? '-1' : String(entry.refreshInterval);
  elModal.classList.remove('hidden');
}

function closeModal() {
  elModal.classList.add('hidden');
  editingId = null;
}

async function saveModal() {
  const name = elEntryName.value.trim();
  const provider = elEntryProvider.value;
  const keyValue = elEntryKey.value.trim();
  const intervalVal = elEntryInterval.value === '-1' ? null : Number(elEntryInterval.value);

  if (!name) return;

  if (editingId) {
    const fields = { name };
    if (elEntryKey.dataset.masked !== 'true' && (keyValue || provider === 'codex')) {
      fields.apiKey = keyValue;
    }
    fields.refreshInterval = intervalVal;
    await window.settingsAPI.updateEntry(editingId, fields);
  } else {
    if (!keyValue && provider !== 'codex') return;
    await window.settingsAPI.addEntry({ name, provider, apiKey: keyValue, refreshInterval: intervalVal });
  }

  closeModal();
  await renderEntries();
}

async function deleteEntry(id) {
  await window.settingsAPI.deleteEntry(id);
  await renderEntries();
}

// --- Eye icon toggle ---
function updateEyeIcon() {
  const hidden = elEntryKey.type === 'password';
  elToggleKey.querySelector('.eye-slash').style.display = hidden ? '' : 'none';
  elToggleKey.querySelector('.eye').style.display = hidden ? 'none' : '';
}

elToggleKey.addEventListener('click', () => {
  if (elEntryKey.dataset.masked === 'true') {
    elEntryKey.value = '';
    elEntryKey.dataset.masked = 'false';
    elEntryKey.type = 'text';
    elEntryKey.focus();
  } else {
    elEntryKey.type = elEntryKey.type === 'password' ? 'text' : 'password';
  }
  updateEyeIcon();
});

elEntryProvider.addEventListener('change', () => {
  updateKeyField();
  elEntryKey.value = '';
  elEntryKey.dataset.masked = 'false';
  elEntryKey.type = 'password';
  updateEyeIcon();
});

elBrowseKey.addEventListener('click', async () => {
  const filePath = await window.settingsAPI.browseAuthFile();
  if (filePath) {
    elEntryKey.value = filePath;
    elEntryKey.type = 'text';
    elEntryKey.dataset.masked = 'false';
    updateEyeIcon();
  }
});

elEntryKey.addEventListener('input', () => {
  elEntryKey.dataset.masked = 'false';
});

// --- Modal buttons ---
document.getElementById('modal-save').addEventListener('click', saveModal);
document.getElementById('modal-cancel').addEventListener('click', closeModal);
document.getElementById('modal-close').addEventListener('click', closeModal);

elEntryName.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveModal(); });
elEntryKey.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveModal(); });

// --- Global refresh interval ---
elInterval.addEventListener('change', async () => {
  await window.settingsAPI.setRefreshInterval(Number(elInterval.value));
});

// --- Language ---
elLangSelect.addEventListener('change', async () => {
  currentLang = elLangSelect.value;
  await window.settingsAPI.setLanguage(currentLang);
  applyTranslations();
});

// --- Add entry button ---
document.getElementById('btn-add').addEventListener('click', openAddModal);

// --- Updates ---
elCheckUpdate.addEventListener('click', checkForUpdates);
elDownloadUpdate.addEventListener('click', downloadUpdate);
elInstallUpdate.addEventListener('click', () => window.settingsAPI.quitAndInstall());

// --- Close button ---
document.getElementById('btn-close').addEventListener('click', () => window.settingsAPI.closeWindow());

window.addEventListener('beforeunload', () => {
  updateCleanups.forEach(fn => fn());
});

// --- Init ---
(async () => {
  const interval = await window.settingsAPI.getRefreshInterval();
  elInterval.value = String(interval);

  currentLang = await window.settingsAPI.getLanguage();
  elLangSelect.value = currentLang;

  bindUpdateEvents();
  applyTranslations();
  await loadUpdateStatus();
})();
