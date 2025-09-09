import React, { useEffect, useState } from "react";
import { Button, ConfigProvider, Select, Switch, Input, message } from "antd";
import { useParams, useSearchParams } from "react-router-dom";
import { getTemplateById } from "../api";
/* =========================
   字段筛选卡片（保持原交互）
   ========================= */
const fieldGroups = [
  {
    label: "商品信息",
    fields: [
      { key: "id", label: "商品ID" },
      { key: "name", label: "商品名称" },
      { key: "image", label: "商品图片" },
    ],
  },
  {
    label: "价格信息",
    fields: [
      { key: "price", label: "当前价格" },
      { key: "originalPrice", label: "原价" },
      { key: "discount", label: "折扣信息" },
    ],
  },
  {
    label: "销售信息",
    fields: [
      { key: "monthlySales", label: "月销量" },
      { key: "reviews", label: "累计评价" },
      { key: "goodRate", label: "好评率" },
    ],
  },
];
function FieldSelectorCard() {
  const [mode, setMode] = useState("all");
  const [selected, setSelected] = useState([]);

  const handleModeChange = (e) => {
    const value = e.target.value;
    setMode(value);
    if (value === "all") setSelected([]);
  };

  const handleFieldChange = (key) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleReset = () => {
    setSelected([]);
    setMode("all");
  };

  return (
    <section className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <i className="fas fa-filter w-5 h-5 mr-2 flex justify-center items-center text-primary"></i>
          <h2 className="text-lg font-medium text-gray-900">字段筛选</h2>
        </div>
        <button className="text-gray-400 hover:text-gray-500">
          <i className="fas fa-chevron-up w-5 h-5 flex justify-center items-center"></i>
        </button>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <input
                id="all-fields"
                name="field-type"
                type="radio"
                value="all"
                checked={mode === "all"}
                onChange={handleModeChange}
                className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
              />
              <label
                htmlFor="all-fields"
                className="ml-2 block text-sm font-medium text-gray-700"
              >
                完整字段
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="partial-fields"
                name="field-type"
                type="radio"
                value="partial"
                checked={mode === "partial"}
                onChange={handleModeChange}
                className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
              />
              <label
                htmlFor="partial-fields"
                className="ml-2 block text-sm font-medium text-gray-700"
              >
                筛选部分字段
              </label>
            </div>
          </div>

          <button
            className="text-sm text-primary hover:text-blue-700"
            onClick={handleReset}
          >
            重置选择
          </button>
        </div>

        {mode === "partial" && (
          <div className="mt-4" id="field-selector">
            <div className="grid grid-cols-3 gap-4">
              {fieldGroups.map((group) => (
                <div className="space-y-2" key={group.label}>
                  <div className="text-sm font-medium text-gray-700">
                    {group.label}
                  </div>
                  <div className="space-y-2">
                    {group.fields.map((field) => (
                      <div
                        className="field-item flex items-center px-3 py-2 border border-gray-200 rounded-md"
                        key={field.key}
                      >
                        <input
                          id={`field-${field.key}`}
                          type="checkbox"
                          className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                          checked={selected.includes(field.key)}
                          onChange={() => handleFieldChange(field.key)}
                        />
                        <label
                          htmlFor={`field-${field.key}`}
                          className="ml-2 block text-sm text-gray-700"
                        >
                          {field.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 数据预览表格 */}
        <div className="mt-6">
          <div className="text-sm font-medium text-gray-700 mb-2">数据预览</div>
          <div className="border border-gray-200 rounded-md overflow-x-auto max-h-52">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    商品ID
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    商品名称
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    当前价格
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    月销量
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    累计评价
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-3 py-2 whitespace-nowrap text-gray-500">
                    100001
                  </td>
                  <td className="px-3 py-2 text-gray-500">
                    Apple iPhone 13 Pro Max 256GB
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-gray-500">
                    ¥9,999
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-gray-500">
                    5,432
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-gray-500">
                    12,345
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 whitespace-nowrap text-gray-500">
                    100002
                  </td>
                  <td className="px-3 py-2 text-gray-500">
                    Samsung Galaxy S22 Ultra 512GB
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-gray-500">
                    ¥8,999
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-gray-500">
                    3,210
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-gray-500">
                    8,765
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 whitespace-nowrap text-gray-500">
                    100003
                  </td>
                  <td className="px-3 py-2 text-gray-500">Xiaomi 12 Pro 256GB</td>
                  <td className="px-3 py-2 whitespace-nowrap text-gray-500">
                    ¥5,299
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-gray-500">
                    2,100
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-gray-500">
                    4,321
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================
   代理设置卡片（AntD Select 修复）
   ========================= */
const proxyOptions = [
  { value: "1", label: "美国代理组" },
  { value: "2", label: "欧洲代理组" },
  { value: "3", label: "亚洲代理组" },
  { value: "east-1", label: "华东代理A" },
  { value: "east-2", label: "华东代理B" },
  { value: "north-1", label: "华北代理A" },
  { value: "north-2", label: "华北代理B" },
];

function ProxySettingCard() {
  const [enabled, setEnabled] = useState(false);
  const [proxy, setProxy] = useState(undefined);
  const [threads, setThreads] = useState(1);

  const maxThreads = 10;
  const recommendedThreads = 3;
  const estimatedTime = "约 2 小时";

  return (
    <section className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <i className="fas fa-server w-5 h-5 mr-2 flex justify-center items-center text-primary"></i>
          <h2 className="text-lg font-medium text-gray-900">代理设置</h2>
        </div>
        <button className="text-gray-400 hover:text-gray-500">
          <i className="fas fa-chevron-up w-5 h-5 flex justify-center items-center"></i>
        </button>
      </div>

      <div className="mt-4 space-y-4">
        <div className="flex items-center">
          <span className="text-sm font-medium text-gray-700 mr-2">启用代理</span>
          <Switch checked={enabled} onChange={setEnabled} />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">
              选择代理
            </label>
            <Select
              placeholder="请选择代理"
              style={{ width: "100%", marginTop: 4 }}
              options={proxyOptions}
              value={proxy}
              onChange={setProxy}
              disabled={!enabled}
              allowClear
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </div>

          <div className="flex-none w-36">
            <label className="block text-sm font-medium text-gray-700">
              剩余进程
            </label>
            <div
              className="mt-1 text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md border border-gray-200"
              id="remaining-processes"
            >
              --
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              推荐配置：
              <span
                id="recommended-threads"
                className="text-primary font-medium"
              >
                {recommendedThreads}
              </span>{" "}
              个进程，预计耗时{" "}
              <span id="estimated-time" className="text-primary font-medium">
                {estimatedTime}
              </span>
            </div>
            <button
              type="button"
              id="apply-recommended"
              className="text-sm text-primary hover:text-blue-700 disabled:opacity-50"
              onClick={() => setThreads(recommendedThreads)}
              disabled={!enabled}
            >
              应用推荐
            </button>
          </div>

          <div className="mt-2">
            <label
              htmlFor="proxy-threads"
              className="block text-sm font-medium text-gray-700"
            >
              设置任务进程数
            </label>
            <div className="mt-1 flex items-center gap-2">
              <button
                type="button"
                id="decrease-threads"
                className="!rounded-button whitespace-nowrap w-8 h-8 inline-flex items-center justify-center border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setThreads((t) => Math.max(1, t - 1))}
                disabled={!enabled || threads <= 1}
              >
                <i className="fas fa-minus w-3 h-3 flex justify-center items-center"></i>
              </button>

              <input
                type="number"
                id="proxy-threads"
                className="block w-20 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-sm text-center"
                min="1"
                max={maxThreads}
                value={threads}
                onChange={(e) =>
                  setThreads(
                    Math.max(1, Math.min(maxThreads, Number(e.target.value)))
                  )
                }
                disabled={!enabled}
              />

              <button
                type="button"
                id="increase-threads"
                className="!rounded-button whitespace-nowrap w-8 h-8 inline-flex items-center justify-center border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setThreads((t) => Math.min(maxThreads, t + 1))}
                disabled={!enabled || threads >= maxThreads}
              >
                <i className="fas fa-plus w-3 h-3 flex justify中心 items-center"></i>
              </button>

              <span className="text-sm text-gray-500 ml-2">
                最大可设置 <span id="max-threads">{maxThreads}</span> 个进程
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================
   主详情页（无侧边栏，所有下拉改 AntD）
   ========================= */
export default function TemplatesDetail() {
  const [regionType, setRegionType] = useState("all");
    const { id: idFromPath } = useParams();
    const [sp] = useSearchParams();
    const id = idFromPath || sp.get("id");

    const [tpl, setTpl] = useState(null);

    useEffect(() => {
    if (!id) return;
    getTemplateById(id).then(setTpl).catch((e) => {
        console.error(e);
    });
    }, [id]);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#1d4ed8",
          borderRadius: 12,
          controlHeight: 36,
        },
      }}
    >
      <div className="flex min-h-screen bg-gray-50">
        {/* 主内容区（无侧边栏；留给你的全局 Sidebar 使用） */}
        <main className="flex-1">
          {/* 顶部信息栏 */}
        <div className="bg-white shadow-sm p-6 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex justify-between items-start">
            <div>
            <h1 className="text-xl font-bold text-gray-900">
                {/* name 是后端派生字段；没有就回退到 templateName */}
                {tpl ? (tpl.name ?? tpl.templateName) : "加载中…"}
            </h1>

            <div className="mt-2 text-sm text-gray-500 space-y-1">
                {/* 描述：desc（派生） -> templateDescription */}
                <div className="flex items-center">
                <i className="fas fa-info-circle w-4 h-4 mr-1 flex justify-center items-center"></i>
                <span>{tpl ? (tpl.desc ?? tpl.templateDescription) : "加载中…"}</span>
                </div>

                {/* 链接：sourceUrl */}
                <div className="flex items-center">
                <i className="fas fa-link w-4 h-4 mr-1 flex justify-center items-center"></i>
                {tpl?.sourceUrl ? (
                    <a
                    href={tpl.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline"
                    >
                    {tpl.sourceUrl}
                    </a>
                ) : (
                    <span>加载中…</span>
                )}
                </div>
                <div className="flex items-center">
                <i className="fas fa-hashtag w-4 h-4 mr-1 flex justify-center items-center"></i>
                <span>
                    累计采集次数：
                    {tpl
                    ? (typeof tpl.usageCount === 'number'
                        ? tpl.usageCount.toLocaleString()
                        : (tpl.usageCount ?? 0))
                    : "加载中…"}
                </span>
                </div>

        {/* 更新时间：updated（派生） -> updatedAt */}
        <div className="flex items-center">
          <i className="fas fa-clock w-4 h-4 mr-1 flex justify-center items-center"></i>
          <span>
            更新时间：{tpl ? (tpl.updated ?? tpl.updatedAt ?? "") : "加载中…"}
          </span>
        </div>
      </div>
    </div>

    <div className="flex space-x-3">
      <Button
        type="primary"
        className="!rounded-[4px] whitespace-nowrap flex items-center"
        onClick={() => message.success("开始使用该模板")}
      >
        <i className="fas fa-play w-4 h-4 mr-2 flex justify-center items-center"></i>
        立即使用
      </Button>
      <Button className="!rounded-[4px] whitespace-nowrap flex items-center border border-gray-300">
        <i className="fas fa-history w-4 h-4 mr-2 flex justify-center items-center"></i>
        历史任务
      </Button>
    </div>
  </div>
</div>

          {/* 主体内容 */}
          <div className="max-w-6xl mx-auto p-6 space-y-6">
            {/* 区域参数卡片 */}
            <section className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <i className="fas fa-map-marker-alt w-5 h-5 mr-2 flex justify-center items-center text-primary"></i>
                  <h2 className="text-lg font-medium text-gray-900">
                    区域参数
                  </h2>
                </div>
                <button className="text-gray-400 hover:text-gray-500">
                  <i className="fas fa-chevron-up w-5 h-5 flex justify-center items-center"></i>
                </button>
              </div>

              <div className="mt-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <input
                      id="all-region"
                      name="region-type"
                      type="radio"
                      value="all"
                      checked={regionType === "all"}
                      onChange={(e) => setRegionType(e.target.value)}
                      className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                    />
                    <label
                      htmlFor="all-region"
                      className="ml-2 block text-sm font-medium text-gray-700"
                    >
                      全国
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="specific-region"
                      name="region-type"
                      type="radio"
                      value="specific"
                      checked={regionType === "specific"}
                      onChange={(e) => setRegionType(e.target.value)}
                      className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                    />
                    <label
                      htmlFor="specific-region"
                      className="ml-2 block text-sm font-medium text-gray-700"
                    >
                      指定区域
                    </label>
                  </div>
                </div>

                {/* 只有“指定区域”时显示下拉 */}
                {regionType === "specific" && (
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        省份
                      </label>
                      <Select
                        placeholder="请选择省份"
                        style={{ width: "100%" }}
                        options={[
                          { value: "北京", label: "北京市" },
                          { value: "上海", label: "上海市" },
                          { value: "广东", label: "广东省" },
                          { value: "浙江", label: "浙江省" },
                          { value: "江苏", label: "江苏省" },
                        ]}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        城市
                      </label>
                      <Select
                        placeholder="请先选择省份"
                        style={{ width: "100%" }}
                        disabled
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        区县
                      </label>
                      <Select
                        placeholder="请先选择城市"
                        style={{ width: "100%" }}
                        disabled
                      />
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* 依赖数据卡片 */}
            <section className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <i className="fas fa-database w-5 h-5 mr-2 flex justify-center items-center text-primary"></i>
                  <h2 className="text-lg font-medium text-gray-900">
                    依赖数据
                  </h2>
                </div>
                <button className="text-gray-400 hover:text-gray-500">
                  <i className="fas fa-chevron-up w-5 h-5 flex justify-center items-center"></i>
                </button>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    选择已有数据表
                  </label>
                  <Select
                    placeholder="请选择数据表"
                    style={{ width: "100%" }}
                    options={[
                      { value: "1", label: "电商商品列表(2023-06-10)" },
                      { value: "2", label: "京东商品关键词搜索(2023-06-05)" },
                      { value: "3", label: "天猫店铺商品(2023-05-28)" },
                    ]}
                    allowClear
                    showSearch
                    filterOption={(input, option) =>
                      (option?.label ?? "")
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-2 text-sm text-gray-500">
                      或
                    </span>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="file-upload"
                    className="block text-sm font-medium text-gray-700"
                  >
                    上传CSV文件
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-blue-500 focus-within:outline-none"
                        >
                          <span>上传文件</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            onChange={() => message.success("文件已选择")}
                          />
                        </label>
                        <p className="pl-1">或拖拽到此处</p>
                      </div>
                      <p className="text-xs text-gray-500">CSV格式，最大10MB</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 border-t border-gray-200 pt-4">
                  <div className="text-sm font-medium text-gray-700">
                    当前数据源
                  </div>
                  <div className="mt-2 text-sm text-gray-500">未选择数据源</div>
                </div>
              </div>
            </section>

            {/* 字段筛选卡片（交互版） */}
            <FieldSelectorCard />

            {/* 代理设置卡片（交互版） */}
            <ProxySettingCard />

            {/* 任务配置卡片 */}
            <section className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <i className="fas fa-tasks w-5 h-5 mr-2 flex justify-center items-center text-primary"></i>
                  <h2 className="text-lg font-medium text-gray-900">
                    任务配置
                  </h2>
                </div>
                <button className="text-gray-400 hover:text-gray-500">
                  <i className="fas fa-chevron-up w-5 h-5 flex justify中心 items-center"></i>
                </button>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <label
                    htmlFor="task-name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    任务名称 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="task-name"
                    className="mt-1"
                    placeholder="例如：京东手机商品采集202306"
                  />
                </div>

                {/* 任务分组：左 Select + 右输入新分组 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    任务分组
                  </label>
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    <Select
                      placeholder="选择分组"
                      style={{ width: "100%" }}
                      options={[
                        { value: "1", label: "电商数据" },
                        { value: "2", label: "社交媒体" },
                        { value: "3", label: "新闻资讯" },
                      ]}
                      allowClear
                      showSearch
                      filterOption={(input, option) =>
                        (option?.label ?? "")
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                    />
                    <Input placeholder="或输入新分组名称" />
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">
                      任务版本
                    </label>
                    <Select
                      defaultValue="2025"
                      style={{ width: "100%" }}
                      options={[
                        { value: "2025", label: "2025 年" },
                        { value: "2024", label: "2024 年" },
                        { value: "2023", label: "2023 年" },
                      ]}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">
                      季度
                    </label>
                    <Select
                      defaultValue="Q1"
                      style={{ width: "100%" }}
                      options={[
                        { value: "Q1", label: "第一季度" },
                        { value: "Q2", label: "第二季度" },
                        { value: "Q3", label: "第三季度" },
                        { value: "Q4", label: "第四季度" },
                      ]}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* 任务进程卡片 */}
            <section className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <i className="fas fa-tasks w-5 h-5 mr-2 flex justify-center items-center text-primary"></i>
                  <h2 className="text-lg font-medium text-gray-900">
                    任务进程
                  </h2>
                </div>
                <button className="text-gray-400 hover:text-gray-500">
                  <i className="fas fa-chevron-up w-5 h-5 flex justify中心 items-center"></i>
                </button>
              </div>

              <div className="mt-4">
                <div className="flex flex-wrap gap-3 mb-4">
                  <Button
                    type="primary"
                    icon={<i className="fas fa-play"></i>}
                  >
                    开始采集
                  </Button>
                  <Button icon={<i className="fas fa-pause"></i>}>暂停采集</Button>
                  <Button icon={<i className="fas fa-stop"></i>}>终止采集</Button>
                  <Button icon={<i className="fas fa-redo"></i>}>重新开始</Button>
                  <Button icon={<i className="fas fa-file-export"></i>}>
                    导出数据
                  </Button>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    采集日志
                  </div>
                  <div
                    className="border border-gray-200 rounded-md p-3 bg-gray-50 text-gray-500 text-sm"
                    style={{ minHeight: 80 }}
                  >
                    暂无日志
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </ConfigProvider>
  );
}
