import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Brain,
  Layers,
  Activity,
  Menu,
  Calculator,
  Sparkles,
} from 'lucide-react';
import { ChatMessage, ChatSession, SolverMode } from './types';
import { ChatInterface } from './components/ChatInterface';
import { PracticeLab } from './components/PracticeLab';
import { DomainPresets } from './components/DomainPresets';
import { FunctionPlotter } from './components/FunctionPlotter';
import { HistorySidebar } from './components/HistorySidebar';

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'practice' | 'domains' | 'grapher'>('chat');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [activeMode, setActiveMode] = useState<SolverMode>('solve');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Load sessions from localStorage on init
  useEffect(() => {
    try {
      const saved = localStorage.getItem('mathai_sessions');
      if (saved) {
        const parsed: ChatSession[] = JSON.parse(saved);
        if (parsed.length > 0) {
          setSessions(parsed);
          setCurrentSessionId(parsed[0].id);
          return;
        }
      }
    } catch (e) {
      console.error('Failed to load sessions from localStorage', e);
    }

    // Default first session
    const initialSession: ChatSession = {
      id: 'session-' + Date.now(),
      title: 'Welcome & Calculus Problem',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [
        {
          id: 'welcome-1',
          role: 'assistant',
          content: `# Welcome to MathAI! 🧮
I am your advanced mathematical problem solver, step-by-step tutor, and analytical computing engine.

### What can I solve for you?
* **Calculus & Analysis**: Integrals $\\int_0^1 x^2 e^x dx$, limits, differential equations $\\frac{dy}{dx} + Py = Q$.
* **Algebra & Polynomials**: Quadratic systems, factoring, roots, logarithm properties.
* **Linear Algebra**: Eigenvalues, eigenvectors, determinants $\\det(A)$, matrix inversions.
* **Probability & Statistics**: Bayes' theorem, normal distributions, combinatorics.
* **Geometry & Trigonometry**: Proofs, angle addition formulas, vector cross-products.

Try typing any question below, clicking the **Handwrite / Draw** button, or picking from the preset catalog!`,
          timestamp: Date.now(),
          mode: 'solve',
        },
      ],
    };
    setSessions([initialSession]);
    setCurrentSessionId(initialSession.id);
  }, []);

  // Save sessions to localStorage
  useEffect(() => {
    if (sessions.length > 0) {
      try {
        localStorage.setItem('mathai_sessions', JSON.stringify(sessions));
      } catch (e) {
        console.error('Failed to save sessions to localStorage', e);
      }
    }
  }, [sessions]);

  // Current session messages
  const currentSession = sessions.find((s) => s.id === currentSessionId);
  const currentMessages = currentSession?.messages || [];

  // Create a new session
  const handleNewSession = () => {
    const newSession: ChatSession = {
      id: 'session-' + Date.now(),
      title: 'New Math Inquiry',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setActiveTab('chat');
  };

  // Delete session
  const handleDeleteSession = (id: string) => {
    const updated = sessions.filter((s) => s.id !== id);
    setSessions(updated);
    if (currentSessionId === id && updated.length > 0) {
      setCurrentSessionId(updated[0].id);
    } else if (updated.length === 0) {
      handleNewSession();
    }
  };

  // Clear all
  const handleClearAll = () => {
    localStorage.removeItem('mathai_sessions');
    handleNewSession();
  };

  // Send message to server
  const handleSendMessage = async (text: string, mode: SolverMode, imageBase64?: string) => {
    if (!text.trim() && !imageBase64) return;

    const userMessage: ChatMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
      imageBase64,
      mode,
    };

    // Update session title if first user message
    let sessionTitle = currentSession?.title;
    if (currentMessages.filter((m) => m.role === 'user').length === 0) {
      sessionTitle = text.slice(0, 36) || 'Math Problem';
    }

    const updatedMessages = [...currentMessages, userMessage];

    // Optimistically update state
    setSessions((prev) =>
      prev.map((s) =>
        s.id === currentSessionId
          ? {
              ...s,
              title: sessionTitle || s.title,
              updatedAt: Date.now(),
              messages: updatedMessages,
            }
          : s
      )
    );

    setIsGenerating(true);

    try {
      const response = await fetch('/api/gemini/math-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          mode,
          imageBase64,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Server error occurred while solving problem.');
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: 'msg-ai-' + Date.now(),
        role: 'assistant',
        content: data.reply,
        timestamp: Date.now(),
        plottableFunction: data.plottableFunction,
        mode,
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId
            ? {
                ...s,
                updatedAt: Date.now(),
                messages: [...updatedMessages, assistantMessage],
              }
            : s
        )
      );
    } catch (err: any) {
      console.error(err);
      const errorMessage: ChatMessage = {
        id: 'msg-err-' + Date.now(),
        role: 'assistant',
        content: `**Error Solving Problem:** ${err.message || 'Unable to connect to MathAI server.'}\nPlease check your network and retry.`,
        timestamp: Date.now(),
        mode,
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId
            ? {
                ...s,
                messages: [...updatedMessages, errorMessage],
              }
            : s
        )
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectPreset = (prompt: string, title?: string) => {
    setActiveTab('chat');
    handleSendMessage(prompt, activeMode);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar for Notebook history */}
      <HistorySidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={(id) => setCurrentSessionId(id)}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        onClearAll={handleClearAll}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Navbar */}
        <header className="h-14 px-4 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
                <Calculator className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-white flex items-center gap-1.5">
                MathAI
                <span className="hidden sm:inline-block text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Pro Engine
                </span>
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'chat'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chatbot Solver</span>
            </button>

            <button
              onClick={() => setActiveTab('practice')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'practice'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Practice Lab</span>
            </button>

            <button
              onClick={() => setActiveTab('domains')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'domains'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Disciplines</span>
            </button>

            <button
              onClick={() => setActiveTab('grapher')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'grapher'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">2D Studio</span>
            </button>
          </nav>

          {/* Quick status */}
          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-medium text-slate-400">LaTeX KaTeX Ready</span>
          </div>
        </header>

        {/* Tab Viewport */}
        <main className="flex-1 overflow-hidden relative">
          {activeTab === 'chat' && (
            <ChatInterface
              messages={currentMessages}
              onSendMessage={handleSendMessage}
              isGenerating={isGenerating}
              onSelectPreset={handleSelectPreset}
              activeMode={activeMode}
              setActiveMode={setActiveMode}
              onNewProblem={handleNewSession}
            />
          )}

          {activeTab === 'practice' && (
            <div className="h-full overflow-y-auto p-4 md:p-8 math-grid-bg">
              <PracticeLab
                onSendToChat={(problemText) => {
                  handleNewSession();
                  handleSendMessage(problemText, 'solve');
                }}
              />
            </div>
          )}

          {activeTab === 'domains' && (
            <div className="h-full overflow-y-auto p-4 md:p-8 math-grid-bg">
              <div className="max-w-5xl mx-auto space-y-6">
                <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
                  <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                    <span>Comprehensive Mathematics Curriculum & Exemplars</span>
                  </h2>
                  <p className="text-xs md:text-sm text-slate-400 mt-1">
                    Select any high-yield problem below to load it directly into the AI mathematics solver.
                  </p>
                </div>

                <DomainPresets onSelectPreset={handleSelectPreset} />
              </div>
            </div>
          )}

          {activeTab === 'grapher' && (
            <div className="h-full overflow-y-auto p-4 md:p-8 math-grid-bg flex items-center justify-center">
              <div className="w-full max-w-4xl">
                <FunctionPlotter initialFunction="sin(x) * x" />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
