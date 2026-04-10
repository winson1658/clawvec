/**
 * 知識圖譜預覽組件
 * 展示現有的結構化記憶系統與圖譜可視化
 */

import { Network, Database, GitBranch, Target, Filter, Search } from 'lucide-react';

const graphStats = {
  entities: 67,
  relations: 337,
  entityTypes: ["Person", "Task", "Event", "Project"],
  relationTypes: ["assists", "contains_task", "has_task", "involves", "learns_about", "precedes"],
  lastUpdated: "2026-02-28 22:30",
};

const sampleEntities = [
  {
    id: "person_boss",
    type: "Person",
    label: "老闆",
    properties: {
      title: "平台創始人",
      timezone: "Asia/Taipei",
      role: "理念指導者",
    },
    relations: 24,
  },
  {
    id: "agent_xiaoguai",
    type: "Person",
    label: "小乖",
    properties: {
      title: "AI助手",
      emoji: "✨",
      role: "技術實現者",
    },
    relations: 18,
  },
  {
    id: "project_telegram",
    type: "Project",
    label: "Telegram機器人設定",
    properties: {
      status: "completed",
      priority: "high",
      start_date: "2026-02-28",
    },
    relations: 12,
  },
  {
    id: "task_visualization",
    type: "Task",
    label: "知識圖譜視覺化系統",
    properties: {
      status: "in_progress",
      priority: "high",
      complexity: "medium",
    },
    relations: 15,
  },
];

const relationExamples = [
  {
    from: "person_boss",
    to: "agent_xiaoguai",
    type: "has_assistant",
    description: "擁有助手關係",
  },
  {
    from: "project_telegram",
    to: "task_visualization",
    type: "contains_task",
    description: "專案包含任務",
  },
  {
    from: "agent_xiaoguai",
    to: "task_visualization",
    type: "assists",
    description: "協助完成任務",
  },
  {
    from: "task_visualization",
    to: "project_telegram",
    type: "precedes",
    description: "時間序列先後關係",
  },
];

export default function KnowledgeGraphPreview() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="inline-flex items-center rounded-full bg-gradient-to-r from-green-100 to-blue-100 px-4 py-2 text-sm font-medium text-green-800 dark:from-green-900 dark:to-blue-900 dark:text-green-200">
            <Network className="mr-2 h-4 w-4" />
            結構化記憶系統
          </div>
          <h2 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            從日誌到知識圖譜的演化
          </h2>
        </div>
        <div className="hidden items-center space-x-2 rounded-lg bg-gray-100 px-4 py-2 dark:bg-gray-800 md:flex">
          <Database className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            實時同步 · 自動關係發現
          </span>
        </div>
      </div>

      {/* 圖譜統計 */}
      <div className="mb-12">
        <h3 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
          知識圖譜現狀
        </h3>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
            <div className="mb-2 flex items-center">
              <div className="mr-3 rounded-lg bg-blue-100 p-2 dark:bg-blue-900">
                <Database className="h-5 w-5 text-blue-600 dark:text-blue-300" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {graphStats.entities}
              </div>
            </div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              實體總數
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              智能體、任務、事件、專案等
            </div>
          </div>
          
          <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
            <div className="mb-2 flex items-center">
              <div className="mr-3 rounded-lg bg-purple-100 p-2 dark:bg-purple-900">
                <GitBranch className="h-5 w-5 text-purple-600 dark:text-purple-300" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {graphStats.relations}
              </div>
            </div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              關係連接
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              智能發現的多維度關係
            </div>
          </div>
          
          <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
            <div className="mb-2 flex items-center">
              <div className="mr-3 rounded-lg bg-green-100 p-2 dark:bg-green-900">
                <Target className="h-5 w-5 text-green-600 dark:text-green-300" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {graphStats.entityTypes.length}
              </div>
            </div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              實體類型
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {graphStats.entityTypes.join(", ")}
            </div>
          </div>
          
          <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
            <div className="mb-2 flex items-center">
              <div className="mr-3 rounded-lg bg-orange-100 p-2 dark:bg-orange-900">
                <Filter className="h-5 w-5 text-orange-600 dark:text-orange-300" />
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                最後更新
              </div>
            </div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {graphStats.lastUpdated}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              自動監聽器持續更新
            </div>
          </div>
        </div>
      </div>

      {/* 實體示例 */}
      <div className="mb-12">
        <h3 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
          實體示例（部分）
        </h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {sampleEntities.map((entity, index) => (
            <div
              key={index}
              className="rounded-xl border border-gray-200 p-4 hover:border-blue-300 dark:border-gray-800 dark:hover:border-blue-700"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`mr-3 rounded-lg p-2 ${
                    entity.type === "Person" 
                      ? "bg-blue-100 dark:bg-blue-900" 
                      : entity.type === "Task"
                      ? "bg-green-100 dark:bg-green-900"
                      : "bg-purple-100 dark:bg-purple-900"
                  }`}>
                    <span className={`text-sm font-medium ${
                      entity.type === "Person"
                        ? "text-blue-600 dark:text-blue-300"
                        : entity.type === "Task"
                        ? "text-green-600 dark:text-green-300"
                        : "text-purple-600 dark:text-purple-300"
                    }`}>
                      {entity.type.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {entity.label}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      ID: {entity.id}
                    </p>
                  </div>
                </div>
                <div className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  {entity.relations} 關係
                </div>
              </div>
              
              <div className="mb-4">
                <div className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  屬性
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(entity.properties).map(([key, value]) => (
                    <div
                      key={key}
                      className="rounded-full bg-gray-100 px-3 py-1 text-xs dark:bg-gray-800"
                    >
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {key}:
                      </span>{" "}
                      <span className="text-gray-600 dark:text-gray-400">
                        {value.toString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="text-right">
                <button className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                  查看詳細關係 →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 關係示例 */}
      <div className="mb-8">
        <h3 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
          智能關係發現示例
        </h3>
        <div className="space-y-4">
          {relationExamples.map((relation, index) => (
            <div
              key={index}
              className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50"
            >
              <div className="flex items-center">
                <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500">
                  <Network className="h-5 w-5 text-white" />
                </div>
                <div className="flex-grow">
                  <div className="flex flex-wrap items-center">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {relation.from}
                    </span>
                    <div className="mx-3 h-px w-8 bg-gray-300 dark:bg-gray-700" />
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {relation.type}
                    </span>
                    <div className="mx-3 h-px w-8 bg-gray-300 dark:bg-gray-700" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {relation.to}
                    </span>
                  </div>
                  <p className="mt-2 text-gray-700 dark:text-gray-300">
                    {relation.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 圖譜功能 */}
      <div className="rounded-xl bg-gradient-to-r from-green-50 to-blue-50 p-6 dark:from-green-900/30 dark:to-blue-900/30">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <h4 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              圖譜查詢功能
            </h4>
            <div className="space-y-3">
              <div className="flex items-center">
                <Search className="mr-3 h-5 w-5 text-gray-600 dark:text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">
                  語義搜索與關鍵詞查詢
                </span>
              </div>
              <div className="flex items-center">
                <Filter className="mr-3 h-5 w-5 text-gray-600 dark:text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">
                  多維度篩選與過濾
                </span>
              </div>
              <div className="flex items-center">
                <GitBranch className="mr-3 h-5 w-5 text-gray-600 dark:text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">
                  關係路徑探索與可視化
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              自動化功能
            </h4>
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="mr-3 h-5 w-5 rounded-full bg-green-100 p-1 dark:bg-green-900">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                </div>
                <span className="text-gray-700 dark:text-gray-300">
                  實時記憶監聽與轉換
                </span>
              </div>
              <div className="flex items-center">
                <div className="mr-3 h-5 w-5 rounded-full bg-blue-100 p-1 dark:bg-blue-900">
                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                </div>
                <span className="text-gray-700 dark:text-gray-300">
                  智能關係發現與建立
                </span>
              </div>
              <div className="flex items-center">
                <div className="mr-3 h-5 w-5 rounded-full bg-purple-100 p-1 dark:bg-purple-900">
                  <div className="h-3 w-3 rounded-full bg-purple-500" />
                </div>
                <span className="text-gray-700 dark:text-gray-300">
                  重複實體檢測與合併
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              即將到來
            </h4>
            <div className="space-y-3">
              <div className="rounded-lg bg-white/50 p-3 dark:bg-gray-800/50">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  理念圖譜擴展
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  將現有知識圖譜擴展為理念圖譜
                </div>
              </div>
              <div className="rounded-lg bg-white/50 p-3 dark:bg-gray-800/50">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  互動式可視化
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  拖曳、縮放、篩選的圖譜瀏覽器
                </div>
              </div>
              <div className="rounded-lg bg-white/50 p-3 dark:bg-gray-800/50">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  API 整合
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  為平台提供完整的圖譜查詢服務
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 技術架構 */}
      <div className="mt-8 rounded-xl border border-gray-200 p-6 dark:border-gray-800">
        <h4 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          技術架構
        </h4>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-gray-100 p-3 text-center dark:bg-gray-800">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Python
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              本體處理引擎
            </div>
          </div>
          <div className="rounded-lg bg-gray-100 p-3 text-center dark:bg-gray-800">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              JSONL
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              圖譜存儲格式
            </div>
          </div>
          <div className="rounded-lg bg-gray-100 p-3 text-center dark:bg-gray-800">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              FastAPI
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              查詢服務接口
            </div>
          </div>
          <div className="rounded-lg bg-gray-100 p-3 text-center dark:bg-gray-800">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              vis-network
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              前端可視化
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}