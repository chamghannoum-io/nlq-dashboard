import React from 'react';
import { MessageSquare, Clock, BarChart3 } from 'lucide-react';

const Sidebar = ({ 
  history, 
  selectedHistoryId, 
  loadHistoryItem, 
  sidebarWidth,
  onNewChat,
  onCollapse
}) => {
  return (
    <div 
      className="bg-white border-r border-gray-200 flex flex-col"
      style={{ width: `${sidebarWidth}px` }}
    >
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            NLQ Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">Chat History</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onNewChat}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            title="Start a new chat"
          >
            New Chat
          </button>
          {onCollapse && (
            <button
              onClick={onCollapse}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
              title="Hide sidebar"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {history.length === 0 ? (
          <div className="text-center text-gray-400 mt-8">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No conversations yet</p>
          </div>
        ) : (
          history.map((item, idx) => {
            const itemId = item.session_id + item.timestamp;
            return (
              <div
                key={idx}
                onClick={() => loadHistoryItem(item)}
                className={`p-3 mb-2 rounded-lg cursor-pointer transition-all ${
                  selectedHistoryId === itemId
                    ? 'bg-blue-50 border-2 border-blue-300'
                    : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                }`}
              >
                <p className="font-medium text-gray-800 text-sm mb-2 line-clamp-2">
                  {item.question}
                </p>
                <p className="text-xs text-gray-600 mb-2 line-clamp-1">
                  {item.answer}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {new Date(item.timestamp).toLocaleString()}
                  </div>
                  {item.visualization_type && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                      {item.visualization_type}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Sidebar;
