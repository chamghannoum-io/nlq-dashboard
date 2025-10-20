import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Clock, BarChart3 } from 'lucide-react';

const NLQDashboard = () => {
  const [sessionId, setSessionId] = useState(null);
  const [question, setQuestion] = useState('');
  const [currentChat, setCurrentChat] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);
  const messagesEndRef = useRef(null);

  const WEBHOOK_URL = 'https://n8n-test.iohealth.com/webhook-test/user-question';
  const HISTORY_URL = 'https://n8n-test.iohealth.com/webhook-test/chat-history';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentChat]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await fetch(HISTORY_URL);
      const data = await response.json();
      setHistory(data.reverse());
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const sendMessage = async () => {
    if (!question.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.trim(),
          session_id: sessionId
        })
      });

      const data = await response.json();
      
      if (!sessionId && data.session_id) {
        setSessionId(data.session_id);
      }

      setCurrentChat(data);
      setQuestion('');
      await loadHistory();
      setSelectedHistoryId(null);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadHistoryItem = (item) => {
    setCurrentChat(item);
    setSelectedHistoryId(item.session_id + item.timestamp);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            NLQ Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">Chat History</p>
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
                  <p className="font-medium text-gray-800 text-sm line-clamp-2 mb-1">
                    {item.question}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {item.timestamp}
                  </div>
                  {item.visualization_type && (
                    <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                      {item.visualization_type}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Chat Section */}
        <div className="flex-1 flex flex-col">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6">
            {!currentChat ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                    Ask a question about your data
                  </h2>
                  <p className="text-gray-500">
                    Type your question below to get started
                  </p>
                </div>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto space-y-4">
                {/* User Question */}
                <div className="flex justify-end">
                  <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-lg">
                    <p className="text-sm">{currentChat.question}</p>
                  </div>
                </div>

                {/* Bot Answer */}
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 max-w-lg shadow-sm">
                    <p className="text-sm text-gray-800">{currentChat.answer}</p>
                    {currentChat.card_name && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-500">
                          📊 {currentChat.card_name}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Section */}
          <div className="border-t border-gray-200 p-4 bg-white">
            <div className="max-w-3xl mx-auto flex gap-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask a question about your data..."
                disabled={loading}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !question.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Visualization Section */}
        <div className="w-1/2 border-l border-gray-200 bg-white flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Visualization</h2>
          </div>
          <div className="flex-1 overflow-hidden">
            {currentChat && currentChat.should_visualize && currentChat.embed_url ? (
              <iframe
                src={currentChat.embed_url}
                className="w-full h-full border-0"
                title="Metabase Visualization"
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">No visualization available</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NLQDashboard;