// src/Tasks.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ConfigProvider, Button, Input, message } from "antd";

const statusTabs = [
  { label: "全部", key: "all" },
  { label: "运行中", key: "running" },
  { label: "已终止", key: "stopped" },
  { label: "已完成", key: "completed" }
];

// —— 工具：状态装饰（把后端 collectStatus 映射到视图用的 key / 颜色 / 图标 / 标签）
function decorForStatus(collectStatus) {
  const s = collectStatus || "";
  if (s.includes("运行")) return { key: "running", tag: "运行中", cls: "bg-green-100 text-green-700", icon: "fa-play" };
  if (s.includes("完成")) return { key: "completed", tag: "已完成", cls: "bg-blue-100 text-blue-700", icon: "fa-check" };
  if (s.includes("终止") || s.includes("停止") || s.includes("暂停"))
    return { key: "stopped", tag: "已终止", cls: "bg-gray-100 text-gray-500", icon: "fa-pause" };
  if (s.includes("失败")) return { key: "failed", tag: "失败", cls: "bg-red-100 text-red-700", icon: "fa-times" };
  return { key: "other", tag: s || "-", cls: "bg-gray-100 text-gray-700", icon: "fa-minus" };
}

// —— 工具：把秒数格式化为“X小时Y分钟/Z秒”
function fmtDuration(sec) {
  const n = Number(sec || 0);
  if (!n) return "0秒";
  const h = Math.floor(n / 3600);
  const m = Math.floor((n % 3600) / 60);
  const s = n % 60;
  const parts = [];
  if (h) parts.push(`${h}小时`);
  if (m) parts.push(`${m}分钟`);
  if (!h && !m) parts.push(`${s}秒`);
  return parts.join("");
}

// —— 工具：LocalDateTime/字符串 → “YYYY-MM-DD HH:mm”
function fmtDate(s) {
  if (!s) return "-";
  const d = new Date(String(s).replace(" ", "T"));
  if (isNaN(d.getTime())) return s;
  const pad = (x) => (x < 10 ? "0" + x : x);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// —— 工具：解析 createdAt 供排序
function ts(s) {
  const t = new Date(String(s || 0).replace(" ", "T")).getTime();
  return Number.isFinite(t) ? t : 0;
}

export default function Tasks() {
  const navigate = useNavigate();

  // 当前登录用户（用于权限）
  const [me, setMe] = useState(null);

  // 后端数据
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  // UI 状态
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const pageSize = 10; // 你已改为10，这里沿用
  const [page, setPage] = useState(1);
  const [checkedMap, setCheckedMap] = useState({});

  // 导出弹窗
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState("csv");
  const [exportTask, setExportTask] = useState(null); // 单个导出时保存该任务

  // ===== API =====
  const load = async () => {
    setLoading(true);
    try {
      // 1) 用户信息（需要后端提供 /api/profile）
      let meObj = null;
      try {
        const meRes = await fetch("/api/profile", { credentials: "include" });
        if (meRes.ok) {
          meObj = await meRes.json();
          setMe(meObj);
        }
      } catch (_) {}

      // 2) 任务列表
      const res = await fetch("/api/tasks", { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      let rows = await res.json();
      rows = Array.isArray(rows) ? rows : [];

      // 3) 批量把 creatorId → 姓名（/api/users/lookup?ids=...）
      const ids = [...new Set(rows.map(r => Number(r.creatorId)).filter(Number.isFinite))];
      if (ids.length) {
        try {
          const luRes = await fetch(`/api/users/lookup?ids=${ids.join(",")}`, { credentials: "include" });
          if (luRes.ok) {
            const nameMap = await luRes.json(); // { "1":"管理员", "2":"张三" }
            rows = rows.map(r => {
              const cid = Number(r.creatorId);
              return {
                ...r,
                creatorName:
                  nameMap[String(cid)] ??
                  (cid === Number(meObj?.id) ? (meObj?.realName || meObj?.username) : null)
              };
            });
          }
        } catch (_) {}
      }

      setTasks(rows);
      setPage(1);
      setCheckedMap({});
    } catch (e) {
      console.error(e);
      message.error("加载任务失败");
    } finally {
      setLoading(false);
    }
  };

  const delOne = async (id) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE", credentials: "include" });
      if (res.status === 204 || res.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== id));
        message.success("已删除");
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (e) {
      console.error(e);
      message.error("删除失败");
    }
  };

  useEffect(() => {
    load();
  }, []);

  // ===== 排序 + 过滤 + 分页 =====
  // 1) 先按 createdAt 倒序稳定排序
  const sorted = useMemo(() => {
    return tasks.slice().sort((a, b) => ts(b.createdAt) - ts(a.createdAt));
  }, [tasks]);

  // 2) 再做筛选
  const filtered = useMemo(() => {
    return sorted.filter((t) => {
      // ✅ 文本匹配：任务名 / 创建人姓名 / 创建人ID / 条数
      const hit =
        !search ||
        t.taskName?.includes(search) ||
        t.creatorName?.includes(search) ||
        String(t.creatorId || "").includes(search) ||
        String(t.recordCount || "").includes(search);
      if (!hit) return false;

      if (tab === "all") return true;
      const s = decorForStatus(t.collectStatus).key;
      return s === tab;
    });
  }, [sorted, search, tab]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const idToName = useMemo(() => {
    const m = {};
    tasks.forEach((t) => (m[t.id] = t.taskName));
    return m;
  }, [tasks]);

  const checkedCount = exportTask ? 1 : Object.values(checkedMap).filter(Boolean).length;
  const checkedNames = Object.entries(checkedMap)
    .filter(([, v]) => v)
    .map(([id]) => idToName[id])
    .filter(Boolean);

  // —— 权限：只有创建者或ID=1可删
  const canDelete = (task) => {
    if (!me) return false;
    if (Number(me.id) === 1) return true; // 管理员
    return Number(task?.creatorId) === Number(me.id);
  };

  return (
    <ConfigProvider
      theme={{
        token: { colorPrimary: "#1d4ed8", borderRadius: 12, controlHeight: 36 }
      }}
    >
      <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm min-h-16 py-2 flex items-start justify-between px-8 sticky top-0 z-10">
          <h2 className="text-xl font-semibold text-gray-800">任务管理</h2>
          <div className="flex items-center gap-3 flex-wrap justify-end max-w-full overflow-x-auto">
            <div className="relative w-40 sm:w-56 md:w-72">
              <Input
                allowClear
                placeholder="搜索 任务名称 / 创建人 / 创建人ID / 条数..."
                className="pl-10 pr-4 py-2 rounded-[--radius-button] shadow-sm"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                prefix={<i className="fas fa-search fa-icon text-gray-400" />}
              />
            </div>
          </div>
        </header>
        
        {/* 置顶二层工具栏：左侧 Tabs + 右侧操作按钮 */}
        <div className="sticky top-16 z-10 bg-gray-50/95 backdrop-blur-sm">
          <div className="flex items-center justify-between px-8 py-2 gap-3 flex-wrap">
            {/* 左侧 Tabs（保留原筛选功能） */}
            <div className="flex gap-2">
              {statusTabs.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  className={`rounded-xl px-5 py-2.5 text-base shadow-sm transition font-medium
                    ${tab === t.key ? "bg-primary-500 text-white" : "bg-white text-gray-700 hover:text-primary-500"}
                    focus:outline-none focus:ring-2 focus:ring-primary-500/30`}
                  onClick={() => {
                    setTab(t.key);     // ✅ 用你的状态名
                    setPage(1);        // 切换筛选回到第一页
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* 右侧四个按钮（从 Header 移过来，逻辑不变） */}
            <div className="flex items-center gap-2">
              <Button
                className="flex items-center gap-2"
                type="default"
                onClick={() => { setExportModalOpen(true); setExportTask(null); }}
              >
                <i className="fas fa-file-export w-4 h-4" /> 导出
              </Button>

              <Button
                className="flex items-center gap-2"
                type="default"
                onClick={() => navigate("/exportManagement")}
              >
                <i className="fas fa-history w-4 h-4" /> 导出记录
              </Button>

              <Button
                className="flex items-center gap-2"
                type="default"
                onClick={load}
                disabled={loading}
              >
                <i className="fas fa-rotate-right w-4 h-4" /> 刷新
              </Button>

              <Button className="flex items-center gap-2" type="primary">
                <i className="fas fa-plus w-4 h-4" /> 新建任务
              </Button>
            </div>
          </div>
        </div>

      
        {/* 表格 */}
        <div className="flex-1 overflow-auto px-8 pb-24">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12"></th>
                  <th className="px-14 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">任务名称</th>
                  <th className="px-10 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">采集状态</th>
                  <th className="px-10 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">采集用时</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">数据条数</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建用户</th>
                  <th className="px-12 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
                  <th className="pr-22 pl-2 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center text-gray-400 py-8">{loading ? "加载中..." : "暂无任务"}</td>
                  </tr>
                ) : (
                  paged.map((t) => {
                    const deco = decorForStatus(t.collectStatus);
                    const delAllowed = canDelete(t);
                    const stopAllowed = canDelete(t);

                    return (
                      <tr key={t.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            className="w-5 h-5 align-middle cursor-pointer"
                            checked={!!checkedMap[t.id]}
                            disabled={deco.key === "running"}
                            style={{
                              accentColor: deco.key === "completed" ? "#2563eb" : deco.key === "stopped" ? "#a3a3a3" : "#d1d5db",
                              cursor: deco.key === "running" ? "not-allowed" : "pointer"
                            }}
                            onChange={() => {
                              if (deco.key === "running") return;
                              setCheckedMap((prev) => ({ ...prev, [t.id]: !prev[t.id] }));
                            }}
                          />
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-base font-medium text-gray-900">{t.taskName}</div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${deco.cls} flex items-center gap-1`}>
                            <i className={`fas ${deco.icon} w-3 h-3 mr-1`} /> {deco.tag}
                          </span>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{fmtDuration(t.collectDuration)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{t.recordCount ?? 0}</td>

                        {/* ✅ 创建用户：优先显示姓名，否则显示 用户#ID */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {t.creatorName || (Number.isFinite(Number(t.creatorId)) ? `用户#${t.creatorId}` : "-")}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{fmtDate(t.createdAt)}</td>

                        <td className="pr-10 pl-2 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center justify-end">
                            {/* 终止（仅示意，权限同删） */}
                            <button
                              className={
                                `text-gray-400 hover:text-gray-600 mr-3 ` +
                                (deco.key === "completed"
                                  ? "opacity-0 pointer-events-none"
                                  : (stopAllowed ? "" : "opacity-40 pointer-events-none"))
                              }
                              tabIndex={(deco.key === "completed" || !stopAllowed) ? -1 : 0}
                              style={{ width: 32, height: 32 }}
                              title={stopAllowed ? "终止" : "仅创建者可终止"}
                              onClick={() => {
                                if (!stopAllowed) return;
                                // TODO: 接入终止接口
                              }}
                            >
                              <i className="fas fa-stop w-4 h-4" />
                            </button>

                            {/* 删除（仅创建者/ID=1可点；带确认弹窗） */}
                            <button
                              className={`text-gray-400 hover:text-red-500 mr-3 ${delAllowed ? "" : "opacity-40 pointer-events-none"}`}
                              style={{ width: 32, height: 32 }}
                              title={delAllowed ? "删除" : "仅创建者或管理员可删除"}
                              onClick={() => {
                                if (!delAllowed) return;
                                const ok = window.confirm(`确定删除任务：\n「${t.taskName}」？`);
                                if (ok) delOne(t.id);
                              }}
                            >
                              <i className="fas fa-trash w-4 h-4" />
                            </button>

                            {/* 导出（运行中隐藏但占位） */}
                            <button
                              className={`text-gray-400 hover:text-gray-600${deco.key === "running" ? " opacity-0 pointer-events-none" : ""}`}
                              tabIndex={deco.key === "running" ? -1 : 0}
                              style={{ width: 32, height: 32 }}
                              onClick={() => {
                                if (deco.key !== "running") {
                                  setExportTask(t);
                                  setExportModalOpen(true);
                                }
                              }}
                              title="导出"
                            >
                              <i className="fas fa-ellipsis-h w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* 固定底部分页条（保持你的 left-70 / pr-22 等类名不动） */}
          <div className="fixed bottom-0 left-70 right-0 z-40 bg-gray-50 py-3">
            <div className="flex justify-center px-8">
              <div className="flex items-center gap-2 bg-white rounded-[--radius-button] px-4 py-2 shadow">
                <span className="text-gray-500 text-sm">共 {filtered.length} 条</span>
                <button
                  type="button"
                  className="px-2 py-1 rounded-[--radius-button] hover:bg-gray-100 text-gray-500 disabled:opacity-50"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  上一页
                </button>
                <span className="text-primary-500 font-semibold">{page}</span>
                <span className="text-gray-400">/</span>
                <span className="text-gray-500">{totalPages}</span>
                <button
                  type="button"
                  className="px-2 py-1 rounded-[--radius-button] hover:bg-gray-100 text-gray-500 disabled:opacity-50"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  下一页
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 导出任务弹窗（原样保留） */}
        {exportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl"
                onClick={() => { setExportModalOpen(false); setExportTask(null); }}
                aria-label="关闭"
              >
                <i className="fas fa-times" />
              </button>
              <h3 className="text-lg font-medium text-gray-900 mb-6">导出任务数据</h3>
              <div className="mb-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">选择导出格式</label>
                  <div className="flex space-x-6">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="radio"
                        className="form-radio h-4 w-4 text-primary"
                        name="export-format"
                        value="csv"
                        checked={exportFormat === "csv"}
                        onChange={() => setExportFormat("csv")}
                      />
                      <span className="ml-2 text-gray-700">CSV 格式</span>
                    </label>
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="radio"
                        className="form-radio h-4 w-4 text-primary"
                        name="export-format"
                        value="database"
                        checked={exportFormat === "database"}
                        onChange={() => setExportFormat("database")}
                      />
                      <span className="ml-2 text-gray-700">数据库格式</span>
                    </label>
                  </div>
                </div>

                <div className="mb-4">
                  <span className="block text-sm font-medium text-gray-700 mb-2">
                    已选择 <span className="text-primary-600 font-semibold">{exportTask ? 1 : checkedCount}</span> 条任务
                    {exportTask
                      ? <span className="ml-2 text-gray-500">({exportTask.taskName})</span>
                      : checkedCount > 0 && checkedNames.length <= 3
                        ? checkedNames.map((n) => <span key={n} className="ml-2 text-gray-500">{n}</span>)
                        : null}
                  </span>
                </div>

                <div className="flex justify-end">
              <Button
                type="primary"
                onClick={async () => {
                  try {
                    if (exportTask) {
                      // 单个导出
                      await fetch("/api/exports/createByTask", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({ taskId: exportTask.id })
                      });
                    } else {
                      // 勾选批量导出
                      const ids = Object.entries(checkedMap)
                        .filter(([, v]) => v)
                        .map(([id]) => Number(id));
                      if (ids.length === 0) { message.warning("请先勾选任务"); return; }
                      await fetch("/api/exports/batch", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({ taskIds: ids })
                      });
                    }
                    message.success("已写入导出记录");
                    setExportModalOpen(false);
                    setExportTask(null);
                    // navigate("/exportManagement"); // 需要时打开
                  } catch (e) {
                    console.error(e);
                    message.error("写入导出记录失败");
                  }
                }}
              >
                开始导出
              </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ConfigProvider>
  );
}
