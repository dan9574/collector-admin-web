import React, { useState, useEffect } from "react";
import { getProfile, updateProfile, changePassword, getAgents, addAgent, updateAgent, deleteAgent, api } from "../api";

export default function SystemManagement() {
  // 注册账号相关
  const [registerForm, setRegisterForm] = useState({ username: "", passwordHash: "", confirmPassword: "", realName: "", showPassword: false, showConfirmPassword: false });
  const [registerMsg, setRegisterMsg] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);

  // 注册提交
  async function handleRegister(e) {
  e.preventDefault();
  if (registerForm.passwordHash !== registerForm.confirmPassword) {
    setRegisterMsg('两次密码不一致');
    return;
  }
  setRegisterLoading(true);
  try {
    const payload = {
      username: registerForm.username?.trim(),
      realName: registerForm.realName?.trim(),
      // 后端用 passwordHash 字段接收“明文密码”，随后服务端自行 hash
      passwordHash: registerForm.passwordHash
    };
    const resp = await api('/users', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    setRegisterMsg('注册成功');
  } catch (err) {
    setRegisterMsg(`注册失败：${err.message || 'Unknown error'}`);
  } finally {
    setRegisterLoading(false);
  }
}

  // 代理管理相关
  const [agents, setAgents] = useState([]);
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentError, setAgentError] = useState("");
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null); // null=新增，否则为编辑对象
  const [agentForm, setAgentForm] = useState({
    name: "",
    location: "",
    ipAddress: "",
    totalProcesses: "",
    availableProcesses: "",
    status: "运行中"
  });
  const [agentFormMsg, setAgentFormMsg] = useState("");
  // 分页相关
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const total = agents.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pagedAgents = agents.slice((page - 1) * pageSize, page * pageSize);

  // 分页按钮渲染逻辑
  function renderPagination() {
    if (totalPages === 1) {
      return (
        <button className="px-3 py-1 border border-primary-500 bg-primary-500 text-white rounded-button shadow">1</button>
      );
    }
    if (totalPages === 2) {
      return (
        <>
          <button
            className={`px-3 py-1 border rounded-button shadow ${page === 1 ? 'border-primary-500 bg-primary-500 text-white' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'}`}
            onClick={() => setPage(1)}
          >1</button>
          <button
            className={`px-3 py-1 border rounded-button shadow ml-2 ${page === 2 ? 'border-primary-500 bg-primary-500 text-white' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'}`}
            onClick={() => setPage(2)}
          >2</button>
        </>
      );
    }
    // totalPages > 2
    return (
      <>
        <button
          className={`px-3 py-1 border rounded-button shadow ${page === 1 ? 'border-primary-500 bg-primary-500 text-white' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'}`}
          onClick={() => setPage(1)}
        >1</button>
        {page > 2 && <span className="mx-1 text-gray-400">...</span>}
        {page !== 1 && page !== totalPages && (
          <button
            className="px-3 py-1 border border-primary-500 bg-primary-500 text-white rounded-button shadow mx-1"
            disabled
          >{page}</button>
        )}
        {page < totalPages - 1 && <span className="mx-1 text-gray-400">...</span>}
        <button
          className={`px-3 py-1 border rounded-button shadow ml-1 ${page === totalPages ? 'border-primary-500 bg-primary-500 text-white' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'}`}
          onClick={() => setPage(totalPages)}
        >{totalPages}</button>
      </>
    );
  }

  // 状态选项
  const statusOptions = [
    { value: "运行中", color: "bg-green-100 text-green-800" },
    { value: "满载", color: "bg-yellow-100 text-yellow-800" },
    { value: "离线", color: "bg-red-100 text-red-800" }
  ];

  // 获取代理列表
  const fetchAgents = async () => {
    setAgentLoading(true);
    setAgentError("");
    try {
      const data = await getAgents();
      setAgents(data);
      setPage(1); // 每次刷新重置到第一页
    } catch (e) {
      setAgentError("加载代理列表失败");
    } finally {
      setAgentLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  // 打开新增/编辑弹窗
  const openAgentModal = (agent = null) => {
    setAgentFormMsg("");
    if (agent) {
      setEditingAgent(agent);
      setAgentForm({
        name: agent.name ?? "",
        location: agent.location ?? "",
        ipAddress: agent.ipAddress ?? "",
        totalProcesses: agent.totalProcesses ?? "",
        availableProcesses: agent.availableProcesses ?? "",
        status: agent.status ?? "运行中"
      });
    } else {
      setEditingAgent(null);
      setAgentForm({ name: "", location: "", ipAddress: "", totalProcesses: "", availableProcesses: "", status: "运行中" });
    }
    setShowAgentModal(true);
  };

  // 关闭弹窗
  const closeAgentModal = () => {
    setShowAgentModal(false);
    setEditingAgent(null);
    setAgentFormMsg("");
  };

  // 提交新增/编辑
  const handleAgentFormSubmit = async (e) => {
    e.preventDefault();
    setAgentFormMsg("");
    // 校验
    if (!agentForm.name || !agentForm.location || !agentForm.ipAddress || !agentForm.totalProcesses || !agentForm.availableProcesses) {
      setAgentFormMsg("请填写所有必填项");
      return;
    }
    try {
      if (editingAgent) {
        await updateAgent(editingAgent.id, agentForm);
        setAgentFormMsg("修改成功");
      } else {
        await addAgent(agentForm);
        setAgentFormMsg("添加成功");
      }
      closeAgentModal();
      fetchAgents();
    } catch (e) {
      setAgentFormMsg((editingAgent ? "修改" : "添加") + "失败: " + (e.message || ""));
    }
  };

  // 删除代理
  const handleDeleteAgent = async (id) => {
    if (!window.confirm("确定要删除该代理吗？")) return;
    try {
      await deleteAgent(id);
      fetchAgents();
    } catch (e) {
      alert("删除失败: " + (e.message || ""));
    }
  };

  // Tab: 'info' | 'password' | 'register'
  const [activeTab, setActiveTab] = useState("info");
  // 个人信息表单
  const [profile, setProfile] = useState({
    realName: "",
    position: "",
    email: "",
    phone: "",
    bio: ""
  });
  // 只读字段
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");
  // 状态
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  // 密码输入框显示/隐藏
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // 密码输入内容
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdMsg, setPwdMsg] = useState("");

  // 页面加载时获取个人信息
  useEffect(() => {
    setLoading(true);
    getProfile()
      .then(data => {
        setUsername(data.username || "");
        setRole(data.role || "");
        setProfile({
          realName: data.realName || "",
          position: data.position || "",
          email: data.email || "",
          phone: data.phone || "",
          bio: data.bio || ""
        });
      })
      .catch(() => setMsg("加载用户信息失败"))
      .finally(() => setLoading(false));
  }, []);

  // 个人信息保存
  const handleSaveProfile = async () => {
    setSaving(true);
    setMsg("");
    try {
      await updateProfile(profile);
      setMsg("保存成功");
    } catch (e) {
      setMsg("保存失败: " + (e.message || ""));
    } finally {
      setSaving(false);
    }
  };

  // 密码保存
  const handleSavePassword = async () => {
    setPwdMsg("");
    if (!password) {
      setPwdMsg("请输入新密码");
      return;
    }
    if (password !== confirmPassword) {
      setPwdMsg("两次输入的密码不一致");
      return;
    }
    try {
      await changePassword(password);
      setPwdMsg("密码修改成功");
      setPassword("");
      setConfirmPassword("");
    } catch (e) {
      setPwdMsg("密码修改失败: " + (e.message || ""));
    }
  };

  return (
    <div className="flex flex-col min-h-[1024px] bg-gray-50">
      {/* 顶部Header */}
      <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6 sticky top-0 z-10">
        <h1 className="text-xl font-semibold text-gray-800">系统管理</h1>
        <div className="flex items-center space-x-4">
          <button className="text-gray-500 hover:text-primary-500 transition-colors duration-200 p-2 rounded-full">
            <i className="fas fa-bell fa-icon"></i>
          </button>
          <div className="w-px h-6 bg-gray-200"></div>
          <button className="flex items-center text-gray-600 hover:text-primary-500 transition-colors duration-200 p-2 rounded-full">
            <i className="fas fa-question-circle fa-icon mr-2"></i>
            <span>帮助中心</span>
          </button>
        </div>
      </header>
      {/* 内容区域 */}
      <main className="flex-1 p-6">
  {/* 账户管理 */}
  <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800">账户管理</h2>
            {activeTab === "info" ? (
              <div className="flex space-x-2">
                <button
                  className="px-4 py-2 bg-primary-500 text-white rounded-button hover:bg-primary-500 whitespace-nowrap shadow transition-colors duration-200"
                  onClick={handleSaveProfile}
                  disabled={saving}
                >
                  <i className="fas fa-save fa-icon mr-2"></i>{saving ? "保存中..." : "保存更改"}
                </button>
                {msg && <span className="text-sm text-gray-500 ml-2">{msg}</span>}
              </div>
            ) : (
          <div className="flex space-x-2">
            <button
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 whitespace-nowrap shadow transition-colors duration-200
             rounded-button !text-white hover:!text-white focus:!text-white active:!text-white"
              onClick={handleSavePassword}
            >
              <i className="fas fa-save fa-icon mr-2 !text-white"></i>
              <span className="!text-white">保存更改</span>
            </button>

            {pwdMsg && (
              <span className={`text-sm ml-2 ${pwdMsg.includes('成功') ? 'text-green-600' : 'text-red-500'}`}>
                {pwdMsg}
              </span>
            )}
          </div>
            )}
          </div>
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                className={`border-b-2 px-4 py-3 text-sm font-medium whitespace-nowrap rounded-t-md transition-colors duration-200 ${
                  activeTab === "info"
                    ? "border-primary-500 text-primary-500 bg-primary-500/10"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                onClick={() => setActiveTab("info")}
              >
                个人信息
              </button>
              <button
                className={`border-b-2 px-4 py-3 text-sm font-medium whitespace-nowrap rounded-t-md transition-colors duration-200 ${
                  activeTab === "password"
                    ? "border-primary-500 text-primary-500 bg-primary-500/10"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                onClick={() => setActiveTab("password")}
              >
                修改密码
              </button>
              {role === 'ADMIN' && (
                <button
                  className={`border-b-2 px-4 py-3 text-sm font-medium whitespace-nowrap rounded-t-md transition-colors duration-200 ${
                    activeTab === "register"
                      ? "border-primary-500 text-primary-500 bg-primary-500/10"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                  onClick={() => setActiveTab("register")}
                >
                  注册账号
                </button>
              )}
            </nav>
          </div>
          {activeTab === "info" ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-button bg-gray-100" value={username} readOnly />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-button bg-gray-100" value={role} readOnly />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-button focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200" value={profile.realName} onChange={e => setProfile(p => ({ ...p, realName: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">职位</label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-button focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200" value={profile.position} onChange={e => setProfile(p => ({ ...p, position: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                  <input type="email" className="w-full px-3 py-2 border border-gray-300 rounded-button focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
                  <input type="tel" className="w-full px-3 py-2 border border-gray-300 rounded-button focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">个人简介</label>
                  <textarea rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-button focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200" value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} />
                </div>
              </div>
            </>
          ) : activeTab === "password" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">新密码</label>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full px-3 py-2 border border-gray-300 rounded-button focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 pr-10"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="请输入新密码"
                  />
                  <button
                    type="button"
                    className="absolute right-2 text-gray-400 hover:text-primary-500 focus:outline-none"
                    tabIndex={-1}
                    onClick={() => setShowPassword(v => !v)}
                  >
                    {showPassword ? (
                      <i className="fas fa-eye-slash"></i>
                    ) : (
                      <i className="fas fa-eye"></i>
                    )}
                  </button>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">确认新密码</label>
                <div className="relative flex items-center">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className="w-full px-3 py-2 border border-gray-300 rounded-button focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 pr-10"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="请再次输入新密码"
                  />
                  <button
                    type="button"
                    className="absolute right-2 text-gray-400 hover:text-primary-500 focus:outline-none"
                    tabIndex={-1}
                    onClick={() => setShowConfirmPassword(v => !v)}
                  >
                    {showConfirmPassword ? (
                      <i className="fas fa-eye-slash"></i>
                    ) : (
                      <i className="fas fa-eye"></i>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : activeTab === "register" && role === 'ADMIN' ? (
            <div className="bg-gray-50 rounded-xl shadow-sm p-6 max-w-md">
              <h3 className="text-base font-semibold text-gray-800 mb-4">注册新账号</h3>
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
                  <input type="text" autoComplete="off" className="w-full px-3 py-2 border border-gray-300 rounded-button focus:ring-primary-500 focus:border-primary-500" value={registerForm.username} onChange={e => setRegisterForm(f => ({ ...f, username: e.target.value }))} placeholder="请输入用户名" />
                  <input type="text" autoComplete="off" className="w-full px-3 py-2 border border-gray-300 rounded-button focus:ring-primary-500 focus:border-primary-500 mt-2" value={registerForm.realName} onChange={e => setRegisterForm(f => ({ ...f, realName: e.target.value }))} placeholder="请输入真实姓名" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
                  <div className="relative flex items-center">
                    <input
                      type={registerForm.showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-button focus:ring-primary-500 focus:border-primary-500 pr-10"
                      value={registerForm.passwordHash}
                      onChange={e => setRegisterForm(f => ({ ...f, passwordHash: e.target.value }))}
                      placeholder="请输入密码"
                    />
                    <button
                      type="button"
                      className="absolute right-2 text-gray-400 hover:text-primary-500 focus:outline-none"
                      tabIndex={-1}
                      onClick={() => setRegisterForm(f => ({ ...f, showPassword: !f.showPassword }))}
                    >
                      {registerForm.showPassword ? (
                        <i className="fas fa-eye-slash"></i>
                      ) : (
                        <i className="fas fa-eye"></i>
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">确认密码</label>
                  <div className="relative flex items-center">
                    <input
                      type={registerForm.showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-button focus:ring-primary-500 focus:border-primary-500 pr-10"
                      value={registerForm.confirmPassword}
                      onChange={e => setRegisterForm(f => ({ ...f, confirmPassword: e.target.value }))}
                      placeholder="请再次输入密码"
                    />
                    <button
                      type="button"
                      className="absolute right-2 text-gray-400 hover:text-primary-500 focus:outline-none"
                      tabIndex={-1}
                      onClick={() => setRegisterForm(f => ({ ...f, showConfirmPassword: !f.showConfirmPassword }))}
                    >
                      {registerForm.showConfirmPassword ? (
                        <i className="fas fa-eye-slash"></i>
                      ) : (
                        <i className="fas fa-eye"></i>
                      )}
                    </button>
                  </div>
                </div>
                {registerMsg && <div className={`text-sm mt-1 ${registerMsg.includes('成功') ? 'text-green-600' : 'text-red-500'}`}>{registerMsg}</div>}
                <div className="flex justify-end">
                  <button type="submit" className="px-4 py-2 bg-primary-500 text-white rounded-button hover:bg-primary-600 whitespace-nowrap" disabled={registerLoading}>{registerLoading ? '注册中...' : '注册'}</button>
                </div>
              </form>
            </div>
          ) : null}
        </div>
        {/* 代理管理 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800">代理管理</h2>
            <button
              className="px-4 py-2 bg-primary-500 text-white rounded-button hover:bg-primary-500 whitespace-nowrap shadow transition-colors duration-200"
              onClick={() => openAgentModal()}
            >
              <i className="fas fa-plus fa-icon mr-2"></i>添加代理
            </button>
          </div>
          {agentError && <div className="text-red-500 mb-2">{agentError}</div>}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">代理名称</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP地址</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">总进程数</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">剩余进程数</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {agentLoading ? (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-400">加载中...</td></tr>
                ) : pagedAgents.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-400">暂无代理</td></tr>
                ) : (
                  pagedAgents.map(agent => {
                    const statusObj = statusOptions.find(s => s.value === agent.status) || statusOptions[0];
                    const percent = agent.totalProcesses ? Math.round((agent.availableProcesses / agent.totalProcesses) * 100) : 0;
                    return (
                      <tr key={agent.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                              <i className="fas fa-server fa-icon text-primary-500"></i>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{agent.name}</div>
                              <div className="text-sm text-gray-500">{agent.location}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{agent.ipAddress}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{agent.totalProcesses}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{agent.availableProcesses}</div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                            <div className="bg-primary-500 h-1.5 rounded-full" style={{ width: `${percent}%` }}></div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusObj.color}`}>{agent.status}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-primary-500 hover:text-primary-700 mr-3" onClick={() => openAgentModal(agent)}>编辑</button>
                          <button className="text-red-500 hover:text-red-700" onClick={() => handleDeleteAgent(agent.id)}>删除</button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {/* 分页UI占位，后续可实现 */}
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-500">
              显示 <span className="font-medium">{total === 0 ? 0 : (page - 1) * pageSize + 1}</span> 到 <span className="font-medium">{Math.min(page * pageSize, total)}</span> 条，共 <span className="font-medium">{total}</span> 条记录，<span className="ml-2">共 {totalPages} 页</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                className="px-3 py-1 border border-gray-300 rounded-button text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >上一页</button>
              {renderPagination()}
              <button
                className="px-3 py-1 border border-gray-300 rounded-button text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >下一页</button>
            </div>
          </div>
          {/* 代理新增/编辑弹窗 */}
          {showAgentModal && (
            <div className="fixed inset-0 backdrop-blur-sm bg-black/10 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">{editingAgent ? "编辑代理" : "添加代理"}</h3>
                  <button className="text-gray-400 hover:text-gray-500" onClick={closeAgentModal}>
                    <i className="fas fa-times fa-icon"></i>
                  </button>
                </div>
                <form className="px-6 py-4" onSubmit={handleAgentFormSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">代理名称</label>
                      <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-button focus:ring-primary-500 focus:border-primary-500" placeholder="例如：华东节点1" value={agentForm.name} onChange={e => setAgentForm(f => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">节点归属</label>
                      <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-button focus:ring-primary-500 focus:border-primary-500" placeholder="例如：上海数据中心" value={agentForm.location} onChange={e => setAgentForm(f => ({ ...f, location: e.target.value }))} />
                    <div>
                    </div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">IP地址</label>
                      <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-button focus:ring-primary-500 focus:border-primary-500" placeholder="例如：192.168.1.101" value={agentForm.ipAddress} onChange={e => setAgentForm(f => ({ ...f, ipAddress: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">总进程数</label>
                      <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-button focus:ring-primary-500 focus:border-primary-500" placeholder="例如：32" value={agentForm.totalProcesses} onChange={e => setAgentForm(f => ({ ...f, totalProcesses: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">剩余进程数</label>
                      <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-button focus:ring-primary-500 focus:border-primary-500" placeholder="例如：12" value={agentForm.availableProcesses} onChange={e => setAgentForm(f => ({ ...f, availableProcesses: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-button focus:ring-primary-500 focus:border-primary-500" value={agentForm.status} onChange={e => setAgentForm(f => ({ ...f, status: e.target.value }))}>
                        {statusOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.value}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {agentFormMsg && <div className="text-red-500 mt-2 text-sm">{agentFormMsg}</div>}
                  <div className="flex justify-end space-x-3 mt-6">
                    <button type="button" className="px-4 py-2 border border-gray-300 text-gray-700 rounded-button hover:bg-gray-50 whitespace-nowrap" onClick={closeAgentModal}>取消</button>
                    <button type="submit" className="px-4 py-2 bg-primary-500 text-white rounded-button hover:bg-primary-600 whitespace-nowrap">{editingAgent ? "保存修改" : "确认添加"}</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}