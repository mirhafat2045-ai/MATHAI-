import React, { useState } from 'react';
import {
  MessageSquare,
  Plus,
  Trash2,
  Download,
  Search,
  Calculator,
  ChevronLeft,
  Clock,
  Check,
} from 'lucide-react';
import { ChatSession } from '../types';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onClearAll: () => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onClearAll,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [exported, setExported] = useState(false);

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExportSession = (session: ChatSession) => {
    let markdown = `# ${session.title}\nDate: ${new Date(session.createdAt).toLocaleString()}\n\n`;
    for (const msg of session.messages) {
      const author = msg.role === 'user' ? '### 👤 User' : '### 🤖 MathAI Solver';
      markdown += `${author} (${new Date(msg.timestamp).toLocaleTimeString()}):\n\n${msg.content}\n\n---\n\n`;
    }

    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MathAI-${session.title.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
    link.click();
    URL.revokeObjectURL(url);

    setExported(true);
    setTimeout(() => setExported(false), 2000);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-72 bg-slate-950 border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/20">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm text-slate-100 tracking-tight">MathAI Workspace</h1>
              <p className="text-[11px] text-slate-400">Universal Math Engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* New Problem Button */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewSession();
              onClose();
            }}
            className="w-full py-2.5 px-3.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-indigo-200 border border-indigo-500/30 font-medium text-xs flex items-center justify-center gap-2 transition-all shadow-sm group"
          >
            <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
            <span>New Math Problem</span>
          </button>
        </div>

        {/* Search */}
        <div className="px-3 pb-2">
          <div className="flex items-center px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 mr-2 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search previous problems..."
              className="w-full bg-transparent text-slate-200 placeholder-slate-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-2 mb-1 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Notebook History ({sessions.length})</span>
          </div>

          {filteredSessions.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No math problems found.
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isActive = session.id === currentSessionId;
              return (
                <div
                  key={session.id}
                  className={`group relative flex items-center justify-between p-2 rounded-xl text-xs transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-slate-800/90 text-white font-medium border border-indigo-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                  onClick={() => {
                    onSelectSession(session.id);
                    onClose();
                  }}
                >
                  <div className="flex items-center gap-2 truncate pr-6">
                    <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                    <span className="truncate">{session.title}</span>
                  </div>

                  {/* Actions on hover */}
                  <div className="absolute right-1.5 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportSession(session);
                      }}
                      title="Export Markdown"
                      className="p-1 text-slate-400 hover:text-indigo-300"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(session.id);
                      }}
                      title="Delete"
                      className="p-1 text-slate-400 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer controls */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <button
            onClick={onClearAll}
            disabled={sessions.length === 0}
            className="flex items-center gap-1.5 text-slate-500 hover:text-rose-400 transition-colors disabled:opacity-30"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>

          {exported && (
            <span className="text-[11px] text-emerald-400 flex items-center gap-1">
              <Check className="w-3 h-3" /> Exported
            </span>
          )}
        </div>
      </aside>
    </>
  );
};
