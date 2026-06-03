// Provider 注册表
// 新增 Provider 只需：1) 新建文件 2) 在此注册 3) settings.html 加 option

const providers = {};

function register(provider) {
  providers[provider.id] = provider;
}

function getProvider(id) {
  const p = providers[id];
  if (!p) throw new Error(`Unknown provider: ${id}`);
  return p;
}

function getAllProviders() {
  return Object.values(providers).map(p => ({ id: p.id, name: p.name, logo: p.logo }));
}

async function fetchBalanceByEntry(entry) {
  const provider = getProvider(entry.provider);
  return provider.fetchBalance(entry.apiKey);
}

// 注册内置 Provider
register(require('./deepseek'));
register(require('./codex'));

module.exports = { register, getProvider, getAllProviders, fetchBalanceByEntry };
