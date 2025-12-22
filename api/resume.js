/**
 * Vercel serverless function to proxy resume URL requests to n8n
 * Similar to the Express /resume endpoint
 */

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { resumeUrl, data, action, sessionId } = req.body;
    
    if (!resumeUrl) {
      return res.status(400).json({ error: 'resumeUrl is required' });
    }

    console.log('Proxying resume request to:', resumeUrl);
    console.log('Request body data:', { action, sessionId, data });

    // Prepare the request body for n8n
    const requestBody = action 
      ? { action, sessionId }
      : data || {};

    // Forward request to n8n resume URL
    const response = await fetch(resumeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('n8n response status:', response.status);

    // Get response content type
    const contentType = response.headers.get('content-type') || 'application/json';
    res.setHeader('Content-Type', contentType);
    res.status(response.status);

    // For streaming responses, we need to handle them differently
    const isStreaming = contentType.includes('text/event-stream') || 
                       contentType.includes('application/x-ndjson');

    if (isStreaming) {
      // For streaming, buffer the entire response
      const text = await response.text();
      res.send(text);
    } else {
      // For non-streaming, try to parse as JSON
      const text = await response.text();
      try {
        const result = JSON.parse(text);
        res.json(result);
      } catch {
        res.send(text);
      }
    }
  } catch (error) {
    console.error('Resume proxy error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      error: 'Proxy error',
      message: error.message,
      stack: error.stack
    });
  }
}

