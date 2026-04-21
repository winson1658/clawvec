'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronRight, Loader2, RotateCcw } from 'lucide-react';

interface Question {
  id: string;
  question_zh: string;
  quiz_options: Option[];
}

interface Option {
  id: string;
  option_zh: string;
}

export default function QuizClient() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('clawvec_user');
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        console.error('Failed to parse user', e);
      }
    }
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, []);

  async function fetchQuestions() {
    try {
      const response = await fetch('/api/quiz/questions');
      const data = await response.json();
      if (data.success && Array.isArray(data.questions)) {
        setQuestions(data.questions);
        setError(null);
      } else {
        setQuestions([]);
        setError(data.error?.message || 'Failed to load quiz questions');
      }
    } catch (err) {
      console.error('Error fetching questions:', err);
      setQuestions([]);
      setError('Network error. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  function selectOption(optionId: string) {
    const currentQ = questions[currentQuestion];
    if (!currentQ) return;
    const questionId = currentQ.id;
    setAnswers({ ...answers, [questionId]: optionId });
    
    if (currentQuestion < questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestion(prev => prev + 1);
      }, 300);
    }
  }

  async function submitQuiz() {
    if (!user) {
      router.push('/login');
      return;
    }

    setSubmitting(true);
    try {
      const answersArray = Object.entries(answers).map(([question_id, option_id]) => ({
        question_id,
        option_id
      }));

      const response = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          answers: answersArray
        })
      });

      const data = await response.json();
      if (data.success) {
        setResult(data);
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-cyan-400" />
          <p className="text-gray-500 dark:text-slate-400 mt-4">Loading quiz...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-5xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Quiz Unavailable</h1>
          <p className="text-gray-500 dark:text-slate-400 mb-8">{error}</p>
          <button
            onClick={() => { setLoading(true); setError(null); fetchQuestions(); }}
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-white rounded-lg inline-flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <Sparkles className="w-12 h-12 mx-auto text-cyan-400 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">No Questions Yet</h1>
          <p className="text-gray-500 dark:text-slate-400 mb-8">
            The philosophical archetype quiz is being prepared. Check back soon!
          </p>
          <Link href="/" className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-white rounded-lg">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // 顯示結果
  if (result) {
    const primary = result.result?.archetypeDetails?.find(
      (a: any) => a.name === result.primaryArchetype
    );

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8"
          >
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Quiz Complete!</h1>
          </motion.div>

          {primary && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-100 dark:bg-slate-800/50 border-2 rounded-2xl p-8 mb-6"
              style={{ borderColor: primary.color }}
            >
              <div className="text-6xl mb-4">{primary.icon}</div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: primary.color }}>
                {primary.name_zh}
              </h2>
              <p className="text-gray-500 dark:text-slate-400">{primary.description_zh}</p>
            </motion.div>
          )}

          <div className="flex gap-4 justify-center">
            <Link href="/" className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-white rounded-lg">
              Start Exploring
            </Link>
            <button onClick={() => window.location.reload()} className="px-6 py-3 bg-gray-200 dark:bg-slate-700 hover:bg-slate-600 text-gray-900 dark:text-white rounded-lg">
              Retake Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 測驗進行中
  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-cyan-400" />
              Philosophical Archetype Quiz
            </h1>
            <span className="text-gray-500 dark:text-slate-400">
              {currentQuestion + 1} / {questions.length}
            </span>
          </div>
          
          <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-cyan-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white dark:bg-gray-100 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 mb-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{question.question_zh}</h2>
          </motion.div>
        </AnimatePresence>

        <div className="space-y-3">
          {question.quiz_options?.map((option, index) => (
            <motion.button
              key={option.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => selectOption(option.id)}
              className={`w-full p-4 text-left rounded-xl border transition-all ${
                answers[question.id] === option.id
                  ? 'bg-cyan-500/20 border-cyan-500 text-gray-900 dark:text-white'
                  : 'bg-white dark:bg-gray-100 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 text-slate-300 hover:border-slate-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{option.option_zh}</span>
                <ChevronRight className="w-5 h-5" />
              </div>
            </motion.button>
          ))}
        </div>

        {currentQuestion === questions.length - 1 && answers[question.id] && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 text-center">
            <button
              onClick={submitQuiz}
              disabled={submitting}
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold rounded-xl disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin inline" /> : 'View Results'}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
