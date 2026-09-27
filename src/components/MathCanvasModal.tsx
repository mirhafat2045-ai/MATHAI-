import React, { useRef, useState, useEffect } from 'react';
import { X, Eraser, PenTool, Trash2, Undo2, Send, Check } from 'lucide-react';

interface MathCanvasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitDrawing: (base64Image: string, promptText?: string) => void;
}

export const MathCanvasModal: React.FC<MathCanvasModalProps> = ({
  isOpen,
  onClose,
  onSubmitDrawing,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#ffffff');
  const [brushSize, setBrushSize] = useState(3);
  const [isEraser, setIsEraser] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [optionalPrompt, setOptionalPrompt] = useState('');

  // Colors available for drawing
  const colors = [
    { label: 'White', hex: '#ffffff' },
    { label: 'Cyan', hex: '#38bdf8' },
    { label: 'Emerald', hex: '#34d399' },
    { label: 'Amber', hex: '#fbbf24' },
    { label: 'Indigo', hex: '#818cf8' },
    { label: 'Rose', hex: '#fb7185' },
  ];

  // Initialize canvas with grid
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high-res canvas dimensions
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    // Initial background
    drawCanvasBackground(ctx, rect.width, rect.height);
    saveState();
  }, [isOpen]);

  const drawCanvasBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = '#0f172a'; // slate-900
    ctx.fillRect(0, 0, width, height);

    // Subtle graph grid lines
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.08)';
    ctx.lineWidth = 1;
    const gridSize = 20;

    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev.slice(-15), data]);
  };

  const handleUndo = () => {
    if (history.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newHistory = [...history];
    newHistory.pop(); // Remove current
    const previous = newHistory[newHistory.length - 1];
    if (previous) {
      ctx.putImageData(previous, 0, 0);
      setHistory(newHistory);
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    drawCanvasBackground(ctx, rect.width, rect.height);
    saveState();
  };

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const { x, y } = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = isEraser ? brushSize * 4 : brushSize;
    ctx.strokeStyle = isEraser ? '#0f172a' : color;
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    saveState();
  };

  const handleSend = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSubmitDrawing(dataUrl, optionalPrompt.trim() || 'Transcribe and solve this handwritten mathematical problem step-by-step.');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-indigo-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400">
              <PenTool className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm md:text-base">Math Handwriting & Geometry Canvas</h3>
              <p className="text-xs text-slate-400">Handwrite equations, fractions, integrals, or draw geometric figures</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-900/90 border-b border-slate-800">
          {/* Tools & Colors */}
          <div className="flex items-center gap-3">
            {/* Pen / Eraser toggle */}
            <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700">
              <button
                onClick={() => setIsEraser(false)}
                className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-colors ${
                  !isEraser ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Pen"
              >
                <PenTool className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsEraser(true)}
                className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-colors ${
                  isEraser ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Eraser"
              >
                <Eraser className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Color palette */}
            {!isEraser && (
              <div className="flex items-center gap-1.5">
                {colors.map((c) => (
                  <button
                    key={c.hex}
                    onClick={() => setColor(c.hex)}
                    title={c.label}
                    className={`w-6 h-6 rounded-full transition-transform ${
                      color === c.hex ? 'scale-110 ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-900' : 'hover:scale-105 opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            )}

            {/* Brush Size */}
            <div className="flex items-center gap-2 ml-2">
              <span className="text-xs text-slate-400">Size:</span>
              <input
                type="range"
                min="1"
                max="10"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-20 accent-indigo-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleUndo}
              disabled={history.length <= 1}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 hover:text-white transition-colors"
              title="Undo last stroke"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleClear}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 transition-colors"
              title="Clear canvas"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Canvas area */}
        <div className="relative flex-1 bg-slate-950 p-2 min-h-[300px] max-h-[420px]">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full h-full rounded-xl cursor-crosshair touch-none border border-slate-800/80 shadow-inner"
            style={{ width: '100%', height: '360px' }}
          />
        </div>

        {/* Footer with prompt input & solve button */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            value={optionalPrompt}
            onChange={(e) => setOptionalPrompt(e.target.value)}
            placeholder="Optional instruction: e.g. 'Solve for x', 'Find the derivative', 'Calculate area'"
            className="w-full sm:flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs md:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={handleSend}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-xs md:text-sm shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Send className="w-4 h-4" />
            <span>Transcribe & Solve with AI</span>
          </button>
        </div>
      </div>
    </div>
  );
};
