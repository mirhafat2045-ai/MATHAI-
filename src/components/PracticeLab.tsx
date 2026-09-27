import React, { useState } from 'react';
import { Sparkles, Brain, CheckCircle2, AlertCircle, HelpCircle, ArrowRight, RefreshCw, Send, Eye } from 'lucide-react';
import { MathRenderer } from './MathRenderer';
import { PracticeProblem } from '../types';

interface PracticeLabProps {
  onSendToChat: (problemText: string) => void;
}

export const PracticeLab: React.FC<PracticeLabProps> = ({ onSendToChat }) => {
  const [topic, setTopic] = useState('Calculus (Integration)');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [loading, setLoading] = useState(false);
  const [problem, setProblem] = useState<PracticeProblem | null>(null);
  
  // Interactive Step Checker
  const [userStep, setUserStep] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [stepFeedback, setStepFeedback] = useState<{
    isCorrect: boolean;
    status: string;
    feedback: string;
    nextHint?: string;
  } | null>(null);
  const [revealedHints, setRevealedHints] = useState<number>(0);
  const [showFullSolution, setShowFullSolution] = useState(false);

  const topics = [
    'Calculus (Integration)',
    'Calculus (Derivatives & Rates)',
    'Algebra (Quadratic & Systems)',
    'Linear Algebra (Matrices & Vectors)',
    'Trigonometry & Polar Coordinates',
    'Differential Equations',
    'Probability & Combinatorics',
    'Discrete Math & Proofs',
  ];

  const difficulties = ['Beginner', 'Intermediate', 'Advanced', 'Olympiad'];

  const generateProblem = async () => {
    setLoading(true);
    setProblem(null);
    setStepFeedback(null);
    setUserStep('');
    setRevealedHints(0);
    setShowFullSolution(false);

    try {
      const res = await fetch('/api/gemini/practice-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, difficulty }),
      });
      if (!res.ok) throw new Error('Failed to generate problem');
      const data = await res.json();
      setProblem(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluateStep = async () => {
    if (!problem || !userStep.trim()) return;
    setEvaluating(true);
    setStepFeedback(null);

    try {
      const res = await fetch('/api/gemini/evaluate-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemStatement: problem.problemStatement,
          userStep: userStep.trim(),
        }),
      });
      if (!res.ok) throw new Error('Evaluation failed');
      const data = await res.json();
      setStepFeedback(data);
    } catch (err) {
      console.error(err);
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Control header */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Brain className="w-5 h-5 text-indigo-400" />
              <span>Interactive Math Practice & Step Checker</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Practice authentic problems, input your intermediate algebraic steps, and receive Socratic AI guidance.
            </p>
          </div>

          <button
            onClick={generateProblem}
            disabled={loading}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{problem ? 'New Problem' : 'Generate Challenge'}</span>
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-800">
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Select Field / Topic</label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {topics.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Difficulty Level</label>
            <div className="grid grid-cols-4 gap-1.5">
              {difficulties.map((diff) => (
                <button
                  key={diff}
                  onClick={() => setDifficulty(diff)}
                  className={`py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    difficulty === diff
                      ? 'bg-indigo-600 text-white font-semibold shadow'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Problem Display */}
      {loading && (
        <div className="p-12 text-center rounded-2xl bg-slate-900/50 border border-slate-800">
          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-300 font-medium">Synthesizing authentic mathematical problem...</p>
          <p className="text-xs text-slate-500 mt-1">Generating rigorous problem statement and verified step solutions</p>
        </div>
      )}

      {problem && !loading && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-indigo-500/30 shadow-2xl space-y-5 animate-in fade-in duration-300">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {problem.topic}
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
                {problem.difficulty}
              </span>
            </div>
            <button
              onClick={() => onSendToChat(problem.problemStatement)}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
            >
              <span>Solve in full Chatbot</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Problem Statement */}
          <div>
            <h3 className="text-base font-bold text-slate-100 mb-2">{problem.title}</h3>
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
              <MathRenderer content={problem.problemStatement} />
            </div>
          </div>

          {/* Step Input & Interactive Checker */}
          <div className="space-y-3 pt-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Your Next Step or Proposed Answer:</span>
              <span className="text-[11px] text-slate-400">LaTeX syntax supported: e.g. $\frac{1}{2}x^2 + C$</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={userStep}
                onChange={(e) => setUserStep(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEvaluateStep()}
                placeholder="e.g. Let u = x^2, du = 2x dx... or final answer"
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleEvaluateStep}
                disabled={evaluating || !userStep.trim()}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 transition-colors"
              >
                {evaluating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>Check Step</span>
              </button>
            </div>

            {/* AI Feedback on step */}
            {stepFeedback && (
              <div
                className={`p-3.5 rounded-xl border flex items-start gap-3 animate-in fade-in duration-200 ${
                  stepFeedback.isCorrect
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                    : stepFeedback.status === 'minor_slip'
                    ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                }`}
              >
                {stepFeedback.isCorrect ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 text-xs md:text-sm">
                  <div className="font-semibold mb-1">
                    {stepFeedback.isCorrect
                      ? 'Mathematically Sound Step!'
                      : stepFeedback.status === 'minor_slip'
                      ? 'Close! Algebraic Adjustment Needed'
                      : 'Step Needs Correction'}
                  </div>
                  <MathRenderer content={stepFeedback.feedback} />
                  {stepFeedback.nextHint && (
                    <div className="mt-2 pt-2 border-t border-slate-700/50 text-indigo-300">
                      <strong>Guiding Hint:</strong> {stepFeedback.nextHint}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Progressive Hints */}
          {problem.hints && problem.hints.length > 0 && (
            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Stuck? Need a Hint?</span>
                </span>
                {revealedHints < problem.hints.length && (
                  <button
                    onClick={() => setRevealedHints((prev) => prev + 1)}
                    className="text-xs text-amber-400 hover:text-amber-300 font-medium"
                  >
                    Reveal Hint {revealedHints + 1} of {problem.hints.length}
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {problem.hints.slice(0, revealedHints).map((hint, hIdx) => (
                  <div
                    key={hIdx}
                    className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/30 text-amber-200 text-xs animate-in fade-in"
                  >
                    <span className="font-bold mr-2 text-amber-400">Hint {hIdx + 1}:</span>
                    <MathRenderer content={hint} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reveal Full Solution Accordion */}
          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={() => setShowFullSolution(!showFullSolution)}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Eye className="w-4 h-4 text-indigo-400" />
              <span>{showFullSolution ? 'Hide Full Solution' : 'Reveal Complete Step-by-Step Solution & Boxed Answer'}</span>
            </button>

            {showFullSolution && (
              <div className="mt-3 p-4 rounded-xl bg-slate-950 border border-indigo-500/20 space-y-3 animate-in fade-in duration-300">
                <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30">
                  <span className="text-xs text-indigo-300 font-semibold uppercase tracking-wider block mb-1">
                    Verified Final Answer:
                  </span>
                  <MathRenderer content={problem.finalAnswer} />
                </div>
                <div className="text-xs text-slate-300">
                  <span className="font-semibold text-slate-100 block mb-1">Full Derivation:</span>
                  <MathRenderer content={problem.fullSolution} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
