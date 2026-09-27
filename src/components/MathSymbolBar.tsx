import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles, BookOpen, Sigma, Compass, Layers } from 'lucide-react';

interface MathSymbolBarProps {
  onInsert: (snippet: string) => void;
}

interface SymbolItem {
  label: string;
  latex: string;
  display?: string;
  category?: string;
}

export const MathSymbolBar: React.FC<MathSymbolBarProps> = ({ onInsert }) => {
  const [activeTab, setActiveTab] = useState<'basics' | 'calculus' | 'greek' | 'algebra' | 'symbols'>('basics');
  const [isExpanded, setIsExpanded] = useState(true);

  const categories = [
    { id: 'basics', name: 'Basic & Powers', icon: Sparkles },
    { id: 'calculus', name: 'Calculus & Limits', icon: Sigma },
    { id: 'algebra', name: 'Algebra & Matrices', icon: Layers },
    { id: 'greek', name: 'Greek & Constants', icon: BookOpen },
    { id: 'symbols', name: 'Relations & Sets', icon: Compass },
  ];

  const symbols: Record<string, SymbolItem[]> = {
    basics: [
      { label: 'Fraction', latex: '\\frac{a}{b}', display: 'a/b' },
      { label: 'Square Root', latex: '\\sqrt{x}', display: '√x' },
      { label: 'Nth Root', latex: '\\sqrt[n]{x}', display: 'ⁿ√x' },
      { label: 'Squared', latex: 'x^2', display: 'x²' },
      { label: 'Power', latex: 'x^{n}', display: 'xⁿ' },
      { label: 'Subscript', latex: 'x_{i}', display: 'xᵢ' },
      { label: 'Absolute', latex: '|x|', display: '|x|' },
      { label: 'Plus-Minus', latex: '\\pm', display: '±' },
      { label: 'Multiplication', latex: '\\times', display: '×' },
      { label: 'Division', latex: '\\div', display: '÷' },
      { label: 'Infinity', latex: '\\infty', display: '∞' },
      { label: 'Natural Log', latex: '\\ln(x)', display: 'ln(x)' },
      { label: 'Exponential', latex: 'e^{x}', display: 'eˣ' },
    ],
    calculus: [
      { label: 'Derivative', latex: '\\frac{d}{dx}', display: 'd/dx' },
      { label: 'Partial Deriv', latex: '\\frac{\\partial y}{\\partial x}', display: '∂/∂x' },
      { label: 'Indefinite Integral', latex: '\\int f(x) dx', display: '∫ dx' },
      { label: 'Definite Integral', latex: '\\int_{a}^{b} f(x) dx', display: '∫ₐᵇ dx' },
      { label: 'Double Integral', latex: '\\iint_{D} f(x,y) dA', display: '∬' },
      { label: 'Limit', latex: '\\lim_{x \\to 0}', display: 'lim x→0' },
      { label: 'Summation', latex: '\\sum_{i=1}^{n}', display: '∑ i=1..n' },
      { label: 'Product', latex: '\\prod_{i=1}^{n}', display: '∏ i=1..n' },
      { label: 'Differential', latex: 'dx', display: 'dx' },
      { label: 'Prime', latex: "f'(x)", display: "f'(x)" },
    ],
    algebra: [
      { label: '2x2 Matrix', latex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}', display: '[2x2]' },
      { label: 'Vector', latex: '\\vec{v} = \\begin{pmatrix} x \\\\ y \\end{pmatrix}', display: 'v⃗' },
      { label: 'Determinant', latex: '\\det(A)', display: 'det(A)' },
      { label: 'Quadratic Formula', latex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}', display: 'Quadratic' },
      { label: 'Log Base', latex: '\\log_{b}(x)', display: 'log_b(x)' },
      { label: 'Dot Product', latex: '\\vec{u} \\cdot \\vec{v}', display: 'u·v' },
      { label: 'Cross Product', latex: '\\vec{u} \\times \\vec{v}', display: 'u×v' },
      { label: 'Norm / Length', latex: '\\|\\vec{v}\\|', display: '||v||' },
    ],
    greek: [
      { label: 'Pi', latex: '\\pi', display: 'π' },
      { label: 'Theta', latex: '\\theta', display: 'θ' },
      { label: 'Alpha', latex: '\\alpha', display: 'α' },
      { label: 'Beta', latex: '\\beta', display: 'β' },
      { label: 'Gamma', latex: '\\gamma', display: 'γ' },
      { label: 'Delta', latex: '\\Delta', display: 'Δ' },
      { label: 'Lambda', latex: '\\lambda', display: 'λ' },
      { label: 'Sigma', latex: '\\sigma', display: 'σ' },
      { label: 'Omega', latex: '\\omega', display: 'ω' },
      { label: 'Epsilon', latex: '\\epsilon', display: 'ε' },
      { label: 'Mu', latex: '\\mu', display: 'μ' },
      { label: 'Degree', latex: '^\\circ', display: '°' },
    ],
    symbols: [
      { label: 'Less/Equal', latex: '\\le', display: '≤' },
      { label: 'Greater/Equal', latex: '\\ge', display: '≥' },
      { label: 'Not Equal', latex: '\\neq', display: '≠' },
      { label: 'Approx', latex: '\\approx', display: '≈' },
      { label: 'Proportional', latex: '\\propto', display: '∝' },
      { label: 'Element Of', latex: '\\in', display: '∈' },
      { label: 'Subset', latex: '\\subset', display: '⊂' },
      { label: 'Union', latex: '\\cup', display: '∪' },
      { label: 'Intersection', latex: '\\cap', display: '∩' },
      { label: 'For All', latex: '\\forall', display: '∀' },
      { label: 'Exists', latex: '\\exists', display: '∃' },
      { label: 'Implies', latex: '\\implies', display: '⟹' },
      { label: 'If and only if', latex: '\\iff', display: '⟺' },
    ],
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg backdrop-blur-md transition-all">
      {/* Header bar with toggle */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/80 bg-slate-950/60">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveTab(cat.id as any);
                  if (!isExpanded) setIsExpanded(true);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors ml-2"
          title={isExpanded ? 'Collapse palette' : 'Expand palette'}
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Symbol items grid */}
      {isExpanded && (
        <div className="p-2.5 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-1.5 max-h-36 overflow-y-auto">
          {symbols[activeTab]?.map((sym, idx) => (
            <button
              key={`${activeTab}-${idx}`}
              onClick={() => onInsert(`$${sym.latex}$`)}
              title={`${sym.label} (${sym.latex})`}
              className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-800/60 hover:bg-indigo-600/20 border border-slate-700/50 hover:border-indigo-500/50 text-slate-200 transition-all duration-150 active:scale-95 group"
            >
              <span className="font-mono text-xs md:text-sm font-semibold text-indigo-300 group-hover:text-indigo-200">
                {sym.display || sym.latex}
              </span>
              <span className="text-[10px] text-slate-400 truncate w-full text-center mt-0.5 opacity-80 group-hover:opacity-100">
                {sym.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
