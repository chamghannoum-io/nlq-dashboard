import { useEffect, useState } from 'react';
import ChatDisplay from './ChatDisplay';
import CustomChatInterface from './CustomChatInterface';
import { ArrowLeft } from 'lucide-react';

export default function ChatSection({ selectedHistoryItem, onClearHistory, chatKey, onVisualizationData }) {
  const [showHistory, setShowHistory] = useState(false);
  const [sessionId, setSessionId] = useState(() => `n8n_session_${Date.now()}`);

  useEffect(() => {
    if (!selectedHistoryItem) {
      setSessionId(`n8n_session_${Date.now()}`);
      setShowHistory(false);
    } else {
      setShowHistory(true);
    }
  }, [selectedHistoryItem, chatKey]);

  const handleBackToLiveChat = () => {
    setShowHistory(false);
    if (onClearHistory) {
      onClearHistory();
    }
  };

  const handleMessageSent = (message) => {
    console.log('Message sent:', message);
  };

  return (
    <div className="h-full flex flex-col bg-transparent">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-700/50 bg-slate-800/20 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Chat Assistant</h2>
            <p className="text-sm text-slate-400 mt-0.5">Ask anything about your data</p>
          </div>
          {showHistory && (
            <button
              onClick={handleBackToLiveChat}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-semibold rounded-xl hover:from-blue-500 hover:to-blue-400 active:scale-95 transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Live Chat
            </button>
          )}
        </div>
      </div>

      {/* Chat Content */}
      <div className="flex-1 overflow-hidden">
        {showHistory ? (
          <ChatDisplay 
            messages={[selectedHistoryItem]} 
            isHistorical={true}
          />
        ) : (
          <CustomChatInterface 
            sessionId={sessionId}
            onMessageSent={handleMessageSent}
            onVisualizationData={onVisualizationData}
          />
        )}
      </div>
    </div>
  );
}
