// In development, use relative paths (proxied by Vite)
// In production, use Vercel API proxy to avoid CORS issues
const isDevelopment = import.meta.env.DEV;
const N8N_BASE_URL = import.meta.env.VITE_N8N_BASE_URL || 'https://n8n-test.iohealth.com';

const getWebhookUrl = (path) => {
  if (isDevelopment) {
    // Development: use relative path (will be proxied by Vite)
    return path;
  }
  // Production: use Vercel API proxy (avoids CORS issues)
  // Remove /webhook prefix since the proxy adds it
  const pathWithoutWebhook = path.replace('/webhook/', '');
  return `/api/webhook/${pathWithoutWebhook}`;
};

// Convert full n8n URLs to proxy URLs in production
const convertN8nUrlToProxy = (url) => {
  if (!url || typeof url !== 'string') return url;
  
  // If it's already a relative path, return as is
  if (url.startsWith('/')) return url;
  
  // If it's a full n8n URL, convert to proxy URL in production
  if (url.includes(N8N_BASE_URL)) {
    if (isDevelopment) {
      // In development, convert to relative path for Vite proxy
      const urlObj = new URL(url);
      return urlObj.pathname + urlObj.search;
    } else {
      // In production, convert to Vercel API proxy
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      // Handle both /webhook/... and /webhook-waiting/... patterns
      if (path.startsWith('/webhook/')) {
        const pathWithoutWebhook = path.replace('/webhook/', '');
        return `/api/webhook/${pathWithoutWebhook}${urlObj.search}`;
      } else if (path.startsWith('/webhook-waiting/')) {
        const pathWithoutWebhook = path.replace('/webhook-waiting/', '');
        return `/api/webhook/waiting/${pathWithoutWebhook}${urlObj.search}`;
      }
    }
  }
  
  // Return original URL if it doesn't match n8n pattern
  return url;
};

const HISTORY_URL = getWebhookUrl('/webhook/chat-history');
const CHAT_WEBHOOK_URL = getWebhookUrl('/webhook/nlq-chat');

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
    // Use the dedicated /api/resume endpoint (similar to Express /resume)
    console.log('[apiService.sendMessageToResumeUrl] Calling /api/resume with resumeUrl:', resumeUrl, 'sessionId:', sessionId);
    const response = await fetch('/api/resume', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        resumeUrl: resumeUrl,
        data: {
          message: message,
          sessionId: sessionId
        }
      }),
      signal: signal
    });
    
    console.log('[apiService.sendMessageToResumeUrl] /api/resume response status:', response.status);

    if (!response.ok) {
      console.error('[apiService.sendMessageToResumeUrl] Non-OK response from /api/resume:', response.status);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
  },

  async resumeWorkflow(resumeUrl, actionPayload = null, sessionId = null) {
    // Use the dedicated /api/resume endpoint for continuing workflows
    const response = await fetch('/api/resume', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        resumeUrl: resumeUrl,
        action: actionPayload?.action || null,
        sessionId: sessionId,
        data: actionPayload || {}
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response;
  },
  
  // Export the conversion function for use in CustomChatInterface
  convertN8nUrlToProxy
};