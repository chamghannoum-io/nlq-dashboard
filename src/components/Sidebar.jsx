import React from 'react';
import { MessageSquare, Clock, BarChart3, Plus, Loader2 } from 'lucide-react';

const Sidebar = ({ 
  history, 
  selectedHistoryItem,
  onHistoryClick,
  sidebarWidth,
  onNewChat,
  onCollapse,
  loading = false
}) => {
  return (
    <div 
      className="bg-slate-800/40 backdrop-blur-xl border-r border-slate-700/50 flex flex-col h-full"
      style={{ width: `${sidebarWidth}px` }}
    >
      {/* Header */}
      <div className="p-5 border-b border-slate-700/50 bg-gradient-to-br from-slate-800/60 to-slate-800/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 ring-2 ring-slate-700/50">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-800"></div>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">NLQ Dashboard</h1>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                AI-Powered Analytics
              </p>
            </div>
          </div>
          {onCollapse && (
            <button
              onClick={onCollapse}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all duration-200 group"
              title="Hide sidebar"
            >
              <svg className="w-5 h-5 transform group-hover:-translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
          )}
        </div>
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 text-white text-sm font-semibold rounded-xl hover:from-blue-500 hover:via-blue-400 hover:to-blue-500 active:scale-95 transition-all duration-200 shadow-lg shadow-blue-500/40 hover:shadow-blue-500/60 group"
          title="Start a new chat"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          <span>New Conversation</span>
        </button>
      </div>
      
      {/* History List */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-4 sticky top-0 bg-slate-800/80 backdrop-blur-md z-10 border-b border-slate-700/30">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            Recent Conversations
          </h2>
        </div>
        
        {loading ? (
          <div className="text-center mt-20 px-4">
            <div className="w-24 h-24 mx-auto mb-5 bg-gradient-to-br from-slate-700/40 to-slate-700/20 rounded-3xl flex items-center justify-center border border-slate-700/50 shadow-xl">
              <Loader2 className="w-12 h-12 text-slate-400 animate-spin" />
            </div>
            <p className="text-sm font-semibold text-slate-400">Loading conversations...</p>
            <p className="text-xs text-slate-500 mt-2">Fetching from database</p>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center mt-20 px-4">
            <div className="w-24 h-24 mx-auto mb-5 bg-gradient-to-br from-slate-700/40 to-slate-700/20 rounded-3xl flex items-center justify-center border border-slate-700/50 shadow-xl">
              <MessageSquare className="w-12 h-12 text-slate-500" />
            </div>
            <p className="text-sm font-semibold text-slate-400">No conversations yet</p>
            <p className="text-xs text-slate-500 mt-2 max-w-[200px] mx-auto">Start a new conversation to see your history here</p>
          </div>
        ) : (
          <div className="px-3 space-y-2.5 py-3">
            {history.map((item, idx) => {
              const isSelected = selectedHistoryItem?.session_id 
                ? selectedHistoryItem.session_id === item.session_id 
                : selectedHistoryItem?.timestamp === item.timestamp;
              
              return (
                <div
                  key={idx}
                  onClick={() => onHistoryClick(item)}
                  className={`relative p-4 rounded-xl cursor-pointer transition-all duration-200 group ${
                    isSelected
                      ? 'bg-gradient-to-br from-blue-600/25 to-blue-500/15 border border-blue-500/50 shadow-xl shadow-blue-500/20 scale-[1.02]'
                      : 'bg-slate-700/20 hover:bg-slate-700/40 border border-slate-700/30 hover:border-slate-600/50 hover:scale-[1.01]'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  )}
                  <p className={`font-semibold text-sm mb-3 leading-relaxed line-clamp-2 ${
                    isSelected ? 'text-white' : 'text-slate-200 group-hover:text-white'
                  }`}>
                    {item.card_name || item.question}
                  </p>
                  
                  <div className={`flex items-center gap-2 text-xs ${
                    isSelected ? 'text-blue-300' : 'text-slate-500 group-hover:text-slate-400'
                  }`}>
                    <Clock className="w-3.5 h-3.5" />
                    <span className="font-medium">{new Date(item.timestamp).toLocaleString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      hour: 'numeric', 
                      minute: '2-digit' 
                    })}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;