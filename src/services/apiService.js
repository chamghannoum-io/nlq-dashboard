const HISTORY_URL = '/webhook/chat-history';

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
  }
};