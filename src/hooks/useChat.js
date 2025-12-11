import { useState, useEffect } from 'react';
import { fetchSessionHistory } from '../services/supabaseService.js';

export const useChat = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadHistory(true); // Initial load with loading state
    
    // Refresh history every 10 seconds (silently, without loading state)
    const interval = setInterval(() => loadHistory(false), 10000);
    return () => clearInterval(interval);
  }, []);

  const loadHistory = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);
      const historyData = await fetchSessionHistory(50);
      
      if (Array.isArray(historyData)) {
        setHistory(historyData);
      }
    } catch (err) {
      console.error('Failed to load history from Supabase:', err);
      setError(err.message);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  return {
    history,
    loading,
    error,
    loadHistory
  };
};