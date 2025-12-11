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

  // Parse table from markdown-style format
  const parseTable = (lines, startIndex) => {
    const tableLines = [];
    let i = startIndex;
    
    // Find header row
    if (i >= lines.length) return null;
    const headerLine = lines[i].trim();
    if (!headerLine.includes('|')) return null;
    
    const headers = headerLine.split('|').map(h => h.trim()).filter(h => h);
    if (headers.length === 0) return null;
    
    i++;
    
    // Skip separator row (---|---|---)
    if (i < lines.length && lines[i].trim().match(/^[\s\-\|:]+$/)) {
      i++;
    }
    
    // Collect data rows
    const rows = [];
    while (i < lines.length) {
      const line = lines[i].trim();
      if (!line || !line.includes('|')) break;
      
      const cells = line.split('|').map(c => c.trim()).filter(c => c);
      if (cells.length > 0) {
        rows.push(cells);
      }
      i++;
    }
    
    if (rows.length === 0) return null;
    
    return {
      type: 'table',
      headers,
      rows,
      endIndex: i - 1
    };
  };

  // Format structured messages with proper styling
  const formatMessage = (content) => {
    if (!content) return null;

    const lines = content.split('\n');
    const elements = [];
    let currentSection = [];
    let i = 0;

    while (i < lines.length) {
      const trimmed = lines[i].trim();
      
      // Empty line - end current section
      if (!trimmed) {
        if (currentSection.length > 0) {
          elements.push({ type: 'section', content: currentSection });
          currentSection = [];
        }
        i++;
        continue;
      }

      // Check for table
      const table = parseTable(lines, i);
      if (table) {
        if (currentSection.length > 0) {
          elements.push({ type: 'section', content: currentSection });
          currentSection = [];
        }
        elements.push(table);
        i = table.endIndex + 1;
        continue;
      }

      // Check for main header (contains "Alert", "Status", or starts with numbers)
      if (trimmed.includes('Alert') || trimmed.includes('Status') || /^\d+/.test(trimmed)) {
        if (currentSection.length > 0) {
          elements.push({ type: 'section', content: currentSection });
          currentSection = [];
        }
        elements.push({ type: 'header', content: trimmed });
        i++;
        continue;
      }

      // Check for sub-header (Critical Priorities, Total, Regional, Select, Shortage Details)
      if (trimmed.includes('Priorities:') || trimmed.startsWith('Total') || trimmed.startsWith('Regional') || trimmed.startsWith('Select') || trimmed.includes('Details')) {
        if (currentSection.length > 0) {
          elements.push({ type: 'section', content: currentSection });
          currentSection = [];
        }
        elements.push({ type: 'subheader', content: trimmed });
        i++;
        continue;
      }

      // Check for bullet points
      if (trimmed.startsWith('•')) {
        currentSection.push({ type: 'bullet', content: trimmed.substring(1).trim() });
        i++;
        continue;
      }

      // Regular text
      currentSection.push({ type: 'text', content: trimmed });
      i++;
    }

    // Add remaining section
    if (currentSection.length > 0) {
      elements.push({ type: 'section', content: currentSection });
    }

    return elements;
  };

  // Render formatted message content - clean standard template for all messages
  const renderFormattedMessage = (content) => {
    const formatted = formatMessage(content);
    
    if (!formatted || formatted.length === 0) {
      return <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{content}</p>;
    }

    return (
      <div className="text-sm text-slate-200 leading-relaxed space-y-2.5">
        {formatted.map((element, idx) => {
          if (element.type === 'header') {
            return (
              <h3 key={idx} className="text-sm font-semibold text-white mb-1.5">
                {element.content}
              </h3>
            );
          }
          
          if (element.type === 'subheader') {
            return (
              <h4 key={idx} className="text-sm font-medium text-slate-300 mt-2.5 mb-1.5">
                {element.content}
              </h4>
            );
          }
          
          if (element.type === 'table') {
            return (
              <div key={idx} className="mt-3 mb-3 overflow-x-auto rounded-xl border border-slate-600/50">
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-600/30">
                      {element.headers.map((header, headerIdx) => (
                        <th 
                          key={headerIdx} 
                          className="px-4 py-3 text-left font-semibold text-slate-200 border-b border-slate-600/50"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {element.rows.map((row, rowIdx) => (
                      <tr 
                        key={rowIdx} 
                        className={rowIdx % 2 === 0 ? 'bg-slate-700/20' : 'bg-slate-700/10'}
                      >
                        {row.map((cell, cellIdx) => {
                          // Check if this is a priority cell
                          const isPriority = cellIdx === 1 && (cell === 'HIGH' || cell === 'MODERATE' || cell === 'LOW');
                          return (
                            <td 
                              key={cellIdx} 
                              className={`px-4 py-3 text-slate-300 border-b border-slate-700/30 ${
                                isPriority ? '' : ''
                              }`}
                            >
                              {isPriority ? (
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                                  cell === 'HIGH' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                                  cell === 'MODERATE' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                                  cell === 'LOW' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                                  'bg-slate-600/30 text-slate-300 border border-slate-600/30'
                                }`}>
                                  {cell}
                                </span>
                              ) : (
                                cell
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }
          
          if (element.type === 'section') {
            return (
              <div key={idx} className="space-y-1.5">
                {element.content.map((item, itemIdx) => {
                  if (item.type === 'bullet') {
                    // Parse priority badges and format
                    const parts = item.content.split('—');
                    const mainPart = parts[0]?.trim() || '';
                    const details = parts[1]?.trim() || '';
                    
                    // Extract priority badge [HIGH], [MODERATE], etc.
                    const priorityMatch = mainPart.match(/\[([^\]]+)\]/);
                    const priority = priorityMatch ? priorityMatch[1] : null;
                    const bloodType = mainPart.replace(/\[([^\]]+)\]/, '').trim();
                    
                    // Split details by pipe for better formatting
                    const detailParts = details ? details.split('|').map(d => d.trim()) : [];
                    
                    return (
                      <div key={itemIdx} className="flex items-start gap-2">
                        <span className="text-blue-400 mt-0.5 text-sm">•</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-white text-sm">{bloodType}</span>
                            {priority && (
                              <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                                priority === 'HIGH' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                                priority === 'MODERATE' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                                priority === 'LOW' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                                'bg-slate-600/30 text-slate-300 border border-slate-600/30'
                              }`}>
                                {priority}
                              </span>
                            )}
                          </div>
                          {detailParts.length > 0 && (
                            <div className="text-slate-400 text-xs mt-1 ml-0">
                              <span className="text-slate-500">—</span> {detailParts.join(' • ')}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <p key={itemIdx} className="text-slate-300 text-sm">
                      {item.content}
                    </p>
                  );
                })}
              </div>
            );
          }
          
          return null;
        })}
      </div>
    );
  };

  // Process a single response based on its type
  const processResponse = (data) => {
    console.log('Processing response:', data);

    const responseType = data.type || 'answer';

    // If there's an embed URL in any response, update the visualization panel immediately
    const embedUrlAny = data.embedUrl || data.embed_url;
    if (embedUrlAny && onVisualizationData) {
      console.log('Updating visualization panel with (any type):', embedUrlAny);
      onVisualizationData({
        embedUrl: embedUrlAny,
        cardId: data.cardId || data.card_id,
        cardName: data.cardName || data.card_name,
        sqlQuery: data.sqlQuery || data.sql_query,
        data: data.data,
        timestamp: data.timestamp
      });
      // Do not return here; still allow chat message to be added if present
    }

    // Handle explicit visualization type - historically used to only update panel
    if (responseType === 'visualization') {
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
        responseType: responseType,
        isFollowup: responseType === 'followup'
      };

      // Add actions if present (for followup type)
      if (data.actions && Array.isArray(data.actions)) {
        newMessage.actions = data.actions;
      }

      setMessages(prev => [...prev, newMessage]);
    }
  };

  // Helper function to check if response is a placeholder
  const isPlaceholderResponse = (data) => {
    if (!data || typeof data !== 'object') return false;

    // Check for common n8n placeholder messages
    const placeholderMessages = [
      'Workflow was started',
      'Workflow is executing',
      'Please wait'
    ];

    const message = data.message || '';
    return placeholderMessages.some(placeholder =>
      message.toLowerCase().includes(placeholder.toLowerCase())
    ) && !data.type && !data.actions && !data.embedUrl && !data.embed_url;
  };

  // Check if response is waiting for user input based on waitType field
  const isWaitingForUserInput = (data) => {
    // Check for explicit waitType field
    if (data.waitType) {
      // "interactive" means wait for user input
      // "automatic" means continue automatically
      return data.waitType === 'interactive';
    }
    
    // Fallback to old behavior if waitType is not present
    // If there are actions, it's definitely waiting for user input
    if (data.actions && Array.isArray(data.actions) && data.actions.length > 0) {
      return true;
    }
    
    // If there's a message, chart, table, or embed - it's showing content and might be waiting for response
    if (data.message || data.chart || data.table || data.embedUrl || data.embed_url) {
      return true;
    }
    
    // If it's just a placeholder or empty response, don't wait
    return false;
  };

  // Continue workflow by calling resume URL with retry logic
  const continueWorkflow = async (resumeUrl, actionPayload = null, retryCount = 0, maxRetries = 5) => {
    if (!resumeUrl || isProcessingWorkflowRef.current) {
      console.log('Skipping continueWorkflow:', { resumeUrl, isProcessing: isProcessingWorkflowRef.current });
      return;
    }

    isProcessingWorkflowRef.current = true;
    console.log(`Calling continueWorkflow with resumeUrl (attempt ${retryCount + 1}/${maxRetries + 1}):`, resumeUrl);

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

      // Handle 409 Conflict - resume URL already consumed
      if (response.status === 409) {
        console.log('Resume URL already consumed (409), ending workflow');
        isProcessingWorkflowRef.current = false;
        return;
      }

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

                // Check if this is a placeholder response that needs retry
                if (isPlaceholderResponse(data)) {
                  if (retryCount < maxRetries) {
                    const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
                    console.log(`Detected placeholder response, retrying in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
                    isProcessingWorkflowRef.current = false;

                    setTimeout(() => {
                      continueWorkflow(resumeUrl, actionPayload, retryCount + 1, maxRetries);
                    }, delay);
                    return;
                  } else {
                    console.warn('Max retries reached for placeholder response, giving up');
                    continue; // Skip this line and continue processing
                  }
                }

                // Process this response
                processResponse(data);

                // Check for next resumeUrl
                const nextResumeUrl = data.resumeUrl || data.resume_url;
                if (nextResumeUrl) {
                  console.log('Found next resumeUrl:', nextResumeUrl);

                  // If response is waiting for user input (has actions or content), store resumeUrl
                  if (isWaitingForUserInput(data)) {
                    console.log('Storing resumeUrl - waiting for user input');
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

            // Check if this is a placeholder response that needs retry
            if (isPlaceholderResponse(data)) {
              if (retryCount < maxRetries) {
                const delay = Math.min(1000 * Math.pow(2, retryCount), 5000); // Exponential backoff, max 5s
                console.log(`Detected placeholder response, retrying in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
                isProcessingWorkflowRef.current = false;

                setTimeout(() => {
                  continueWorkflow(resumeUrl, actionPayload, retryCount + 1, maxRetries);
                }, delay);
                return;
              } else {
                console.warn('Max retries reached for placeholder response, giving up');
                isProcessingWorkflowRef.current = false;
                return;
              }
            }

            // Process valid response
            processResponse(data);

            const nextResumeUrl = data.resumeUrl || data.resume_url;
            if (nextResumeUrl) {
              if (isWaitingForUserInput(data)) {
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

          // Check if this is a placeholder response that needs retry
          if (isPlaceholderResponse(data)) {
            if (retryCount < maxRetries) {
              const delay = Math.min(1000 * Math.pow(2, retryCount), 5000); // Exponential backoff, max 5s
              console.log(`Detected placeholder response, retrying in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
              isProcessingWorkflowRef.current = false;

              setTimeout(() => {
                continueWorkflow(resumeUrl, actionPayload, retryCount + 1, maxRetries);
              }, delay);
              return;
            } else {
              console.warn('Max retries reached for placeholder response, giving up');
              isProcessingWorkflowRef.current = false;
              return;
            }
          }

          // Process valid response
          processResponse(data);

          const nextResumeUrl = data.resumeUrl || data.resume_url;
          if (nextResumeUrl) {
            if (isWaitingForUserInput(data)) {
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

    // Check if there's a pending resumeUrl to respond to
    const pendingResumeUrl = currentResumeUrl;
    setCurrentResumeUrl(null); // Clear any stored resume URL from previous interaction

    if (onMessageSent) {
      onMessageSent(userMessage);
    }

    abortControllerRef.current = new AbortController();

    try {
      // If there's a pending resumeUrl, send the message there instead of the normal endpoint
      const response = pendingResumeUrl 
        ? await apiService.sendMessageToResumeUrl(pendingResumeUrl, messageText, sessionId, abortControllerRef.current.signal)
        : await apiService.sendMessage(messageText, sessionId, abortControllerRef.current.signal);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let firstResumeUrl = null;
      let lastResponseData = null;

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
                  lastResponseData = data;
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
              lastResponseData = data;
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
            lastResponseData = data;
          }
        } catch (e) {
          console.error('Error parsing initial response:', e);
        }
      }

      // If we got a resumeUrl, check waitType to determine next action
      if (firstResumeUrl && lastResponseData) {
        console.log('Checking waitType for resumeUrl:', firstResumeUrl);
        
        if (isWaitingForUserInput(lastResponseData)) {
          console.log('WaitType is interactive - storing resumeUrl for user action');
          setCurrentResumeUrl(firstResumeUrl);
        } else {
          console.log('WaitType is automatic - continuing workflow automatically');
          await continueWorkflow(firstResumeUrl);
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

      // Parse action data if it's in the value field as JSON string
      let actionData = action;
      if (action.value && typeof action.value === 'string') {
        try {
          actionData = JSON.parse(action.value);
          console.log('Parsed action data from value:', actionData);
        } catch (e) {
          console.warn('Failed to parse action.value:', e);
          // If parsing fails, use the original action object
        }
      }

      // Call the resume URL with the action payload
      const payload = {
        action: actionData,
        sessionId: sessionId
      };
      console.log('Sending action payload to resume URL:', payload);
      
      await continueWorkflow(currentResumeUrl, payload);

      setIsLoading(false);
      // Don't clear currentResumeUrl here - continueWorkflow will set the next one if present
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
          isError: msg.isError,
          responseType: msg.responseType
        });
      } else {
        standaloneMessages.push({
          id: msg.id,
          content: msg.content,
          timestamp: msg.timestamp,
          actions: msg.actions,
          isError: msg.isError,
          responseType: msg.responseType
        });
      }
    }
  });

  return (
    <div className="flex flex-col h-full bg-transparent relative">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8">
        {/* Standalone Assistant Messages (e.g., initial welcome) */}
        {standaloneMessages.map((msg) => (
          <div key={msg.id} className="flex justify-start animate-slide-in">
            <div className="flex items-start gap-4 max-w-[80%]">
              <div className="relative">
                <div className="w-11 h-11 bg-gradient-to-br from-purple-500 via-blue-500 to-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/40 ring-2 ring-slate-700/50">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-slate-800"></div>
              </div>
              <div className="flex-1">
                <div className="bg-gradient-to-br from-slate-700/60 to-slate-700/40 backdrop-blur-md rounded-3xl rounded-tl-md px-6 py-5 shadow-2xl border border-slate-600/50 hover:border-slate-500/50 transition-all duration-300">
                  {renderFormattedMessage(msg.content)}
                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-600/40">
                    {msg.timestamp && (
                      <div className="flex items-center gap-2 flex-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <p className="text-xs text-slate-400 font-medium">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    )}
                    <button
                      onClick={() => speakText(msg.content, msg.id)}
                      className="p-2 hover:bg-slate-600/50 rounded-xl transition-all duration-200 group"
                      title={speaking === msg.id ? "Stop speaking" : "Read aloud"}
                    >
                      {speaking === msg.id ? (
                        <VolumeX className="w-4 h-4 text-blue-400" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {groupedMessages.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-6 animate-slide-in">
            {/* User Message */}
            <div className="flex justify-end">
              <div className="flex items-start gap-4 max-w-[80%]">
                <div className="flex-1">
                  <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-blue-600 text-white rounded-3xl rounded-tr-md px-6 py-5 shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/40 transition-all duration-300">
                    <p className="text-sm leading-relaxed font-medium">{group.question}</p>
                    <p className="text-xs text-blue-100 mt-3 opacity-75">
                      {new Date(group.questionTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/40 ring-2 ring-slate-700/50">
                  <User className="w-6 h-6 text-white" />
                </div>
              </div>
                </div>

            {/* Bot Messages */}
            {group.answers.map((answer, answerIdx) => (
              <div key={answer.id} className="flex justify-start">
                <div className="flex items-start gap-4 max-w-[80%]">
                  <div className="relative">
                    <div className="w-11 h-11 bg-gradient-to-br from-purple-500 via-blue-500 to-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/40 ring-2 ring-slate-700/50">
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-slate-800"></div>
                  </div>
                  <div className="flex-1">
                    <div className="bg-gradient-to-br from-slate-700/60 to-slate-700/40 backdrop-blur-md rounded-3xl rounded-tl-md px-6 py-5 shadow-2xl border border-slate-600/50 hover:border-slate-500/50 transition-all duration-300">
                      {renderFormattedMessage(answer.content)}

                  {/* Action Buttons */}
                      {answer.actions && Array.isArray(answer.actions) && answer.actions.length > 0 && (
                        <div className="flex flex-wrap gap-2.5 mt-5">
                          {answer.actions.map((action, actionIdx) => (
                        <button
                              key={actionIdx}
                          onClick={() => handleActionClick(action)}
                              className="px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-500 hover:to-blue-400 transition-all duration-200 shadow-lg shadow-blue-500/40 hover:shadow-blue-500/60 active:scale-95"
                        >
                          {action.label || action.text || 'Action'}
                        </button>
                      ))}
                    </div>
                  )}
                      
                      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-600/40">
                        {answer.timestamp && (
                          <div className="flex items-center gap-2 flex-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <p className="text-xs text-slate-400 font-medium">
                              {new Date(answer.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        )}
                        <button
                          onClick={() => speakText(answer.content, answer.id)}
                          className="p-2 hover:bg-slate-600/50 rounded-xl transition-all duration-200 group"
                          title={speaking === answer.id ? "Stop speaking" : "Read aloud"}
                        >
                          {speaking === answer.id ? (
                            <VolumeX className="w-4 h-4 text-blue-400" />
                          ) : (
                            <Volume2 className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
                          )}
                        </button>
                      </div>
                </div>
              </div>
            </div>
          </div>
        ))}

            {/* Typing Indicator */}
            {isLoading && groupIdx === groupedMessages.length - 1 && group.answers.length === 0 && (
              <div className="flex justify-start">
                <div className="flex items-start gap-4 max-w-[80%]">
                  <div className="relative">
                    <div className="w-11 h-11 bg-gradient-to-br from-purple-500 via-blue-500 to-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/40 ring-2 ring-slate-700/50 animate-pulse">
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-yellow-400 rounded-full border-2 border-slate-800 animate-pulse"></div>
                  </div>
                  <div className="bg-gradient-to-br from-slate-700/60 to-slate-700/40 backdrop-blur-md rounded-3xl rounded-tl-md px-6 py-5 shadow-2xl border border-slate-600/50">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
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
      <div className="border-t border-slate-700/50 bg-slate-800/40 backdrop-blur-md px-8 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask me anything about your data..."
              rows={1}
              className="w-full px-6 py-4 pr-16 rounded-2xl bg-slate-700/60 border-2 border-slate-600/50 text-white placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm transition-all duration-200 shadow-xl"
              style={{
                minHeight: '60px',
                maxHeight: '120px'
              }}
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="absolute right-3 bottom-3 p-3.5 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-500 hover:to-blue-400 disabled:hover:from-blue-600 disabled:hover:to-blue-500 shadow-lg shadow-blue-500/40 hover:shadow-blue-500/60 active:scale-95"
              title="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-3 text-center">
            Press <kbd className="px-2 py-0.5 rounded bg-slate-700/50 border border-slate-600/50 text-slate-400 font-mono">Enter</kbd> to send, <kbd className="px-2 py-0.5 rounded bg-slate-700/50 border border-slate-600/50 text-slate-400 font-mono">Shift + Enter</kbd> for new line
          </p>
        </div>
      </div>
    </div>
  );
}

