const HISTORY_URL = '/webhook/chat-history';
const CHAT_WEBHOOK_URL = '/webhook/nlq-chat';

export const apiService = {
  async loadHistory() {
    const historyUrl = `${HISTORY_URL}?limit=1000&_=${Date.now()}`;
      
    const response = await fetch(historyUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-store'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const historyArray = Array.isArray(data) ? data : [data];
    
    return historyArray.reverse();
  },

  async sendMessage(message, sessionId, signal) {
    const response = await fetch(CHAT_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        message: message,
        sessionId: sessionId
      }),
      signal: signal
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response;
  },

  async sendMessageToResumeUrl(resumeUrl, message, sessionId, signal) {
    const response = await fetch(resumeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        message: message,
        sessionId: sessionId
      }),
      signal: signal
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response;
  }
};