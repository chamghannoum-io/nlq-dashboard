import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Clock, Volume2, VolumeX } from 'lucide-react';
import { apiService } from '../services/apiService';

export default function CustomChatInterface({ sessionId, onMessageSent, onVisualizationData }) {
  const [messages, setMessages] = useState([
    {
      id: 'initial',
      type: 'assistant',
      content: 'Hello! Ask me anything about your healthcare data.',
      timestamp: Date.now()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [speaking, setSpeaking] = useState(null);
  const [currentResumeUrl, setCurrentResumeUrl] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortControllerRef = useRef(null);
  const isProcessingWorkflowRef = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const speakText = (text, messageId) => {
    window.speechSynthesis.cancel();

    if (speaking === messageId) {
      setSpeaking(null);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(voice => voice.lang.startsWith('en-'));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onstart = () => setSpeaking(messageId);
    utterance.onend = () => setSpeaking(null);
    utterance.onerror = () => setSpeaking(null);

    window.speechSynthesis.speak(utterance);
  };

  // Process a single response based on its type
  const processResponse = (data) => {
    console.log('Processing response:', data);

    const responseType = data.type || 'answer';

    // Handle visualization type - only update visualization panel, don't add to chat
    if (responseType === 'visualization') {
      const embedUrl = data.embedUrl || data.embed_url;
      if (embedUrl && onVisualizationData) {
        console.log('Updating visualization panel with:', embedUrl);
        onVisualizationData({
          embedUrl: embedUrl,
          cardId: data.cardId || data.card_id,
          cardName: data.cardName || data.card_name,
          sqlQuery: data.sqlQuery || data.sql_query,
          data: data.data,
          timestamp: data.timestamp
        });
      }
      return;
    }

    // For all other types (answer, status, followup), add to chat
    const messageContent = data.message || data.answer;
    if (messageContent !== undefined) {
      const messageId = `assistant-${Date.now()}-${Math.random()}`;
      const newMessage = {
        id: messageId,
        type: 'assistant',
        content: messageContent,
        timestamp: Date.now(),
        responseType: responseType
      };

      // Add actions if present (for followup type)
      if (data.actions && Array.isArray(data.actions)) {
        newMessage.actions = data.actions;
      }

      setMessages(prev => [...prev, newMessage]);
    }
  };

  // Continue workflow by calling resume URL
  const continueWorkflow = async (resumeUrl, actionPayload = null) => {
    if (!resumeUrl || isProcessingWorkflowRef.current) {
      console.log('Skipping continueWorkflow:', { resumeUrl, isProcessing: isProcessingWorkflowRef.current });
      return;
    }

    isProcessingWorkflowRef.current = true;
    console.log('Calling continueWorkflow with resumeUrl:', resumeUrl);

    try {
      const requestBody = actionPayload
        ? { action: actionPayload.action, sessionId }
        : {};

      console.log('Resume URL request body:', requestBody);

      const response = await fetch(resumeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Resume URL response status:', response.status);

      if (!response.ok) {
        console.warn('Resume URL response not OK:', response.status);
        isProcessingWorkflowRef.current = false;
        return;
      }

      const contentType = response.headers.get('content-type') || '';
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      if (reader) {
        // Handle streaming response
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            console.log('Resume URL stream ended');
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim()) {
              try {
                const data = JSON.parse(line);
                console.log('Resume URL response data:', data);

                // Process this response
                processResponse(data);

                // Check for next resumeUrl
                const nextResumeUrl = data.resumeUrl || data.resume_url;
                if (nextResumeUrl) {
                  console.log('Found next resumeUrl:', nextResumeUrl);

                  // If response has actions, store resumeUrl for button clicks
                  if (data.actions && Array.isArray(data.actions) && data.actions.length > 0) {
                    console.log('Storing resumeUrl for action buttons');
                    setCurrentResumeUrl(nextResumeUrl);
                  } else {
                    // Otherwise, recursively continue workflow
                    isProcessingWorkflowRef.current = false;
                    await continueWorkflow(nextResumeUrl);
                    return; // Important: return to avoid setting isProcessing to false twice
                  }
                }
              } catch (e) {
                console.error('Error parsing resume URL response line:', e, 'Line:', line);
              }
            }
          }
        }

        // Process any remaining buffer
        if (buffer.trim()) {
          try {
            const data = JSON.parse(buffer);
            console.log('Resume URL buffer data:', data);
            processResponse(data);

            const nextResumeUrl = data.resumeUrl || data.resume_url;
            if (nextResumeUrl) {
              if (data.actions && Array.isArray(data.actions) && data.actions.length > 0) {
                setCurrentResumeUrl(nextResumeUrl);
              } else {
                isProcessingWorkflowRef.current = false;
                await continueWorkflow(nextResumeUrl);
                return;
              }
            }
          } catch (e) {
            console.error('Error parsing resume URL buffer:', e);
          }
        }
      } else {
        // Handle non-streaming response
        const responseText = await response.text();
        console.log('Resume URL non-streaming response:', responseText);

        try {
          const data = JSON.parse(responseText);
          processResponse(data);

          const nextResumeUrl = data.resumeUrl || data.resume_url;
          if (nextResumeUrl) {
            if (data.actions && Array.isArray(data.actions) && data.actions.length > 0) {
              setCurrentResumeUrl(nextResumeUrl);
            } else {
              isProcessingWorkflowRef.current = false;
              await continueWorkflow(nextResumeUrl);
              return;
            }
          }
        } catch (e) {
          console.error('Error parsing resume URL response:', e);
        }
      }
    } catch (error) {
      console.error('Error in continueWorkflow:', error);
    } finally {
      isProcessingWorkflowRef.current = false;
    }
  };

  const handleSendMessage = async () => {
    const messageText = inputValue.trim();
    if (!messageText || isLoading) return;

    // Add user message
    const userMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: messageText,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setCurrentResumeUrl(null); // Clear any stored resume URL from previous interaction

    if (onMessageSent) {
      onMessageSent(userMessage);
    }

    abortControllerRef.current = new AbortController();

    try {
      const response = await apiService.sendMessage(messageText, sessionId, abortControllerRef.current.signal);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let firstResumeUrl = null;

      console.log('Initial webhook response received');

      if (reader) {
        // Handle streaming response
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            console.log('Initial webhook stream ended');
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim()) {
              try {
                const data = JSON.parse(line);
                console.log('Initial webhook response data:', data);

                // Process this response
                processResponse(data);

                // Check for resumeUrl to continue workflow
                const resumeUrl = data.resumeUrl || data.resume_url;
                if (resumeUrl && !firstResumeUrl) {
                  firstResumeUrl = resumeUrl;
                }
              } catch (e) {
                console.error('Error parsing initial response line:', e, 'Line:', line);
              }
            }
          }
        }

        // Process any remaining buffer
        if (buffer.trim()) {
          try {
            const data = JSON.parse(buffer);
            console.log('Initial webhook buffer data:', data);
            processResponse(data);

            const resumeUrl = data.resumeUrl || data.resume_url;
            if (resumeUrl && !firstResumeUrl) {
              firstResumeUrl = resumeUrl;
            }
          } catch (e) {
            console.error('Error parsing initial buffer:', e);
          }
        }
      } else {
        // Handle non-streaming response
        const responseText = await response.text();
        console.log('Initial webhook non-streaming response:', responseText);

        try {
          const data = JSON.parse(responseText);
          processResponse(data);

          const resumeUrl = data.resumeUrl || data.resume_url;
          if (resumeUrl) {
            firstResumeUrl = resumeUrl;
          }
        } catch (e) {
          console.error('Error parsing initial response:', e);
        }
      }

      // If we got a resumeUrl, start the continuation workflow
      if (firstResumeUrl) {
        console.log('Starting continuation workflow with resumeUrl:', firstResumeUrl);
        await continueWorkflow(firstResumeUrl);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request aborted');
        return;
      }
      console.error('Error sending message:', error);
      
      // Add error message
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        type: 'assistant',
        content: 'Sorry, I encountered an error processing your message. Please try again.',
        timestamp: Date.now(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleActionClick = async (action) => {
    console.log('Action clicked:', action);
    console.log('Current resume URL:', currentResumeUrl);

    // If there's a stored resume URL, use it for the action
    if (currentResumeUrl) {
      setIsLoading(true);

      // Add a user message showing which action was clicked
      const actionMessage = {
        id: `user-${Date.now()}`,
        type: 'user',
        content: action.label || action.text || 'Action selected',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, actionMessage]);

      // Call the resume URL with the action payload
      await continueWorkflow(currentResumeUrl, {
        action: action.id || action.type,
        sessionId: sessionId
      });

      setIsLoading(false);
      setCurrentResumeUrl(null); // Clear after use
    } else if (action.type === 'button' && action.payload) {
      // Fallback to old behavior if no resume URL
      setInputValue(action.payload);
      setTimeout(() => {
        handleSendMessage();
      }, 10);
    }
  };

  // Group messages by user question and assistant responses
  const groupedMessages = [];
  const standaloneMessages = [];
  let currentGroup = null;
  
  messages.forEach((msg) => {
    if (msg.type === 'user') {
      currentGroup = {
        question: msg.content,
        questionTimestamp: msg.timestamp,
        answers: []
      };
      groupedMessages.push(currentGroup);
    } else if (msg.type === 'assistant') {
      if (currentGroup) {
        currentGroup.answers.push({
          id: msg.id,
          content: msg.content,
          timestamp: msg.timestamp,
          actions: msg.actions,
          isError: msg.isError
        });
      } else {
        standaloneMessages.push({
          id: msg.id,
          content: msg.content,
          timestamp: msg.timestamp,
          actions: msg.actions,
          isError: msg.isError
        });
      }
    }
  });

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-50 to-white">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* Standalone Assistant Messages (e.g., initial welcome) */}
        {standaloneMessages.map((msg) => (
          <div key={msg.id} className="flex justify-start">
            <div className="flex items-end gap-3 max-w-[75%]">
              <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                <Bot className="w-5 h-5 text-gray-700" />
              </div>
              <div className="bg-white rounded-2xl rounded-bl-sm px-5 py-3 shadow-md border border-gray-200">
                <p className="text-sm text-gray-800 leading-relaxed">{msg.content}</p>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                  {msg.timestamp && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <p className="text-xs text-gray-500">
                        {new Date(msg.timestamp).toLocaleString()}
                      </p>
                    </div>
                  )}
                  <button
                    onClick={() => speakText(msg.content, msg.id)}
                    className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                    title={speaking === msg.id ? "Stop speaking" : "Read aloud"}
                  >
                    {speaking === msg.id ? (
                      <VolumeX className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-gray-500 hover:text-blue-600 transition-colors" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {groupedMessages.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-4">
            {/* User Message */}
            <div className="flex justify-end">
              <div className="flex items-end gap-3 max-w-[75%]">
                <div className="bg-blue-600 text-white rounded-2xl rounded-br-sm px-5 py-3 shadow-md">
                  <p className="text-sm leading-relaxed">{group.question}</p>
                </div>
                <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                  <User className="w-5 h-5 text-white" />
                </div>
              </div>
                </div>

            {/* Bot Messages */}
            {group.answers.map((answer, answerIdx) => (
              <div key={answer.id} className="flex justify-start">
                <div className="flex items-end gap-3 max-w-[75%]">
                  <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                    <Bot className="w-5 h-5 text-gray-700" />
                  </div>
                  <div className="bg-white rounded-2xl rounded-bl-sm px-5 py-3 shadow-md border border-gray-200">
                    <p className="text-sm text-gray-800 leading-relaxed">{answer.content}</p>

                {/* Action Buttons */}
                    {answer.actions && Array.isArray(answer.actions) && answer.actions.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {answer.actions.map((action, actionIdx) => (
                      <button
                            key={actionIdx}
                        onClick={() => handleActionClick(action)}
                            className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        {action.label || action.text || 'Action'}
                      </button>
                    ))}
                  </div>
                )}
                    
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                      {answer.timestamp && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <p className="text-xs text-gray-500">
                            {new Date(answer.timestamp).toLocaleString()}
                          </p>
                        </div>
                      )}
                      <button
                        onClick={() => speakText(answer.content, answer.id)}
                        className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                        title={speaking === answer.id ? "Stop speaking" : "Read aloud"}
                      >
                        {speaking === answer.id ? (
                          <VolumeX className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Volume2 className="w-4 h-4 text-gray-500 hover:text-blue-600 transition-colors" />
                        )}
                      </button>
                    </div>
              </div>
            </div>
          </div>
        ))}

            {/* Typing Indicator */}
            {isLoading && groupIdx === groupedMessages.length - 1 && group.answers.length === 0 && (
              <div className="flex justify-start">
                <div className="flex items-end gap-3 max-w-[75%]">
                  <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                    <Bot className="w-5 h-5 text-gray-700" />
                  </div>
                  <div className="bg-white rounded-2xl rounded-bl-sm px-5 py-3 shadow-md border border-gray-200">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white px-6 py-4">
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your question..."
              rows={1}
              className="w-full px-4 py-3 pr-12 rounded-2xl border border-gray-300 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              style={{
                minHeight: '50px',
                maxHeight: '120px'
              }}
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="absolute right-2 bottom-2 p-2 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 text-white hover:bg-blue-700 disabled:hover:bg-blue-600"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

