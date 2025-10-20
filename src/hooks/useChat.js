import { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/apiService.js';

// Hook for managing chat state and API calls
export const useChat = () => {
  const [sessionId, setSessionId] = useState(null);
  const [question, setQuestion] = useState('');
  const [currentChat, setCurrentChat] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    console.log('Current chat changed:', currentChat);
    scrollToBottom();
  }, [currentChat]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const historyData = await apiService.loadHistory();
      if (Array.isArray(historyData) && historyData.length > 0) {
        setHistory(historyData);
      } else {
        console.warn('History fetch returned empty or non-JSON; keeping existing history');
      }
    } catch (error) {
      console.error('Failed to load history:', error);
      setHistory([]);
    }
  };

  const sendMessage = async () => {
    if (!question.trim()) return;

    console.log('Sending message:', question.trim());
    
    // Optimistic UI: show the user's question immediately
    const optimistic = {
      question: question.trim(),
      answer: 'Working on it…',
      should_visualize: true
    };
    setCurrentChat(optimistic);
    setLoading(true);
    try {
      const askedAtMs = Date.now();
      const askedQuestion = question.trim();
      const askedQuestionLc = askedQuestion.toLowerCase();
      const chatData = await apiService.sendQuestion(askedQuestion, sessionId);
      
      if (!sessionId && chatData.session_id) {
        setSessionId(chatData.session_id);
        console.log('Set new session ID:', chatData.session_id);
      }

      setCurrentChat(chatData);
      console.log('Set current chat:', chatData);
      setQuestion('');
      
      // Always refresh history after sending (backend may enrich later)
      await loadHistory();
      setSelectedHistoryId(null);

      // If visualization details are not ready yet, poll history briefly to pick up embed_url
      if (!chatData?.embed_url) {
        try {
          const maxAttempts = 5;
          const delayMs = 1200;
          for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const latest = await apiService.loadHistory();
            // Prefer most recent entry for THIS question (avoid switching to older completed items)
            const enriched = latest.find((h) => {
              const q = (h.question || '').trim().toLowerCase();
              const sameQuestion = q === askedQuestionLc;
              const sameSession = (chatData.session_id && h.session_id === chatData.session_id) || !chatData.session_id || !h.session_id;
              const tsOk = (() => {
                const t = Date.parse(h.timestamp || '');
                return Number.isFinite(t) ? (t >= askedAtMs - 5000) : true; // allow small skew
              })();
              return sameQuestion && sameSession && tsOk && !!h.embed_url;
            });
            if (enriched) {
              setCurrentChat(enriched);
              break;
            }
            await new Promise((r) => setTimeout(r, delayMs));
          }
        } catch (e) {
          console.warn('Polling for visualization failed:', e);
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Check if it's a CORS error but workflow might have executed
      if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
        console.log('CORS error detected, but workflow may have executed');
        // Show a message indicating the request was sent
        const corsChat = {
          question: question.trim(),
          answer: "Your question has been sent! However, there's a CORS issue preventing the response from displaying. Please check your n8n workflow logs or try refreshing the page to see if the response appears.",
          should_visualize: false
        };
        setCurrentChat(corsChat);
      } else {
        const errorChat = {
          question: question.trim(),
          answer: `Sorry, there was an error processing your question: ${error.message}. Please try again.`,
          should_visualize: false
        };
        setCurrentChat(errorChat);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadHistoryItem = (item) => {
    console.log('Loading history item:', item);
    setCurrentChat(item);
    setSelectedHistoryId(item.session_id + item.timestamp);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startNewChat = () => {
    // Reset state for a fresh conversation
    setQuestion('');
    setCurrentChat(null);
    setSelectedHistoryId(null);
    setSessionId(null);
  };

  return {
    // State
    sessionId,
    question,
    setQuestion,
    currentChat,
    history,
    loading,
    selectedHistoryId,
    messagesEndRef,
    
    // Actions
    sendMessage,
    loadHistoryItem,
    handleKeyPress,
    startNewChat
  };
};
