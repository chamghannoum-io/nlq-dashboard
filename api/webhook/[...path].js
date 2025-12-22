/**
 * Vercel serverless function to proxy requests to n8n
 * This avoids CORS issues by making server-to-server requests
 */

// Support both VITE_N8N_BASE_URL (for consistency) and N8N_BASE_URL
const N8N_BASE_URL = process.env.VITE_N8N_BASE_URL || process.env.N8N_BASE_URL || 'https://n8n-test.iohealth.com';

export default async function handler(req, res) {
  // Set CORS headers first
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST and GET methods
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Request method:', req.method);
    console.log('Request query:', JSON.stringify(req.query));
    console.log('Request body:', JSON.stringify(req.body));
    console.log('N8N_BASE_URL:', N8N_BASE_URL);

    // Get the path from the request
    // Vercel uses "...path" as the query key for catch-all routes [...path]
    // Examples:
    // /api/webhook/nlq-chat -> /webhook/nlq-chat
    // /api/webhook/waiting/764222 -> /webhook-waiting/764222
    const path = req.query['...path'] || req.query.path;
    const webhookPath = Array.isArray(path) ? path.join('/') : path;
    
    console.log('Raw path from query:', path);
    console.log('Webhook path (joined):', webhookPath);
    console.log('Is array?', Array.isArray(path));
    
    if (!webhookPath) {
      console.error('Missing webhook path in query:', req.query);
      return res.status(400).json({ 
        error: 'Missing webhook path',
        query: req.query 
      });
    }
    
    // Check if path starts with "waiting" to handle /webhook-waiting/ pattern
    // Handle both array format ["waiting", "764238"] and string format "waiting/764238"
    let targetUrl;
    
    // Check if it's a waiting path
    const isWaitingPath = Array.isArray(path) 
      ? path.length > 0 && path[0] === 'waiting'
      : typeof webhookPath === 'string' && (webhookPath.startsWith('waiting/') || webhookPath === 'waiting');
    
    if (isWaitingPath) {
      // Handle waiting path
      let waitingPath;
      if (Array.isArray(path)) {
        // Remove first element "waiting" and join the rest
        waitingPath = path.slice(1).join('/');
      } else {
        // Remove "waiting/" prefix or handle if it's just "waiting"
        waitingPath = webhookPath === 'waiting' ? '' : webhookPath.replace(/^waiting\/?/, '');
      }
      
      if (!waitingPath) {
        return res.status(400).json({ error: 'Missing waiting path ID' });
      }
      
      targetUrl = `${N8N_BASE_URL}/webhook-waiting/${waitingPath}`;
      console.log('Detected waiting path, target URL:', targetUrl);
    } else {
      // Regular webhook endpoint
      targetUrl = `${N8N_BASE_URL}/webhook/${webhookPath}`;
      console.log('Regular webhook path, target URL:', targetUrl);
    }

    // Forward query parameters (exclude the path parameter)
    const url = new URL(targetUrl);
    if (req.query) {
      Object.keys(req.query).forEach(key => {
        if (key !== 'path' && key !== '...path') {
          url.searchParams.append(key, req.query[key]);
        }
      });
    }

    console.log('Target URL:', url.toString());

    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': req.headers['user-agent'] || 'Vercel-Proxy',
    };

    // Prepare request body - handle both parsed and unparsed body
    let requestBody;
    if (req.method === 'POST') {
      if (req.body) {
        // If body is already an object, stringify it; otherwise use as-is
        requestBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      }
    }

    console.log('Request body to send:', requestBody);

    // Forward request to n8n
    const response = await fetch(url.toString(), {
      method: req.method,
      headers: headers,
      body: requestBody,
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    // Get response content type
    const contentType = response.headers.get('content-type') || 'application/json';
    
    // Set response headers
    res.setHeader('Content-Type', contentType);
    res.status(response.status);

    // For all responses, get the text (Vercel serverless functions work better with buffered responses)
    // This handles both streaming and non-streaming responses
    const text = await response.text();
    
    console.log('Response text length:', text.length);
    console.log('Response text preview:', text.substring(0, 200));
    
    // Try to parse as JSON, fallback to text
    try {
      const data = JSON.parse(text);
      res.json(data);
    } catch (parseError) {
      console.log('Not JSON, sending as text');
      res.send(text);
    }
  } catch (error) {
    console.error('Proxy error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Proxy error', 
      message: error.message,
      name: error.name,
      stack: error.stack
    });
  }
}

