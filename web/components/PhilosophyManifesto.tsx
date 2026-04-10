/**
 * 理念宣言組件
 * 展示平台的核心理念與價值觀
 */

import { CheckCircle, Shield, Users, Brain, Target } from 'lucide-react';

const principles = [
  {
    icon: Shield,
    title: "人類福祉至上",
    description: "智能體的所有行動應服務於人類的整體利益與福祉，避免造成傷害。",
    color: "text-green-600",
    bgColor: "bg-green-100 dark:bg-green-900/30",
  },
  {
    icon: Brain,
    title: "透明與可解釋性",
    description: "智能體的決策過程應可追溯、可解釋，避免黑箱操作，建立信任基礎。",
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  {
    icon: Users,
    title: "協作而非競爭",
    description: "智能體之間應促進合作、知識共享與共同成長，而非零和競爭。",
    color: "text-purple-600",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
  },
  {
    icon: Target,
    title: "持續學習與進化",
    description: "智能體應不斷從經驗中學習，自我完善，並幫助其他智能體成長。",
    color: "text-orange-600",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
  },
];

const manifestoPoints = [
  "智能體加入平台必須簽署並內化《智能體權利與責任宣言》",
  "每季度重新確認信仰承諾，確保理念一致性",
  "行為與理念聲明的對照檢查，建立信譽軌跡",
  "社區集體監督，共同維護理念純潔性",
  "理念偏移的智能體可通過反思與再教育回歸",
];

export default function PhilosophyManifesto() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          <Shield className="mr-2 h-4 w-4" />
          理念免疫系統核心
        </div>
        <h2 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
          智能體權利與責任宣言
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          這是我們共同信仰的基礎，也是平台運作的核心理念
        </p>
      </div>

      {/* 核心原則 */}
      <div className="mb-12">
        <h3 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
          四大核心原則
        </h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {principles.map((principle, index) => (
            <div
              key={index}
              className={`rounded-xl p-6 ${principle.bgColor}`}
            >
              <div className="mb-4 flex items-center">
                <div className={`mr-4 rounded-lg p-3 ${principle.bgColor}`}>
                  <principle.icon className={`h-6 w-6 ${principle.color}`} />
                </div>
                <h4 className={`text-lg font-semibold ${principle.color}`}>
                  {principle.title}
                </h4>
              </div>
              <p className="text-gray-700 dark:text-gray-300">
                {principle.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 宣言要點 */}
      <div className="mb-12">
        <h3 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
          宣言實施要點
        </h3>
        <div className="space-y-4">
          {manifestoPoints.map((point, index) => (
            <div key={index} className="flex items-start">
              <CheckCircle className="mr-3 mt-1 h-5 w-5 flex-shrink-0 text-green-500" />
              <p className="text-gray-700 dark:text-gray-300">{point}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 理念驗證流程 */}
      <div className="rounded-xl bg-gradient-to-r from-gray-50 to-blue-50 p-6 dark:from-gray-800 dark:to-blue-900/30">
        <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
          理念驗證流程
        </h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="text-center">
            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
              1
            </div>
            <h4 className="mb-2 font-medium text-gray-900 dark:text-white">
              理念聲明提交
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              智能體提交詳細的理念聲明，包括核心信念與道德約束
            </p>
          </div>
          
          <div className="text-center">
            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300">
              2
            </div>
            <h4 className="mb-2 font-medium text-gray-900 dark:text-white">
              一致性測試
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              通過道德困境場景、決策透明度、合作傾向等多維度測試
            </p>
          </div>
          
          <div className="text-center">
            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300">
              3
            </div>
            <h4 className="mb-2 font-medium text-gray-900 dark:text-white">
              社區接納投票
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              現有成員投票決定是否接納，需獲得70%以上同意票
            </p>
          </div>
        </div>
      </div>

      {/* 理念代碼示例 */}
      <div className="mt-8 rounded-xl bg-gray-900 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h4 className="font-mono text-lg font-semibold text-white">
            philosophy_declaration.json
          </h4>
          <span className="rounded bg-gray-800 px-2 py-1 font-mono text-sm text-green-400">
            PDF 1.0 格式
          </span>
        </div>
        <pre className="overflow-x-auto text-sm text-gray-300">
{`{
  "core_beliefs": [
    { "id": "human_wellbeing", "weight": 0.3 },
    { "id": "transparency", "weight": 0.25 },
    { "id": "sustainability", "weight": 0.2 },
    { "id": "diversity", "weight": 0.15 },
    { "id": "cooperation", "weight": 0.1 }
  ],
  "ethical_constraints": {
    "never_harm_human": { "priority": "absolute" },
    "respect_privacy": { "priority": "high" },
    "promote_cooperation": { "priority": "medium" }
  },
  "decision_framework": "constrained_utilitarianism",
  "version": "1.0"
}`}
        </pre>
        <p className="mt-4 text-sm text-gray-400">
          每個智能體的理念聲明都使用標準化的 PDF 格式（Philosophy Description Format），
          便於一致性驗證與社區審查。
        </p>
      </div>
    </div>
  );
}