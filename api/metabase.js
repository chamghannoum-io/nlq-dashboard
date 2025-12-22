/**
 * Metabase Content Proxy (Alternative Route)
 *
 * This is a fallback proxy that uses query parameters instead of path-based routing
 * Usage: /api/metabase?path=public/question/...
 *
 * This serves as a backup if the catch-all route [...path].js doesn't work
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
    // Get the path from query parameter
    const pathParam = req.query.path;

    if (!pathParam) {
      return res.status(400).json({
        error: 'Missing path parameter',
        usage: '/api/metabase?path=public/question/...',
        query: req.query
      });
    }

    const metabasePath = Array.isArray(pathParam) ? pathParam.join('/') : pathParam;

    // Get query string if any (exclude the path parameter)
    const params = new URLSearchParams(req.url.split('?')[1] || '');
    params.delete('path');
    const queryString = params.toString();

    // Build full Metabase URL
    const metabaseBase = 'http://139.185.56.253:3000';
    const targetUrl = queryString
      ? `${metabaseBase}/${metabasePath}?${queryString}`
      : `${metabaseBase}/${metabasePath}`;

    console.log('[Metabase Proxy] Query:', req.query);
    console.log('[Metabase Proxy] Path:', metabasePath);
    console.log('[Metabase Proxy] Target URL:', targetUrl);

    // Fetch from Metabase
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': req.headers.accept || '*/*',
      },
    });

    if (!response.ok) {
      console.error('[Metabase Proxy] Error:', response.status, response.statusText);
      return res.status(response.status).json({
        error: 'Metabase request failed',
        status: response.status,
        statusText: response.statusText,
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
      .replace(/(['"`(])\/app\//g, `$1${proxyBase}?path=app/`)
      .replace(/(['"`(])\/public\//g, `$1${proxyBase}?path=public/`)
      .replace(/(['"`(])\/api\//g, `$1${proxyBase}?path=api/`)
      .replace(/(['"`(])\/static\//g, `$1${proxyBase}?path=static/`)
      // Replace in src/href attributes
      .replace(/src="\/([^"]+)"/g, `src="${proxyBase}?path=$1"`)
      .replace(/href="\/([^"]+)"/g, (match, p) => {
        if (p.startsWith('#') || p.startsWith('mailto:') || p.startsWith('javascript:')) {
          return match;
        }
        return `href="${proxyBase}?path=${p}"`;
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

    console.log('[Metabase Proxy] Success - returned', contentType);
    res.status(200).send(modified);

  } catch (error) {
    console.error('[Metabase Proxy] Error:', error);
    res.status(500).json({
      error: 'Proxy error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
