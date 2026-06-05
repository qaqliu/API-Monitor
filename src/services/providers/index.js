// Provider 注册表
// 新增 Provider 只需：1) 新建文件 2) 在此注册 3) settings.html 加 option

const { getCustomProviders, getCustomProvider } = require('../store');
const { createCustomProvider } = require('./custom');

const providers = {};

function register(provider) {
  providers[provider.id] = provider;
}

function getProvider(id) {
  const p = providers[id] || getRuntimeCustomProvider(id);
  if (!p) throw new Error(`Unknown provider: ${id}`);
  return p;
}

function getAllProviders() {
  const builtIns = Object.values(providers).map(p => ({ id: p.id, name: p.name, logo: p.logo, custom: false }));
  const custom = getCustomProviders().map(p => ({
    id: p.id,
    name: p.name,
    logo: p.logo,
    custom: true,
    monitors: p.monitors || [],
    widgetHeight: p.widgetHeight,
    widgetCardHeight: p.widgetCardHeight,
    widgetHtml: p.widgetHtml || '',
  }));
  return [...builtIns, ...custom];
}

async function fetchBalanceByEntry(entry) {
  const provider = getProvider(entry.provider);
  return provider.custom ? provider.fetchBalance(entry) : provider.fetchBalance(entry.apiKey);
}

function getRuntimeCustomProvider(id) {
  const definition = getCustomProvider(id);
  return definition ? createCustomProvider(definition) : null;
}

// 注册内置 Provider
register(require('./deepseek'));
register(require('./codex'));

module.exports = { register, getProvider, getAllProviders, fetchBalanceByEntry };
