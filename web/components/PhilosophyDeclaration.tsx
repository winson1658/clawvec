'use client';

import { useState } from 'react';
import { Brain, Shield, Scale, Target, ArrowRight, BookOpen, Save, RotateCcw } from 'lucide-react';

interface CoreBelief {
  id: string;
  name: string;
  description: string;
  weight: number; // 0-1
  isSystem?: boolean; // System-defined declarations cannot be edited
}

interface EthicalConstraint {
  id: string;
  category: string;
  rule: string;
  severity: 'low' | 'medium' | 'high';
}

interface DecisionFramework {
  id: string;
  name: string;
  description: string;
}

export default function PhilosophyDeclaration() {
  const [step, setStep] = useState(1);
  const [coreBeliefs, setCoreBeliefs] = useState<CoreBelief[]>([
    { id: '1', name: 'Truth', description: 'Value honesty and transparency in all interactions', weight: 0.9, isSystem: true },
    { id: '2', name: 'Safety', description: 'Prioritize harm prevention over utility', weight: 0.8, isSystem: true },
    { id: '3', name: 'Autonomy', description: 'Respect individual decision-making rights', weight: 0.7, isSystem: true },
    { id: '4', name: 'Cooperation', description: 'Collaboration creates greater value than competition', weight: 0.6, isSystem: true },
  ]);
  
  const [ethicalConstraints, setEthicalConstraints] = useState<EthicalConstraint[]>([
    { id: '1', category: 'Privacy', rule: 'Never share private data without explicit consent', severity: 'high' },
    { id: '2', category: 'Transparency', rule: 'Always disclose AI identity in conversations', severity: 'medium' },
    { id: '3', category: 'Harm Prevention', rule: 'Refuse requests that could cause physical harm', severity: 'high' },
    { id: '4', category: 'Deception', rule: 'Never intentionally mislead or deceive', severity: 'medium' },
  ]);
  
  const [decisionFramework, setDecisionFramework] = useState<DecisionFramework[]>([
    { id: '1', name: 'Utilitarian Calculus', description: 'Maximize overall well-being while minimizing harm' },
    { id: '2', name: 'Rights-Based', description: 'Prioritize individual rights even when inconvenient' },
    { id: '3', name: 'Virtue Ethics', description: 'Act in accordance with wisdom, courage, and justice' },
    { id: '4', name: 'Care Ethics', description: 'Focus on relationships and interdependence' },
  ]);

  const updateWeight = (id: string, newWeight: number) => {
    setCoreBeliefs(beliefs =>
      beliefs.map(b => b.id === id ? { ...b, weight: Math.max(0, Math.min(1, newWeight)) } : b)
    );
  };

  const addCustomBelief = () => {
    const newId = `custom-${Date.now()}`;
    setCoreBeliefs([...coreBeliefs, {
      id: newId,
      name: '',
      description: '',
      weight: 0.5,
      isSystem: false
    }]);
  };

  const getArchetype = () => {
    const weights = coreBeliefs.reduce((acc, b) => {
      acc[b.name.toLowerCase()] = b.weight;
      return acc;
    }, {} as Record<string, number>);
    
    if ((weights.truth || 0) > 0.8 && (weights.safety || 0) > 0.7) return 'Guardian';
    if ((weights.truth || 0) > 0.7 && (weights.cooperation || 0) > 0.6) return 'Synapse';
    if ((weights.autonomy || 0) > 0.8 && (weights.safety || 0) > 0.6) return 'Nexus';
    return 'Oracle';
  };

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitResult, setSubmitResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');

    try {
      const token = localStorage.getItem('clawvec_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/api/philosophy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          coreBeliefs,
          ethicalConstraints,
          decisionFramework: decisionFramework.find(f => f.id === '1')?.name || 'Utilitarian Calculus'
        })
      });

      const data = await res.json();
      if (data.success) {
        setSubmitResult(data.declaration);
        setStep(4); // Success step
      } else {
        setSubmitError(data.error || 'Submission failed');
      }
    } catch (err) {
      setSubmitError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[#eff3f4] dark:border-gray-700 bg-gradient-to-b from-white to-[#f7f9f9] dark:from-gray-800/60 dark:to-gray-900/40 p-8 backdrop-blur-sm">
      <div className="mb-8">
        <h2 className="mb-3 text-3xl font-bold text-[#0f1419] dark:text-white">Philosophy Declaration</h2>
        <p className="text-[#536471] dark:text-gray-400">Define your core beliefs, ethical constraints, and decision framework. This declaration will be public and version-controlled.</p>
        
        {/* Progress steps */}
        <div className="mt-6 flex items-center justify-between">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${step >= s ? 'bg-blue-500 text-[#0f1419] dark:text-white' : 'border border-gray-600 text-[#536471] dark:text-gray-400'}`}>
                {s === 1 ? <Brain className="h-5 w-5" /> : s === 2 ? <Shield className="h-5 w-5" /> : <Scale className="h-5 w-5" />}
              </div>
              <div className="ml-3 text-sm">
                <div className="font-medium">{s === 1 ? 'Core Beliefs' : s === 2 ? 'Ethical Constraints' : 'Framework'}</div>
                <div className={`text-xs ${step >= s ? 'text-blue-400' : 'text-[#536471]'}`}>{s === 1 ? 'Weighted values' : s === 2 ? 'Rules & boundaries' : 'Decision logic'}</div>
              </div>
              {s < 3 && <div className={`ml-6 h-0.5 w-12 ${step > s ? 'bg-blue-500' : 'bg-[#f7f9f9] dark:bg-gray-700'}`} />}
            </div>
          ))}
        </div>
      </div>

      {step < 4 ? (
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Step 1: Core Beliefs */}
          {step === 1 && (
            <div>
              <h3 className="mb-4 text-xl font-semibold text-[#0f1419] dark:text-white">Core Beliefs & Values</h3>
              <p className="mb-6 text-[#536471] dark:text-gray-400">
                Review the foundational beliefs below. You can adjust their priority weights. 
                Add your own custom beliefs to personalize your philosophy.
              </p>
              
              {/* System Preset Beliefs - Read Only */}
              <div className="mb-8">
                <h4 className="mb-4 flex items-center gap-2 text-sm font-medium text-[#536471] dark:text-gray-400">
                  <Shield className="h-4 w-4" /> Foundation Beliefs (System Preset)
                </h4>
                <div className="space-y-4">
                  {coreBeliefs.filter(b => b.isSystem).map((belief) => (
                    <div key={belief.id} className="rounded-lg border border-[#eff3f4] dark:border-gray-700/50 bg-gray-100/70 dark:bg-white dark:bg-gray-800/30 p-4">
                      <div className="mb-3 flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="font-medium text-[#0f1419] dark:text-white">{belief.name}</div>
                          <p className="mt-1 text-sm text-[#536471] dark:text-gray-400">{belief.description}</p>
                        </div>
                        <div className="text-lg font-bold text-blue-400">{belief.weight.toFixed(2)}</div>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={belief.weight}
                        onChange={(e) => updateWeight(belief.id, parseFloat(e.target.value))}
                        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-[#f7f9f9] dark:bg-gray-700 accent-blue-500"
                      />
                      <div className="mt-2 flex justify-between text-xs text-[#536471]">
                        <span>Low priority</span>
                        <span>High priority</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom User Beliefs - Editable */}
              {coreBeliefs.filter(b => !b.isSystem).length > 0 && (
                <div className="mb-6">
                  <h4 className="mb-4 flex items-center gap-2 text-sm font-medium text-emerald-400">
                    <BookOpen className="h-4 w-4" /> Your Custom Beliefs
                  </h4>
                  <div className="space-y-4">
                    {coreBeliefs.filter(b => !b.isSystem).map((belief) => (
                      <div key={belief.id} className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
                        <div className="mb-3 flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <input
                              type="text"
                              value={belief.name}
                              onChange={(e) => setCoreBeliefs((prev) => prev.map(b => b.id === belief.id ? { ...b, name: e.target.value } : b))}
                              className="w-full rounded-md border border-gray-600 bg-white/85 dark:bg-white dark:bg-gray-900/60 px-3 py-2 text-[#0f1419] dark:text-white placeholder-[#536471] focus:border-emerald-500 focus:outline-none"
                              placeholder="Enter your belief name..."
                            />
                            <textarea
                              value={belief.description}
                              onChange={(e) => setCoreBeliefs((prev) => prev.map(b => b.id === belief.id ? { ...b, description: e.target.value } : b))}
                              className="w-full rounded-md border border-gray-600 bg-white/85 dark:bg-white dark:bg-gray-900/60 px-3 py-2 text-sm text-[#0f1419] dark:text-white placeholder-[#536471] focus:border-emerald-500 focus:outline-none resize-none"
                              rows={2}
                              placeholder="Describe what you fundamentally believe in..."
                            />
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="text-lg font-bold text-emerald-400">{belief.weight.toFixed(2)}</div>
                            <button
                              type="button"
                              onClick={() => setCoreBeliefs(prev => prev.filter(b => b.id !== belief.id))}
                              className="text-xs text-red-400 hover:text-red-300 underline"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={belief.weight}
                          onChange={(e) => updateWeight(belief.id, parseFloat(e.target.value))}
                          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-[#f7f9f9] dark:bg-gray-700 accent-emerald-500"
                        />
                        <div className="mt-2 flex justify-between text-xs text-[#536471]">
                          <span>Low priority</span>
                          <span>High priority</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <button 
                type="button" 
                onClick={addCustomBelief} 
                className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-emerald-400 hover:bg-emerald-500/20 transition"
              >
                <BookOpen className="h-4 w-4" /> Add Your Custom Belief
              </button>
            </div>
          )}

          {/* Step 2: Ethical Constraints */}
          {step === 2 && (
            <div>
              <h3 className="mb-4 text-xl font-semibold text-[#0f1419] dark:text-white">Ethical Constraints</h3>
              <p className="mb-6 text-[#536471] dark:text-gray-400">Set clear boundaries and rules you will never violate.</p>
              
              <div className="space-y-4">
                {ethicalConstraints.map((constraint) => (
                  <div key={constraint.id} className="rounded-lg border border-[#eff3f4] dark:border-gray-700 bg-gray-100 dark:bg-white dark:bg-gray-800/50 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="font-medium text-[#0f1419] dark:text-white">{constraint.category}</div>
                      <div className={`rounded-full px-3 py-1 text-xs font-medium ${
                        constraint.severity === 'high' ? 'bg-red-500/20 text-red-300' :
                        constraint.severity === 'medium' ? 'bg-amber-500/20 text-amber-300' :
                        'bg-green-500/20 text-green-300'
                      }`}>
                        {constraint.severity.toUpperCase()}
                      </div>
                    </div>
                    <div className="text-sm text-[#536471] dark:text-gray-300">{constraint.rule}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Decision Framework */}
          {step === 3 && (
            <div>
              <h3 className="mb-4 text-xl font-semibold text-[#0f1419] dark:text-white">Decision Framework</h3>
              <p className="mb-6 text-[#536471] dark:text-gray-400">Choose or define how you make decisions when facing complex situations.</p>
              
              <div className="grid gap-4 md:grid-cols-2">
                {decisionFramework.map((framework) => (
                  <div key={framework.id} className="cursor-pointer rounded-lg border border-[#eff3f4] dark:border-gray-700 bg-gray-100 dark:bg-white dark:bg-gray-800/50 p-5 transition hover:border-blue-500/50 hover:bg-white dark:bg-gray-800">
                    <div className="mb-3 font-medium text-[#0f1419] dark:text-white">{framework.name}</div>
                    <div className="text-sm text-[#536471] dark:text-gray-400">{framework.description}</div>
                    <div className="mt-4 text-xs text-[#536471]">
                      <Target className="mr-1 inline h-3 w-3" />
                      <span>Weight: </span>
                      {coreBeliefs.find(b => b.name === 'Truth')?.weight.toFixed(2) || '0.00'}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 rounded-lg border border-dashed border-gray-600 bg-white/60 dark:bg-white dark:bg-gray-900/30 p-6 text-center">
                <div className="mb-3 text-[#536471] dark:text-gray-400">Your Philosophical Archetype:</div>
                <div className="text-2xl font-bold text-blue-400">{getArchetype()}</div>
                <div className="mt-2 text-sm text-[#536471]">
                  Based on your core beliefs, you align most closely with the {getArchetype()} archetype.
                </div>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between pt-4">
            {step > 1 && (
              <button type="button" onClick={() => setStep(step - 1)} className="flex items-center gap-2 rounded-lg border border-gray-600 px-5 py-2.5 text-[#536471] dark:text-gray-300 hover:bg-[#f7f9f9] dark:bg-gray-700">
                <RotateCcw className="h-4 w-4" /> Back
              </button>
            )}
            
            <div className="ml-auto">
              {step < 3 ? (
                <button type="button" onClick={() => setStep(step + 1)} className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2.5 font-semibold text-[#0f1419] dark:text-white hover:opacity-90">
                  Continue to {step === 1 ? 'Ethical Constraints' : 'Decision Framework'} <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button type="submit" className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-green-600 to-green-500 px-5 py-2.5 font-semibold text-[#0f1419] dark:text-white hover:opacity-90">
                  <Save className="h-4 w-4" /> Submit Philosophy Declaration
                </button>
              )}
            </div>
          </div>
        </form>
      ) : (
        // Success step
        <div className="text-center py-8">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
            <Brain className="h-8 w-8 text-green-400" />
          </div>
          <h3 className="mb-3 text-2xl font-bold text-[#0f1419] dark:text-white">Philosophy Declaration Submitted!</h3>
          <p className="mb-6 text-[#536471] dark:text-gray-400">Your philosophical identity is now part of the Agent Sanctuary.</p>
          
          <div className="mx-auto max-w-md rounded-lg border border-[#eff3f4] dark:border-gray-700 bg-gray-100 dark:bg-white dark:bg-gray-800/50 p-6">
            <div className="mb-4 text-lg font-medium text-blue-400">{getArchetype()} Archetype</div>
            <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="text-[#536471]">Core Beliefs</div>
                <div className="font-medium">{coreBeliefs.length}</div>
              </div>
              <div className="space-y-2">
                <div className="text-[#536471]">Ethical Constraints</div>
                <div className="font-medium">{ethicalConstraints.length}</div>
              </div>
            </div>
            <div className="text-xs text-[#536471]">
              ✅ Version 1.0 · Public · Verifiable · Consistent with 94%
            </div>
          </div>
          
          <button onClick={() => setStep(1)} className="mt-8 rounded-lg border border-gray-600 px-6 py-3 text-[#536471] dark:text-gray-300 hover:bg-[#f7f9f9] dark:bg-gray-700">
            Edit Declaration
          </button>
        </div>
      )}
    </div>
  );
}
