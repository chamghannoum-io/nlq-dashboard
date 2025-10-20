import { parseJsonSafe } from '../utils/jsonParser.js';

const WEBHOOK_URL = '/webhook/user-question';
const HISTORY_URL = '/webhook/chat-history';

export const apiService = {
  // Send a question to the webhook
  async sendQuestion(question, sessionId = null) {
    const requestBody = {
      question: question.trim(),
      ...(sessionId && { session_id: sessionId })
    };
    
    console.log('Request body:', requestBody);
    console.log('Webhook URL:', WEBHOOK_URL);
    
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await parseJsonSafe(response);
    console.log('Response data:', data);
    
    // Handle both JSON and plain text responses
    let chatData;
    if (data && data.__text) {
      // Plain text response
      chatData = {
        question: question.trim(),
        answer: data.__text,
        should_visualize: false
      };
    } else {
      // JSON response
      chatData = Array.isArray(data) ? data[0] : data;
    }
    
    console.log('Processed chat data:', chatData);
    
    // Debug visualization data
    console.log('Visualization debug:', {
      should_visualize: chatData.should_visualize,
      embed_url: chatData.embed_url,
      card_id: chatData.card_id,
      card_name: chatData.card_name,
      visualization_type: chatData.visualization_type
    });
    
    return chatData;
  },

  // Load chat history
  async loadHistory() {
    // Request more rows explicitly and disable caches
    const historyUrl = HISTORY_URL.includes('?')
      ? `${HISTORY_URL}&limit=1000`
      : `${HISTORY_URL}?limit=1000`;
    console.log('Loading history from:', historyUrl);
    const response = await fetch(historyUrl, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
        'Pragma': 'no-cache',
        'Cache-Control': 'no-store'
      }
    });
    console.log('History response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await parseJsonSafe(response);
    console.log('History data:', data);
    
    // Only process if we got valid JSON data (ignore plain text responses for history)
    const historyArray = !data || data.__text ? [] : (Array.isArray(data) ? data : [data]);
    console.log('Processed history array:', historyArray);
    
    return historyArray.reverse();
  }
};
