// 模板中心API
/**
 * 获取模板列表
 * @param {Object} params - { page, pageSize, scene, collectType, status, search, sortType }
 * @returns {Promise<{content:[], totalElements:number}>}
 */
export async function getTemplates(params = {}) {
  const query = Object.entries(params)
    .filter(([k, v]) => v !== undefined && v !== '' && v !== '全部')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  const res = await fetch(`/api/templates${query ? `?${query}` : ''}`);
  if (res.status === 401) throw new Error('未登录');
  if (!res.ok) throw new Error('获取模板列表失败');
  return res.json();
}

export async function api(path, init = {}) {
  const resp = await fetch('/api' + path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
    ...init
  });
  if (!resp.ok) throw new Error(await resp.text());
  const ct = resp.headers.get('content-type') || '';
  return ct.includes('application/json') ? resp.json() : resp.text();
}

// 获取当前用户完整资料
export function getProfile() {
  return api('/profile');
}

// 更新当前用户资料
export function updateProfile(data) {
  return api('/profile', {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

// 修改当前用户密码
export function changePassword(newPassword) {
  return api('/profile/password', {
    method: 'PUT',
    body: JSON.stringify({ newPassword })
  });
}

export async function getAgents() {
  const res = await fetch("/api/agents");
  if (!res.ok) throw new Error("获取代理列表失败");
  return res.json();
}

// 代理管理API
export async function addAgent(agent) {
  const res = await fetch("/api/agents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(agent),
  });
  if (!res.ok) throw new Error("添加代理失败");
  return res.json();
}

export async function updateAgent(id, agent) {
  const res = await fetch(`/api/agents/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(agent),
  });
  if (!res.ok) throw new Error("更新代理失败");
  return res.json();
}

export async function deleteAgent(id) {
  const res = await fetch(`/api/agents/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("删除代理失败");
}

export function getTemplateById(id) {
  if (!id) throw new Error('缺少模板 id');
  // 复用你现有的 api()，自动带 /api 前缀与 credentials
  return api(`/templates/${id}`);
}