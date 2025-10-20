import React from 'react';
import { Send, MessageSquare } from 'lucide-react';

const ChatSection = ({ 
  currentChat, 
  question, 
  setQuestion, 
  loading, 
  sendMessage, 
  handleKeyPress, 
  messagesEndRef 
}) => {
  return (
    <div className="flex flex-col flex-1">
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
  );
};

export default ChatSection;
