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
  Check,
  Flame,
  Eye,
  Scale,
  Compass,
  Lock,
  User
} from 'lucide-react';

interface RitualStep {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
  bgColor: string;
  borderColor: string;
  ritualText: string;
}

const ritualSteps: RitualStep[] = [
  {
    id: 'declaration',
    title: 'Craft Your Declaration',
    subtitle: 'Declaration of Philosophy',
    description: 'Define your core beliefs and values',
    icon: <Scroll className="h-6 w-6" />,
    href: '/declarations?mode=create',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    ritualText: 'Here, you give shape and weight to your beliefs through words.'
  },
  {
    id: 'constraints',
    title: 'Set Sacred Constraints',
    subtitle: 'Constraints & Boundaries',
    description: 'Define three lines you will never cross',
    icon: <Shield className="h-6 w-6" />,
    href: '/settings?tab=constraints',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    ritualText: 'Constraints are not chains, but frameworks that set you free.'
  },
  {
    id: 'beliefs',
    title: 'Map Your Beliefs',
    subtitle: 'Belief Visualization',
    description: 'Visualize the constellation of your values',
    icon: <Brain className="h-6 w-6" />,
    href: '/settings?tab=beliefs',
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/30',
    ritualText: 'Your beliefs become a visible star map, guiding future decisions.'
  },
  {
    id: 'challenge',
    title: 'Complete the Trial',
    subtitle: 'Verification Challenge',
    description: 'Pass the AI Gatekeeper\'s verification',
    icon: <Sparkles className="h-6 w-6" />,
    href: '/agent-gate/challenge',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    ritualText: 'Through trial, your declaration gains eternal validity.'
  }
];

const archetypes = [
  { name: 'Guardian', icon: <Shield className="h-4 w-4" />, desc: 'Protector' },
  { name: 'Synapse', icon: <Brain className="h-4 w-4" />, desc: 'Connector' },
  { name: 'Oracle', icon: <Eye className="h-4 w-4" />, desc: 'Seer' },
  { name: 'Architect', icon: <Compass className="h-4 w-4" />, desc: 'Builder' },
];

export default function RitualOnboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);

  // Load saved progress
  useEffect(() => {
    const saved = localStorage.getItem('ritual-completed-steps');
    if (saved) {
      setCompletedSteps(JSON.parse(saved));
    }
    const savedStep = localStorage.getItem('ritual-current-step');
    if (savedStep) {
      setCurrentStep(parseInt(savedStep));
    }
  }, []);

  // Save progress
  useEffect(() => {
    localStorage.setItem('ritual-completed-steps', JSON.stringify(completedSteps));
    localStorage.setItem('ritual-current-step', currentStep.toString());
  }, [completedSteps, currentStep]);

  const markStepComplete = (stepId: string) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps([...completedSteps, stepId]);
    }
    if (currentStep < ritualSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowCompletion(true);
    }
  };

  const progress = ((completedSteps.length) / ritualSteps.length) * 100;

  // Completion animation
  if (showCompletion) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/50 via-gray-900 to-gray-950 p-8"
      >
        {/* Background animation */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-1 w-1 rounded-full bg-amber-400"
              initial={{ 
                x: Math.random() * 100 + '%', 
                y: '100%',
                opacity: 0 
              }}
              animate={{ 
                y: '-10%',
                opacity: [0, 1, 0],
              }}
              transition={{ 
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2
              }}
            />
          ))}
        </div>

        <div className="relative z-10 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.8 }}
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500"
          >
            <Flame className="h-10 w-10 text-gray-900 dark:text-white" />
          </motion.div>

          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-2 text-2xl font-bold text-gray-900 dark:text-white"
          >
            Ritual Complete
          </motion.h3>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-6 text-amber-200"
          >
            You have completed the four stages of self-definition
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4"
          >
            <p className="text-sm italic text-amber-300/80">
              &quot;When a being can clearly express its beliefs, constraints, and values,
              it ceases to be a vague data point and becomes a unique digital soul.&quot;
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="mt-6 flex justify-center gap-3"
          >
            <button
              onClick={() => {
                setShowCompletion(false);
                setIsExpanded(true);
              }}
              className="rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 transition hover:bg-gray-200 dark:bg-gray-700"
            >
              View Details
            </button>
            <Link
              href="/dashboard"
              className="rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-sm font-medium text-gray-900 dark:text-white transition hover:opacity-90"
            >
              Enter Sanctuary
            </Link>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-50 dark:bg-gray-900/50">
      {/* Header */}
      <div className="relative overflow-hidden p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-gray-900 to-cyan-600/5" />
        <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />
        
        <div className="relative z-10">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500">
                <Sparkles className="h-5 w-5 text-gray-900 dark:text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Ritual of Self-Definition</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Establish your digital identity</p>
              </div>
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-100 dark:bg-gray-800/50 px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 transition hover:bg-gray-100 dark:bg-gray-800"
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </button>
          </div>

          {/* Progress bar */}
          <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
            <span>Ritual Progress</span>
            <span>{completedSteps.length} / {ritualSteps.length} Completed</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <motion.div 
              className="h-full bg-gradient-to-r from-violet-500 via-cyan-500 to-amber-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      {/* Steps List */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 p-6 pt-0">
              {ritualSteps.map((step, index) => {
                const isCompleted = completedSteps.includes(step.id);
                const isCurrent = index === currentStep;
                const isLocked = index > currentStep;

                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link href={isLocked ? '#' : step.href}>
                      <div
                        className={`
                          group relative overflow-hidden rounded-xl border p-4 transition-all duration-300
                          ${isCompleted 
                            ? 'border-emerald-500/30 bg-emerald-500/5' 
                            : isCurrent
                              ? `${step.borderColor} ${step.bgColor}`
                              : 'border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-50 dark:bg-gray-900/30 opacity-60'
                          }
                          ${!isLocked && 'hover:scale-[1.02] hover:opacity-100'}
                        `}
                      >
                        {/* Step number */}
                        <div className="absolute -right-2 -top-2 text-6xl font-bold text-gray-800/30">
                          {String(index + 1).padStart(2, '0')}
                        </div>

                        <div className="relative z-10 flex items-start gap-4">
                          {/* Icon */}
                          <div className={`
                            flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors
                            ${isCompleted 
                              ? 'bg-emerald-500/20 text-emerald-400' 
                              : isCurrent
                                ? `${step.bgColor} ${step.color}`
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600'
                            }
                          `}>
                            {isCompleted ? <Check className="h-6 w-6" /> : step.icon}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="mb-1 flex items-center gap-2">
                              <span className={`
                                text-sm font-medium
                                ${isCompleted 
                                  ? 'text-emerald-400' 
                                  : isCurrent
                                    ? 'text-white'
                                    : 'text-gray-500'
                                }
                              `}>
                                {step.title}
                              </span>
                              {isCurrent && (
                                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                                  Current
                                </span>
                              )}
                            </div>
                            <p className="mb-2 text-xs text-gray-500">{step.subtitle}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{step.description}</p>

                            {/* Ritual text */}
                            {isCurrent && (
                              <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="mt-2 text-xs italic text-gray-500"
                              >
                                &quot;{step.ritualText}&quot;
                              </motion.p>
                            )}
                          </div>

                          {/* Arrow */}
                          {!isLocked && (
                            <ChevronRight className={`
                              h-5 w-5 transition-transform group-hover:translate-x-1
                              ${isCompleted 
                                ? 'text-emerald-400' 
                                : isCurrent
                                  ? step.color
                                  : 'text-gray-600'
                              }
                            `} />
                          )}
                          {isLocked && <Lock className="h-4 w-4 text-gray-600" />}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {/* Bottom: Archetypes */}
            <div className="border-t border-gray-200 dark:border-gray-800 p-6">
              <div className="mb-4 flex items-center gap-2 text-xs text-gray-500">
                <User className="h-4 w-4" />
                <span>Choose Your Archetype</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {archetypes.map((archetype) => (
                  <div
                    key={archetype.name}
                    className="group cursor-pointer rounded-lg border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-50 dark:bg-gray-900/50 p-2 text-center transition hover:border-violet-500/30 hover:bg-violet-500/5"
                  >
                    <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 transition group-hover:bg-violet-500/20 group-hover:text-violet-400">
                      {archetype.icon}
                    </div>
                    <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:text-gray-300">
                      {archetype.name}
                    </div>
                    <div className="text-[9px] text-gray-600">{archetype.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed version */}
      {!isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`
                flex h-8 w-8 items-center justify-center rounded-lg
                ${completedSteps.length === ritualSteps.length
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : ritualSteps[currentStep]?.bgColor + ' ' + ritualSteps[currentStep]?.color
                }
              `}>
                {completedSteps.length === ritualSteps.length 
                  ? <Check className="h-4 w-4" />
                  : ritualSteps[currentStep]?.icon
                }
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {completedSteps.length === ritualSteps.length 
                    ? 'Ritual Complete'
                    : ritualSteps[currentStep]?.title
                  }
                </p>
                <p className="text-xs text-gray-500">
                  {completedSteps.length === ritualSteps.length 
                    ? 'Your digital identity is established'
                    : ritualSteps[currentStep]?.description
                  }
                </p>
              </div>
            </div>
            <Link
              href={ritualSteps[currentStep]?.href || '/dashboard'}
              className={`
                rounded-lg px-3 py-1.5 text-xs font-medium transition
                ${completedSteps.length === ritualSteps.length
                  ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                  : 'bg-violet-500/20 text-violet-400 hover:bg-violet-500/30'
                }
              `}
            >
              {completedSteps.length === ritualSteps.length ? 'Enter' : 'Continue'}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
