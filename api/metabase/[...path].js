/**
 * Metabase Content Proxy
 * Place this at /api/metabase/[...path].js to catch all routes
 *
 * Usage from frontend:
 *   // Instead of:
 *   // http://139.185.56.253:3000/public/question/...
 *   // Use:
 *   // /api/metabase/public/question/...
 */

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Get the path from query params (Vercel uses "...path" for catch-all routes)
    const path = req.query['...path'] || req.query.path || '';
    const metabasePath = Array.isArray(path) ? path.join('/') : path;
    
    if (!metabasePath) {
      console.error('Missing path in query:', req.query);
      return res.status(400).json({ 
        error: 'Missing path',
        query: req.query 
      });
    }
    
    // Get query string if any (exclude the path parameter)
    // Extract from original URL if present
    const originalUrl = req.url || '';
    const queryIndex = originalUrl.indexOf('?');
    let queryString = '';
    if (queryIndex > -1) {
      const fullQuery = originalUrl.substring(queryIndex + 1);
      // Filter out path-related query params
      const params = new URLSearchParams(fullQuery);
      params.delete('path');
      params.delete('...path');
      queryString = params.toString();
    }
    
    // Build full Metabase URL
    const metabaseBase = 'http://139.185.56.253:3000';
    const targetUrl = queryString 
      ? `${metabaseBase}/${metabasePath}?${queryString}`
      : `${metabaseBase}/${metabasePath}`;
    
    console.log('Request query:', req.query);
    console.log('Metabase path:', metabasePath);
    console.log('Proxying to:', targetUrl);

    // Fetch from Metabase
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': req.headers.accept || '*/*',
      },
    });

    if (!response.ok) {
      console.error('Metabase error:', response.status);
      return res.status(response.status).json({ 
        error: 'Metabase request failed',
        status: response.status,
        url: targetUrl
      });
    }

    const contentType = response.headers.get('content-type') || 'text/html';
    
    // For binary content, pass through
    if (contentType.includes('image/') || 
        contentType.includes('font/') || 
        contentType.includes('woff') ||
        contentType.includes('octet-stream')) {
      const buffer = await response.arrayBuffer();
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      return res.send(Buffer.from(buffer));
    }

    // For text content, rewrite URLs
    const text = await response.text();
    
    // Get the proxy base URL
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    const proxyBase = `${protocol}://${host}/api/metabase`;
    
    // Replace URLs in the content
    let modified = text
      // Replace absolute HTTP URLs to Metabase
      .replace(/http:\/\/139\.185\.56\.253:3000/g, proxyBase)
      // Replace root-relative URLs
      .replace(/(['"`(])\/app\//g, `$1${proxyBase}/app/`)
      .replace(/(['"`(])\/public\//g, `$1${proxyBase}/public/`)
      .replace(/(['"`(])\/api\//g, `$1${proxyBase}/api/`)
      .replace(/(['"`(])\/static\//g, `$1${proxyBase}/static/`)
      // Replace in src/href attributes
      .replace(/src="\/([^"]+)"/g, `src="${proxyBase}/$1"`)
      .replace(/href="\/([^"]+)"/g, (match, p) => {
        if (p.startsWith('#') || p.startsWith('mailto:') || p.startsWith('javascript:')) {
          return match;
        }
        return `href="${proxyBase}/${p}"`;
      });

    // Set response headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('X-Frame-Options', 'ALLOWALL');
    res.setHeader('Content-Security-Policy', "frame-ancestors *");
    
    // Copy other useful headers
    const cacheControl = response.headers.get('cache-control');
    if (cacheControl) {
      res.setHeader('Cache-Control', cacheControl);
    }

    res.status(200).send(modified);

  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Proxy error', 
      message: error.message 
    });
  }
}


