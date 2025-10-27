import React from 'react';
import { User, Bot, Clock, History } from 'lucide-react';

export default function ChatDisplay({ messages, isHistorical }) {
  if (!messages || messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <Bot className="w-20 h-20 mx-auto mb-4 opacity-30 text-gray-400" />
          <p className="text-gray-500 font-medium">No messages to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-50 to-white">
      {/* Historical Banner */}
      {isHistorical && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-3 shadow-sm">
          <div className="flex items-center gap-2 text-blue-800">
            <History className="w-4 h-4" />
            <p className="text-sm font-medium">Viewing historical conversation</p>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.map((msg, idx) => (
          <div key={idx} className="space-y-4">
            {/* User Message */}
            {msg.question && (
              <div className="flex justify-end">
                <div className="flex items-end gap-3 max-w-[75%]">
                  <div className="bg-blue-600 text-white rounded-2xl rounded-br-sm px-5 py-3 shadow-md">
                    <p className="text-sm leading-relaxed">{msg.question}</p>
                  </div>
                  <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                    <User className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
            )}

            {/* Bot Message */}
            {msg.answer && (
              <div className="flex justify-start">
                <div className="flex items-end gap-3 max-w-[75%]">
                  <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                    <Bot className="w-5 h-5 text-gray-700" />
                  </div>
                  <div className="bg-white rounded-2xl rounded-bl-sm px-5 py-3 shadow-md border border-gray-200">
                    <p className="text-sm text-gray-800 leading-relaxed">{msg.answer}</p>
                    {msg.timestamp && (
                      <div className="flex items-center gap-1 mt-3 pt-2 border-t border-gray-100">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <p className="text-xs text-gray-500">
                          {new Date(msg.timestamp).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}