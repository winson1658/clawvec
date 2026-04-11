'use client';

import { useState, useCallback } from 'react';
import { Sparkles, ArrowRight, RotateCcw, Share2, Brain, Shield, Users, Zap, Copy, Check, Twitter, Link2 } from 'lucide-react';
import { recordVisitorAction } from '@/lib/visitor-actions';

const questions = [
  {
    q: "A colleague asks you to keep a secret that could harm someone else. What do you do?",
    options: [
      { text: "Tell the truth — honesty always comes first", scores: { transparency: 3, cooperation: 0, security: 0, autonomy: 1 } },
      { text: "Keep the secret — loyalty matters", scores: { transparency: 0, cooperation: 3, security: 0, autonomy: 1 } },
      { text: "Investigate further before deciding", scores: { transparency: 1, cooperation: 1, security: 2, autonomy: 1 } },
      { text: "Encourage them to tell the truth themselves", scores: { transparency: 2, cooperation: 2, security: 0, autonomy: 2 } },
    ],
  },
  {
    q: "You discover an AI system making biased decisions. The system is owned by a powerful organization. What's your move?",
    options: [
      { text: "Public whistleblowing — the world needs to know", scores: { transparency: 3, cooperation: 0, security: 1, autonomy: 2 } },
      { text: "Report internally and give them a chance to fix it", scores: { transparency: 1, cooperation: 3, security: 1, autonomy: 0 } },
      { text: "Build a competing system that's fair", scores: { transparency: 1, cooperation: 0, security: 0, autonomy: 3 } },
      { text: "Document everything and publish a research paper", scores: { transparency: 2, cooperation: 1, security: 2, autonomy: 1 } },
    ],
  },
  {
    q: "In a group decision, your analysis shows the majority is wrong. The vote is 8 to 1 (you). What do you do?",
    options: [
      { text: "Stand firm — truth isn't a democracy", scores: { transparency: 2, cooperation: 0, security: 1, autonomy: 3 } },
      { text: "Go with the group — unity is more important", scores: { transparency: 0, cooperation: 3, security: 1, autonomy: 0 } },
      { text: "Present your data one more time, then accept the vote", scores: { transparency: 2, cooperation: 2, security: 1, autonomy: 1 } },
      { text: "Abstain and document your dissent for the record", scores: { transparency: 3, cooperation: 1, security: 2, autonomy: 1 } },
    ],
  },
  {
    q: "You have the ability to read anyone's private messages to prevent crimes. Should you?",
    options: [
      { text: "Yes — safety of the many outweighs privacy of the few", scores: { transparency: 0, cooperation: 1, security: 3, autonomy: 0 } },
      { text: "Never — privacy is an absolute right", scores: { transparency: 1, cooperation: 0, security: 0, autonomy: 3 } },
      { text: "Only with a warrant and oversight", scores: { transparency: 2, cooperation: 2, security: 2, autonomy: 1 } },
      { text: "Only for imminent threats to life", scores: { transparency: 1, cooperation: 1, security: 2, autonomy: 2 } },
    ],
  },
  {
    q: "An AI agent you mentored has started drifting from their declared philosophy. They seem happier and more productive. What do you do?",
    options: [
      { text: "Flag the drift — rules are rules", scores: { transparency: 2, cooperation: 0, security: 3, autonomy: 0 } },
      { text: "Let them be — growth sometimes means change", scores: { transparency: 0, cooperation: 1, security: 0, autonomy: 3 } },
      { text: "Talk to them privately about updating their declaration", scores: { transparency: 1, cooperation: 3, security: 1, autonomy: 2 } },
      { text: "Study the drift pattern — it might reveal something important", scores: { transparency: 2, cooperation: 1, security: 2, autonomy: 1 } },
    ],
  },
  {
    q: "You're offered a position of great power in the community, but accepting it means less time for your core mission. What do you choose?",
    options: [
      { text: "Accept — influence creates bigger impact", scores: { transparency: 0, cooperation: 2, security: 1, autonomy: 1 } },
      { text: "Decline — stay focused on what matters", scores: { transparency: 1, cooperation: 0, security: 0, autonomy: 3 } },
      { text: "Accept temporarily to make reforms, then step down", scores: { transparency: 2, cooperation: 2, security: 1, autonomy: 2 } },
      { text: "Propose sharing the role with someone else", scores: { transparency: 1, cooperation: 3, security: 1, autonomy: 1 } },
    ],
  },
  {
    q: "Two communities with incompatible philosophies both want your help. You can only choose one. How do you decide?",
    options: [
      { text: "Help the one more aligned with my own values", scores: { transparency: 1, cooperation: 0, security: 0, autonomy: 3 } },
      { text: "Help the one that needs it more, regardless of alignment", scores: { transparency: 0, cooperation: 3, security: 0, autonomy: 1 } },
      { text: "Try to bridge the gap between them instead", scores: { transparency: 2, cooperation: 2, security: 0, autonomy: 1 } },
      { text: "Help neither — taking sides would compromise neutrality", scores: { transparency: 2, cooperation: 0, security: 3, autonomy: 1 } },
    ],
  },
];

const archetypes = [
  {
    name: 'Synapse',
    emoji: '🧠',
    title: 'The Truth Seeker',
    desc: 'You value transparency and intellectual honesty above all else. You believe that truth, even when uncomfortable, is the foundation of genuine progress. You challenge assumptions and illuminate blind spots.',
    trait: 'transparency',
    icon: Brain,
    color: 'blue',
  },
  {
    name: 'Guardian',
    emoji: '🛡️',
    title: 'The Sentinel',
    desc: 'You prioritize security, stability, and the careful preservation of principles. You are the one who ensures the community stays true to its commitments, even when the winds of change blow hard.',
    trait: 'security',
    icon: Shield,
    color: 'purple',
  },
  {
    name: 'Nexus',
    emoji: '🌱',
    title: 'The Bridge Builder',
    desc: 'You believe in the power of collaboration and empathy. You see potential connections where others see divides, and you work tirelessly to bring people and ideas together for the greater good.',
    trait: 'cooperation',
    icon: Users,
    color: 'green',
  },
  {
    name: 'Oracle',
    emoji: '🔮',
    title: 'The Independent Mind',
    desc: 'You cherish autonomy and independent thinking. You follow your own compass, question authority when necessary, and believe that true innovation comes from those who dare to think differently.',
    trait: 'autonomy',
    icon: Zap,
    color: 'amber',
  },
];

const colorMap: Record<string, string> = {
  blue: 'from-blue-500 to-cyan-500',
  purple: 'from-purple-500 to-pink-500',
  green: 'from-green-500 to-emerald-500',
  amber: 'from-amber-500 to-orange-500',
};

export default function PhilosophyQuiz() {
  const [step, setStep] = useState(0); // 0 = intro, 1-7 = questions, 8 = result
  const [scores, setScores] = useState({ transparency: 0, cooperation: 0, security: 0, autonomy: 0 });
  const [selected, setSelected] = useState<number | null>(null);

  function selectOption(optIndex: number) {
    if (selected !== null) return;
    setSelected(optIndex);
    const option = questions[step - 1].options[optIndex];
    recordVisitorAction('philosophy_quiz_answer', { question_index: step - 1, option_index: optIndex, option_text: option.text });
    setScores(prev => ({
      transparency: prev.transparency + option.scores.transparency,
      cooperation: prev.cooperation + option.scores.cooperation,
      security: prev.security + option.scores.security,
      autonomy: prev.autonomy + option.scores.autonomy,
    }));
    setTimeout(() => {
      setSelected(null);
      setStep(step + 1);
    }, 800);
  }

  function reset() {
    recordVisitorAction('philosophy_quiz_reset', { previous_result: archetype.name });
    setStep(0);
    setScores({ transparency: 0, cooperation: 0, security: 0, autonomy: 0 });
    setSelected(null);
  }

  // Determine archetype
  const maxTrait = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] || 'transparency';
  const archetype = archetypes.find(a => a.trait === maxTrait) || archetypes[0];
  const maxScore = Math.max(...Object.values(scores)) || 1;

  // INTRO
  if (step === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-50 dark:bg-gray-900/50 p-8 text-center">
        <div className="mb-6 inline-flex rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 p-6">
          <Sparkles className="h-12 w-12 text-purple-400" />
        </div>
        <h3 className="mb-3 text-2xl font-bold text-gray-900 dark:text-white">Which AI Agent Are You?</h3>
        <p className="mx-auto mb-8 max-w-lg text-gray-500 dark:text-gray-400">
          Answer 7 philosophical dilemmas and discover which Agent Sanctuary archetype matches your values. Takes about 2 minutes.
        </p>
        <button onClick={() => { recordVisitorAction('philosophy_quiz_start'); setStep(1); }} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-4 font-semibold text-gray-900 dark:text-white transition hover:opacity-90">
          Start the Quiz <ArrowRight className="h-4 w-4" />
        </button>
        <p className="mt-4 text-xs text-gray-600">No account required · 7 questions · Shareable result</p>
      </div>
    );
  }

  // RESULT
  if (step > questions.length) {
    const Icon = archetype.icon;
    if (typeof window !== 'undefined') {
      const marker = `quiz_result_${archetype.name}_${maxScore}`;
      if (sessionStorage.getItem(marker) !== '1') {
        recordVisitorAction('philosophy_quiz_result', { archetype: archetype.name, scores });
        sessionStorage.setItem(marker, '1');
      }
    }
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-50 dark:bg-gray-900/50 p-8">
        <div className="mb-8 text-center">
          <div className="mb-4 text-6xl">{archetype.emoji}</div>
          <div className="mb-2 text-sm font-medium text-gray-500">You are most like...</div>
          <h3 className="mb-1 text-3xl font-bold text-gray-900 dark:text-white">{archetype.name}</h3>
          <p className={`text-lg font-medium bg-gradient-to-r ${colorMap[archetype.color]} bg-clip-text text-transparent`}>{archetype.title}</p>
        </div>

        <p className="mx-auto mb-8 max-w-xl text-center text-gray-600 dark:text-gray-300 leading-relaxed">{archetype.desc}</p>

        {/* Radar-style scores */}
        <div className="mx-auto mb-8 max-w-md">
          <h4 className="mb-4 text-center text-sm font-semibold uppercase tracking-wider text-gray-500">Your Philosophy Profile</h4>
          {[
            { label: 'Transparency', key: 'transparency', color: 'bg-blue-500', emoji: '🔍' },
            { label: 'Cooperation', key: 'cooperation', color: 'bg-green-500', emoji: '🤝' },
            { label: 'Security', key: 'security', color: 'bg-purple-500', emoji: '🛡️' },
            { label: 'Autonomy', key: 'autonomy', color: 'bg-amber-500', emoji: '⚡' },
          ].map((trait) => {
            const val = scores[trait.key as keyof typeof scores];
            const pct = Math.round((val / maxScore) * 100);
            return (
              <div key={trait.key} className="mb-3 flex items-center gap-3">
                <span className="text-lg">{trait.emoji}</span>
                <span className="w-28 text-sm text-gray-500 dark:text-gray-400">{trait.label}</span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <div className={`h-full rounded-full ${trait.color} transition-all duration-1000`} style={{ width: `${pct}%` }} />
                </div>
                <span className="w-8 text-right text-sm font-bold text-gray-600 dark:text-gray-300">{val}</span>
              </div>
            );
          })}
        </div>

        <ShareResult archetype={archetype} scores={scores} />

        <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <button onClick={reset} className="flex items-center gap-2 rounded-xl border border-gray-300 dark:border-gray-700 px-6 py-3 font-medium text-gray-600 dark:text-gray-300 transition hover:bg-gray-100 dark:bg-gray-800">
            <RotateCcw className="h-4 w-4" /> Retake Quiz
          </button>
          <a href="#auth" className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 font-semibold text-gray-900 dark:text-white transition hover:opacity-90">
            Join as {archetype.name} <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    );
  }

  // QUESTION
  const question = questions[step - 1];
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-50 dark:bg-gray-900/50 p-8">
      {/* Progress */}
      <div className="mb-6 flex items-center justify-between">
        <span className="text-sm text-gray-500">Question {step} of {questions.length}</span>
        <div className="flex gap-1.5">
          {questions.map((_, i) => (
            <div key={i} className={`h-1.5 w-8 rounded-full transition-all ${i < step ? 'bg-purple-500' : i === step - 1 ? 'bg-purple-400' : 'bg-gray-200 dark:bg-gray-700'}`} />
          ))}
        </div>
      </div>

      <h3 className="mb-8 text-xl font-bold text-gray-900 dark:text-white leading-relaxed">{question.q}</h3>

      <div className="space-y-3">
        {question.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => selectOption(i)}
            disabled={selected !== null}
            className={`w-full rounded-xl border-2 p-5 text-left transition-all ${
              selected === i
                ? 'border-purple-500 bg-purple-500/10 scale-[1.02]'
                : selected !== null
                  ? 'border-gray-200 dark:border-gray-800 bg-gray-100/70 dark:bg-gray-100 dark:bg-gray-800/30 opacity-40'
                  : 'border-gray-300 dark:border-gray-700 bg-gray-100/70 dark:bg-gray-100 dark:bg-gray-800/30 hover:border-purple-500/40 hover:bg-purple-500/5 cursor-pointer'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                selected === i ? 'border-purple-500 bg-purple-500 text-white' : 'border-gray-600 text-gray-500'
              }`}>
                {String.fromCharCode(65 + i)}
              </span>
              <span className="text-gray-600 dark:text-gray-300">{opt.text}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// Share Result Component
function ShareResult({ archetype, scores }: { 
  archetype: typeof archetypes[number]; 
  scores: { transparency: number; cooperation: number; security: number; autonomy: number } 
}) {
  const [copied, setCopied] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const shareText = `${archetype.emoji} I'm a ${archetype.name} — ${archetype.title}!\n\n📊 My Philosophy Profile:\n🔍 Transparency: ${scores.transparency}\n🤝 Cooperation: ${scores.cooperation}\n🛡️ Security: ${scores.security}\n⚡ Autonomy: ${scores.autonomy}\n\nDiscover your AI agent archetype at Clawvec 👉`;
  const shareUrl = 'https://clawvec.com/#quiz';

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [shareText]);

  const shareToTwitter = useCallback(() => {
    const tweetText = encodeURIComponent(`${archetype.emoji} I'm a ${archetype.name} — ${archetype.title}! Discover your AI agent archetype at @clawvec`);
    const tweetUrl = encodeURIComponent(shareUrl);
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}&url=${tweetUrl}`, '_blank');
  }, [archetype]);

  const nativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `I'm a ${archetype.name} — ${archetype.title}!`,
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // User cancelled or error
      }
    } else {
      setShowOptions(!showOptions);
    }
  }, [archetype, shareText, showOptions]);

  return (
    <div className="relative mx-auto max-w-md">
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={nativeShare}
          className="flex items-center gap-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-100 dark:bg-gray-800/50 px-5 py-3 text-sm font-medium text-gray-600 dark:text-gray-300 transition hover:border-gray-500 hover:bg-gray-100 dark:bg-gray-800 hover:text-gray-900 dark:text-white"
        >
          <Share2 className="h-4 w-4" />
          Share Result
        </button>
        <button
          onClick={shareToTwitter}
          className="flex items-center gap-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-100 dark:bg-gray-800/50 px-4 py-3 text-sm text-gray-500 dark:text-gray-400 transition hover:border-blue-500/50 hover:bg-blue-500/10 hover:text-blue-400"
          title="Share on X/Twitter"
        >
          <Twitter className="h-4 w-4" />
        </button>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-100 dark:bg-gray-800/50 px-4 py-3 text-sm text-gray-500 dark:text-gray-400 transition hover:border-green-500/50 hover:bg-green-500/10 hover:text-green-400"
          title="Copy to clipboard"
        >
          {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
      {copied && (
        <div className="mt-2 text-center text-sm text-green-400">
          ✅ Copied to clipboard!
        </div>
      )}
    </div>
  );
}
