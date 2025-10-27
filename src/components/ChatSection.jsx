import { useEffect, useState } from 'react';
import { createChat } from '@n8n/chat';
import '@n8n/chat/style.css';
import ChatDisplay from './ChatDisplay';
import { ArrowLeft } from 'lucide-react';

export default function ChatSection({ selectedHistoryItem }) {
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!selectedHistoryItem) {
      const container = document.getElementById('n8n-chat-container');
      if (container) {
        container.innerHTML = '';
      }

      createChat({
        webhookUrl: '/webhook/6a2a75cc-9487-4650-8174-31e80a40158b/chat',
        target: '#n8n-chat-container',
        mode: 'fullscreen',
        chatSessionKey: 'n8n_session_id',
        
        initialMessages: [
          'Hello! Ask me anything about your healthcare data.'
        ],
        inputPlaceholder: 'Type your question...',
      });

      setShowHistory(false);
    } else {
      setShowHistory(true);
    }
  }, [selectedHistoryItem]);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Chat</h2>
          {showHistory && (
            <button
              onClick={() => {
                setShowHistory(false);
                window.location.reload();
              }}
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
          <div id="n8n-chat-container" className="h-full" />
        )}
      </div>
    </div>
  );
}