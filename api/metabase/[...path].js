/**
 * Metabase Content Proxy - serves Metabase pages directly through HTTPS
 * This avoids mixed content issues by serving everything through your HTTPS domain
 * Uses path-based routing: /api/metabase/public/question/... -> http://139.185.56.253:3000/public/question/...
 */

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET and POST methods
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the path from the request
    // Vercel uses "...path" as the query key for catch-all routes [...path]
    const path = req.query['...path'] || req.query.path || '';
    const metabasePath = Array.isArray(path) ? path.join('/') : path;
    
    // Build the Metabase URL
    const metabaseBase = 'http://139.185.56.253:3000';
    const targetUrl = `${metabaseBase}/${metabasePath}${req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''}`;
    
    console.log('Proxying Metabase:', targetUrl);
    console.log('Request method:', req.method);

    // Create timeout controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    // Forward request to Metabase
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': req.headers.accept || '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Content-Type': req.headers['content-type'] || 'application/json',
      },
      body: req.method === 'POST' && req.body ? JSON.stringify(req.body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('Metabase response not OK:', response.status);
      return res.status(response.status).json({ 
        error: 'Metabase request failed',
        status: response.status 
      });
    }

    const contentType = response.headers.get('content-type') || 'text/html';
    
    // For binary content (images, fonts), pass through directly
    if (contentType.includes('image/') || 
        contentType.includes('font/') || 
        contentType.includes('octet-stream') ||
        contentType.includes('application/pdf')) {
      const buffer = await response.arrayBuffer();
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      res.status(response.status);
      return res.send(Buffer.from(buffer));
    }

    // For text content (HTML, CSS, JS), rewrite URLs
    const text = await response.text();
    const proxyPath = '/api/metabase';
    
    // Replace all Metabase URLs with proxy URLs
    let modified = text
      // Replace absolute HTTP URLs to Metabase
      .replace(/http:\/\/139\.185\.56\.253:3000/g, proxyPath)
      .replace(/http:\/\/139\.185\.56\.253:3000/g, proxyPath)
      // Replace root-relative URLs in strings (handles quotes, double quotes, template literals)
      .replace(/(['"`])\/app\//g, `$1${proxyPath}/app/`)
      .replace(/(['"`])\/public\//g, `$1${proxyPath}/public/`)
      .replace(/(['"`])\/api\//g, `$1${proxyPath}/api/`)
      .replace(/(['"`])\/static\//g, `$1${proxyPath}/static/`)
      // Fix src and href attributes in HTML
      .replace(/(<script[^>]*\ssrc=["'])\/([^"']+)(["'])/gi, `$1${proxyPath}/$2$3`)
      .replace(/(<link[^>]*\shref=["'])\/([^"']+)(["'])/gi, (match, prefix, path, suffix) => {
        // Don't rewrite anchor links
        if (path.startsWith('#')) return match;
        return `${prefix}${proxyPath}/${path}${suffix}`;
      })
      .replace(/(<img[^>]*\ssrc=["'])\/([^"']+)(["'])/gi, `$1${proxyPath}/$2$3`)
      .replace(/(<iframe[^>]*\ssrc=["'])\/([^"']+)(["'])/gi, `$1${proxyPath}/$2$3`)
      // Replace in CSS url() functions
      .replace(/url\((['"]?)\/([^'")]+)\1\)/g, (match, quote, path) => {
        if (path.match(/^(app|api|public|static)\//)) {
          return `url(${quote}${proxyPath}/${path}${quote})`;
        }
        return match;
      })
      // Inject JavaScript to intercept runtime requests
      .replace(/<head([^>]*)>/i, `<head$1>
      <script>
        (function() {
          const proxyPath = '${proxyPath}';
          const metabaseBase = '${metabaseBase}';
          
          // Override fetch to intercept HTTP requests
          const originalFetch = window.fetch;
          window.fetch = function(url, options) {
            if (typeof url === 'string') {
              if (url.startsWith('http://139.185.56.253:3000')) {
                url = url.replace('http://139.185.56.253:3000', proxyPath);
              } else if (url.startsWith('/') && !url.startsWith(proxyPath)) {
                url = proxyPath + url;
              }
            }
            return originalFetch.call(this, url, options);
          };
          
          // Override XMLHttpRequest to intercept HTTP requests
          const originalOpen = XMLHttpRequest.prototype.open;
          XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
            if (typeof url === 'string') {
              if (url.startsWith('http://139.185.56.253:3000')) {
                url = url.replace('http://139.185.56.253:3000', proxyPath);
              } else if (url.startsWith('/') && !url.startsWith(proxyPath)) {
                url = proxyPath + url;
              }
            }
            return originalOpen.call(this, method, url, async, user, password);
          };
        })();
      </script>`);

    res.setHeader('Content-Type', contentType);
    res.setHeader('X-Frame-Options', 'ALLOWALL');
    res.setHeader('Content-Security-Policy', "frame-ancestors *");
    res.setHeader('Cache-Control', contentType.includes('text/css') || contentType.includes('application/javascript') 
      ? 'public, max-age=31536000' 
      : 'no-cache');
    res.status(response.status);
    res.send(modified);

  } catch (error) {
    console.error('Proxy error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    // Handle timeout errors
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      return res.status(504).json({ 
        error: 'Request timeout',
        message: 'The Metabase server took too long to respond'
      });
    }
    
    res.status(500).json({ 
      error: 'Proxy error', 
      message: error.message 
    });
  }
}

