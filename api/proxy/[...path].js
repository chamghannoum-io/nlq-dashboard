/**
 * Vercel serverless function to proxy Metabase iframe content
 * This allows HTTP Metabase content to be loaded in HTTPS pages
 */

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the target URL from query parameter
    const targetUrl = req.query.url;
    
    if (!targetUrl) {
      return res.status(400).json({ error: 'Missing url parameter' });
    }

    // Decode the URL if it's encoded
    const decodedUrl = decodeURIComponent(targetUrl);
    
    // Only allow HTTP URLs (for Metabase)
    if (!decodedUrl.startsWith('http://')) {
      return res.status(400).json({ error: 'Only HTTP URLs are allowed' });
    }

    console.log('Proxying Metabase URL:', decodedUrl);

    // Fetch the content from Metabase
    const response = await fetch(decodedUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Vercel-Proxy)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: 'Failed to fetch content',
        status: response.status 
      });
    }

    // Get content type
    const contentType = response.headers.get('content-type') || 'text/html';
    
    // Set response headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('X-Frame-Options', 'ALLOWALL');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.status(response.status);

    // Get the HTML content
    const html = await response.text();
    
    // Modify the HTML to fix any relative URLs and iframe issues
    // Replace any http:// references in the HTML to use our proxy
    const modifiedHtml = html
      .replace(/src="http:\/\//g, 'src="/api/proxy?url=')
      .replace(/href="http:\/\//g, 'href="/api/proxy?url=')
      .replace(/action="http:\/\//g, 'action="/api/proxy?url=');

    res.send(modifiedHtml);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Proxy error', 
      message: error.message 
    });
  }
}

