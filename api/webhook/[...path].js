/**
 * Vercel serverless function to proxy requests to n8n
 * This avoids CORS issues by making server-to-server requests
 */

// Support both VITE_N8N_BASE_URL (for consistency) and N8N_BASE_URL
const N8N_BASE_URL = process.env.VITE_N8N_BASE_URL || process.env.N8N_BASE_URL || 'https://n8n-test.iohealth.com';

export default async function handler(req, res) {
  // Only allow POST and GET methods
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the path from the request
    // Examples:
    // /api/webhook/nlq-chat -> /webhook/nlq-chat
    // /api/webhook/waiting/764222 -> /webhook-waiting/764222
    const path = req.query.path;
    const webhookPath = Array.isArray(path) ? path.join('/') : path;
    
    // Check if path starts with "waiting/" to handle /webhook-waiting/ pattern
    let targetUrl;
    if (webhookPath.startsWith('waiting/')) {
      // Remove "waiting/" prefix and use /webhook-waiting/ endpoint
      const waitingPath = webhookPath.replace('waiting/', '');
      targetUrl = `${N8N_BASE_URL}/webhook-waiting/${waitingPath}`;
    } else {
      // Regular webhook endpoint
      targetUrl = `${N8N_BASE_URL}/webhook/${webhookPath}`;
    }

    // Forward query parameters
    const url = new URL(targetUrl);
    if (req.query) {
      Object.keys(req.query).forEach(key => {
        if (key !== 'path') {
          url.searchParams.append(key, req.query[key]);
        }
      });
    }

    // Prepare headers (exclude host and connection headers)
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': req.headers['user-agent'] || 'Vercel-Proxy',
    };

    // Forward request to n8n
    const response = await fetch(url.toString(), {
      method: req.method,
      headers: headers,
      body: req.method === 'POST' ? JSON.stringify(req.body) : undefined,
    });

    // Get response headers
    const contentType = response.headers.get('content-type') || 'application/json';
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

    // Handle OPTIONS preflight
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // For streaming responses, pipe the stream directly
    // Check if response might be streaming (n8n often uses streaming)
    const isStreaming = contentType.includes('text/event-stream') || 
                       contentType.includes('application/x-ndjson') ||
                       !contentType.includes('application/json');
    
    if (isStreaming && response.body) {
      res.setHeader('Content-Type', contentType || 'text/plain');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.status(response.status);
      
      // Pipe the response stream to the client
      // Note: This works in Vercel serverless functions
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          res.write(chunk);
        }
        res.end();
        return;
      } catch (streamError) {
        console.error('Streaming error:', streamError);
        // Fall through to non-streaming handling
      }
    }

    // For non-streaming responses, get the text
    const text = await response.text();
    
    // Try to parse as JSON, fallback to text
    try {
      const data = JSON.parse(text);
      res.status(response.status).json(data);
    } catch {
      res.status(response.status).send(text);
    }
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Proxy error', 
      message: error.message 
    });
  }
}

