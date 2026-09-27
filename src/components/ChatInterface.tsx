import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Send,
  Image as ImageIcon,
  Camera,
  PenTool,
  Activity,
  Calculator,
  Sparkles,
  Bot,
  User,
  Volume2,
  VolumeX,
  RefreshCw,
  X,
  FileQuestion,
  HelpCircle,
  Share2,
  Check,
  Compass,
} from 'lucide-react';
import { ChatMessage, SolverMode } from '../types';
import { MathRenderer } from './MathRenderer';
import { MathSymbolBar } from './MathSymbolBar';
import { FunctionPlotter } from './FunctionPlotter';
import { MathCanvasModal } from './MathCanvasModal';
import { CameraScannerModal } from './CameraScannerModal';
import { ScientificKeypad } from './ScientificKeypad';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, mode: SolverMode, imageBase64?: string) => Promise<void>;
  isGenerating: boolean;
  onSelectPreset: (prompt: string) => void;
  activeMode: SolverMode;
  setActiveMode: (mode: SolverMode) => void;
  onNewProblem: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isGenerating,
  onSelectPreset,
  activeMode,
  setActiveMode,
  onNewProblem,
}) => {
  const [inputText, setInputText] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [showCanvas, setShowCanvas] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showPlotter, setShowPlotter] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);
  const [activePlotFunction, setActivePlotFunction] = useState<string>('x^2 - 4');
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [showSymbolBar, setShowSymbolBar] = useState(true);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  // Insert math symbol at cursor position
  const handleInsertSymbol = (snippet: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setInputText((prev) => prev + snippet);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = textarea.value;
    const updated = current.substring(0, start) + snippet + current.substring(end);
    setInputText(updated);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + snippet.length, start + snippet.length);
    }, 0);
  };

  const handleBackspace = () => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setInputText((prev) => prev.slice(0, -1));
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = textarea.value;

    if (start === end && start > 0) {
      const updated = current.substring(0, start - 1) + current.substring(end);
      setInputText(updated);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start - 1, start - 1);
      }, 0);
    } else if (start !== end) {
      const updated = current.substring(0, start) + current.substring(end);
      setInputText(updated);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start, start);
      }, 0);
    }
  };

  // Quick instant calculation check for arithmetic
  const instantCalcResult = useMemo(() => {
    const trimmed = inputText.trim();
    if (!trimmed || trimmed.length > 40 || trimmed.includes('\\') || trimmed.includes('$')) return null;
    if (/^[0-9\+\-\*\/\^\(\)\.\s\%]+$/.test(trimmed)) {
      try {
        const sanitized = trimmed.replace(/\^/g, '**');
        // eslint-disable-next-line no-new-func
        const res = new Function(`"use strict"; return (${sanitized});`)();
        if (typeof res === 'number' && !isNaN(res) && isFinite(res)) {
          return res;
        }
      } catch {
        return null;
      }
    }
    return null;
  }, [inputText]);

  // Image upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Submit message
  const handleSend = async () => {
    if ((!inputText.trim() && !attachedImage) || isGenerating) return;

    const textToSend = inputText.trim() || (attachedImage ? 'Solve the mathematical problem in this image.' : '');
    const imgToSend = attachedImage || undefined;

    setInputText('');
    setAttachedImage(null);

    await onSendMessage(textToSend, activeMode, imgToSend);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Text to speech for math solutions
  const toggleSpeak = (msgId: string, text: string) => {
    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const spokenText = text
      .replace(/\$\$[\s\S]*?\$\$/g, 'mathematical expression')
      .replace(/\$([^\$]+)\$/g, '$1')
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1 over $2')
      .replace(/\\sqrt\{([^}]+)\}/g, 'square root of $1')
      .replace(/\\int/g, 'integral')
      .replace(/\\sum/g, 'sum')
      .replace(/\\boxed/g, 'answer is');

    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const modeDescriptions: Record<SolverMode, { label: string; desc: string; icon: any }> = {
    solve: {
      label: 'Deep Step-by-Step',
      desc: 'Complete algebraic breakdown, formulas, boxed answer & verification',
      icon: Sparkles,
    },
    tutor: {
      label: 'Socratic Tutor',
      desc: 'Guided inquiry: hints and questions to help you solve it yourself',
      icon: HelpCircle,
    },
    proof: {
      label: 'Formal Proof',
      desc: 'Rigorous axiomatic theorem statements, lemmas, and Q.E.D.',
      icon: FileQuestion,
    },
    quick: {
      label: 'Quick Answer',
      desc: 'Concise solution highlighting the core result and key step',
      icon: Activity,
    },
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 relative overflow-hidden">
      {/* Top Bar with Mode Switcher & Tools */}
      <div className="p-3 bg-slate-950/80 border-b border-slate-800/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 z-10">
        {/* Mode Selector Tabs */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          {(Object.keys(modeDescriptions) as SolverMode[]).map((mode) => {
            const item = modeDescriptions[mode];
            const Icon = item.icon;
            const isActive = activeMode === mode;
            return (
              <button
                key={mode}
                onClick={() => setActiveMode(mode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
                title={item.desc}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Action triggers: Camera Scanner, Keypad, Canvas & Function Grapher */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setShowCamera(true)}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 transition-all shadow-xs"
            title="Scan with Photomath Camera"
          >
            <Camera className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Camera Scan</span>
          </button>

          <button
            onClick={() => setShowKeypad(!showKeypad)}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 border transition-all ${
              showKeypad
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Toggle Scientific Keypad"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Keypad</span>
          </button>

          <button
            onClick={() => setShowPlotter(!showPlotter)}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 border transition-all ${
              showPlotter
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-sm'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">2D Grapher</span>
          </button>

          <button
            onClick={() => setShowCanvas(true)}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
            title="Handwriting and Geometry Canvas"
          >
            <PenTool className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Draw</span>
          </button>
        </div>
      </div>

      {/* Floating 2D Grapher Overlay when toggled */}
      {showPlotter && (
        <div className="p-3 bg-slate-950 border-b border-indigo-500/30 animate-in slide-in-from-top-4 duration-200">
          <FunctionPlotter
            initialFunction={activePlotFunction}
            onClose={() => setShowPlotter(false)}
          />
        </div>
      )}

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 math-grid-bg">
        {messages.length === 0 ? (
          <div className="max-w-2xl mx-auto my-auto text-center py-10 px-4 space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center mx-auto shadow-2xl shadow-indigo-500/30 ring-4 ring-indigo-500/20">
              <Compass className="w-8 h-8 text-white" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-100 tracking-tight">
                AI Mathematics Problem Solver & Tutor
              </h2>
              <p className="text-sm text-slate-400 mt-2 max-w-lg mx-auto">
                Ask any math problem in algebra, calculus, matrices, geometry, or statistics.
                Input via keyboard, handwriting canvas, or upload a photo of your worksheet.
              </p>
            </div>

            {/* Quick Starter Chips */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Popular Inquiries:
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {[
                  'Evaluate $\\int x^2 \\cos(x) dx$',
                  'Solve $2x^2 - 5x + 2 = 0$',
                  'Find eigenvalues of $\\begin{pmatrix} 3 & 1 \\\\ 0 & 2 \\end{pmatrix}$',
                  'Find derivative of $f(x) = \\ln(x^2 + 1)$',
                  'Calculate normal distribution probability for $Z > 1.96$',
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSelectPreset(preset)}
                    className="px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-indigo-600/20 border border-slate-800 hover:border-indigo-500/40 text-xs text-slate-300 hover:text-indigo-200 transition-all active:scale-95"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const isUser = message.role === 'user';
            return (
              <div
                key={message.id}
                className={`flex gap-3.5 max-w-4xl mx-auto ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 flex-shrink-0 mt-1 shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`flex flex-col space-y-2 max-w-[90%] md:max-w-[85%] rounded-2xl p-4 shadow-xl ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-tr-xs ml-auto shadow-indigo-900/20'
                      : 'bg-slate-900/95 border border-slate-800 text-slate-100 rounded-tl-xs shadow-black/40'
                  }`}
                >
                  {/* Mode badge for assistant */}
                  {!isUser && message.mode && (
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1.5 font-medium text-indigo-300">
                        <Sparkles className="w-3 h-3" />
                        {modeDescriptions[message.mode]?.label || 'Math Solution'}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}

                  {/* Attached user image preview */}
                  {message.imageBase64 && (
                    <div className="rounded-xl overflow-hidden border border-white/20 my-1 max-w-sm">
                      <img
                        src={message.imageBase64}
                        alt="Math problem attachment"
                        className="w-full h-auto object-contain max-h-60 bg-slate-950"
                      />
                    </div>
                  )}

                  {/* Math text content */}
                  <MathRenderer
                    content={message.content}
                    className={isUser ? 'text-white' : 'text-slate-100'}
                  />

                  {/* Retry button if this message indicates an error */}
                  {!isUser && message.content.includes('Error Solving Problem') && (
                    <button
                      onClick={() => {
                        const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
                        if (lastUserMsg) {
                          onSendMessage(lastUserMsg.content, activeMode, lastUserMsg.imageBase64);
                        }
                      }}
                      className="mt-2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 w-fit shadow-md transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry Question</span>
                    </button>
                  )}

                  {/* Assistant controls: Audio speech & Plot recommendation */}
                  {!isUser && (
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 mt-2 border-t border-slate-800/80">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => toggleSpeak(message.id, message.content)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800/80 transition-colors text-xs flex items-center gap-1"
                          title="Read out math explanation"
                        >
                          {speakingMsgId === message.id ? (
                            <>
                              <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                              <span className="text-rose-400 text-[11px]">Stop</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5" />
                              <span className="text-[11px]">Listen</span>
                            </>
                          )}
                        </button>

                        {/* Interactive Graph Trigger if plottable */}
                        {message.plottableFunction && (
                          <button
                            onClick={() => {
                              setActivePlotFunction(message.plottableFunction!);
                              setShowPlotter(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 text-xs flex items-center gap-1.5 transition-colors"
                          >
                            <Activity className="w-3.5 h-3.5 text-sky-400" />
                            <span>Plot $y = {message.plottableFunction}$</span>
                          </button>
                        )}
                      </div>

                      {/* Quick Follow-up suggestion buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onSendMessage('Can you show an alternative method to solve this?', activeMode)}
                          className="text-[11px] text-slate-400 hover:text-indigo-300 px-2 py-0.5 rounded hover:bg-slate-800"
                        >
                          Alternative method
                        </button>
                        <button
                          onClick={() => onSendMessage('Give me a similar practice problem with hints.', activeMode)}
                          className="text-[11px] text-slate-400 hover:text-indigo-300 px-2 py-0.5 rounded hover:bg-slate-800"
                        >
                          Similar problem
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 flex-shrink-0 mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Loading Indicator */}
        {isGenerating && (
          <div className="flex gap-3.5 max-w-4xl mx-auto">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 flex-shrink-0">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-indigo-500/20 text-slate-300 flex items-center gap-3">
              <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />
              <div className="text-xs">
                <span className="font-semibold text-slate-200">Solving with Mathematical Rigor...</span>
                <span className="text-slate-500 block">Deriving step-by-step transformations and verifying bounds</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 md:p-4 bg-slate-950/90 border-t border-slate-800/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto space-y-2">
          {/* Math Symbol Virtual Keyboard */}
          {showSymbolBar && (
            <MathSymbolBar onInsert={handleInsertSymbol} />
          )}

          {/* Scientific Keypad Drawer */}
          {showKeypad && (
            <div className="animate-in slide-in-from-bottom-2 duration-200">
              <ScientificKeypad
                onInsert={handleInsertSymbol}
                onBackspace={handleBackspace}
                onClear={() => setInputText('')}
                onSubmit={handleSend}
              />
            </div>
          )}

          {/* Instant Local Calculation Preview Banner */}
          {instantCalcResult !== null && (
            <div className="flex items-center justify-between px-3 py-1.5 bg-indigo-950/80 border border-indigo-500/40 rounded-xl text-xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-slate-300 font-medium">Instant Result:</span>
                <span className="font-mono font-bold text-indigo-200 text-sm">{instantCalcResult}</span>
              </div>
              <button
                onClick={() => setInputText((prev) => `${prev} = ${instantCalcResult}`)}
                className="text-[11px] text-indigo-400 hover:text-indigo-200 underline"
              >
                Insert answer
              </button>
            </div>
          )}

          {/* Attached image preview tag */}
          {attachedImage && (
            <div className="flex items-center gap-2 p-2 bg-slate-900 border border-indigo-500/40 rounded-xl w-fit animate-in fade-in">
              <img
                src={attachedImage}
                alt="Upload preview"
                className="w-12 h-12 object-cover rounded-lg border border-slate-800"
              />
              <div className="text-xs">
                <span className="font-medium text-slate-200 block">Math Image Attached</span>
                <span className="text-[10px] text-slate-400">Ready for OCR & step solving</span>
              </div>
              <button
                onClick={() => setAttachedImage(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-rose-400 ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Input box */}
          <div className="flex items-end gap-2 bg-slate-900/90 border border-slate-800 focus-within:border-indigo-500/70 rounded-2xl p-2 transition-all shadow-lg focus-within:shadow-indigo-500/10">
            {/* Quick action buttons on left */}
            <div className="flex items-center gap-1 pb-1">
              <button
                type="button"
                onClick={() => setShowCamera(true)}
                title="Scan problem with camera (Photomath style)"
                className="p-2 rounded-xl text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors"
              >
                <Camera className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Upload math worksheet or problem image"
                className="p-2 rounded-xl text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors"
              >
                <ImageIcon className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => setShowCanvas(true)}
                title="Open handwriting & drawing scratchpad"
                className="p-2 rounded-xl text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors"
              >
                <PenTool className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setShowKeypad(!showKeypad)}
                title={showKeypad ? 'Hide scientific keypad' : 'Show scientific keypad'}
                className={`p-2 rounded-xl transition-colors ${
                  showKeypad ? 'text-indigo-400 bg-indigo-600/20' : 'text-slate-400 hover:text-indigo-300 hover:bg-slate-800'
                }`}
              >
                <Calculator className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setShowSymbolBar(!showSymbolBar)}
                title={showSymbolBar ? 'Hide symbol keyboard' : 'Show symbol keyboard'}
                className={`p-2 rounded-xl transition-colors ${
                  showSymbolBar ? 'text-indigo-400 bg-indigo-600/20' : 'text-slate-400 hover:text-indigo-300 hover:bg-slate-800'
                }`}
              >
                <span className="font-serif font-bold text-xs">∫ dx</span>
              </button>
            </div>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              rows={2}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask any math problem, paste equation, or write LaTeX: e.g. Evaluate $\int_0^1 x^2 e^x dx$..."
              className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 text-sm focus:outline-none resize-none py-1.5 px-2 max-h-36 font-sans leading-relaxed"
            />

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={(!inputText.trim() && !attachedImage) || isGenerating}
              className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 text-white shadow-lg shadow-indigo-600/30 transition-all active:scale-95 flex-shrink-0"
              title="Solve Problem (Enter)"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 px-2">
            <span>Press <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">Enter</kbd> to solve, <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">Shift+Enter</kbd> for newline</span>
            <span>LaTeX delimiters: <code className="text-slate-400 font-mono">$...$</code> or <code className="text-slate-400 font-mono">$$...$$</code></span>
          </div>
        </div>
      </div>

      {/* Handwriting Canvas Modal */}
      <MathCanvasModal
        isOpen={showCanvas}
        onClose={() => setShowCanvas(false)}
        onSubmitDrawing={(base64Img, prompt) => {
          setAttachedImage(base64Img);
          if (prompt) setInputText(prompt);
        }}
      />

      {/* Photomath Camera Scanner Modal */}
      <CameraScannerModal
        isOpen={showCamera}
        onClose={() => setShowCamera(false)}
        onCaptureProblem={(base64Img, prompt) => {
          setAttachedImage(base64Img);
          if (prompt) setInputText(prompt);
        }}
      />
    </div>
  );
};
