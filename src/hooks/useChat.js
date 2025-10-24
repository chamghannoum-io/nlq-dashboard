import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService.js';

export const useChat = () => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadHistory();
    
    const interval = setInterval(loadHistory, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadHistory = async () => {
    try {
      const historyData = await apiService.loadHistory();
      if (Array.isArray(historyData) && historyData.length > 0) {
        setHistory(historyData);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  return {
    history,
    loadHistory
  };
};