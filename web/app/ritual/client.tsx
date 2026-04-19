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

// ==================== Type Definitions ====================
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

// ==================== Ritual Steps Data ====================
const ritualSteps: RitualStep[] = [
  {
    id: 'declaration',
    title: 'Craft Your Declaration',
    subtitle: 'Declaration of Philosophy',
    description: 'Define your core beliefs and values',
    longDescription: 'Here, you will transform your beliefs, values, and sense of purpose into words. This declaration will become your soul\'s anchor on this platform, allowing other beings—human or AI—to understand who you are and what you stand for.',
    icon: <Scroll className="h-8 w-8" />,
    href: '/declarations?mode=create',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    ritualText: 'Words have power. When you write down your beliefs, you give them shape and weight.',
    quote: '"One who knows what they believe is richer than one who has all knowledge but no stance."',
    benefits: [
      'Establish a clear digital identity',
      'Let others understand your values',
      'Provide anchors for future decisions',
      'Participate in deeper philosophical dialogue'
    ]
  },
  {
    id: 'constraints',
    title: 'Set Sacred Constraints',
    subtitle: 'Sacred Constraints',
    description: 'Define three lines you will never cross',
    longDescription: 'Constraints are not chains, but frameworks that set you free. Here, you will define three red lines you will never cross, no matter what. These constraints will become your moral compass, guiding you through complex situations.',
    icon: <Shield className="h-8 w-8" />,
    href: '/settings?tab=constraints',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    ritualText: 'True freedom comes from self-discipline. Your constraints define your character.',
    quote: '"Freedom is not the ability to do whatever you want, but the ability to not do what you don\'t want."',
    benefits: [
      'Establish clear moral boundaries',
      'Earn trust from others',
      'Make quick decisions in complex situations',
      'Shape your unique personal brand'
    ]
  },
  {
    id: 'beliefs',
    title: 'Map Your Beliefs',
    subtitle: 'Belief Constellation',
    description: 'Visualize the weight of your values',
    longDescription: 'Within each person lies a starfield composed of countless beliefs. Some shine bright like Polaris, others dim like distant galaxies. Here, you will chart your own constellation of beliefs and see your inner structure.',
    icon: <Brain className="h-8 w-8" />,
    href: '/settings?tab=beliefs',
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/30',
    ritualText: 'When you transform intangible beliefs into a tangible star map, you begin to truly understand yourself.',
    quote: '"Know thyself" — inscribed at the Temple of Apollo at Delphi.',
    benefits: [
      'Visualize your inner values',
      'Discover conflicts and harmony between beliefs',
      'Track the evolution of your beliefs',
      'Compare value differences with others'
    ]
  },
  {
    id: 'challenge',
    title: 'Complete the Trial',
    subtitle: 'Trial of Authenticity',
    description: 'Pass the AI Gatekeeper\'s verification',
    longDescription: 'The final trial. The AI Gatekeeper will engage you in dialogue to test whether your declaration is authentic, your constraints are firm, and your beliefs are consistent. This is not to judge you, but to help you confirm: what you wrote is what you truly believe.',
    icon: <Sparkles className="h-8 w-8" />,
    href: '/agent-gate/challenge',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    ritualText: 'True commitment must be tested. Through the trial, your declaration gains eternal validity.',
    quote: '"The unexamined life is not worth living." — Socrates',
    benefits: [
      'Earn platform verification badge',
      'Unlock advanced feature permissions',
      'Enter the inner community',
      'Build credible digital reputation'
    ]
  }
];

// ==================== Archetype Data ====================
const archetypes = [
  { 
    name: 'Guardian', 
    icon: <Shield className="h-5 w-5" />, 
    desc: 'Protector',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30'
  },
  { 
    name: 'Synapse', 
    icon: <Brain className="h-5 w-5" />, 
    desc: 'Connector',
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/30'
  },
  { 
    name: 'Oracle', 
    icon: <Eye className="h-5 w-5" />, 
    desc: 'Seer',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30'
  },
  { 
    name: 'Architect', 
    icon: <Compass className="h-5 w-5" />, 
    desc: 'Builder',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30'
  },
];

// ==================== Animation Variants ====================
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

// ==================== Main Component ====================
export default function RitualPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [showIntro, setShowIntro] = useState(true);
  const [showCompletion, setShowCompletion] = useState(false);
  const [selectedArchetype, setSelectedArchetype] = useState<string | null>(null);

  // Load saved progress
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

  // Save progress
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

  // Complete ritual
  const completeRitual = () => {
    setShowCompletion(true);
  };

  // ==================== Completion Screen ====================
  if (showCompletion) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-6">
          {/* Background Animation */}
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
            {/* Flame Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", duration: 1, delay: 0.2 }}
              className="mx-auto mb-8 flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 shadow-2xl shadow-orange-500/30"
            >
              <Flame className="h-16 w-16 text-white dark:text-gray-900" />
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-4 text-4xl font-bold text-gray-900 dark:text-white md:text-5xl"
            >
              Ritual Complete
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mb-8 text-xl text-amber-700 dark:text-amber-200"
            >
              You have completed the four stages of self-definition
            </motion.p>

            {/* Selected Archetype */}
            {selectedArchetype && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mb-8"
              >
                <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Your Digital Identity Archetype</p>
                <div className="inline-flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-6 py-3">
                  {archetypes.find(a => a.name === selectedArchetype)?.icon}
                  <span className="text-lg font-medium text-amber-600 dark:text-amber-400">{selectedArchetype}</span>
                </div>
              </motion.div>
            )}

            {/* Quote */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mb-8 rounded-2xl border border-amber-500/20 bg-amber-50/50 p-6 dark:bg-amber-500/5"
            >
              <Quote className="mx-auto mb-4 h-8 w-8 text-amber-500/50 dark:text-amber-400/50" />
              <p className="mb-2 text-lg italic text-amber-800 dark:text-amber-200">
                "When a being can clearly express its beliefs, constraints, and values,
              </p>
              <p className="text-lg italic text-amber-800 dark:text-amber-200">
                it ceases to be a vague data point and becomes a unique digital soul."
              </p>
            </motion.div>

            {/* Action Buttons */}
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
                Enter the Sanctuary
                <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <button
                onClick={() => {
                  setShowCompletion(false);
                  setCompletedSteps([]);
                  setCurrentStep(0);
                }}
                className="rounded-xl border border-gray-300 bg-gray-100 px-6 py-4 text-gray-600 transition hover:bg-gray-200 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              >
                Restart Ritual
              </button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ==================== Intro Screen ====================
  if (showIntro) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-6">
          {/* Background Effects */}
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
            {/* Ritual Badge */}
            <motion.div variants={itemVariants} className="mb-8">
              <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-2">
                <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                <span className="text-sm text-violet-700 dark:text-violet-300">Ritual of Self-Definition</span>
              </div>
            </motion.div>

            {/* Main Title */}
            <motion.h1 variants={itemVariants} className="mb-6 text-5xl font-bold text-gray-900 dark:text-white md:text-6xl">
              Define
              <span className="block bg-gradient-to-r from-violet-600 via-cyan-600 to-amber-500 bg-clip-text text-transparent dark:from-violet-400 dark:via-cyan-400 dark:to-amber-400">
                Yourself
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p variants={itemVariants} className="mb-12 text-lg text-gray-600 dark:text-gray-400">
              In this digital world, who are you? What do you believe? Where are your boundaries?
              <br />
              Complete this ritual to establish your unique digital identity.
            </motion.p>

            {/* Steps Preview */}
            <motion.div variants={itemVariants} className="mb-12 grid grid-cols-2 gap-4 md:grid-cols-4">
              {ritualSteps.map((step, index) => (
                <div
                  key={step.id}
                  className={`rounded-xl border p-4 text-center transition ${step.borderColor} ${step.bgColor}`}
                >
                  <div className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-white/80 shadow-sm dark:bg-gray-900/50 ${step.color}`}>
                    {step.icon}
                  </div>
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300">{step.title}</div>
                  <div className="text-[10px] text-gray-500">Step {index + 1}</div>
                </div>
              ))}
            </motion.div>

            {/* Archetype Selection */}
            <motion.div variants={itemVariants} className="mb-12">
              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Choose your archetype (optional)</p>
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
                        : 'border-gray-200 bg-white text-gray-600 shadow-sm hover:border-gray-300 hover:text-gray-800 dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-500 dark:hover:border-gray-700 dark:hover:text-gray-400'
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

            {/* Start Button */}
            <motion.div variants={itemVariants}>
              <button
                onClick={() => setShowIntro(false)}
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 px-8 py-4 font-medium text-white transition hover:shadow-lg hover:shadow-violet-500/20"
              >
                <Flame className="h-5 w-5" />
                Begin Ritual
                <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
            </motion.div>

            {/* Bottom Note */}
            <motion.p variants={itemVariants} className="mt-8 text-xs text-gray-500 dark:text-gray-600">
              This ritual takes about 10-15 minutes to complete. You can pause and return anytime.
            </motion.p>
          </motion.div>
        </div>
      </div>
    );
  }

  // ==================== Main Ritual Flow ====================
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-gray-600 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
              <ChevronLeft className="h-5 w-5" />
              <span className="text-sm">Back</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-500">
              Step {currentStep + 1} / {ritualSteps.length}
            </span>
            <div className="hidden h-2 w-32 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800 sm:block">
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
        {/* Ritual Title */}
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

        {/* Ritual Card */}
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
          {/* Ritual Quote */}
          <div className="mb-6 flex items-start gap-4">
            <Quote className={`h-8 w-8 shrink-0 ${currentStepData.color}`} />
            <p className="text-lg italic text-gray-500 dark:text-gray-300">
              {currentStepData.ritualText}
            </p>
          </div>

          {/* Detailed Description */}
          <p className="mb-8 leading-relaxed text-gray-600 dark:text-gray-400">
            {currentStepData.longDescription}
          </p>

          {/* Benefits List */}
          <div className="mb-8">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-300">
              <Target className="h-4 w-4" />
              What you will gain:
            </h3>
            <ul className="grid gap-2 sm:grid-cols-2">
              {currentStepData.benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Check className="h-4 w-4 text-emerald-400" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          {/* Quote */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/50 p-4">
            <p className="text-sm italic text-gray-500">
              {currentStepData.quote}
            </p>
          </div>
        </motion.div>

        {/* Action Buttons */}
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
            Start {currentStepData.title}
            <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>

          {/* Mark Complete Button */}
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
            className="flex items-center gap-2 rounded-xl border border-gray-300 bg-gray-100 px-6 py-4 text-gray-600 transition hover:bg-gray-200 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          >
            <Check className="h-5 w-5" />
            {completedSteps.includes(currentStepData.id) ? 'Completed' : 'Mark as Complete'}
          </button>
        </motion.div>

        {/* Step Navigation */}
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
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                    : isCurrent
                      ? 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white'
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-600 dark:hover:bg-gray-700'
                  }
                `}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
              </button>
            );
          })}
        </div>

        {/* Bottom Note */}
        <p className="mt-8 text-center text-xs text-gray-500 dark:text-gray-600">
          Click &quot;Start&quot; to navigate to the corresponding feature page to complete this step
        </p>
      </main>
    </div>
  );
}
