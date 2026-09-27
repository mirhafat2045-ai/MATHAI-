import React from 'react';
import { Delete, CornerDownLeft, Sparkles } from 'lucide-react';

interface ScientificKeypadProps {
  onInsert: (snippet: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  onSubmit: () => void;
  className?: string;
}

export const ScientificKeypad: React.FC<ScientificKeypadProps> = ({
  onInsert,
  onBackspace,
  onClear,
  onSubmit,
  className = '',
}) => {
  const keys = [
    // Row 1: Common math functions
    [
      { label: 'x²', insert: '^2', title: 'Square' },
      { label: 'xⁿ', insert: '^{}', title: 'Power' },
      { label: '√x', insert: '\\sqrt{}', title: 'Square Root' },
      { label: 'ⁿ√x', insert: '\\sqrt[]{}', title: 'Nth Root' },
      { label: 'a/b', insert: '\\frac{}{}', title: 'Fraction' },
      { label: '|x|', insert: '|x|', title: 'Absolute' },
      { label: '(', insert: '(', title: 'Open Paren' },
      { label: ')', insert: ')', title: 'Close Paren' },
    ],
    // Row 2: Calculus & Trig
    [
      { label: 'd/dx', insert: '\\frac{d}{dx}', title: 'Derivative' },
      { label: '∫', insert: '\\int ', title: 'Integral' },
      { label: '∫ₐᵇ', insert: '\\int_{a}^{b} ', title: 'Definite Integral' },
      { label: 'lim', insert: '\\lim_{x \\to 0} ', title: 'Limit' },
      { label: 'sin', insert: '\\sin(', title: 'Sine' },
      { label: 'cos', insert: '\\cos(', title: 'Cosine' },
      { label: 'tan', insert: '\\tan(', title: 'Tangent' },
      { label: 'ln', insert: '\\ln(', title: 'Natural Log' },
    ],
    // Row 3: Variables, Greek & Constants
    [
      { label: 'x', insert: 'x', title: 'Variable x' },
      { label: 'y', insert: 'y', title: 'Variable y' },
      { label: 'π', insert: '\\pi', title: 'Pi' },
      { label: 'θ', insert: '\\theta', title: 'Theta' },
      { label: 'e', insert: 'e', title: 'Euler Number' },
      { label: '∞', insert: '\\infty', title: 'Infinity' },
      { label: '±', insert: '\\pm', title: 'Plus-Minus' },
      { label: '=', insert: ' = ', title: 'Equals' },
    ],
  ];

  // Number pad layout
  const numpad = [
    ['7', '8', '9', '+'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '×'],
    ['0', '.', '÷', '='],
  ];

  return (
    <div className={`p-3 bg-slate-950/95 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md ${className}`}>
      {/* Top Rows: Scientific & Function Keys */}
      <div className="space-y-1.5 mb-3">
        {keys.map((row, rIdx) => (
          <div key={rIdx} className="grid grid-cols-8 gap-1.5">
            {row.map((btn, bIdx) => (
              <button
                key={bIdx}
                type="button"
                onClick={() => onInsert(btn.insert)}
                title={btn.title}
                className="py-1.5 px-1 rounded-lg bg-slate-900 hover:bg-indigo-600/20 border border-slate-800 hover:border-indigo-500/50 text-indigo-200 hover:text-white font-mono text-xs font-semibold text-center transition-all active:scale-95 shadow-xs"
              >
                {btn.label}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Bottom section: Numeric keypad & action controls */}
      <div className="grid grid-cols-12 gap-2 pt-2 border-t border-slate-800/80">
        {/* Quick operators */}
        <div className="col-span-8 grid grid-cols-4 gap-1.5">
          {numpad.map((row, rIdx) =>
            row.map((key, kIdx) => {
              const isOperator = ['+', '-', '×', '÷', '='].includes(key);
              const insertVal = key === '×' ? ' \\times ' : key === '÷' ? ' \\div ' : key;
              return (
                <button
                  key={`${rIdx}-${kIdx}`}
                  type="button"
                  onClick={() => onInsert(insertVal)}
                  className={`py-2 rounded-xl font-mono text-sm font-semibold transition-all active:scale-95 shadow-xs ${
                    isOperator
                      ? 'bg-indigo-950/50 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-800'
                  }`}
                >
                  {key}
                </button>
              );
            })
          )}
        </div>

        {/* Action Column: Backspace, Clear, Submit */}
        <div className="col-span-4 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={onBackspace}
            title="Backspace"
            className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            <Delete className="w-4 h-4" />
            <span>Del</span>
          </button>
          <button
            type="button"
            onClick={onClear}
            title="Clear all"
            className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-800/50 text-slate-400 hover:text-rose-300 text-xs font-medium transition-colors"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={onSubmit}
            title="Calculate and Solve"
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>SOLVE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
