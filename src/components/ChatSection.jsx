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
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Chat</h2>
          {showHistory && (
            <button
              onClick={handleBackToLiveChat}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-all duration-200 shadow-sm hover:shadow-md"
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
