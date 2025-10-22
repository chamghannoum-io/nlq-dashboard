import { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/apiService.js';

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

  // Listen for visualization updates from apiService
  useEffect(() => {
    const handleVisualizationReady = (event) => {
      const completeChat = event.detail;
      
      setCurrentChat(prev => {
        if (prev && prev.question.trim().toLowerCase() === completeChat.question.trim().toLowerCase()) {
          console.log('Updating current chat with visualization data from event');
          return {
            ...prev,
            ...completeChat,
            isLoadingVisualization: false
          };
        }
        return prev;
      });
    };

    const handleVisualizationTimeout = (event) => {
      console.warn('Visualization loading timed out for:', event.detail.question);
      setCurrentChat(prev => {
        if (prev && prev.question.trim().toLowerCase() === event.detail.question.trim().toLowerCase()) {
          return {
            ...prev,
            isLoadingVisualization: false,
            should_visualize: false
          };
        }
        return prev;
      });
    };

    window.addEventListener('visualizationReady', handleVisualizationReady);
    window.addEventListener('visualizationTimeout', handleVisualizationTimeout);

    return () => {
      window.removeEventListener('visualizationReady', handleVisualizationReady);
      window.removeEventListener('visualizationTimeout', handleVisualizationTimeout);
    };
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
    
    const optimistic = {
      question: question.trim(),
      answer: 'Working on it…',
      should_visualize: true,
      isLoadingVisualization: true
    };
    setCurrentChat(optimistic);
    setLoading(true);
    
    try {
      const askedQuestion = question.trim();
      const chatData = await apiService.sendQuestion(askedQuestion, sessionId);
      
      if (!sessionId && chatData.session_id) {
        setSessionId(chatData.session_id);
        console.log('Set new session ID:', chatData.session_id);
      }

      setCurrentChat(chatData);
      console.log('Set current chat:', chatData);
      setQuestion('');
      
      // Refresh history
      await loadHistory();
      setSelectedHistoryId(null);

      
    } catch (error) {
      console.error('Failed to send message:', error);
      
      if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
        console.log('CORS error detected, but workflow may have executed');
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