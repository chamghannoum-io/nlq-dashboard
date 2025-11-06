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
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortControllerRef = useRef(null);

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

    if (onMessageSent) {
      onMessageSent(userMessage);
    }

    abortControllerRef.current = new AbortController();
    let resumeUrlCalled = false; // Track if resume URL has been called

    const callResumeUrl = (resumeUrl) => {
      if (resumeUrl && !resumeUrlCalled) {
        resumeUrlCalled = true;
        console.log('Calling resume URL (Stage 2):', resumeUrl);
        
        setTimeout(() => {
          fetch(resumeUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
          })
            .then(async response => {
              console.log('Resume URL response status:', response.status);
              
              if (response.ok) {
                try {
                  const responseText = await response.text();
                  console.log('Resume URL response text:', responseText);
                  
                  let responseData;
                  try {
                    responseData = JSON.parse(responseText);
                    console.log('Resume URL response data (parsed):', responseData);
                  } catch (parseError) {
                    const lines = responseText.trim().split('\n');
                    console.log(`Resume URL response has ${lines.length} line(s)`);
                    
                    for (const line of lines) {
                      if (line.trim()) {
                        try {
                          responseData = JSON.parse(line);
                          console.log('Parsed resume URL response line:', responseData);
                          handleResumeUrlResponse(responseData);
                        } catch (e) {
                          console.error('Failed to parse resume URL response line:', e);
                        }
                      }
                    }
                    return; 
                  }
                  
                  handleResumeUrlResponse(responseData);
                } catch (error) {
                  console.error('Error processing resume URL response:', error);
                }
              } else {
                console.warn('Resume URL response not OK:', response.status);
              }
            })
            .catch(error => {
              console.error('Error calling resume URL:', error);
            });
        }, 100); 
      }
    };

    const handleResumeUrlResponse = (data) => {
      console.log('Processing resume URL response:', data);
      
      if (!onVisualizationData) {
        console.error('onVisualizationData callback is not available!');
        return;
      }
      
      if (Array.isArray(data)) {
        console.log('Resume URL response is array with', data.length, 'items');
        data.forEach((item, index) => {
          console.log(`Processing resume URL response item ${index}:`, item);
          
          const embedUrl = item.embedUrl || item.embed_url;
          if (embedUrl) {
            console.log('Found embedUrl in resume URL response item:', embedUrl);
            onVisualizationData({
              embedUrl: embedUrl,
              cardId: item.cardId || item.card_id,
              cardName: item.cardName || item.card_name,
              sqlQuery: item.sqlQuery || item.sql_query,
              data: item.data,
              timestamp: item.timestamp
            });
          }
          
          const messageContent = item.message || item.answer;
          if (messageContent !== undefined) {
            const messageId = `assistant-${Date.now()}-${Math.random()}`;
            setMessages(prev => [...prev, {
              id: messageId,
              type: 'assistant',
              content: messageContent,
              timestamp: Date.now(),
              actions: item.actions
            }]);
          }
        });
      } else {
        console.log('Resume URL response is single object');
        
        const embedUrl = data.embedUrl || data.embed_url;
        console.log('Resume URL response embedUrl check:', { embedUrl: data.embedUrl, embed_url: data.embed_url, result: embedUrl });
        if (embedUrl) {
          console.log('Found embedUrl in resume URL response, calling onVisualizationData:', embedUrl);
          onVisualizationData({
            embedUrl: embedUrl,
            cardId: data.cardId || data.card_id,
            cardName: data.cardName || data.card_name,
            sqlQuery: data.sqlQuery || data.sql_query,
            data: data.data,
            timestamp: data.timestamp
          });
        } else {
          console.log('No embedUrl found in resume URL response');
        }
        
        const messageContent = data.message || data.answer;
        if (messageContent !== undefined) {
          const messageId = `assistant-${Date.now()}-${Math.random()}`;
          setMessages(prev => [...prev, {
            id: messageId,
            type: 'assistant',
            content: messageContent,
            timestamp: Date.now(),
            actions: data.actions
          }]);
        }
      }
    };

    try {
      const response = await apiService.sendMessage(messageText, sessionId, abortControllerRef.current.signal);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type') || '';
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      console.log('Response received, content-type:', contentType);
      console.log('Has reader?', !!reader);

      if (reader) {
        let payloadCount = 0;
        let streamClosed = false;
        
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log('Stream ended. Total payloads processed:', payloadCount);
            streamClosed = true;
            
            // If we haven't received the second payload yet, wait a bit longer
            // The resume URL triggers the workflow to send the second payload
            if (!streamClosed || payloadCount === 0) {
              console.log('Stream closed but may receive more data after resume URL call...');
            }
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; 

          console.log(`Processing ${lines.length} line(s) from stream chunk`);

          for (const line of lines) {
            if (line.trim()) {
              try {
                payloadCount++;
                const data = JSON.parse(line);
                
                console.log(`[Payload #${payloadCount}] Parsed streaming response data:`, data);
                console.log(`[Payload #${payloadCount}] Is array?`, Array.isArray(data));
                console.log(`[Payload #${payloadCount}] Has embedUrl?`, !!(data.embedUrl || data.embed_url));
                console.log(`[Payload #${payloadCount}] Has message/answer?`, !!(data.message || data.answer));
                
                if (Array.isArray(data)) {
                  console.log('Processing array in streaming response with', data.length, 'items');
                  data.forEach((item, index) => {
                    console.log(`Processing streaming array item ${index}:`, item);
                    
                    const resumeUrl = item.resumeUrl || item.resume_url;
                    if (resumeUrl && !resumeUrlCalled) {
                      console.log('Found resumeUrl in streaming array item:', resumeUrl);
                      callResumeUrl(resumeUrl);
                    }
                    
                    const itemEmbedUrl = item.embedUrl || item.embed_url;
                    console.log(`Streaming item ${index} embedUrl check:`, { embedUrl: item.embedUrl, embed_url: item.embed_url, result: itemEmbedUrl });
                    if (itemEmbedUrl && onVisualizationData) {
                      console.log('Found embedUrl in streaming array item:', itemEmbedUrl);
                      onVisualizationData({
                        embedUrl: itemEmbedUrl,
                        cardId: item.cardId || item.card_id,
                        cardName: item.cardName || item.card_name,
                        sqlQuery: item.sqlQuery || item.sql_query,
                        data: item.data,
                        timestamp: item.timestamp
                      });
                    }
                    
                    const itemMessage = item.message || item.answer;
                    if (itemMessage !== undefined) {
                      const messageId = `assistant-${Date.now()}-${Math.random()}`;
                      setMessages(prev => [...prev, {
                        id: messageId,
                        type: 'assistant',
                        content: itemMessage,
                        timestamp: Date.now(),
                        actions: item.actions
                      }]);
                    }
                  });
                } else {
                  // Check for resume URL first (before message check)
                  if (data.resumeUrl && !resumeUrlCalled) {
                    console.log('Found resumeUrl in streaming response:', data.resumeUrl);
                    callResumeUrl(data.resumeUrl);
                  }
                  
                  const embedUrl = data.embedUrl || data.embed_url;
                  console.log(`[Payload #${payloadCount}] Streaming single object embedUrl check:`, { embedUrl: data.embedUrl, embed_url: data.embed_url, result: embedUrl, hasCallback: !!onVisualizationData });
                  if (embedUrl) {
                    if (onVisualizationData) {
                      console.log(`[Payload #${payloadCount}] Found embedUrl in streaming response, calling onVisualizationData:`, embedUrl);
                      onVisualizationData({
                        embedUrl: embedUrl,
                        cardId: data.cardId || data.card_id,
                        cardName: data.cardName || data.card_name,
                        sqlQuery: data.sqlQuery || data.sql_query,
                        data: data.data,
                        timestamp: data.timestamp
                      });
                    } else {
                      console.warn(`[Payload #${payloadCount}] embedUrl found but onVisualizationData callback is not provided!`);
                    }
                  } else {
                    console.log(`[Payload #${payloadCount}] No embedUrl in this payload`);
                  }
                  
                  const messageContent = data.message || data.answer;
                  if (messageContent !== undefined) {
                  const messageId = `assistant-${Date.now()}-${Math.random()}`;
                  setMessages(prev => [...prev, {
                    id: messageId,
                      type: 'assistant',
                      content: messageContent,
                    timestamp: Date.now(),
                    actions: data.actions
                  }]);
                  }
                }
              } catch (e) {
                console.error('Error parsing streaming line:', e, 'Line:', line);
                if (line.trim()) {
                  const messageId = `assistant-${Date.now()}-${Math.random()}`;
                  setMessages(prev => [...prev, {
                    id: messageId,
                    type: 'assistant',
                    content: line.trim(),
                    timestamp: Date.now()
                  }]);
                }
              }
            }
          }
        }

        // Process any remaining buffer - might contain multiple JSON objects separated by newlines
        if (buffer.trim()) {
          console.log('Processing buffer:', buffer);
          const bufferLines = buffer.trim().split('\n');
          console.log(`Buffer has ${bufferLines.length} potential JSON object(s)`);
          
          for (const line of bufferLines) {
            if (line.trim()) {
              try {
                const data = JSON.parse(line);
                payloadCount++;
                console.log(`[Buffer Payload #${payloadCount}] Parsed buffer data:`, data);
                
                if (data.resumeUrl && !resumeUrlCalled) {
                  console.log(`[Buffer Payload #${payloadCount}] Found resumeUrl in buffer:`, data.resumeUrl);
                  callResumeUrl(data.resumeUrl);
                }
                
                const embedUrl = data.embedUrl || data.embed_url;
                if (embedUrl && onVisualizationData) {
                  console.log(`[Buffer Payload #${payloadCount}] Found embedUrl in buffer:`, embedUrl);
                  onVisualizationData({
                    embedUrl: embedUrl,
                    cardId: data.cardId || data.card_id,
                    cardName: data.cardName || data.card_name,
                    sqlQuery: data.sqlQuery || data.sql_query,
                    data: data.data,
                    timestamp: data.timestamp
                  });
                }
                
                const messageContent = data.message || data.answer;
                if (messageContent !== undefined) {
              const messageId = `assistant-${Date.now()}-${Math.random()}`;
              setMessages(prev => [...prev, {
                id: messageId,
                    type: 'assistant',
                    content: messageContent,
                timestamp: Date.now(),
                actions: data.actions
              }]);
            }
          } catch (e) {
                console.error('Error parsing buffer line:', e, 'Line:', line);
                if (line.trim()) {
              const messageId = `assistant-${Date.now()}-${Math.random()}`;
              setMessages(prev => [...prev, {
                id: messageId,
                type: 'assistant',
                    content: line.trim(),
                timestamp: Date.now()
              }]);
                }
              }
            }
          }
        }
      } else {
        const responseText = await response.text();
        console.log('Non-streaming response text:', responseText);
        
        let data;
        try {
          data = JSON.parse(responseText);
          console.log('Non-streaming response data (parsed):', data);
          console.log('Is array?', Array.isArray(data));
        } catch (parseError) {
          console.error('Failed to parse non-streaming response:', parseError);
          throw new Error('Invalid JSON response');
        }
        
        if (data.resumeUrl && !resumeUrlCalled) {
          console.log('Found resumeUrl in non-streaming response:', data.resumeUrl);
          callResumeUrl(data.resumeUrl);
        }
        
        const embedUrl = data.embedUrl || data.embed_url;
        if (embedUrl && onVisualizationData) {
          console.log('Found embedUrl in non-streaming response:', embedUrl);
          onVisualizationData({
            embedUrl: embedUrl,
            cardId: data.cardId || data.card_id,
            cardName: data.cardName || data.card_name,
            sqlQuery: data.sqlQuery || data.sql_query,
            data: data.data,
            timestamp: data.timestamp
          });
        }
        
        if (Array.isArray(data)) {
          console.log('Processing array response with', data.length, 'items');
          data.forEach((item, index) => {
            console.log(`Processing array item ${index}:`, item);
            
            const resumeUrl = item.resumeUrl || item.resume_url;
            if (resumeUrl && !resumeUrlCalled) {
              console.log('Found resumeUrl in array item:', resumeUrl);
              callResumeUrl(resumeUrl);
            }
            
            const itemEmbedUrl = item.embedUrl || item.embed_url;
            console.log(`Item ${index} embedUrl check:`, { embedUrl: item.embedUrl, embed_url: item.embed_url, result: itemEmbedUrl });
            if (itemEmbedUrl && onVisualizationData) {
              console.log('Found embedUrl in array item:', itemEmbedUrl);
              onVisualizationData({
                embedUrl: itemEmbedUrl,
                cardId: item.cardId || item.card_id,
                cardName: item.cardName || item.card_name,
                sqlQuery: item.sqlQuery || item.sql_query,
                data: item.data,
                timestamp: item.timestamp
              });
            } else {
              console.log(`No embedUrl found in item ${index} or onVisualizationData not provided`, {
                hasEmbedUrl: !!itemEmbedUrl,
                hasCallback: !!onVisualizationData
              });
            }
            
            const itemMessage = item.message || item.answer;
            if (itemMessage !== undefined) {
              const messageId = `assistant-${Date.now()}-${Math.random()}`;
              setMessages(prev => [...prev, {
                id: messageId,
                type: 'assistant',
                content: itemMessage,
                timestamp: Date.now(),
                actions: item.actions
              }]);
            }
          });
        } else {
          const messageContent = data.message || data.answer;
          if (messageContent !== undefined) {
            const messageId = `assistant-${Date.now()}`;
            setMessages(prev => [...prev, {
              id: messageId,
              type: 'assistant',
              content: messageContent,
              timestamp: Date.now(),
              actions: data.actions
            }]);
          }
        }
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
    if (action.type === 'button' && action.payload) {
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

