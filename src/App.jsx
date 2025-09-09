
import { useEffect, useState } from "react";
import { api } from "./api";
import Sidebar from "./Sidebar";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import SystemManagement from "./Pages/SystemManagement";
import Templates from "./Pages/Templates";
import TemplatesDetail from "./Pages/TemplatesDetail";
import Tasks from "./Pages/Tasks";
import ExportManagement from "./Pages/ExportManagement";

function Login({ onOk }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setE] = useState("");
  const navigate = useNavigate();

  const submit = async () => {
    setE("");
    try {
      await api("/login", {
        method: "POST",
        body: JSON.stringify({ username: u, password: p }),
      });
      onOk(); // 刷新用户状态
    } catch (e) {
      setE(e.message || "登录失败");
    }
  };

  return (
    <div style={{ display: "grid", placeItems: "center", height: "100vh" }}>
      <div style={{ width: 320, display: "grid", gap: 8 }}>
        <h3>登录</h3>
        <input
          placeholder="用户名"
          value={u}
          onChange={(e) => setU(e.target.value)}
        />
        <input
          placeholder="密码"
          type="password"
          value={p}
          onChange={(e) => setP(e.target.value)}
        />
        <button onClick={submit}>登录</button>
        {err && <div style={{ color: "red" }}>{err}</div>}
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setL] = useState(true);

  const refresh = async () => {
    try {
      setUser(await api("/profile"));
    } catch {
      setUser(null);
    } finally {
      setL(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  if (loading) return <div style={{ padding: 16 }}>Loading…</div>;
  if (!user) return <Login onOk={async () => { await refresh(); navigate("/templates", { replace: true }); }} />;

  const logout = async () => {
    try {
      await api("/logout", { method: "POST" });
    } catch {}
    setUser(null);
  };

  if (user.error) {
    return <div style={{ padding: 16 }}>登录失败：{user.error}</div>;
  }

  return (
    <div style={{ display: "flex" }}>
      {/* 左边：侧边栏 */}
  <Sidebar onLogout={logout} realName={user.realName || user.username} position={user.position || user.role} />

      {/* 右边：主要内容区域 */}
      <div className="flex-1 ml-[300px] min-h-screen bg-gray-50">
        <Routes>
          <Route
            path="/system"
            element={<SystemManagement user={user} onLogout={logout} />}
          />
          <Route
            path="/templates"
            element={<Templates user={user} />}
          />
          <Route
            path="/templates/:id"
            element={<TemplatesDetail />}
          />
          <Route
            path="/templatesDetail"
            element={<TemplatesDetail />}
          />
          <Route
            path="/tasks"
            element={<Tasks user={user} />}
          />
          <Route
            path="/exportManagement"
            element={<ExportManagement user={user} />}
          />
          {/* 兜底：任何未匹配路径都跳到模板中心 */}
          <Route path="*" element={<Navigate to="/templates" replace />} />
        </Routes>
      </div>
    </div>
  );
}
