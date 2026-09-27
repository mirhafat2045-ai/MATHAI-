import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Activity, HelpCircle, Table, Eye, EyeOff } from 'lucide-react';

interface FunctionPlotterProps {
  initialFunction?: string;
  onClose?: () => void;
  compact?: boolean;
}

export const FunctionPlotter: React.FC<FunctionPlotterProps> = ({
  initialFunction = 'x^2 - 4',
  onClose,
  compact = false,
}) => {
  const [expr1, setExpr1] = useState(initialFunction);
  const [expr2, setExpr2] = useState('');
  const [showExpr2, setShowExpr2] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [xMin, setXMin] = useState(-8);
  const [xMax, setXMax] = useState(8);
  const [hoverCoord, setHoverCoord] = useState<{ x: number; y: number } | null>(null);
  const [plotError, setPlotError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Parse and evaluate expression string f(x)
  const evaluateMathExpr = useCallback((rawExpr: string, x: number): number => {
    if (!rawExpr.trim()) return NaN;
    try {
      let formatted = rawExpr
        .toLowerCase()
        .replace(/\s+/g, '')
        .replace(/(\d)([a-z\(])/g, '$1*$2')
        .replace(/([a-z\)])(\d)/g, '$1*$2')
        .replace(/\^/g, '**')
        .replace(/sin/g, 'Math.sin')
        .replace(/cos/g, 'Math.cos')
        .replace(/tan/g, 'Math.tan')
        .replace(/asin/g, 'Math.asin')
        .replace(/acos/g, 'Math.acos')
        .replace(/atan/g, 'Math.atan')
        .replace(/exp/g, 'Math.exp')
        .replace(/ln/g, 'Math.log')
        .replace(/log/g, 'Math.log10')
        .replace(/sqrt/g, 'Math.sqrt')
        .replace(/abs/g, 'Math.abs')
        .replace(/pi/g, 'Math.PI')
        .replace(/\be\b/g, 'Math.E');

      // eslint-disable-next-line no-new-func
      const fn = new Function('x', 'Math', `"use strict"; return (${formatted});`);
      const res = fn(x, Math);
      if (typeof res !== 'number' || isNaN(res) || !isFinite(res)) {
        return NaN;
      }
      return res;
    } catch {
      return NaN;
    }
  }, []);

  // Draw plot on canvas
  const drawPlot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    const yRange = (xMax - xMin) * (height / width);
    const yMin = -yRange / 2;
    const yMax = yRange / 2;

    const toCanvasX = (x: number) => ((x - xMin) / (xMax - xMin)) * width;
    const toCanvasY = (y: number) => height - ((y - yMin) / (yMax - yMin)) * height;
    const toMathX = (cx: number) => xMin + (cx / width) * (xMax - xMin);

    // Clear background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    // Subtle grid lines
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';

    const span = xMax - xMin;
    let step = 1;
    if (span > 30) step = 5;
    else if (span > 15) step = 2;
    else if (span < 5) step = 0.5;
    else if (span < 2) step = 0.2;

    const startX = Math.floor(xMin / step) * step;
    for (let x = startX; x <= xMax; x += step) {
      const cx = toCanvasX(x);
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, height);
      ctx.stroke();

      if (Math.abs(x) > 0.001) {
        ctx.fillStyle = 'rgba(148, 163, 184, 0.45)';
        ctx.font = '10px monospace';
        ctx.fillText(x.toFixed(step < 1 ? 1 : 0), cx + 2, toCanvasY(0) + 12);
      }
    }

    const startY = Math.floor(yMin / step) * step;
    for (let y = startY; y <= yMax; y += step) {
      const cy = toCanvasY(y);
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(width, cy);
      ctx.stroke();

      if (Math.abs(y) > 0.001) {
        ctx.fillStyle = 'rgba(148, 163, 184, 0.45)';
        ctx.font = '10px monospace';
        ctx.fillText(y.toFixed(step < 1 ? 1 : 0), toCanvasX(0) + 4, cy - 2);
      }
    }

    // Axes
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.6)';

    // X Axis
    const originY = toCanvasY(0);
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(width, originY);
    ctx.stroke();

    // Y Axis
    const originX = toCanvasX(0);
    ctx.beginPath();
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, height);
    ctx.stroke();

    // Function 1 (Primary - Sky Blue)
    const drawCurve = (expression: string, strokeColor: string) => {
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = strokeColor;
      ctx.beginPath();

      let started = false;
      const numPoints = width * 2;

      for (let i = 0; i <= numPoints; i++) {
        const cx = (i / numPoints) * width;
        const x = toMathX(cx);
        const y = evaluateMathExpr(expression, x);

        if (isNaN(y) || Math.abs(y) > 1e6) {
          started = false;
          continue;
        }

        const cy = toCanvasY(y);
        if (cy < -100 || cy > height + 100) {
          started = false;
          continue;
        }

        if (!started) {
          ctx.moveTo(cx, cy);
          started = true;
        } else {
          ctx.lineTo(cx, cy);
        }
      }
      ctx.stroke();
    };

    drawCurve(expr1, '#38bdf8'); // f1: sky blue

    if (showExpr2 && expr2.trim()) {
      drawCurve(expr2, '#34d399'); // f2: emerald green
    }

    // Hover Coordinate Indicator
    if (hoverCoord) {
      const cx = toCanvasX(hoverCoord.x);
      const cy = toCanvasY(hoverCoord.y);

      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, height);
      ctx.moveTo(0, cy);
      ctx.lineTo(width, cy);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#6366f1';
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }, [xMin, xMax, expr1, expr2, showExpr2, evaluateMathExpr, hoverCoord]);

  useEffect(() => {
    drawPlot();
  }, [drawPlot]);

  const zoom = (factor: number) => {
    const center = (xMin + xMax) / 2;
    const halfSpan = ((xMax - xMin) / 2) * factor;
    if (halfSpan < 0.2 || halfSpan > 500) return;
    setXMin(center - halfSpan);
    setXMax(center + halfSpan);
  };

  const resetView = () => {
    setXMin(-8);
    setXMax(8);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const width = canvas.width;
    const xVal = xMin + (mouseX / width) * (xMax - xMin);
    const yVal = evaluateMathExpr(expr1, xVal);

    if (!isNaN(yVal)) {
      setHoverCoord({ x: xVal, y: yVal });
    } else {
      setHoverCoord(null);
    }
  };

  const presets = [
    { name: 'Quadratic Roots', expr1: 'x^2 - 4', expr2: '' },
    { name: 'Curve Intersection', expr1: 'x^2', expr2: '2*x + 3' },
    { name: 'Sine & Cosine', expr1: 'sin(x)', expr2: 'cos(x)' },
    { name: 'Cubic Extrema', expr1: 'x^3 - 3*x', expr2: '' },
    { name: 'Gaussian Bell', expr1: 'exp(-x^2)', expr2: '' },
    { name: 'Damped Wave', expr1: 'exp(-0.2*x)*sin(3*x)', expr2: '' },
  ];

  // Table of Values computation (-5 to 5)
  const tableData = [-4, -3, -2, -1, 0, 1, 2, 3, 4].map((x) => ({
    x,
    y1: evaluateMathExpr(expr1, x),
    y2: showExpr2 && expr2.trim() ? evaluateMathExpr(expr2, x) : null,
  }));

  return (
    <div className={`rounded-2xl border border-indigo-500/25 bg-slate-900/95 shadow-2xl overflow-hidden backdrop-blur-md ${compact ? 'p-3' : 'p-4'}`}>
      {/* Header controls */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
            <Activity className="w-4 h-4" />
          </div>
          <span className="font-bold text-slate-100 text-sm">Desmos-Grade 2D Function Plotter</span>
          {hoverCoord && (
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-sky-300 border border-slate-700 ml-2">
              x: {hoverCoord.x.toFixed(2)}, y: {hoverCoord.y.toFixed(2)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowTable(!showTable)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 border transition-colors ${
              showTable
                ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/40'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-700'
            }`}
            title="Table of Values"
          >
            <Table className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Values</span>
          </button>
          <button
            onClick={() => zoom(0.7)}
            title="Zoom In"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => zoom(1.4)}
            title="Zoom Out"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={resetView}
            title="Reset View"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded bg-slate-800 ml-1"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Function Inputs (Dual curves support) */}
      <div className="space-y-2 mb-3">
        {/* Function 1 */}
        <div className="flex items-center bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-1.5 focus-within:border-sky-500 transition-colors">
          <span className="w-3 h-3 rounded-full bg-sky-400 mr-2 flex-shrink-0" />
          <span className="font-mono text-xs sm:text-sm font-semibold text-sky-400 mr-2">f₁(x) =</span>
          <input
            type="text"
            value={expr1}
            onChange={(e) => setExpr1(e.target.value)}
            placeholder="e.g. x^2 - 4 or sin(x)"
            className="w-full bg-transparent text-slate-100 font-mono text-xs sm:text-sm focus:outline-none"
          />
          <button
            onClick={() => setShowExpr2(!showExpr2)}
            className="text-xs text-slate-400 hover:text-emerald-300 ml-2 whitespace-nowrap"
          >
            {showExpr2 ? '- Compare' : '+ Compare f₂(x)'}
          </button>
        </div>

        {/* Function 2 (Optional for comparison / intersections) */}
        {showExpr2 && (
          <div className="flex items-center bg-slate-950 border border-emerald-500/40 rounded-xl px-3 py-1.5 focus-within:border-emerald-400 transition-colors animate-in fade-in">
            <span className="w-3 h-3 rounded-full bg-emerald-400 mr-2 flex-shrink-0" />
            <span className="font-mono text-xs sm:text-sm font-semibold text-emerald-400 mr-2">f₂(x) =</span>
            <input
              type="text"
              value={expr2}
              onChange={(e) => setExpr2(e.target.value)}
              placeholder="e.g. 2*x + 3 (for intersections)"
              className="w-full bg-transparent text-slate-100 font-mono text-xs sm:text-sm focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Presets */}
      <div className="flex items-center gap-1.5 mb-3 overflow-x-auto no-scrollbar">
        <span className="text-[11px] text-slate-400 mr-1 flex items-center gap-1 whitespace-nowrap">
          <HelpCircle className="w-3 h-3" /> Presets:
        </span>
        {presets.map((p) => (
          <button
            key={p.name}
            onClick={() => {
              setExpr1(p.expr1);
              if (p.expr2) {
                setExpr2(p.expr2);
                setShowExpr2(true);
              } else {
                setShowExpr2(false);
              }
            }}
            className={`text-xs px-2.5 py-1 rounded-full transition-colors whitespace-nowrap ${
              expr1 === p.expr1
                ? 'bg-indigo-600 text-white font-medium shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Canvas */}
      <div className="relative rounded-xl overflow-hidden border border-slate-800 shadow-inner">
        <canvas
          ref={canvasRef}
          width={compact ? 480 : 720}
          height={compact ? 240 : 340}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverCoord(null)}
          className="w-full h-auto cursor-crosshair block"
        />
      </div>

      {/* Table of Values view */}
      {showTable && (
        <div className="mt-3 p-3 bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto animate-in fade-in">
          <span className="text-xs font-semibold text-slate-300 mb-2 block">Table of Function Values</span>
          <table className="w-full text-xs font-mono text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-1 px-2">x</th>
                <th className="py-1 px-2 text-sky-400">f₁(x)</th>
                {showExpr2 && <th className="py-1 px-2 text-emerald-400">f₂(x)</th>}
              </tr>
            </thead>
            <tbody>
              {tableData.map((row) => (
                <tr key={row.x} className="border-b border-slate-900/60 hover:bg-slate-900/40">
                  <td className="py-1 px-2 text-slate-300 font-semibold">{row.x}</td>
                  <td className="py-1 px-2 text-sky-300">{isNaN(row.y1) ? 'Undefined' : row.y1.toFixed(3)}</td>
                  {showExpr2 && (
                    <td className="py-1 px-2 text-emerald-300">
                      {row.y2 === null ? '-' : isNaN(row.y2) ? 'Undefined' : row.y2.toFixed(3)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
