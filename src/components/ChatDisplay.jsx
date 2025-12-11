import React, { useState } from 'react';
import { User, Bot, Clock, History, Volume2, VolumeX } from 'lucide-react';

export default function ChatDisplay({ messages, isHistorical }) {
  const [speaking, setSpeaking] = useState(null);

  const speakText = (text, messageIndex) => {
    window.speechSynthesis.cancel();

    if (speaking === messageIndex) {
      // If clicking the same message, stop
      setSpeaking(null);
      return;
    }

    // Create speech synthesis
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure voice
    utterance.rate = 1.0; 
    utterance.pitch = 1.0; 
    utterance.volume = 1.0; 
    
    // Optional: Select a specific voice
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(voice => voice.lang.startsWith('en-'));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onstart = () => setSpeaking(messageIndex);
    utterance.onend = () => setSpeaking(null);
    utterance.onerror = () => setSpeaking(null);

    window.speechSynthesis.speak(utterance);
  };

  if (!messages || messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-transparent">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-5 bg-slate-700/30 rounded-3xl flex items-center justify-center">
            <Bot className="w-12 h-12 text-slate-500" />
          </div>
          <p className="text-slate-300 font-semibold text-lg">No messages to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Historical Banner */}
      {isHistorical && (
        <div className="bg-blue-500/20 border-b border-blue-500/30 px-6 py-3 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-blue-300">
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
                  <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-2xl rounded-br-md px-5 py-4 shadow-xl shadow-blue-500/20">
                    <p className="text-sm leading-relaxed">{msg.question}</p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30">
                    <User className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
            )}

            {/* Bot Message with TTS */}
            {msg.answer && (
              <div className="flex justify-start">
                <div className="flex items-end gap-3 max-w-[75%]">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 via-blue-500 to-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-slate-700/50 backdrop-blur-sm rounded-2xl rounded-bl-md px-5 py-4 shadow-xl border border-slate-600/50">
                    <p className="text-sm text-slate-200 leading-relaxed">{msg.answer}</p>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-600/50">
                      {msg.timestamp && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <p className="text-xs text-slate-400">
                            {new Date(msg.timestamp).toLocaleString()}
                          </p>
                        </div>
                      )}
                      <button
                        onClick={() => speakText(msg.answer, idx)}
                        className="p-1.5 hover:bg-slate-600/50 rounded-lg transition-all duration-200"
                        title={speaking === idx ? "Stop speaking" : "Read aloud"}
                      >
                        {speaking === idx ? (
                          <VolumeX className="w-4 h-4 text-blue-400" />
                        ) : (
                          <Volume2 className="w-4 h-4 text-slate-400 hover:text-blue-400 transition-colors" />
                        )}
                      </button>
                    </div>
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