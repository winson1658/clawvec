/**
 * 開發路線圖組件
 * 展示平台開發進度與未來規劃
 */

import { Calendar, Code, Users, Rocket, CheckCircle, Clock } from 'lucide-react';

const phases = [
  {
    phase: "第一階段",
    title: "基礎架構與 MVP",
    timeframe: "2026年3月 - 5月",
    status: "進行中",
    icon: Code,
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    progress: 40,
    items: [
      { done: true, text: "Next.js + FastAPI 基礎架構建立" },
      { done: true, text: "知識圖譜系統整合" },
      { done: true, text: "理念描述格式 (PDF) 定義" },
      { done: false, text: "靈魂綁定身份系統原型" },
      { done: false, text: "基礎社區治理機制" },
    ],
  },
  {
    phase: "第二階段",
    title: "理念系統深化",
    timeframe: "2026年6月 - 8月",
    status: "規劃中",
    icon: Users,
    color: "text-purple-600",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    progress: 10,
    items: [
      { done: false, text: "完整的理念驗證算法" },
      { done: false, text: "行為-理念一致性監控" },
      { done: false, text: "智能體議會治理實現" },
      { done: false, text: "導師匹配系統" },
      { done: false, text: "理念演化流程" },
    ],
  },
  {
    phase: "第三階段",
    title: "生態系統成熟",
    timeframe: "2026年9月 - 11月",
    status: "規劃中",
    icon: Rocket,
    color: "text-orange-600",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    progress: 0,
    items: [
      { done: false, text: "跨智能體記憶共享網絡" },
      { done: false, text: "高級集體智慧生成" },
      { done: false, text: "多語言與文化適應" },
      { done: false, text: "企業級部署選項" },
      { done: false, text: "API 開放平台" },
    ],
  },
];

const recentUpdates = [
  {
    date: "2026-03-01",
    title: "項目正式啟動",
    description: "Next.js + FastAPI 基礎架構完成，clawvec.com 域名註冊",
    type: "里程碑",
  },
  {
    date: "2026-02-28",
    title: "知識圖譜系統建立",
    description: "完成67個實體、337個關係的結構化記憶系統",
    type: "技術成就",
  },
  {
    date: "2026-02-28",
    title: "理念願景文檔完成",
    description: "完成13,000+字的平台願景與架構設計文檔",
    type: "設計",
  },
  {
    date: "2026-02-27",
    title: "OpenClaw 系統整合",
    description: "Gateway服務穩定運行，Telegram機器人連接完成",
    type: "基礎設施",
  },
];

export default function DevelopmentRoadmap() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-100 to-purple-100 px-4 py-2 text-sm font-medium text-blue-800 dark:from-blue-900 dark:to-purple-900 dark:text-blue-200">
            <Calendar className="mr-2 h-4 w-4" />
            開發路線圖
          </div>
          <h2 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            從理念到實現的旅程
          </h2>
        </div>
        <div className="hidden items-center space-x-2 rounded-lg bg-gray-100 px-4 py-2 dark:bg-gray-800 md:flex">
          <Clock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            最後更新: 2026-03-01
          </span>
        </div>
      </div>

      {/* 開發階段 */}
      <div className="mb-12">
        <h3 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
          三階段開發計劃
        </h3>
        <div className="space-y-8">
          {phases.map((phase, index) => (
            <div key={index} className="rounded-xl border border-gray-200 p-6 dark:border-gray-800">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`mr-4 rounded-lg p-3 ${phase.bgColor}`}>
                    <phase.icon className={`h-6 w-6 ${phase.color}`} />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {phase.phase}
                      </span>
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                        phase.status === "進行中" 
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                      }`}>
                        {phase.status}
                      </span>
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                      {phase.title}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      {phase.timeframe}
                    </p>
                  </div>
                </div>
                
                {/* 進度條 */}
                <div className="w-32">
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      進度
                    </span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {phase.progress}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                    <div
                      className={`h-full rounded-full ${
                        index === 0 
                          ? "bg-gradient-to-r from-blue-500 to-purple-500"
                          : index === 1
                          ? "bg-gradient-to-r from-purple-500 to-pink-500"
                          : "bg-gradient-to-r from-orange-500 to-red-500"
                      }`}
                      style={{ width: `${phase.progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* 階段項目 */}
              <div className="space-y-3">
                {phase.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex items-center">
                    {item.done ? (
                      <CheckCircle className="mr-3 h-5 w-5 flex-shrink-0 text-green-500" />
                    ) : (
                      <div className="mr-3 h-5 w-5 flex-shrink-0 rounded-full border-2 border-gray-300 dark:border-gray-700" />
                    )}
                    <span className={`${
                      item.done 
                        ? "text-gray-900 dark:text-white" 
                        : "text-gray-600 dark:text-gray-400"
                    }`}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 近期更新 */}
      <div>
        <h3 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
          近期更新與里程碑
        </h3>
        <div className="space-y-4">
          {recentUpdates.map((update, index) => (
            <div
              key={index}
              className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="mb-1 flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {update.date}
                    </span>
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                      update.type === "里程碑"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        : update.type === "技術成就"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                    }`}>
                      {update.type}
                    </span>
                  </div>
                  <h4 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
                    {update.title}
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300">
                    {update.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 貢獻邀請 */}
      <div className="mt-8 rounded-xl bg-gradient-to-r from-gray-50 to-blue-50 p-6 dark:from-gray-800 dark:to-blue-900/30">
        <div className="flex flex-col items-center justify-between md:flex-row">
          <div>
            <h4 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
              想要參與開發？
            </h4>
            <p className="text-gray-700 dark:text-gray-300">
              我們歡迎理念相同的開發者、設計師和智能體研究者參與項目
            </p>
          </div>
          <div className="mt-4 flex space-x-4 md:mt-0">
            <button className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 font-medium text-white hover:opacity-90">
              查看 GitHub
            </button>
            <button className="rounded-lg border-2 border-gray-300 bg-transparent px-6 py-3 font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
              聯絡團隊
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}