// DOM refs
const elWidget = document.getElementById('widget');
const elPrev = document.getElementById('btn-prev');
const elNext = document.getElementById('btn-next');
const elLogo = document.getElementById('entry-logo');
const elTitle = document.getElementById('entry-title');
const elTotal = document.getElementById('val-total');
const elGranted = document.getElementById('val-granted');
const elTopped = document.getElementById('val-topped');
const elError = document.getElementById('error-message');
const elStatus = document.getElementById('status-text');
const btnRefresh = document.getElementById('btn-refresh');
const btnSettings = document.getElementById('btn-settings');
const btnMinimize = document.getElementById('btn-minimize');
const elBalanceView = document.getElementById('balance-view');
const elCodexView = document.getElementById('codex-view');
const elEmptyView = document.getElementById('empty-view');
const elDropdown = document.getElementById('entry-dropdown');
const elDropdownSearch = document.getElementById('dropdown-search-input');
const elDropdownList = document.getElementById('dropdown-list');

// Codex DOM refs
const elPct5h = document.getElementById('val-5h-pct');
const elPct7d = document.getElementById('val-7d-pct');
const elBar5h = document.getElementById('bar-5h');
const elBar7d = document.getElementById('bar-7d');
const elRing5h = document.getElementById('ring-5h');
const elRing7d = document.getElementById('ring-7d');
const elReset5h = document.getElementById('reset-5h');
const elReset7d = document.getElementById('reset-7d');
const elCredits = document.getElementById('val-credits');
const elErrorCodex = document.getElementById('error-message-codex');

let entries = [];
let currentIndex = 0;
let currentLang = 'zh-CN';
let dropdownOpen = false;
let refreshCleanup = null;
let entriesChangedCleanup = null;
let langChangeCleanup = null;

// Light i18n
const T = {
  en: {
    totalBalance: 'Total Balance', granted: 'Granted', toppedUp: 'Topped Up',
    fiveHourUsage: '5h Usage', sevenDayUsage: '7d Usage', credits: 'Credits',
    remaining: 'remaining',
    noEntries: 'No entries configured.', openSettings: 'Open Settings',
    refresh: 'Refresh', search: 'Search...', noMatches: 'No matches',
    addFirst: 'Add your first entry',
  },
  'zh-CN': {
    totalBalance: '总余额', granted: '赠送余额', toppedUp: '充值余额',
    fiveHourUsage: '5小时用量', sevenDayUsage: '7天用量', credits: '积分额度',
    remaining: '后重置',
    noEntries: '暂无监控条目。', openSettings: '打开设置',
    refresh: '刷新', search: '搜索...', noMatches: '无匹配结果',
    addFirst: '添加第一个条目',
  },
};

function t(key) { return (T[currentLang] && T[currentLang][key]) || T.en[key] || key; }

const PROVIDER_LOGOS = {
  deepseek: `<svg viewBox="0 0 64 47" xmlns="http://www.w3.org/2000/svg"><path d="M62.4575 3.89441C61.7888 3.56726 61.501 4.1908 61.1101 4.50769C60.9763 4.60999 60.863 4.7428 60.75 4.86548C59.7727 5.9082 58.6311 6.59302 57.1394 6.51123C54.9587 6.38855 53.0969 7.07349 51.4512 8.73975C51.1013 6.68506 49.939 5.45837 48.1699 4.67126C47.2441 4.26233 46.3081 3.85352 45.6599 2.96411C45.2073 2.33032 45.084 1.625 44.8577 0.929932C44.7136 0.510864 44.5696 0.081543 44.0862 0.0098877C43.5615 -0.0718994 43.3557 0.367676 43.1501 0.735718C42.3271 2.2384 42.0083 3.89441 42.0391 5.5708C42.1111 9.34277 43.7056 12.3481 46.8738 14.4846C47.2336 14.73 47.3264 14.9753 47.2131 15.333C46.9971 16.0691 46.74 16.7847 46.5137 17.5206C46.3696 17.9908 46.1538 18.093 45.6497 17.8887C43.9114 17.1628 42.4094 16.0895 41.0825 14.7913C38.8298 12.6139 36.7932 10.2117 34.2524 8.33081C33.6558 7.89124 33.0593 7.48242 32.4421 7.09399C29.8499 4.57922 32.7815 2.5144 33.4604 2.26904C34.1702 2.01343 33.7073 1.1344 31.4133 1.14465C29.1196 1.15479 27.0212 1.92151 24.3467 2.94373C23.9558 3.09705 23.5444 3.20947 23.1226 3.30151C20.6951 2.84143 18.1748 2.73926 15.5415 3.03577C10.5835 3.58777 6.62329 5.92859 3.7124 9.92554C0.215088 14.73 -0.60791 20.1886 0.400146 25.8824C1.45972 31.8828 4.5249 36.8508 9.23608 40.7354C14.1221 44.7629 19.7488 46.7357 26.1675 46.3575C30.0659 46.1327 34.4067 45.6113 39.303 41.4713C40.5374 42.0847 41.8335 42.33 43.9834 42.514C45.6394 42.6674 47.2336 42.4323 48.468 42.1766C50.4019 41.7678 50.2683 39.9789 49.5688 39.6517C43.9009 37.0144 45.1455 38.0878 44.0142 37.2189C46.8943 33.8148 51.2351 30.278 52.9324 18.8188C53.0662 17.9091 52.9529 17.3367 52.9324 16.6006C52.9221 16.1509 53.0249 15.9771 53.5393 15.9259C54.9587 15.7625 56.3372 15.3739 57.6023 14.6788C61.2747 12.6753 62.7559 9.38367 63.1055 5.43799C63.157 4.83484 63.0952 4.2113 62.4575 3.89441ZM30.4568 39.4065C24.9639 35.0927 22.2998 33.6718 21.199 33.7332C20.1704 33.7944 20.3557 34.97 20.5818 35.7367C20.8186 36.493 21.1272 37.0144 21.5591 37.6788C21.8574 38.1184 22.0632 38.7727 21.2607 39.2633C19.4915 40.3571 16.416 38.8953 16.272 38.8237C12.6924 36.718 9.69897 33.9375 7.59033 30.1349C5.55347 26.4753 4.37061 22.5499 4.17529 18.3589C4.12378 17.3468 4.42212 16.989 5.43018 16.8051C6.75708 16.5597 8.12524 16.5087 9.45215 16.7029C15.0581 17.5206 19.8311 20.025 23.8323 23.9913C26.116 26.2504 27.844 28.9491 29.6235 31.5864C31.5164 34.3873 33.553 37.0553 36.145 39.2429C37.0605 40.0095 37.791 40.5922 38.4905 41.0215C36.3816 41.2567 32.8638 41.3077 30.4568 39.4065ZM33.0901 22.4886C33.0901 22.0388 33.4502 21.681 33.9026 21.681C34.0056 21.681 34.0981 21.7015 34.1804 21.7322C34.2935 21.7731 34.3965 21.8344 34.4788 21.9264C34.6228 22.0695 34.7051 22.2739 34.7051 22.4886C34.7051 22.9384 34.345 23.2961 33.8923 23.2961C33.4397 23.2961 33.0901 22.9384 33.0901 22.4886ZM41.2676 26.6798C40.7432 26.8944 40.2185 27.0784 39.7144 27.0989C38.9326 27.1398 38.0789 26.8229 37.616 26.4344C36.896 25.8313 36.3816 25.494 36.1658 24.441C36.073 23.9913 36.1245 23.2961 36.2068 22.8975C36.3921 22.0388 36.1863 21.4868 35.5793 20.986C35.0857 20.577 34.4583 20.4646 33.769 20.4646C33.5117 20.4646 33.2751 20.3522 33.1003 20.2601C32.8123 20.1171 32.5757 19.7593 32.802 19.3197C32.874 19.1766 33.2239 18.8291 33.3062 18.7677C34.2422 18.2362 35.3223 18.4099 36.3201 18.8086C37.2458 19.1869 37.9453 19.882 38.9534 20.8633C39.9819 22.0491 40.167 22.3762 40.7534 23.2655C41.2163 23.9607 41.6379 24.6761 41.926 25.494C42.1008 26.0051 41.8745 26.4242 41.2676 26.6798Z" fill="#4D6BFE" fill-rule="nonzero"/></svg>`,
  codex: `<svg viewBox="0 0 320 320" xmlns="http://www.w3.org/2000/svg" aria-label="ChatGPT"><path fill="#10A37F" d="m297.06 130.97c7.26-21.79 4.76-45.66-6.85-65.48-17.46-30.4-52.56-46.04-86.84-38.68-15.25-17.18-37.16-26.95-60.13-26.81-35.04-.08-66.13 22.48-76.91 55.82-22.51 4.61-41.94 18.7-53.31 38.67-17.59 30.32-13.58 68.54 9.92 94.54-7.26 21.79-4.76 45.66 6.85 65.48 17.46 30.4 52.56 46.04 86.84 38.68 15.24 17.18 37.16 26.95 60.13 26.8 35.06.09 66.16-22.49 76.94-55.86 22.51-4.61 41.94-18.7 53.31-38.67 17.57-30.32 13.55-68.51-9.94-94.51zm-120.28 168.11c-14.03.02-27.62-4.89-38.39-13.88.49-.26 1.34-.73 1.89-1.07l63.72-36.8c3.26-1.85 5.26-5.32 5.24-9.07v-89.83l26.93 15.55c.29.14.48.42.52.74v74.39c-.04 33.08-26.83 59.9-59.91 59.97zm-128.84-55.03c-7.03-12.14-9.56-26.37-7.15-40.18.47.28 1.3.79 1.89 1.13l63.72 36.8c3.23 1.89 7.23 1.89 10.47 0l77.79-44.92v31.1c.02.32-.13.63-.38.83l-64.41 37.19c-28.69 16.52-65.33 6.7-81.92-21.95zm-16.77-139.09c7-12.16 18.05-21.46 31.21-26.29 0 .55-.03 1.52-.03 2.2v73.61c-.02 3.74 1.98 7.21 5.23 9.06l77.79 44.91-26.93 15.55c-.27.18-.61.21-.91.08l-64.42-37.22c-28.63-16.58-38.45-53.21-21.95-81.89zm221.26 51.49-77.79-44.92 26.93-15.54c.27-.18.61-.21.91-.08l64.42 37.19c28.68 16.57 38.51 53.26 21.94 81.94-7.01 12.14-18.05 21.44-31.2 26.28v-75.81c.03-3.74-1.96-7.2-5.2-9.06zm26.8-40.34c-.47-.29-1.3-.79-1.89-1.13l-63.72-36.8c-3.23-1.89-7.23-1.89-10.47 0l-77.79 44.92v-31.1c-.02-.32.13-.63.38-.83l64.41-37.16c28.69-16.55 65.37-6.7 81.91 22 6.99 12.12 9.52 26.31 7.15 40.1zm-168.51 55.43-26.94-15.55c-.29-.14-.48-.42-.52-.74v-74.39c.02-33.12 26.89-59.96 60.01-59.94 14.01 0 27.57 4.92 38.34 13.88-.49.26-1.33.73-1.89 1.07l-63.72 36.8c-3.26 1.85-5.26 5.31-5.24 9.06l-.04 89.79zm14.63-31.54 34.65-20.01 34.65 20v40.01l-34.65 20-34.65-20z"/></svg>`,
};

function currentEntry() { return entries[currentIndex] || null; }

function formatTime() {
  return new Date().toLocaleTimeString('zh-CN', { hour12: false });
}

function renderNav() {
  const hasMultiple = entries.length > 1;
  elPrev.classList.toggle('hidden', !hasMultiple);
  elNext.classList.toggle('hidden', !hasMultiple);
}

function renderHeader() {
  const entry = currentEntry();
  elLogo.className = 'logo';
  if (entry) {
    elLogo.classList.add(`provider-${entry.provider}`);
    elLogo.innerHTML = PROVIDER_LOGOS[entry.provider] || '';
    elTitle.textContent = entry.name || 'API Monitor';
  } else {
    elLogo.innerHTML = '';
    elTitle.textContent = 'API Monitor';
  }
}

function applyTranslations() {
  const entry = currentEntry();
  const isCodex = entry && entry.provider === 'codex';

  // Resize widget height
  if (isCodex) {
    elWidget.classList.add('widget-codex');
  } else {
    elWidget.classList.remove('widget-codex');
  }
  window.api.resizeWidget(isCodex ? 'codex' : 'deepseek');

  // Toggle views
  elBalanceView.style.display = isCodex ? 'none' : '';
  elCodexView.style.display = isCodex ? '' : 'none';

  if (isCodex) {
    document.getElementById('lbl-5h').textContent = t('fiveHourUsage');
    document.getElementById('lbl-7d').textContent = t('sevenDayUsage');
    document.getElementById('lbl-credits').textContent = t('credits');
  } else {
    document.getElementById('lbl-total').textContent = t('totalBalance');
    document.getElementById('lbl-granted').textContent = t('granted');
    document.getElementById('lbl-topped').textContent = t('toppedUp');
  }

  document.getElementById('empty-msg').textContent = t('noEntries');
  document.getElementById('btn-open-settings').textContent = t('openSettings');
  btnRefresh.innerHTML = '&#x21bb; ' + t('refresh');
  elDropdownSearch.placeholder = t('search');
}

function showEmptyState() {
  elBalanceView.style.display = 'none';
  elCodexView.style.display = 'none';
  elEmptyView.classList.remove('hidden');
  btnRefresh.disabled = true;
  elLogo.innerHTML = '';
  elTitle.textContent = 'API Monitor';
  elPrev.classList.add('hidden');
  elNext.classList.add('hidden');
}

function showBalanceView() {
  elEmptyView.classList.add('hidden');
  btnRefresh.disabled = false;
}

function setLoading() {
  // DeepSeek
  [elTotal, elGranted, elTopped].forEach(el => {
    el.textContent = '--';
    el.classList.add('loading');
    el.classList.remove('codex-value');
  });
  elError.classList.add('hidden');
  // Codex
  [elPct5h, elPct7d].forEach(el => { el.textContent = '--'; });
  elBar5h.style.width = '0%';
  elBar7d.style.width = '0%';
  setRingProgress(elRing5h, 0);
  setRingProgress(elRing7d, 0);
  elReset5h.textContent = '--';
  elReset7d.textContent = '--';
  elCredits.textContent = '--';
  elErrorCodex.classList.add('hidden');
}

function displayBalance(balance, provider) {
  if (provider === 'codex') {
    displayCodexBalance(balance);
  } else {
    elTotal.textContent = balance.total_balance.toFixed(2);
    elGranted.textContent = balance.granted_balance.toFixed(2);
    elTopped.textContent = balance.topped_up_balance.toFixed(2);
    [elTotal, elGranted, elTopped].forEach(el => {
      el.classList.remove('codex-value');
      el.classList.remove('loading');
    });
    elError.classList.add('hidden');
  }
  elStatus.textContent = formatTime();
}

function displayCodexBalance(b) {
  // 5h
  const pPct = b.primary_used_percent;
  elPct5h.textContent = pPct != null ? `${pPct}%` : '--';
  elBar5h.style.width = pPct != null ? `${Math.min(pPct, 100)}%` : '0%';
  renderCodexReset(elRing5h, elReset5h, b.primary_reset_after_seconds, 18000, false);
  // 7d
  const sPct = b.secondary_used_percent;
  elPct7d.textContent = sPct != null ? `${sPct}%` : '--';
  elBar7d.style.width = sPct != null ? `${Math.min(sPct, 100)}%` : '0%';
  renderCodexReset(elRing7d, elReset7d, b.secondary_reset_after_seconds, 604800, true);
  // Credits
  elCredits.textContent = `$${(b.credits_balance || 0).toFixed(2)}`;
  elErrorCodex.classList.add('hidden');
}

// --- Codex helpers ---
const RING_CIRC = 2 * Math.PI * 8; // r=8 → ~50.27

function setRingProgress(el, fraction) {
  const offset = RING_CIRC * (1 - Math.min(Math.max(fraction, 0), 1));
  el.setAttribute('stroke-dasharray', RING_CIRC);
  el.setAttribute('stroke-dashoffset', offset);
}

function renderCodexReset(ringEl, textEl, resetAfterSec, windowSec, isWeekly) {
  if (resetAfterSec == null) {
    setRingProgress(ringEl, 0);
    textEl.textContent = '--';
    return;
  }
  const remaining = Math.max(0, resetAfterSec);
  const fraction = windowSec > 0 ? remaining / windowSec : 0;
  setRingProgress(ringEl, fraction);

  const rem = t('remaining');
  if (isWeekly) {
    const d = Math.floor(remaining / 86400);
    const h = Math.floor((remaining % 86400) / 3600);
    textEl.textContent = `${d}d ${h}h ${rem}`;
  } else {
    const h = Math.floor(remaining / 3600);
    const m = Math.floor((remaining % 3600) / 60);
    textEl.textContent = `${h}h ${m}min ${rem}`;
  }
}

function displayError(code, message) {
  const entry = currentEntry();
  if (entry && entry.provider === 'codex') {
    elCodexView.style.display = '';
    elPct5h.textContent = '--'; elPct7d.textContent = '--';
    elBar5h.style.width = '0%'; elBar7d.style.width = '0%';
    setRingProgress(elRing5h, 0); setRingProgress(elRing7d, 0);
    elReset5h.textContent = '--'; elReset7d.textContent = '--';
    elCredits.textContent = '--';
    elErrorCodex.textContent = message;
    elErrorCodex.classList.remove('hidden');
  } else {
    [elTotal, elGranted, elTopped].forEach(el => {
      el.textContent = '--';
      el.classList.add('loading');
    });
    elError.textContent = message;
    elError.classList.remove('hidden');
  }
  elStatus.textContent = formatTime();
}

async function refreshBalance() {
  const entry = currentEntry();
  if (!entry) return;
  setLoading();
  const result = await window.api.getBalance(entry.id);
  if (result.success) {
    displayBalance(result.data, entry.provider);
  } else {
    displayError(result.error, result.message);
  }
}

async function loadEntries() {
  entries = await window.api.getEntries();
  currentIndex = await window.api.getCurrentIndex();
  if (currentIndex >= entries.length) currentIndex = Math.max(0, entries.length - 1);

  if (entries.length === 0) {
    showEmptyState();
  } else {
    showBalanceView();
    renderHeader();
    renderNav();
    applyTranslations();
    refreshBalance();
  }

  if (dropdownOpen) buildDropdownItems(elDropdownSearch.value);
}

async function switchEntry(index) {
  if (index === currentIndex || index < 0 || index >= entries.length) return;
  currentIndex = index;
  await window.api.setCurrentIndex(currentIndex);
  renderHeader();
  renderNav();
  applyTranslations();
  refreshBalance();
  if (dropdownOpen) buildDropdownItems(elDropdownSearch.value);
}

async function switchEntryDelta(delta) {
  if (entries.length <= 1) return;
  const newIdx = (currentIndex + delta + entries.length) % entries.length;
  await switchEntry(newIdx);
}

// --- Dropdown ---
function openDropdown() {
  if (dropdownOpen) return;
  dropdownOpen = true;
  elDropdown.classList.remove('hidden');
  elDropdownSearch.value = '';
  buildDropdownItems('');
  elDropdownSearch.focus();
}

function closeDropdown() {
  if (!dropdownOpen) return;
  dropdownOpen = false;
  elDropdown.classList.add('hidden');
}

function buildDropdownItems(filter) {
  const q = (filter || '').toLowerCase();
  const filtered = entries.filter(e =>
    !q || e.name.toLowerCase().includes(q) || e.provider.toLowerCase().includes(q)
  );

  elDropdownList.innerHTML = '';

  if (entries.length === 0) {
    elDropdownList.innerHTML = `<div class="dropdown-empty">
      <div>${t('noEntries')}</div>
      <button class="btn-add-first">${t('addFirst')}</button>
    </div>`;
    const btn = elDropdownList.querySelector('.btn-add-first');
    if (btn) btn.addEventListener('click', () => {
      closeDropdown();
      window.api.openSettings();
    });
    return;
  }

  if (filtered.length === 0) {
    elDropdownList.innerHTML = `<div class="dropdown-empty">${t('noMatches')}</div>`;
    return;
  }

  filtered.forEach(entry => {
    const idx = entries.indexOf(entry);
    const isActive = idx === currentIndex;
    const div = document.createElement('div');
    div.className = 'dropdown-item' + (isActive ? ' active' : '');
    div.classList.add(`provider-${entry.provider}`);
    div.dataset.index = idx;
    div.innerHTML = `
      <span class="item-logo">${PROVIDER_LOGOS[entry.provider] || ''}</span>
      <span class="item-name">${escapeHtml(entry.name || 'Unnamed')}</span>
      <span class="item-check">&#x2713;</span>
    `;
    div.addEventListener('click', () => {
      closeDropdown();
      switchEntry(idx);
    });
    elDropdownList.appendChild(div);
  });
}

elDropdownSearch.addEventListener('input', () => {
  buildDropdownItems(elDropdownSearch.value);
});

elDropdownSearch.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeDropdown();
  } else if (e.key === 'Enter') {
    const first = elDropdownList.querySelector('.dropdown-item');
    if (first) {
      closeDropdown();
      switchEntry(Number(first.dataset.index));
    }
  }
});

// --- Event listeners ---
elPrev.addEventListener('click', () => switchEntryDelta(-1));
elNext.addEventListener('click', () => switchEntryDelta(1));

elTitle.addEventListener('click', (e) => {
  e.stopPropagation();
  if (dropdownOpen) {
    closeDropdown();
  } else {
    openDropdown();
  }
});

btnRefresh.addEventListener('click', refreshBalance);
btnSettings.addEventListener('click', () => window.api.openSettings());
btnMinimize.addEventListener('click', () => window.api.minimizeWindow());
document.getElementById('btn-exit').addEventListener('click', () => window.api.quitApp());
document.getElementById('btn-open-settings').addEventListener('click', () => window.api.openSettings());

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// --- Update notification ---
let updateCleanups = [];
const elUpdateBanner = document.getElementById('update-banner');
const elUpdateText = document.getElementById('update-text');
const elUpdateAction = document.getElementById('update-action');

function showUpdateBanner(text, actionLabel, actionFn) {
  elUpdateText.textContent = text;
  elUpdateAction.textContent = actionLabel;
  elUpdateAction.onclick = actionFn;
  elUpdateBanner.classList.remove('hidden');
}

function hideUpdateBanner() { elUpdateBanner.classList.add('hidden'); }

updateCleanups.push(window.api.onUpdateEvent('update-available', (data) => {
  showUpdateBanner(`v${data.version} available`, 'Download', () => {
    elUpdateText.textContent = 'Downloading...';
    elUpdateAction.textContent = '...';
    elUpdateAction.onclick = null;
    window.api.downloadUpdate().catch((err) => {
      showUpdateBanner(`Update failed: ${err.message || 'Unknown'}`, 'Retry', () => {
        hideUpdateBanner();
        window.api.checkForUpdates();
      });
    });
  });
}));

updateCleanups.push(window.api.onUpdateEvent('update-progress', (data) => {
  elUpdateText.textContent = `Downloading... ${data.percent}%`;
  elUpdateAction.textContent = '...';
  elUpdateAction.onclick = null;
}));

updateCleanups.push(window.api.onUpdateEvent('update-downloaded', () => {
  showUpdateBanner('Update ready. Restart now?', 'Restart', () => {
    elUpdateAction.textContent = '...';
    elUpdateAction.onclick = null;
    window.api.quitAndInstall().catch((err) => {
      showUpdateBanner(`Install failed: ${err.message || 'Unknown'}`, 'Retry', () => {
        window.api.quitAndInstall();
      });
    });
  });
}));

updateCleanups.push(window.api.onUpdateEvent('update-error', (data) => {
  showUpdateBanner(`Update failed: ${data.message}`, 'Retry', () => {
    hideUpdateBanner();
    window.api.checkForUpdates();
  });
}));

// IPC listeners
refreshCleanup = window.api.onTriggerRefresh(() => refreshBalance());
entriesChangedCleanup = window.api.onEntriesChanged(() => loadEntries());

langChangeCleanup = window.api.onLanguageChanged((lang) => {
  currentLang = lang;
  applyTranslations();
});

window.addEventListener('beforeunload', () => {
  if (refreshCleanup) refreshCleanup();
  if (entriesChangedCleanup) entriesChangedCleanup();
  if (langChangeCleanup) langChangeCleanup();
  updateCleanups.forEach(fn => fn());
});

// Init
(async () => {
  currentLang = await window.api.getLanguage();
  applyTranslations();
  await loadEntries();
})();
