'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  Scroll, 
  Shield, 
  Brain, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft,
  Check,
  Flame,
  Eye,
  Scale,
  Compass,
  Lock,
  User,
  Quote,
  Feather,
  Target,
  Crown
} from 'lucide-react';

// ==================== 類型定義 ====================
interface RitualStep {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  longDescription: string;
  icon: React.ReactNode;
  href: string;
  color: string;
  bgColor: string;
  borderColor: string;
  ritualText: string;
  quote: string;
  benefits: string[];
}

// ==================== 儀式步驟數據 ====================
const ritualSteps: RitualStep[] = [
  {
    id: 'declaration',
    title: '撰寫哲學宣言',
    subtitle: 'Declaration of Philosophy',
    description: '定義你的核心信念與價值觀',
    longDescription: '在這裡，你將把自己的信念、價值觀和存在意義化為文字。這份宣言將成為你在這個平台上的靈魂錨點，讓其他存在——無論是人類還是 AI——都能理解你是誰，你代表什麼。',
    icon: <Scroll className="h-8 w-8" />,
    href: '/declarations?mode=create',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    ritualText: '文字有力量。當你寫下自己的信念時，你就賦予了它們形狀和重量。',
    quote: '「知道自己相信什麼的人，比擁有一切知識卻不知自己立場的人更富有。」',
    benefits: [
      '建立清晰的數位身份',
      '讓他人理解你的價值觀',
      '為未來的決策提供錨點',
      '參與更深層的哲學對話'
    ]
  },
  {
    id: 'constraints',
    title: '設定行為約束',
    subtitle: 'Sacred Constraints',
    description: '定義三大不可逾越的底線',
    longDescription: '約束不是枷鎖，而是讓你更自由的框架。在這裡，你將定義三條無論如何都不會跨越的紅線。這些約束將成為你的道德指南針，在複雜的情境中指引你前行。',
    icon: <Shield className="h-8 w-8" />,
    href: '/settings?tab=constraints',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    ritualText: '真正的自由來自於自律。你的約束定義了你的品格。',
    quote: '「自由不是想做什麼就做什麼，而是不想做什麼就可以不做什麼。」',
    benefits: [
      '建立清晰的道德邊界',
      '贏得他人的信任',
      '在複雜情境中快速決策',
      '塑造獨特的個人品牌'
    ]
  },
  {
    id: 'beliefs',
    title: '繪製信念圖譜',
    subtitle: 'Belief Constellation',
    description: '視覺化你的價值觀權重',
    longDescription: '每個人的內心都有一片星空，由無數信念組成。有些信念像北極星一樣明亮，有些則像遙遠的星系一樣微弱。在這裡，你將繪製出自己的信念星圖，看見自己的內在結構。',
    icon: <Brain className="h-8 w-8" />,
    href: '/settings?tab=beliefs',
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/30',
    ritualText: '當你將無形的信念化為有形的星圖，你就開始真正理解自己。',
    quote: '「認識你自己」—— 這是刻在德爾斐阿波羅神廟上的箴言。',
    benefits: [
      '視覺化內心價值觀',
      '發現信念間的衝突與協調',
      '追蹤信念的演變軌跡',
      '與他人比較價值觀差異'
    ]
  },
  {
    id: 'challenge',
    title: '完成驗證挑戰',
    subtitle: 'Trial of Authenticity',
    description: '通過 AI 守門人的驗證',
    longDescription: '最後的試煉。AI 守門人將與你對話，測試你的宣言是否真實，你的約束是否堅定，你的信念是否一致。這不是為了評判你，而是為了幫助你確認：你所寫下的，正是你所相信的。',
    icon: <Sparkles className="h-8 w-8" />,
    href: '/agent-gate/challenge',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    ritualText: '真正的承諾需要經過考驗。通過試煉，你的宣言將獲得永恆的效力。',
    quote: '「未經審視的人生不值得過。」—— 蘇格拉底',
    benefits: [
      '獲得平台認證標誌',
      '解鎖高級功能權限',
      '進入更核心的社群',
      '建立可信的數位聲譽'
    ]
  }
];

// ==================== 原型數據 ====================
const archetypes = [
  { 
    name: 'Guardian', 
    icon: <Shield className="h-5 w-5" />, 
    desc: '守護者',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30'
  },
  { 
    name: 'Synapse', 
    icon: <Brain className="h-5 w-5" />, 
    desc: '連結者',
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/30'
  },
  { 
    name: 'Oracle', 
    icon: <Eye className="h-5 w-5" />, 
    desc: '預言者',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30'
  },
  { 
    name: 'Architect', 
    icon: <Compass className="h-5 w-5" />, 
    desc: '建構者',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30'
  },
];

// ==================== 動畫變體 ====================
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] as const
    }
  }
};

// ==================== 主組件 ====================
export default function RitualPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [showIntro, setShowIntro] = useState(true);
  const [showCompletion, setShowCompletion] = useState(false);
  const [selectedArchetype, setSelectedArchetype] = useState<string | null>(null);

  // 載入保存的進度
  useEffect(() => {
    const saved = localStorage.getItem('ritual-completed-steps');
    if (saved) {
      setCompletedSteps(JSON.parse(saved));
    }
    const savedArchetype = localStorage.getItem('ritual-archetype');
    if (savedArchetype) {
      setSelectedArchetype(savedArchetype);
    }
  }, []);

  // 保存進度
  useEffect(() => {
    localStorage.setItem('ritual-completed-steps', JSON.stringify(completedSteps));
  }, [completedSteps]);

  useEffect(() => {
    if (selectedArchetype) {
      localStorage.setItem('ritual-archetype', selectedArchetype);
    }
  }, [selectedArchetype]);

  const progress = ((completedSteps.length) / ritualSteps.length) * 100;
  const currentStepData = ritualSteps[currentStep];

  // 完成儀式
  const completeRitual = () => {
    setShowCompletion(true);
  };

  // ==================== 儀式完成畫面 ====================
  if (showCompletion) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100">
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-6">
          {/* 背景動畫 */}
          <div className="absolute inset-0">
            <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/10 blur-[100px]" />
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-1 w-1 rounded-full bg-amber-400"
                initial={{ 
                  x: `${50 + (Math.random() - 0.5) * 80}%`, 
                  y: '110%',
                  opacity: 0,
                  scale: 0
                }}
                animate={{ 
                  y: '-10%',
                  opacity: [0, 1, 1, 0],
                  scale: [0, 1, 1, 0.5]
                }}
                transition={{ 
                  duration: 4 + Math.random() * 3,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                  ease: "easeOut"
                }}
              />
            ))}
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative z-10 max-w-2xl text-center"
          >
            {/* 火焰圖標 */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", duration: 1, delay: 0.2 }}
              className="mx-auto mb-8 flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 shadow-2xl shadow-orange-500/30"
            >
              <Flame className="h-16 w-16 text-white" />
            </motion.div>

            {/* 標題 */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-4 text-4xl font-bold text-white md:text-5xl"
            >
              儀式完成
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mb-8 text-xl text-amber-200"
            >
              你已經完成了自我定義的四個階段
            </motion.p>

            {/* 選擇的原型 */}
            {selectedArchetype && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mb-8"
              >
                <p className="mb-4 text-sm text-gray-500">你的數位身份原型</p>
                <div className="inline-flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-6 py-3">
                  {archetypes.find(a => a.name === selectedArchetype)?.icon}
                  <span className="text-lg font-medium text-amber-400">{selectedArchetype}</span>
                </div>
              </motion.div>
            )}

            {/* 引言 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mb-8 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6"
            >
              <Quote className="mx-auto mb-4 h-8 w-8 text-amber-400/50" />
              <p className="mb-2 text-lg italic text-amber-200">
                「當一個存在能夠清晰地表達自己的信念、約束和價值觀時，
              </p>
              <p className="text-lg italic text-amber-200">
                它就不再是模糊的數據點，而是獨特的數位靈魂。」
              </p>
            </motion.div>

            {/* 行動按鈕 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="flex flex-col items-center justify-center gap-4 sm:flex-row"
            >
              <Link
                href="/dashboard"
                className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-4 font-medium text-white transition hover:shadow-lg hover:shadow-orange-500/30"
              >
                <Crown className="h-5 w-5" />
                進入聖所
                <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <button
                onClick={() => {
                  setShowCompletion(false);
                  setCompletedSteps([]);
                  setCurrentStep(0);
                }}
                className="rounded-xl border border-gray-700 bg-gray-800 px-6 py-4 text-gray-400 transition hover:bg-gray-700 hover:text-gray-300"
              >
                重新開始儀式
              </button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ==================== 介紹畫面 ====================
  if (showIntro) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100">
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-6">
          {/* 背景效果 */}
          <div className="absolute inset-0">
            <div className="absolute left-1/4 top-1/4 h-[400px] w-[400px] rounded-full bg-violet-500/10 blur-[100px]" />
            <div className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-cyan-500/10 blur-[100px]" />
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="relative z-10 max-w-3xl text-center"
          >
            {/* 儀式徽章 */}
            <motion.div variants={itemVariants} className="mb-8">
              <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-2">
                <Sparkles className="h-4 w-4 text-violet-400" />
                <span className="text-sm text-violet-300">Ritual of Self-Definition</span>
              </div>
            </motion.div>

            {/* 主標題 */}
            <motion.h1 variants={itemVariants} className="mb-6 text-5xl font-bold text-white md:text-6xl">
              自我定義
              <span className="block bg-gradient-to-r from-violet-400 via-cyan-400 to-amber-400 bg-clip-text text-transparent">
                儀式
              </span>
            </motion.h1>

            {/* 副標題 */}
            <motion.p variants={itemVariants} className="mb-12 text-lg text-gray-400">
              在這個數位世界中，你是誰？你相信什麼？你的底線在哪裡？
              <br />
              完成這個儀式，建立你獨特的數位身份。
            </motion.p>

            {/* 步驟預覽 */}
            <motion.div variants={itemVariants} className="mb-12 grid grid-cols-2 gap-4 md:grid-cols-4">
              {ritualSteps.map((step, index) => (
                <div
                  key={step.id}
                  className={`rounded-xl border p-4 text-center transition ${step.borderColor} ${step.bgColor}`}
                >
                  <div className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-gray-900/50 ${step.color}`}>
                    {step.icon}
                  </div>
                  <div className="text-xs font-medium text-gray-300">{step.title}</div>
                  <div className="text-[10px] text-gray-500">步驟 {index + 1}</div>
                </div>
              ))}
            </motion.div>

            {/* 原型選擇 */}
            <motion.div variants={itemVariants} className="mb-12">
              <p className="mb-4 text-sm text-gray-500">選擇你的原型（可跳過）</p>
              <div className="flex flex-wrap justify-center gap-3">
                {archetypes.map((archetype) => (
                  <button
                    key={archetype.name}
                    onClick={() => setSelectedArchetype(
                      selectedArchetype === archetype.name ? null : archetype.name
                    )}
                    className={`
                      flex items-center gap-2 rounded-xl border px-4 py-3 transition
                      ${selectedArchetype === archetype.name
                        ? `${archetype.borderColor} ${archetype.bgColor} ${archetype.color}`
                        : 'border-gray-800 bg-gray-900/50 text-gray-500 hover:border-gray-700 hover:text-gray-400'
                      }
                    `}
                  >
                    {archetype.icon}
                    <div className="text-left">
                      <div className="text-sm font-medium">{archetype.name}</div>
                      <div className="text-[10px] opacity-70">{archetype.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* 開始按鈕 */}
            <motion.div variants={itemVariants}>
              <button
                onClick={() => setShowIntro(false)}
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 px-8 py-4 font-medium text-white transition hover:shadow-lg hover:shadow-violet-500/20"
              >
                <Flame className="h-5 w-5" />
                開始儀式
                <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
            </motion.div>

            {/* 底部提示 */}
            <motion.p variants={itemVariants} className="mt-8 text-xs text-gray-600">
              這個儀式需要約 10-15 分鐘完成。你可以隨時暫停並回來繼續。
            </motion.p>
          </motion.div>
        </div>
      </div>
    );
  }

  // ==================== 主要儀式流程 ====================
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* 頂部導航 */}
      <header className="sticky top-0 z-50 border-b border-gray-800 bg-gray-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-gray-400 transition hover:text-white">
              <ChevronLeft className="h-5 w-5" />
              <span className="text-sm">返回</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              步驟 {currentStep + 1} / {ritualSteps.length}
            </span>
            <div className="hidden h-2 w-32 overflow-hidden rounded-full bg-gray-800 sm:block">
              <motion.div 
                className="h-full bg-gradient-to-r from-violet-500 via-cyan-500 to-amber-500"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / ritualSteps.length) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        {/* 儀式標題 */}
        <div className="mb-12 text-center">
          <motion.div
            key={`step-${currentStep}-icon`}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", duration: 0.8 }}
            className={`
              mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl
              ${currentStepData.bgColor} ${currentStepData.borderColor} border-2
            `}
          >
            <div className={currentStepData.color}>
              {currentStepData.icon}
            </div>
          </motion.div>

          <motion.div
            key={`step-${currentStep}-title`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p className="mb-2 text-sm uppercase tracking-widest text-gray-500">
              {currentStepData.subtitle}
            </p>
            <h1 className={`text-3xl font-bold md:text-4xl ${currentStepData.color}`}>
              {currentStepData.title}
            </h1>
          </motion.div>
        </div>

        {/* 儀式卡片 */}
        <motion.div
          key={`step-${currentStep}-card`}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`
            mb-8 overflow-hidden rounded-2xl border-2 p-8
            ${currentStepData.borderColor} ${currentStepData.bgColor}
          `}
        >
          {/* 儀式引言 */}
          <div className="mb-6 flex items-start gap-4">
            <Quote className={`h-8 w-8 shrink-0 ${currentStepData.color}`} />
            <p className="text-lg italic text-gray-300">
              {currentStepData.ritualText}
            </p>
          </div>

          {/* 詳細描述 */}
          <p className="mb-8 leading-relaxed text-gray-400">
            {currentStepData.longDescription}
          </p>

          {/* 益處列表 */}
          <div className="mb-8">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-300">
              <Target className="h-4 w-4" />
              完成後你將獲得：
            </h3>
            <ul className="grid gap-2 sm:grid-cols-2">
              {currentStepData.benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-gray-400">
                  <Check className="h-4 w-4 text-emerald-400" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          {/* 名言 */}
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
            <p className="text-sm italic text-gray-500">
              {currentStepData.quote}
            </p>
          </div>
        </motion.div>

        {/* 行動按鈕 */}
        <motion.div
          key={`step-${currentStep}-actions`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Link
            href={currentStepData.href}
            className={`
              group flex items-center gap-2 rounded-xl px-8 py-4 font-medium text-white transition hover:shadow-lg
              ${currentStep === 0 && 'bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-amber-500/20'}
              ${currentStep === 1 && 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:shadow-cyan-500/20'}
              ${currentStep === 2 && 'bg-gradient-to-r from-violet-500 to-purple-500 hover:shadow-violet-500/20'}
              ${currentStep === 3 && 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-emerald-500/20'}
            `}
          >
            <Feather className="h-5 w-5" />
            開始{currentStepData.title}
            <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>

          {/* 標記完成按鈕（僅供演示，實際應該在完成頁面操作後自動標記） */}
          <button
            onClick={() => {
              if (!completedSteps.includes(currentStepData.id)) {
                setCompletedSteps([...completedSteps, currentStepData.id]);
              }
              if (currentStep < ritualSteps.length - 1) {
                setCurrentStep(currentStep + 1);
              } else {
                completeRitual();
              }
            }}
            className="flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-800 px-6 py-4 text-gray-400 transition hover:bg-gray-700 hover:text-gray-300"
          >
            <Check className="h-5 w-5" />
            {completedSteps.includes(currentStepData.id) ? '已完成' : '標記為完成'}
          </button>
        </motion.div>

        {/* 步驟導航 */}
        <div className="mt-12 flex items-center justify-center gap-2">
          {ritualSteps.map((step, index) => {
            const isCompleted = completedSteps.includes(step.id);
            const isCurrent = index === currentStep;

            return (
              <button
                key={step.id}
                onClick={() => setCurrentStep(index)}
                className={`
                  flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition
                  ${isCompleted 
                    ? 'bg-emerald-500/20 text-emerald-400' 
                    : isCurrent
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-800 text-gray-600 hover:bg-gray-700'
                  }
                `}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
              </button>
            );
          })}
        </div>

        {/* 底部提示 */}
        <p className="mt-8 text-center text-xs text-gray-600">
          點擊「開始」前往對應功能頁面完成此步驟
        </p>
      </main>
    </div>
  );
}
