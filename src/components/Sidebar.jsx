import React from 'react';
import { MessageSquare, Clock, BarChart3, Plus } from 'lucide-react';

const Sidebar = ({ 
  history, 
  selectedHistoryItem,
  onHistoryClick,
  sidebarWidth,
  onNewChat,
  onCollapse
}) => {
  return (
    <div 
      className="bg-white border-r border-gray-200 flex flex-col h-full shadow-sm"
      style={{ width: `${sidebarWidth}px` }}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-gray-900">NLQ Dashboard</h1>
          </div>
          {onCollapse && (
            <button
              onClick={onCollapse}
              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
              title="Hide sidebar"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
          )}
        </div>
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-all duration-200 shadow-sm hover:shadow-md"
          title="Start a new chat"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>
      </div>
      
      {/* History List */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-3 py-2">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Recent Conversations</h2>
        </div>
        
        {history.length === 0 ? (
          <div className="text-center text-gray-400 mt-12 px-4">
            <MessageSquare className="w-16 h-16 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium text-gray-500">No conversations yet</p>
            <p className="text-xs text-gray-400 mt-1">Start chatting to see history here</p>
          </div>
        ) : (
          <div className="px-2 space-y-2 pb-3">
            {history.map((item, idx) => {
              const isSelected = selectedHistoryItem?.timestamp === item.timestamp;
              
              return (
                <div
                  key={idx}
                  onClick={() => onHistoryClick(item)}
                  className={`p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'bg-blue-50 border-2 border-blue-500 shadow-md transform scale-[1.02]'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent hover:border-gray-200'
                  }`}
                >
                  {item.visualization_type && (
                    <div className="mb-2">
                      <span className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                        {item.visualization_type}
                      </span>
                    </div>
                  )}
                  
                  <p className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2 leading-relaxed">
                    {item.card_name || item.question}
                  </p>
                  
                  {item.card_name && item.card_name !== item.question && (
                    <p className="text-xs text-gray-500 mb-2 line-clamp-1 italic font-light">
                      Q: {item.question}
                    </p>
                  )}
                  
                  <p className="text-xs text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                    {item.answer}
                  </p>
                  
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
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