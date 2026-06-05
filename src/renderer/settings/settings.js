const elEntryList = document.getElementById('entry-list');
const elInterval = document.getElementById('refresh-interval');
const elModal = document.getElementById('modal-overlay');
const elModalTitle = document.getElementById('modal-title');
const elEntryName = document.getElementById('entry-name');
const elEntryProvider = document.getElementById('entry-provider');
const elEntryProviderSearch = document.getElementById('entry-provider-search');
const elEntryProviderOptions = document.getElementById('entry-provider-options');
const elEntryKey = document.getElementById('entry-key');
const elEntryInterval = document.getElementById('entry-interval');
const elEntrySimpleMode = document.getElementById('entry-simple-mode');
const elDeepSeekSimpleField = document.getElementById('deepseek-simple-field');
const elToggleKey = document.getElementById('btn-toggle-key');
const elBrowseKey = document.getElementById('btn-browse-key');
const elLangSelect = document.getElementById('language-select');
const elEntryListEnabled = document.getElementById('entry-list-enabled');
const elCurrentVersion = document.getElementById('current-version');
const elUpdateStatus = document.getElementById('update-status');
const elCheckUpdate = document.getElementById('btn-check-update');
const elDownloadUpdate = document.getElementById('btn-download-update');
const elInstallUpdate = document.getElementById('btn-install-update');
const elCustomProviderList = document.getElementById('custom-provider-list');
const elProviderModal = document.getElementById('provider-modal-overlay');
const elProviderModalTitle = document.getElementById('provider-modal-title');
const elProviderName = document.getElementById('custom-provider-name');
const elProviderBase = document.getElementById('custom-provider-base');
const elLogoPreview = document.getElementById('logo-preview');
const elMonitorBlockList = document.getElementById('monitor-block-list');
const elLogoCropModal = document.getElementById('logo-crop-modal-overlay');
const elLogoCropStage = document.getElementById('logo-crop-stage');
const elLogoCropImage = document.getElementById('logo-crop-image');
const elLogoCropBox = document.getElementById('logo-crop-box');

let editingId = null;
let editingProviderId = null;
let originalEntryProvider = '';
let entriesCache = [];
let providersCache = [];
let customProvidersCache = [];
let providerLogoDataUrl = '';
let monitorBlocks = [];
let providerWidgetHeight = 0;
let cropSourceDataUrl = '';
let cropRect = { x: 0, y: 0, size: 120 };
let cropDrag = null;
let currentLang = 'zh-CN';
let updateCleanups = [];
let updateStatusKey = 'updateReady';
let updateStatusValues = {};

const DEFAULT_LOGO = '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="14" fill="#4caf84"/><path d="M18 35c6-14 22-14 28 0M22 38c5 8 15 8 20 0" fill="none" stroke="white" stroke-width="5" stroke-linecap="round"/><circle cx="25" cy="27" r="3" fill="white"/><circle cx="39" cy="27" r="3" fill="white"/></svg>';

const T = {
  en: {
    settings: 'Settings', general: 'General', monitor: 'Monitor', providers: 'Providers',
    language: 'Language', restartNote: 'Language change takes effect after restart.',
    monitorEntries: 'Monitor Entries', addEntry: '+ Add Entry', defaultRefresh: 'Default Auto-refresh',
    customProviders: 'Custom Providers', addProvider: '+ Add Provider',
    refresh1min: '1 minute', refresh5min: '5 minutes', refresh10min: '10 minutes',
    refresh15min: '15 minutes', refresh30min: '30 minutes', refresh60min: '60 minutes',
    addTitle: 'Add Entry', editTitle: 'Edit Entry', name: 'Name', provider: 'Provider',
    providerSearch: 'Search provider...', apiKey: 'API Key', authPath: 'Auth File Path',
    authPathHint: 'Leave empty to use default: ~/.codex/auth.json',
    simpleMode: 'Compact mode', refreshInterval: 'Refresh Interval', useDefault: 'Use default',
    cancel: 'Cancel', save: 'Save', edit: 'Edit', delete: 'Delete', unnamed: 'Unnamed',
    defaultLower: 'default', updates: 'Updates', currentVersion: 'Current Version',
    updateReady: 'Ready to check for updates.', updateChecking: 'Checking for updates...',
    updateAvailable: 'Version {version} is available.', updateNotAvailable: 'You are using the latest version.',
    updateDownloading: 'Downloading... {percent}%', updateDownloaded: 'Update downloaded. Restart to install.',
    updateDevMode: 'Updates are only available in packaged builds.', updateFailed: 'Update failed: {message}',
    checkUpdates: 'Check for Updates', download: 'Download', restart: 'Restart',
    addProviderTitle: 'Add Provider', editProviderTitle: 'Edit Provider', logo: 'Logo',
    chooseImage: 'Choose Image', providerName: 'Provider Name', baseUrl: 'Base URL',
    monitorBlocks: 'Monitor Blocks', balance: 'Balance', dashboard: 'Dashboard',
    label: 'Label', path: 'Relative Path', jsonPath: 'JSON Path', url: 'URL',
    noCustomProviders: 'No custom providers yet.',
  },
  'zh-CN': {
    settings: '设置', general: '通用', monitor: '监控', providers: '自定义提供商',
    language: '语言', restartNote: '语言修改将在重启后生效。',
    monitorEntries: '监控条目', addEntry: '+ 添加条目', defaultRefresh: '默认自动刷新',
    customProviders: '自定义提供商', addProvider: '+ 添加提供商',
    refresh1min: '1 分钟', refresh5min: '5 分钟', refresh10min: '10 分钟',
    refresh15min: '15 分钟', refresh30min: '30 分钟', refresh60min: '60 分钟',
    addTitle: '添加条目', editTitle: '编辑条目', name: '名称', provider: '提供商',
    providerSearch: '搜索提供商...', apiKey: 'API Key', authPath: 'Auth 文件路径',
    authPathHint: '留空则使用默认路径：~/.codex/auth.json',
    simpleMode: '精简模式', refreshInterval: '刷新间隔', useDefault: '使用默认',
    cancel: '取消', save: '保存', edit: '编辑', delete: '删除', unnamed: '未命名',
    defaultLower: '默认', updates: '更新', currentVersion: '当前版本',
    updateReady: '可手动检查更新。', updateChecking: '正在检查更新...',
    updateAvailable: '发现新版本 {version}。', updateNotAvailable: '当前已是最新版本。',
    updateDownloading: '正在下载... {percent}%', updateDownloaded: '更新已下载，重启后安装。',
    updateDevMode: '仅打包后的正式版本支持检查更新。', updateFailed: '更新失败：{message}',
    checkUpdates: '检查更新', download: '下载', restart: '重启安装',
    addProviderTitle: '添加提供商', editProviderTitle: '编辑提供商', logo: 'Logo',
    chooseImage: '选择图片', providerName: '提供商名称', baseUrl: 'Base URL',
    monitorBlocks: '监控积木', balance: '余额', dashboard: '官网仪表盘',
    label: '显示名称', path: '相对路径', jsonPath: 'JSON 字段路径', url: 'URL',
    noCustomProviders: '暂无自定义提供商。',
  },
};

function t(key) { return (T[currentLang] && T[currentLang][key]) || T.en[key] || key; }
function tf(key, values) {
  return Object.entries(values || {}).reduce((text, [name, value]) => text.replace(`{${name}}`, value), t(key));
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

function logoHtml(logo) {
  if (!logo) return DEFAULT_LOGO;
  if (String(logo).startsWith('data:image/')) return `<img src="${logo}" alt="">`;
  return logo;
}

function applyTranslations() {
  document.getElementById('header-title').textContent = t('settings');
  document.getElementById('cat-general').textContent = t('general');
  document.getElementById('cat-monitor').textContent = t('monitor');
  document.getElementById('cat-providers').textContent = t('providers');
  document.getElementById('lbl-language').textContent = t('language');
  document.getElementById('lang-hint').textContent = t('restartNote');
  document.getElementById('lbl-entry-list-enabled').textContent = currentLang === 'zh-CN' ? '启用条目切换列表' : 'Enable entry selector list';
  document.getElementById('entry-list-hint').textContent = currentLang === 'zh-CN'
    ? '关闭后悬浮窗恢复为纯本体大小，Logo 不再作为可点击入口。'
    : 'When disabled, the widget uses the compact original window size and the logo is not clickable.';
  document.getElementById('lbl-updates').textContent = t('updates');
  document.getElementById('lbl-current-version').textContent = t('currentVersion');
  elCheckUpdate.textContent = t('checkUpdates');
  elDownloadUpdate.textContent = t('download');
  elInstallUpdate.textContent = t('restart');
  elUpdateStatus.textContent = tf(updateStatusKey, updateStatusValues);
  document.getElementById('lbl-entries').textContent = t('monitorEntries');
  document.getElementById('btn-add').textContent = t('addEntry');
  document.getElementById('lbl-defresh').textContent = t('defaultRefresh');
  document.getElementById('lbl-custom-providers').textContent = t('customProviders');
  document.getElementById('btn-add-provider').textContent = t('addProvider');
  document.getElementById('lbl-name').textContent = t('name');
  document.getElementById('lbl-provider').textContent = t('provider');
  elEntryProviderSearch.placeholder = t('providerSearch');
  document.getElementById('lbl-simple-mode').textContent = t('simpleMode');
  document.getElementById('lbl-interval').textContent = t('refreshInterval');
  document.getElementById('opt-def').textContent = t('useDefault');
  document.getElementById('modal-cancel').textContent = t('cancel');
  document.getElementById('modal-save').textContent = t('save');
  document.getElementById('provider-modal-cancel').textContent = t('cancel');
  document.getElementById('provider-modal-save').textContent = t('save');
  document.getElementById('lbl-provider-logo').textContent = t('logo');
  document.getElementById('btn-choose-logo').textContent = t('chooseImage');
  document.getElementById('lbl-custom-provider-name').textContent = t('providerName');
  document.getElementById('lbl-custom-provider-base').textContent = t('baseUrl');
  document.getElementById('lbl-monitor-blocks').textContent = t('monitorBlocks');
  document.getElementById('btn-add-balance-monitor').textContent = '+ ' + t('balance');
  document.getElementById('btn-add-dashboard-monitor').textContent = '+ ' + t('dashboard');
  updateRefreshLabels();
  updateKeyField();
  renderEntries();
  renderCustomProviders();
  renderMonitorBlocks();
}

function updateRefreshLabels() {
  const labels = ['refresh1min', 'refresh5min', 'refresh10min', 'refresh15min', 'refresh30min', 'refresh60min'];
  ['opt-r1', 'opt-r5', 'opt-r10', 'opt-r15', 'opt-r30', 'opt-r60'].forEach((id, index) => {
    const el = document.getElementById(id);
    if (el) el.textContent = t(labels[index]);
  });
  Array.from(elEntryInterval.options).forEach(option => {
    const value = option.value;
    if (value === '-1') option.textContent = t('useDefault');
    else option.textContent = `${value} ${currentLang === 'zh-CN' ? '分钟' : value === '1' ? 'minute' : 'minutes'}`;
  });
}

async function loadProviders() {
  providersCache = await window.settingsAPI.getProviders();
  customProvidersCache = await window.settingsAPI.getCustomProviders();
  renderProviderOptions();
  renderCustomProviders();
}

function renderProviderOptions() {
  const current = elEntryProvider.value || '';
  elEntryProvider.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = '';
  elEntryProvider.appendChild(placeholder);
  providersCache.forEach(p => {
    const option = document.createElement('option');
    option.value = p.id;
    option.textContent = p.name + (p.custom ? ' · custom' : '');
    elEntryProvider.appendChild(option);
  });
  if (providersCache.some(p => p.id === current)) elEntryProvider.value = current;
  if (!elEntryProvider.value && elEntryProvider.options.length > 0) elEntryProvider.selectedIndex = 0;
  syncProviderInput();
  renderProviderComboList();
  updateKeyField();
}

function syncProviderInput() {
  const p = providerById(elEntryProvider.value);
  elEntryProviderSearch.value = p ? p.name : '';
}

function renderProviderComboList() {
  const query = elEntryProviderSearch.value.trim().toLowerCase();
  const matches = providersCache.filter(p =>
    !query || p.name.toLowerCase().includes(query) || p.id.toLowerCase().includes(query)
  );
  elEntryProviderOptions.innerHTML = '';
  matches.forEach(p => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'provider-option' + (p.id === elEntryProvider.value ? ' active' : '');
    item.dataset.id = p.id;
    item.innerHTML = `<span class="provider-option-logo">${logoHtml(p.logo || DEFAULT_LOGO)}</span><span>${escapeHtml(p.name)}${p.custom ? ' · custom' : ''}</span>`;
    item.addEventListener('click', () => selectProvider(p.id));
    elEntryProviderOptions.appendChild(item);
  });
  if (matches.length === 0) {
    elEntryProviderOptions.innerHTML = '<div class="provider-option-empty">No matches</div>';
  }
}

function selectProvider(id) {
  elEntryProvider.value = id;
  syncProviderInput();
  elEntryProviderOptions.classList.add('hidden');
  updateKeyField();
}

function providerById(id) {
  if (!id) return null;
  return providersCache.find(p => p.id === id) || { id, name: id, logo: DEFAULT_LOGO, custom: true };
}

function logoForProvider(id) {
  return logoHtml(providerById(id).logo || DEFAULT_LOGO);
}

function updateKeyField() {
  const isCodex = elEntryProvider.value === 'codex';
  const isDeepSeek = elEntryProvider.value === 'deepseek';
  document.getElementById('lbl-apikey').textContent = isCodex ? t('authPath') : t('apiKey');
  elEntryKey.placeholder = isCodex ? 'C:\\Users\\...\\.codex\\auth.json' : 'sk-...';
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
  elDeepSeekSimpleField.classList.toggle('hidden', !isDeepSeek);
}

function intervalLabel(v) {
  if (v == null || v === -1) return t('defaultLower');
  return `${v} min`;
}

async function renderEntries() {
  entriesCache = await window.settingsAPI.getEntries();
  elEntryList.innerHTML = '';
  entriesCache.forEach(entry => {
    const provider = providerById(entry.provider);
    const card = document.createElement('div');
    card.className = 'entry-card';
    card.innerHTML = `
      <div class="logo">${logoForProvider(entry.provider)}</div>
      <div class="info">
        <div class="entry-name">${escapeHtml(entry.name || t('unnamed'))}</div>
        <div class="entry-meta">${escapeHtml(provider.name)} &middot; ${escapeHtml(entry.apiKey || '')} &middot; Refresh: ${intervalLabel(entry.refreshInterval)}${entry.simpleMode ? ' · compact' : ''}</div>
      </div>
      <div class="actions">
        <button class="btn-edit" data-id="${entry.id}">${t('edit')}</button>
        <button class="btn-del" data-id="${entry.id}">${t('delete')}</button>
      </div>`;
    elEntryList.appendChild(card);
  });
  elEntryList.querySelectorAll('.btn-edit').forEach(btn => btn.addEventListener('click', () => openEditModal(btn.dataset.id)));
  elEntryList.querySelectorAll('.btn-del').forEach(btn => btn.addEventListener('click', () => deleteEntry(btn.dataset.id)));
}

function renderCustomProviders() {
  if (!elCustomProviderList) return;
  elCustomProviderList.innerHTML = '';
  if (customProvidersCache.length === 0) {
    elCustomProviderList.innerHTML = `<div class="empty-line">${t('noCustomProviders')}</div>`;
    return;
  }
  customProvidersCache.forEach(provider => {
    const card = document.createElement('div');
    card.className = 'entry-card';
    card.innerHTML = `
      <div class="logo">${logoHtml(provider.logo || DEFAULT_LOGO)}</div>
      <div class="info">
        <div class="entry-name">${escapeHtml(provider.name)}</div>
        <div class="entry-meta">${escapeHtml(provider.baseUrl)} · ${(provider.monitors || []).length} blocks</div>
      </div>
      <div class="actions">
        <button class="btn-edit-provider" data-id="${provider.id}">${t('edit')}</button>
        <button class="btn-del-provider" data-id="${provider.id}">${t('delete')}</button>
      </div>`;
    elCustomProviderList.appendChild(card);
  });
  elCustomProviderList.querySelectorAll('.btn-edit-provider').forEach(btn => btn.addEventListener('click', () => openProviderModal(btn.dataset.id)));
  elCustomProviderList.querySelectorAll('.btn-del-provider').forEach(btn => btn.addEventListener('click', () => deleteProvider(btn.dataset.id)));
}

document.querySelectorAll('.cat-btn').forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.cat)));

function switchTab(cat) {
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.getElementById('cat-' + cat).classList.add('active');
  document.getElementById('panel-' + cat).classList.add('active');
}

function openAddModal() {
  editingId = null;
  originalEntryProvider = '';
  elModalTitle.textContent = t('addTitle');
  elEntryName.value = '';
  elEntryProviderSearch.value = '';
  renderProviderOptions();
  elEntryProvider.value = '';
  elEntryProviderSearch.value = '';
  updateKeyField();
  elEntryKey.value = '';
  elEntryKey.dataset.masked = 'false';
  elEntryKey.type = 'password';
  elEntrySimpleMode.checked = false;
  elEntryInterval.value = '-1';
  updateKeyField();
  updateEyeIcon();
  elModal.classList.remove('hidden');
  elEntryName.focus();
}

function openEditModal(id) {
  const entry = entriesCache.find(e => e.id === id);
  if (!entry) return;
  editingId = id;
  originalEntryProvider = entry.provider;
  elModalTitle.textContent = t('editTitle');
  elEntryName.value = entry.name || '';
  elEntryProviderSearch.value = '';
  renderProviderOptions();
  selectProvider(entry.provider);
  elEntryKey.value = entry.apiKey || '';
  elEntryKey.dataset.masked = 'true';
  elEntryKey.type = 'password';
  elEntrySimpleMode.checked = Boolean(entry.simpleMode);
  elEntryInterval.value = entry.refreshInterval == null ? '-1' : String(entry.refreshInterval);
  updateKeyField();
  updateEyeIcon();
  elModal.classList.remove('hidden');
}

function closeModal() {
  elModal.classList.add('hidden');
  editingId = null;
  originalEntryProvider = '';
}

async function saveModal() {
  const name = elEntryName.value.trim();
  const provider = elEntryProvider.value;
  const keyValue = elEntryKey.value.trim();
  const intervalVal = elEntryInterval.value === '-1' ? null : Number(elEntryInterval.value);
  if (!name || !provider) return;

  if (editingId) {
    const fields = { name, provider, refreshInterval: intervalVal, simpleMode: provider === 'deepseek' && elEntrySimpleMode.checked };
    if (elEntryKey.dataset.masked !== 'true') fields.apiKey = keyValue;
    await window.settingsAPI.updateEntry(editingId, fields);
  } else {
    if (!keyValue && provider !== 'codex') return;
    await window.settingsAPI.addEntry({
      name,
      provider,
      apiKey: keyValue,
      refreshInterval: intervalVal,
      simpleMode: provider === 'deepseek' && elEntrySimpleMode.checked,
    });
  }
  closeModal();
  await renderEntries();
}

async function deleteEntry(id) {
  await window.settingsAPI.deleteEntry(id);
  await renderEntries();
}

function updateEyeIcon() {
  const hidden = elEntryKey.type === 'password';
  elToggleKey.querySelector('.eye-slash').style.display = hidden ? '' : 'none';
  elToggleKey.querySelector('.eye').style.display = hidden ? 'none' : '';
}

elToggleKey.addEventListener('click', () => {
  // Editing masked keys should reveal the masked text only; typing is what opts into replacement.
  elEntryKey.type = elEntryKey.type === 'password' ? 'text' : 'password';
  updateEyeIcon();
});

elEntryProvider.addEventListener('change', () => {
  updateKeyField();
  if (!editingId || elEntryProvider.value !== originalEntryProvider) {
    elEntryKey.value = '';
    elEntryKey.dataset.masked = 'false';
  }
  elEntryKey.type = 'password';
  updateEyeIcon();
});

elEntryProviderSearch.addEventListener('focus', () => {
  renderProviderComboList();
  elEntryProviderOptions.classList.remove('hidden');
});

elEntryProviderSearch.addEventListener('input', () => {
  renderProviderComboList();
  elEntryProviderOptions.classList.remove('hidden');
});

elEntryProviderSearch.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    syncProviderInput();
    elEntryProviderOptions.classList.add('hidden');
  }
  if (event.key === 'Enter') {
    const first = elEntryProviderOptions.querySelector('.provider-option');
    if (first) selectProvider(first.dataset.id);
  }
});

document.addEventListener('click', (event) => {
  if (!event.target.closest('.provider-combo')) {
    elEntryProviderOptions.classList.add('hidden');
    if (!elEntryProvider.value) elEntryProviderSearch.value = '';
    else if (!providersCache.some(p => p.name === elEntryProviderSearch.value)) syncProviderInput();
  }
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

elEntryKey.addEventListener('input', () => { elEntryKey.dataset.masked = 'false'; });

function openProviderModal(id) {
  editingProviderId = id || null;
  const provider = id ? customProvidersCache.find(p => p.id === id) : null;
  elProviderModalTitle.textContent = provider ? t('editProviderTitle') : t('addProviderTitle');
  elProviderName.value = provider ? provider.name : '';
  elProviderBase.value = provider ? provider.baseUrl : '';
  providerLogoDataUrl = provider ? (provider.logo || '') : '';
  monitorBlocks = provider ? JSON.parse(JSON.stringify(provider.monitors || [])) : [];
  providerWidgetHeight = provider ? (provider.widgetHeight || calculateProviderWidgetHeight(monitorBlocks)) : calculateProviderWidgetHeight(monitorBlocks);
  resetLogoControls();
  renderLogoPreview();
  renderMonitorBlocks();
  elProviderModal.classList.remove('hidden');
}

function closeProviderModal() {
  elProviderModal.classList.add('hidden');
  editingProviderId = null;
}

function cryptoId() {
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function resetLogoControls() {
  cropSourceDataUrl = '';
  cropRect = { x: 0, y: 0, size: 120 };
}

function renderLogoPreview() {
  elLogoPreview.innerHTML = logoHtml(providerLogoDataUrl || DEFAULT_LOGO);
}

function openLogoCropModal(dataUrl) {
  cropSourceDataUrl = dataUrl;
  elLogoCropImage.src = dataUrl;
  elLogoCropModal.classList.remove('hidden');
  elLogoCropImage.onload = initLogoCropBox;
  if (elLogoCropImage.complete) initLogoCropBox();
}

function normalizeMonitorBlock(block) {
  return {
    id: block.id || cryptoId(),
    type: block.type === 'dashboard' ? 'dashboard' : 'balance',
    label: block.label || '',
    path: block.path || '',
    jsonPath: block.jsonPath || '',
    url: block.url || '',
  };
}

function calculateProviderWidgetHeight(blocks) {
  const items = Array.isArray(blocks) ? blocks : [];
  const blockHeight = items.length === 0
    ? 20
    : items.reduce((sum, block) => sum + (block.type === 'dashboard' ? 26 : 20), 0) + Math.max(0, items.length - 1) * 7;
  const widgetCardHeight = Math.min(340, Math.max(125, 105 + blockHeight));
  return widgetCardHeight + 160;
}

function syncProviderWidgetHeight() {
  providerWidgetHeight = calculateProviderWidgetHeight(monitorBlocks);
  return providerWidgetHeight;
}

function renderMonitorBlocks() {
  if (!elMonitorBlockList) return;
  elMonitorBlockList.innerHTML = '';
  monitorBlocks = monitorBlocks.map(normalizeMonitorBlock);
  syncProviderWidgetHeight();
  monitorBlocks.forEach((block, index) => {
    const item = document.createElement('div');
    item.className = 'monitor-block';
    item.dataset.index = index;
    item.innerHTML = `
      <div class="monitor-block-head" draggable="true" data-index="${index}">
        <span class="drag-handle">::</span>
        <strong>${block.type === 'dashboard' ? t('dashboard') : t('balance')}</strong>
        <button class="btn-remove-monitor" data-index="${index}">${t('delete')}</button>
      </div>
      <input class="monitor-label" data-index="${index}" value="${escapeHtml(block.label)}" placeholder="${t('label')}">
      ${block.type === 'balance' ? `
        <input class="monitor-path" data-index="${index}" value="${escapeHtml(block.path)}" placeholder="${t('path')}">
        <input class="monitor-json-path" data-index="${index}" value="${escapeHtml(block.jsonPath)}" placeholder="${t('jsonPath')}">
      ` : `
        <input class="monitor-url" data-index="${index}" value="${escapeHtml(block.url)}" placeholder="${t('url')}">
      `}
    `;
    elMonitorBlockList.appendChild(item);
  });
  bindMonitorBlockEvents();
}

function bindMonitorBlockEvents() {
  elMonitorBlockList.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', () => {
      const block = monitorBlocks[Number(input.dataset.index)];
      if (input.classList.contains('monitor-label')) block.label = input.value;
      if (input.classList.contains('monitor-path')) block.path = input.value;
      if (input.classList.contains('monitor-json-path')) block.jsonPath = input.value;
      if (input.classList.contains('monitor-url')) block.url = input.value;
    });
  });
  elMonitorBlockList.querySelectorAll('.btn-remove-monitor').forEach(btn => {
    btn.addEventListener('click', () => {
      monitorBlocks.splice(Number(btn.dataset.index), 1);
      renderMonitorBlocks();
    });
  });
  elMonitorBlockList.querySelectorAll('.monitor-block').forEach(blockEl => {
    blockEl.addEventListener('dragover', e => e.preventDefault());
    blockEl.addEventListener('drop', e => {
      e.preventDefault();
      const from = Number(e.dataTransfer.getData('text/plain'));
      const to = Number(blockEl.dataset.index);
      if (from === to) return;
      const [moved] = monitorBlocks.splice(from, 1);
      monitorBlocks.splice(to, 0, moved);
      renderMonitorBlocks();
    });
  });
  elMonitorBlockList.querySelectorAll('.monitor-block-head').forEach(headEl => {
    headEl.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', headEl.dataset.index));
  });
}

async function saveProviderModal() {
  const name = elProviderName.value.trim();
  const baseUrl = elProviderBase.value.trim();
  if (!name || !baseUrl) return;
  const payload = {
    name,
    baseUrl,
    logo: getCroppedLogo(),
    monitors: monitorBlocks.map(normalizeMonitorBlock).filter(block => block.label && (block.type === 'dashboard' ? block.url : block.path && block.jsonPath)),
  };
  providerWidgetHeight = calculateProviderWidgetHeight(payload.monitors);
  payload.widgetHeight = providerWidgetHeight;
  if (editingProviderId) await window.settingsAPI.updateCustomProvider(editingProviderId, payload);
  else await window.settingsAPI.addCustomProvider(payload);
  closeProviderModal();
  await loadProviders();
  await renderEntries();
}

function getCroppedLogo() {
  return providerLogoDataUrl || DEFAULT_LOGO;
}

function initLogoCropBox() {
  const bounds = getCropImageBounds();
  const size = Math.max(48, Math.min(bounds.width, bounds.height) * 0.72);
  cropRect = {
    x: bounds.x + (bounds.width - size) / 2,
    y: bounds.y + (bounds.height - size) / 2,
    size,
  };
  renderLogoCropBox();
}

function getCropImageBounds() {
  const stage = elLogoCropStage.getBoundingClientRect();
  const img = elLogoCropImage.getBoundingClientRect();
  return {
    x: img.left - stage.left,
    y: img.top - stage.top,
    width: img.width,
    height: img.height,
  };
}

function renderLogoCropBox() {
  elLogoCropBox.style.left = `${cropRect.x}px`;
  elLogoCropBox.style.top = `${cropRect.y}px`;
  elLogoCropBox.style.width = `${cropRect.size}px`;
  elLogoCropBox.style.height = `${cropRect.size}px`;
}

function startLogoCropDrag(event) {
  const handle = event.target.classList.contains('crop-handle')
    ? Array.from(event.target.classList).find(name => ['nw', 'ne', 'sw', 'se'].includes(name))
    : null;
  cropDrag = {
    mode: handle ? 'resize' : 'move',
    handle,
    startX: event.clientX,
    startY: event.clientY,
    rect: { ...cropRect },
  };
  elLogoCropBox.setPointerCapture(event.pointerId);
}

function moveLogoCropDrag(event) {
  if (!cropDrag) return;
  if (cropDrag.mode === 'move') moveCropBox(event);
  else resizeCropBox(event);
  renderLogoCropBox();
}

function moveCropBox(event) {
  const bounds = getCropImageBounds();
  const dx = event.clientX - cropDrag.startX;
  const dy = event.clientY - cropDrag.startY;
  cropRect.x = clamp(cropDrag.rect.x + dx, bounds.x, bounds.x + bounds.width - cropRect.size);
  cropRect.y = clamp(cropDrag.rect.y + dy, bounds.y, bounds.y + bounds.height - cropRect.size);
}

function resizeCropBox(event) {
  const bounds = getCropImageBounds();
  const minSize = 36;
  const pointer = getStagePoint(event);
  const rect = cropDrag.rect;
  let x = rect.x;
  let y = rect.y;
  let size = rect.size;

  if (cropDrag.handle === 'se') {
    size = Math.min(pointer.x - rect.x, pointer.y - rect.y, bounds.x + bounds.width - rect.x, bounds.y + bounds.height - rect.y);
  } else if (cropDrag.handle === 'nw') {
    const right = rect.x + rect.size;
    const bottom = rect.y + rect.size;
    size = Math.min(right - pointer.x, bottom - pointer.y, right - bounds.x, bottom - bounds.y);
    x = right - size;
    y = bottom - size;
  } else if (cropDrag.handle === 'ne') {
    const bottom = rect.y + rect.size;
    size = Math.min(pointer.x - rect.x, bottom - pointer.y, bounds.x + bounds.width - rect.x, bottom - bounds.y);
    y = bottom - size;
  } else if (cropDrag.handle === 'sw') {
    const right = rect.x + rect.size;
    size = Math.min(right - pointer.x, pointer.y - rect.y, right - bounds.x, bounds.y + bounds.height - rect.y);
    x = right - size;
  }

  cropRect.size = Math.max(minSize, size);
  cropRect.x = clamp(x, bounds.x, bounds.x + bounds.width - cropRect.size);
  cropRect.y = clamp(y, bounds.y, bounds.y + bounds.height - cropRect.size);
}

function getStagePoint(event) {
  const stage = elLogoCropStage.getBoundingClientRect();
  const bounds = getCropImageBounds();
  return {
    x: clamp(event.clientX - stage.left, bounds.x, bounds.x + bounds.width),
    y: clamp(event.clientY - stage.top, bounds.y, bounds.y + bounds.height),
  };
}

function applyLogoCrop() {
  if (!cropSourceDataUrl || !elLogoCropImage.complete) return;
  const bounds = getCropImageBounds();
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const scaleX = elLogoCropImage.naturalWidth / bounds.width;
  const scaleY = elLogoCropImage.naturalHeight / bounds.height;
  const sx = (cropRect.x - bounds.x) * scaleX;
  const sy = (cropRect.y - bounds.y) * scaleY;
  const sw = cropRect.size * scaleX;
  const sh = cropRect.size * scaleY;
  ctx.drawImage(elLogoCropImage, sx, sy, sw, sh, 0, 0, 128, 128);
  providerLogoDataUrl = canvas.toDataURL('image/png');
  renderLogoPreview();
  closeLogoCropModal();
}

function closeLogoCropModal() {
  elLogoCropModal.classList.add('hidden');
  cropDrag = null;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

async function deleteProvider(id) {
  await window.settingsAPI.deleteCustomProvider(id);
  await loadProviders();
  await renderEntries();
}

document.getElementById('btn-choose-logo').addEventListener('click', async () => {
  const file = await window.settingsAPI.browseLogoFile();
  if (!file) return;
  openLogoCropModal(file.dataUrl);
});

elLogoCropBox.addEventListener('pointerdown', startLogoCropDrag);
elLogoCropBox.addEventListener('pointermove', moveLogoCropDrag);
elLogoCropBox.addEventListener('pointerup', () => { cropDrag = null; });
elLogoCropBox.addEventListener('pointercancel', () => { cropDrag = null; });
document.getElementById('logo-crop-apply').addEventListener('click', applyLogoCrop);
document.getElementById('logo-crop-cancel').addEventListener('click', closeLogoCropModal);
document.getElementById('logo-crop-close').addEventListener('click', closeLogoCropModal);
document.getElementById('btn-add-balance-monitor').addEventListener('click', () => {
  monitorBlocks.push({ id: cryptoId(), type: 'balance', label: '', path: '', jsonPath: '' });
  renderMonitorBlocks();
});
document.getElementById('btn-add-dashboard-monitor').addEventListener('click', () => {
  monitorBlocks.push({ id: cryptoId(), type: 'dashboard', label: '', url: '' });
  renderMonitorBlocks();
});
document.getElementById('provider-modal-save').addEventListener('click', saveProviderModal);
document.getElementById('provider-modal-cancel').addEventListener('click', closeProviderModal);
document.getElementById('provider-modal-close').addEventListener('click', closeProviderModal);
document.getElementById('btn-add-provider').addEventListener('click', () => openProviderModal());

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
  } else {
    setUpdateButtons('idle');
    setUpdateStatus('updateReady');
  }
}

function bindUpdateEvents() {
  updateCleanups.push(window.settingsAPI.onUpdateEvent('update-available', data => {
    setUpdateButtons('available');
    setUpdateStatus('updateAvailable', { version: data && data.version ? data.version : '--' });
  }));
  updateCleanups.push(window.settingsAPI.onUpdateEvent('update-not-available', () => {
    setUpdateButtons('idle');
    setUpdateStatus('updateNotAvailable');
  }));
  updateCleanups.push(window.settingsAPI.onUpdateEvent('update-progress', data => {
    setUpdateButtons('downloading');
    setUpdateStatus('updateDownloading', { percent: data && data.percent != null ? data.percent : 0 });
  }));
  updateCleanups.push(window.settingsAPI.onUpdateEvent('update-downloaded', () => {
    setUpdateButtons('downloaded');
    setUpdateStatus('updateDownloaded');
  }));
  updateCleanups.push(window.settingsAPI.onUpdateEvent('update-error', data => {
    setUpdateButtons('idle');
    setUpdateStatus('updateFailed', { message: data && data.message ? data.message : 'Unknown' });
  }));
  updateCleanups.push(window.settingsAPI.onUpdateEvent('update-dev-mode', () => {
    setUpdateButtons('idle');
    setUpdateStatus('updateDevMode');
  }));
}

async function checkForUpdates() {
  setUpdateButtons('checking');
  setUpdateStatus('updateChecking');
  await window.settingsAPI.checkForUpdates();
}

async function downloadUpdate() {
  setUpdateButtons('downloading');
  setUpdateStatus('updateDownloading', { percent: 0 });
  await window.settingsAPI.downloadUpdate();
}

document.getElementById('modal-save').addEventListener('click', saveModal);
document.getElementById('modal-cancel').addEventListener('click', closeModal);
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('btn-add').addEventListener('click', openAddModal);
document.getElementById('btn-close').addEventListener('click', () => window.settingsAPI.closeWindow());
elCheckUpdate.addEventListener('click', checkForUpdates);
elDownloadUpdate.addEventListener('click', downloadUpdate);
elInstallUpdate.addEventListener('click', () => window.settingsAPI.quitAndInstall());
elEntryName.addEventListener('keydown', e => { if (e.key === 'Enter') saveModal(); });
elEntryKey.addEventListener('keydown', e => { if (e.key === 'Enter') saveModal(); });
elInterval.addEventListener('change', async () => window.settingsAPI.setRefreshInterval(Number(elInterval.value)));
elEntryListEnabled.addEventListener('change', async () => {
  await window.settingsAPI.setEntryListEnabled(elEntryListEnabled.checked);
});
elLangSelect.addEventListener('change', async () => {
  currentLang = elLangSelect.value;
  await window.settingsAPI.setLanguage(currentLang);
  applyTranslations();
});
window.addEventListener('beforeunload', () => updateCleanups.forEach(fn => fn()));

(async () => {
  elInterval.value = String(await window.settingsAPI.getRefreshInterval());
  elEntryListEnabled.checked = await window.settingsAPI.getEntryListEnabled();
  currentLang = await window.settingsAPI.getLanguage();
  elLangSelect.value = currentLang;
  await loadProviders();
  bindUpdateEvents();
  applyTranslations();
  await loadUpdateStatus();
})();
