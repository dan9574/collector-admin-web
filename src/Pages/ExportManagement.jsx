// src/ExportManagement.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ConfigProvider, Button, Input, message } from "antd";

const statusTabs = [
  { label: "全部", key: "all" },
  { label: "导出中", key: "running" },
  { label: "已完成", key: "completed" },
  { label: "失败", key: "failed" }
];

// 状态样式
function decorForStatus(status) {
  const s = status || "";
  if (s === "running")   return { key: "running",   tag: "导出中", cls: "bg-green-100 text-green-700",  icon: "fa-play" };
  if (s === "completed") return { key: "completed", tag: "已完成", cls: "bg-blue-100 text-blue-700",   icon: "fa-check" };
  if (s === "failed")    return { key: "failed",    tag: "失败",   cls: "bg-red-100 text-red-700",     icon: "fa-times" };
  return { key: "other", tag: s || "-", cls: "bg-gray-100 text-gray-700", icon: "fa-minus" };
}

function fmtBytes(bytes) {
  const n = Number(bytes || 0);
  if (!n) return "0 B";
  const units = ["B","KB","MB","GB","TB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(n) / Math.log(1024)));
  const v = n / Math.pow(1024, i);
  return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

function fmtDate(s) {
  if (!s) return "-";
  const d = new Date(String(s).replace(" ", "T"));
  if (isNaN(d.getTime())) return s;
  const pad = (x) => (x < 10 ? "0" + x : x);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function ts(s) {
  const t = new Date(String(s || 0).replace(" ", "T")).getTime();
  return Number.isFinite(t) ? t : 0;
}

export default function ExportManagement() {
  const navigate = useNavigate();

  // 当前用户（权限）
  const [me, setMe] = useState(null);

  // 数据
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // UI
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const pageSize = 10;
  const [page, setPage] = useState(1);
  const [checkedMap, setCheckedMap] = useState({});

  const canDelete = (r) => {
    if (!me) return false;
    if (me.id === 1) return true;       // 管理员
    return Number(r?.creatorId) === Number(me?.id);
  };

  // API
  const load = async () => {
    setLoading(true);
    try {
      const meRes = await fetch("/api/profile", { credentials: "include" });
      const meJson = meRes.ok ? await meRes.json() : null;
      if (meJson) setMe(meJson);
      const res = await fetch("/api/exports", { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const rowsFromApi = Array.isArray(data) ? data : [];
      const ids = Array.from(new Set(
        rowsFromApi.map(r => Number(r.creatorId)).filter(v => Number.isFinite(v))
      ));
      let nameMap = {};
      if (ids.length > 0) {
        const mapRes = await fetch(`/api/users/lookup?ids=${ids.join(",")}`, { credentials: "include" });
        if (mapRes.ok) nameMap = await mapRes.json(); // 形如 { "1":"张三", "2":"李四" }
      }
      const withNames = rowsFromApi.map(r => {
        const cid = Number(r.creatorId);
        const fromMap = nameMap[String(cid)];
        const selfName = (meJson && cid === Number(meJson.id)) ? (meJson.realName ?? meJson.username) : null;
        return { ...r, creatorName: fromMap ?? selfName ?? null };
      });
      setRows(withNames);
      setPage(1);
      setCheckedMap({});
    } catch (e) {
      console.error(e);
      message.error("加载导出记录失败");
    } finally {
      setLoading(false);
    }
  };

  const delOne = async (id) => {
    try {
      const res = await fetch(`/api/exports/${id}`, { method: "DELETE", credentials: "include" });
      if (res.status === 204 || res.ok) {
        setRows((prev) => prev.filter((r) => r.id !== id));
        message.success("已删除");
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (e) {
      console.error(e);
      message.error("删除失败");
    }
  };

  useEffect(() => { load(); }, []);

  // 排序 → 过滤 → 分页
  const sorted = useMemo(() => rows.slice().sort((a, b) => ts(b.exportedAt) - ts(a.exportedAt) || (b.id - a.id)), [rows]);

  const filtered = useMemo(() => {
    return sorted.filter((r) => {
      if (tab !== "all" && decorForStatus(r.exportStatus).key !== tab) return false;
      if (!search) return true;
      const s = search.trim();
      return (
        r.taskName?.includes(s) ||
        r.creatorName?.includes(s) ||
        String(r.creatorId ?? "").includes(s) ||
        String(r.recordCount ?? "").includes(s)
      );
    });
  }, [sorted, tab, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  return (
    <ConfigProvider theme={{ token: { colorPrimary: "#1d4ed8", borderRadius: 12, controlHeight: 36 } }}>
      <div className="flex flex-col h-screen bg-blue-50 overflow-hidden">
        {/* Header */}
        <header className="bg-blue-50 border-b border-blue-100 min-h-16 py-2 flex items-center justify-between px-8 sticky top-0 z-20">
          <h2 className="text-xl font-semibold text-gray-800">导出记录</h2>
          <div className="flex items-center gap-3">
            <div className="relative w-80">
              <Input
                allowClear
                placeholder="搜索：任务名 / 创建人 / 条数…"
                className="pl-10 pr-4 py-2 rounded-[--radius-button] shadow-sm"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                prefix={<i className="fas fa-search fa-icon text-gray-400" />}
              />
            </div>
            <Button className="flex items-center gap-2" type="default" onClick={load} disabled={loading}>
              <i className="fas fa-rotate-right w-4 h-4" /> 刷新
            </Button>
            <Button className="flex items-center gap-2" type="default" onClick={() => navigate("/tasks")}>
              <i className="fas fa-arrow-left w-4 h-4" /> 返回任务
            </Button>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex gap-2 px-8 mt-8 mb-4">
          {statusTabs.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`rounded-xl px-5 py-2.5 text-base shadow-sm transition font-medium
                ${tab === t.key ? "bg-primary-500 text-white" : "bg-white text-gray-700 hover:text-primary-500"}
                focus:outline-none focus:ring-2 focus:ring-primary-500/30`}
              onClick={() => { setTab(t.key); setPage(1); }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto px-8 pb-24">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12"></th>
                  <th className="px-10 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">任务名称</th>
                  <th className="px-8 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">导出状态</th>
                  <th className="px-8 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">文件大小</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">数据条数</th>
                  <th className="px-8 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建用户</th>
                  <th className="px-12 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">导出时间</th>
                  <th className="pr-8 pl-2 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center text-gray-400 py-8">{loading ? "加载中..." : "暂无记录"}</td>
                  </tr>
                ) : (
                  paged.map((r) => {
                    const deco = decorForStatus(r.exportStatus);
                    const isAdmin = Number(me?.id) === 1;
                    const canDelete = (r) => {
                        if (!me) return false;
                        if (Number(me.id) === 1) return true;
                        return Number(r?.creatorId) === Number(me?.id);
                    };
                    const delAllowed = canDelete(r);
                    const canDownload = deco.key === "completed";
                    return (
                      <tr key={r.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            className="w-5 h-5 align-middle cursor-pointer"
                            disabled={deco.key === "running"}
                            style={{ accentColor: deco.key === "completed" ? "#2563eb" : "#d1d5db", cursor: deco.key === "running" ? "not-allowed" : "pointer" }}
                            onChange={() => {}}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-base font-medium text-gray-900">{r.taskName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${deco.cls} flex items-center gap-1`}>
                            <i className={`fas ${deco.icon} w-3 h-3 mr-1`} /> {deco.tag}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{fmtBytes(r.fileSizeBytes)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{r.recordCount ?? 0}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {r.creatorName || (r.creatorId != null ? `用户#${r.creatorId}` : "-")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{fmtDate(r.exportedAt)}</td>
                        <td className="pr-8 pl-2 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center justify-end">
                            {/* 下载：仅完成可点 */}
                            <a
                              className={`text-gray-400 hover:text-gray-600 mr-3 ${canDownload ? "" : "opacity-40 pointer-events-none"}`}
                              style={{ width: 32, height: 32 }}
                              title={canDownload ? "下载文件" : "导出未完成"}
                              href={canDownload ? `/api/exports/${r.id}/file` : undefined}
                              onClick={(e) => { if (!canDownload) e.preventDefault(); }}
                            >
                              <i className="fas fa-download w-4 h-4" />
                            </a>

                            {/* 删除：仅创建者/ID=1 */}
                            <button
                              className={`text-gray-400 hover:text-red-500 ${delAllowed ? "" : "opacity-40 pointer-events-none"}`}
                              style={{ width: 32, height: 32 }}
                              title={delAllowed ? "删除" : "仅创建者可删除"}
                              onClick={() => {
                                if (!delAllowed) return;
                                const ok = window.confirm(`确定删除导出记录：\nID=${r.id}（${r.taskName}）？`);
                                if (ok) delOne(r.id);
                              }}
                            >
                              <i className="fas fa-trash w-4 h-4" />
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

          {/* 固定底部分页条 */}
          <div className="fixed bottom-0 left-70 right-0 z-40 bg-blue-50 py-3">
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
      </div>
    </ConfigProvider>
  );
}
