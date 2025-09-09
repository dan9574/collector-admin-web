import React, { useState, useEffect } from "react";
import { ConfigProvider, Select, Spin, message } from "antd";
import { getTemplates } from "../api";
import { useNavigate } from "react-router-dom";

const sceneTags    = ["全部", "房产", "品牌业态", "电商", "金融", "教育"];
const collectTypes = ["全部", "网站", "小程序", "APP", "接口"];
const statusTypes  = ["全部", "生效", "失效", "更新中"];
const sortTypes    = ["更新时间", "使用次数"];

export default function Templates() {
  const [search, setSearch]           = useState("");
  const [scene, setScene]             = useState("全部");
  const [collectType, setCollectType] = useState("全部");
  const [statusType, setStatusType]   = useState("全部");
  const [sortType, setSortType]       = useState("排序方式");
  const [page, setPage]               = useState(1);
  const [pageSize]                    = useState(12);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [data, setData]               = useState({ content: [], totalElements: 0 });
  const navigate = useNavigate();

  // 拉取模板数据
  useEffect(() => {
    setLoading(true);
    setError("");
    getTemplates({
      page: page - 1, // Spring Data 0 基
      size: pageSize,
      scene,
      collectType,
      status: statusType,
      search,
      sortType: sortType === "排序方式" ? undefined : sortType
    })
      .then((res) => setData(res))
      .catch((e) => {
        setError(e.message || "加载失败");
        // 401/未登录情况的更稳处理
        if (e?.status === 401 || e?.message === "未登录") message.error("请先登录");
      })
      .finally(() => setLoading(false));
  }, [page, pageSize, scene, collectType, statusType, search, sortType]);

  const total      = data.totalElements || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // —— 统一映射：把后端返回的两套命名统一成卡片字段 ——
  const paged = (data.content || []).map((t) => {
    const status = t.status ?? "生效";
    const statusColor =
      t.statusColor ??
      (status === "生效"
        ? "bg-green-100 text-green-800"
        : status === "失效"
        ? "bg-gray-100 text-gray-400"
        : status === "更新中"
        ? "bg-blue-100 text-blue-700"
        : "bg-gray-100 text-gray-400");

    const tags =
      Array.isArray(t.tags) && t.tags.length
        ? t.tags
        : [t.category ?? t.scene, t.collectType ?? t.collect_type].filter(Boolean);

    return {
      id: t.id,
      name: t.name ?? t.templateName ?? t.template_name ?? "",
      desc: t.desc ?? t.templateDescription ?? t.template_description ?? "",
      updated: t.updated ?? t.updatedAt ?? t.updated_at ?? "",
      status,
      statusColor,
      tags,
      usageCount: t.usageCount ?? t.usage_count ?? 0,
      img:
        t.img ??
        "https://ai-public.mastergo.com/gen_page/map_placeholder_1280x720.png?width=32&height=32&orientation=squarish"
    };
  });

  // 排序：支持按更新时间和使用次数
  const sorted = [...paged].sort((a, b) => {
    if (sortType === "更新时间") return new Date(b.updated) - new Date(a.updated);
    if (sortType === "使用次数")  return (b.usageCount || 0) - (a.usageCount || 0);
    return 0;
  });

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#1d4ed8",
          borderRadius: 12,
          controlHeight: 36
        }
      }}
    >
      <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-8 sticky top-0 z-10">
          <h2 className="text-xl font-semibold text-gray-800">模板中心</h2>
          <div className="relative w-96">
            <input
              type="text"
              placeholder="搜索模板名称..."
              className="w-full pl-10 pr-4 py-2 rounded-[--radius-button] shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            <i className="fas fa-search fa-icon absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </header>

        {/* 筛选 */}
        <div className="flex flex-wrap justify-between items-center px-8 mt-8 mb-8 gap-4">
          {/* 左侧：场景按钮（去重复 px/py/rounded） */}
          <div className="flex flex-wrap gap-2">
            {sceneTags.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`rounded-xl px-5 py-2.5 text-base shadow-sm transition
                  ${scene === tag
                    ? "bg-primary-500 text-white"
                    : "bg-white text-gray-700 hover:text-primary-500"}`}
                onClick={() => {
                  setScene(tag);
                  setPage(1);
                }}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* 右侧：AntD 下拉（防压缩、防换行） */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-[180px] shrink-0">
              <Select
                value={collectType === "全部" ? undefined : collectType}
                onChange={(v) => {
                  setCollectType(v);
                  setPage(1);
                }}
                options={collectTypes.map((o) => ({ value: o, label: o }))}
                style={{ width: "100%" }}
                placeholder="采集方式"
              />
            </div>
            <div className="min-w-[180px] shrink-0">
              <Select
                value={statusType === "全部" ? undefined : statusType}
                onChange={(v) => {
                  setStatusType(v);
                  setPage(1);
                }}
                options={statusTypes.map((o) => ({ value: o, label: o }))}
                style={{ width: "100%" }}
                placeholder="模板状态"
              />
            </div>
            <div className="min-w-[180px] shrink-0">
              <Select
                value={sortType === "排序方式" ? undefined : sortType}
                onChange={(v) => {
                  setSortType(v);
                  setPage(1);
                }}
                options={sortTypes.map((o) => ({ value: o, label: o }))}
                style={{ width: "100%" }}
                placeholder="排序方式"
              />
            </div>
          </div>
        </div>

        {/* 模板卡片 */}
        <div className="flex-1 overflow-auto">
        <div className="grid items-start grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 px-8">
        {loading ? (
            <div className="col-span-full flex justify-center items-center py-16">
            <Spin size="large" />
            </div>
        ) : error ? (
            <div className="col-span-full text-center text-red-400 py-16">{error}</div>
        ) : sorted.length === 0 ? (
            <div className="col-span-full text-center text-gray-400 py-16">暂无模板</div>
        ) : (
            sorted.map((t) => (
            <div
                key={t.id}
                className="self-start bg-white rounded-lg shadow-sm overflow-hidden transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-lg"
            >
                <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                    <img src={t.img} className="w-8 h-8 rounded-md object-cover" alt="logo" />
                    <h3 className="text-lg font-semibold text-gray-800">{t.name}</h3>
                    </div>
                    <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full ${t.statusColor}`}>
                    {t.status}
                    </span>
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                    {t.tags.map((tag) => (
                    <span key={`${t.id}-${tag}`} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                        {tag}
                    </span>
                    ))}
                </div>
                <p className="text-sm text-gray-600 mb-4">{t.desc}</p>
                <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>更新于 {t.updated}</span>
                    <button
                        className="text-primary-500 hover:text-blue-700 flex items-center gap-1"
                        onClick={() => navigate(`/templates/${t.id}`)}  // 也可换成 `/templatesDetail?id=${t.id}`
                    >
                    查看详情 <i className="fas fa-chevron-right ml-1" />
                    </button>
                </div>
                </div>
            </div>
            ))
        )}
        </div>
        </div>

        {/* 分页条 固定底部 */}
        <div className="sticky bottom-0 w-full bg-gray-50 py-4 mt-auto">
          <div className="flex justify-center">
            <div className="flex items-center gap-2 bg-white rounded-[--radius-button] px-4 py-2 shadow">
              <span className="text-gray-500 text-sm">共 {total} 条</span>
              <button
                type="button"
                className="px-2 py-1 rounded-[--radius-button] hover:bg-gray-100 text-gray-500 disabled:opacity-50"
                onClick={() => setPage(page - 1)}
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
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
              >
                下一页
              </button>
            </div>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}
