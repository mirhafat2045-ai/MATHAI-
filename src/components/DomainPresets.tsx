import React from 'react';
import {
  Compass,
  PieChart,
  FunctionSquare,
  Network,
  Binary,
  Cpu,
  Layers,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface DomainPresetProps {
  onSelectPreset: (prompt: string, title?: string) => void;
}

export const DomainPresets: React.FC<DomainPresetProps> = ({ onSelectPreset }) => {
  const domains = [
    {
      id: 'algebra',
      name: 'Algebra & Equations',
      icon: FunctionSquare,
      color: 'from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/30',
      problems: [
        {
          title: 'Quadratic System',
          prompt: 'Solve the system of equations:\n1) $x^2 + y^2 = 25$\n2) $x - y = 1$\nFind all real and complex solutions with step-by-step substitution.',
        },
        {
          title: 'Polynomial Roots & Factoring',
          prompt: 'Find all roots of the polynomial $P(x) = 2x^3 - 3x^2 - 11x + 6$ using the rational root theorem and polynomial long division.',
        },
        {
          title: 'Logarithmic Equation',
          prompt: 'Solve for $x$: $\\log_2(x + 3) + \\log_2(x - 1) = 5$. Check for extraneous solutions.',
        },
      ],
    },
    {
      id: 'calculus',
      name: 'Calculus & Analysis',
      icon: Compass,
      color: 'from-indigo-500/20 to-purple-500/20 text-indigo-400 border-indigo-500/30',
      problems: [
        {
          title: 'Integration by Parts',
          prompt: 'Evaluate the indefinite integral with full derivation:\n$$\\int x^2 e^{3x} dx$$',
        },
        {
          title: 'Optimization & Maxima',
          prompt: 'A rectangular box with an open top has a square base and a volume of $32\\text{ cm}^3$. Find the dimensions that minimize the surface area.',
        },
        {
          title: 'L\'Hôpital\'s Limit',
          prompt: 'Evaluate the indeterminate limit:\n$$\\lim_{x \\to 0} \\frac{\\sin(x) - x}{x^3}$$',
        },
      ],
    },
    {
      id: 'linear_algebra',
      name: 'Linear Algebra',
      icon: Layers,
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
      problems: [
        {
          title: 'Eigenvalues & Eigenvectors',
          prompt: 'Find the eigenvalues and corresponding normalized eigenvectors of the matrix:\n$$A = \\begin{pmatrix} 4 & 1 \\\\ 2 & 3 \\end{pmatrix}$$',
        },
        {
          title: 'Matrix Inversion (Gauss-Jordan)',
          prompt: 'Compute the inverse of $M = \\begin{pmatrix} 1 & 2 & 3 \\\\ 0 & 1 & 4 \\\\ 5 & 6 & 0 \\end{pmatrix}$ using augmented row reduction.',
        },
      ],
    },
    {
      id: 'diff_eq',
      name: 'Differential Equations',
      icon: Network,
      color: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30',
      problems: [
        {
          title: 'First-Order Linear ODE',
          prompt: 'Solve the initial value problem:\n$$\\frac{dy}{dx} + 2y = 4e^{-2x}, \\quad y(0) = 3$$\nusing the integrating factor method.',
        },
        {
          title: 'Second-Order Damped Oscillator',
          prompt: 'Find the general solution to the homogeneous equation:\n$$y\'\'(t) + 4y\'(t) + 13y(t) = 0$$\nExplain the damping behavior.',
        },
      ],
    },
    {
      id: 'statistics',
      name: 'Probability & Stats',
      icon: PieChart,
      color: 'from-rose-500/20 to-pink-500/20 text-rose-400 border-rose-500/30',
      problems: [
        {
          title: 'Bayes\' Theorem Diagnostic',
          prompt: 'A medical test has 99% sensitivity and 95% specificity. A disease has a prevalence of 0.5% in the population. If a patient tests positive, what is the probability they actually have the disease?',
        },
        {
          title: 'Binomial Distribution & Normal Approx',
          prompt: 'A fair coin is tossed 100 times. Calculate the probability of getting between 45 and 55 heads using both the exact binomial formula and the normal approximation with continuity correction.',
        },
      ],
    },
    {
      id: 'discrete',
      name: 'Discrete Math & Proofs',
      icon: Binary,
      color: 'from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/30',
      problems: [
        {
          title: 'Mathematical Induction Proof',
          prompt: 'Prove by induction for all integers $n \\ge 1$:\n$$\\sum_{i=1}^{n} i^2 = \\frac{n(n+1)(2n+1)}{6}$$',
        },
        {
          title: 'Modular Arithmetic & Fermat',
          prompt: 'Find the remainder when $3^{1000}$ is divided by $13$ using Fermat\'s Little Theorem.',
        },
      ],
    },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-indigo-400" />
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Explore Mathematical Disciplines & Exemplars
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {domains.map((domain) => {
          const Icon = domain.icon;
          return (
            <div
              key={domain.id}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <div className={`p-1.5 rounded-lg bg-gradient-to-br border ${domain.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-200">{domain.name}</h4>
                </div>

                <div className="space-y-1.5">
                  {domain.problems.map((prob, pIdx) => (
                    <button
                      key={pIdx}
                      onClick={() => onSelectPreset(prob.prompt, prob.title)}
                      className="w-full text-left p-2 rounded-lg bg-slate-950/60 hover:bg-indigo-600/20 border border-slate-800/80 hover:border-indigo-500/40 transition-colors group flex items-center justify-between"
                    >
                      <span className="text-xs text-slate-300 group-hover:text-indigo-200 font-medium truncate">
                        {prob.title}
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-indigo-400 transition-transform group-hover:translate-x-0.5 flex-shrink-0 ml-1.5" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
