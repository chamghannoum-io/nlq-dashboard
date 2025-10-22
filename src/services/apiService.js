import { parseJsonSafe } from '../utils/jsonParser.js';

const WEBHOOK_URL = '/webhook/user-question';
const HISTORY_URL = '/webhook/chat-history';

export const apiService = {
  async sendQuestion(question, sessionId = null) {
    const requestBody = {
      question: question.trim(),
      ...(sessionId && { session_id: sessionId })
    };
    
    console.log('Request body:', requestBody);
    
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await parseJsonSafe(response);
    console.log('Initial webhook response:', JSON.stringify(data, null, 2));
    
    // Handle plain text response (first webhook)
    let chatData;
    if (data && data.__text) {
      chatData = {
        question: question.trim(),
        answer: data.__text,
        should_visualize: true, 
        isLoadingVisualization: true 
      };
      
      console.log('Plain text response received, will poll for visualization data...');
      
      this.pollForVisualization(question, chatData);
    } else {
      chatData = Array.isArray(data) ? data[0] : data;
      chatData.isLoadingVisualization = false;
    }
    return chatData;
  },

  async pollForVisualization(question, initialChatData) {
    const maxAttempts = 10;
    const delays = [500, 500, 700, 700, 1000, 1000, 1500, 2000, 2500, 3000];
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        await new Promise(resolve => setTimeout(resolve, delays[attempt]));
        
        console.log(`Polling attempt ${attempt + 1}/${maxAttempts} for visualization...`);
        const history = await this.loadHistory();
        
        const questionLower = question.trim().toLowerCase();
        const matches = history.filter(h => 
          h.question && h.question.trim().toLowerCase() === questionLower
        );
        
        if (matches.length > 0) {
          const completeChat = matches[0];
          
          console.log('Found match in history:', JSON.stringify(completeChat, null, 2));
          
          if (completeChat.embed_url || completeChat.should_visualize === false) {
            console.log('Complete visualization data found, broadcasting update...');
            
            window.dispatchEvent(new CustomEvent('visualizationReady', {
              detail: completeChat
            }));
            
            return completeChat;
          } else {
            console.log('Match found but no visualization data yet');
          }
        } else {
          console.log(`Attempt ${attempt + 1}: No matching entry found in history yet`);
        }
      } catch (error) {
        console.warn(`Polling attempt ${attempt + 1} failed:`, error);
      }
    }
    
    console.log('Max polling attempts reached, visualization may not be available');
    
    window.dispatchEvent(new CustomEvent('visualizationTimeout', {
      detail: { question }
    }));
  },

  async loadHistory() {
    const historyUrl = HISTORY_URL.includes('?')
      ? `${HISTORY_URL}&limit=1000&_=${Date.now()}`
      : `${HISTORY_URL}?limit=1000&_=${Date.now()}`;
      
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
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await parseJsonSafe(response);
    const historyArray = !data || data.__text ? [] : (Array.isArray(data) ? data : [data]);
    
    return historyArray.reverse();
  }
};