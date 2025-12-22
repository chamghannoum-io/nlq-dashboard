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
    const metabaseBase = 'http://139.185.56.253:3000';

    // Helper function to convert paths to proxy URLs
    const toProxyUrl = (path) => {
      // Remove leading slash
      const cleanPath = path.startsWith('/') ? path.substring(1) : path;
      return `${proxyBase}?path=${encodeURIComponent(cleanPath)}`;
    };

    // Replace URLs in the content - COMPREHENSIVE REPLACEMENTS
    let modified = text
      // Replace absolute HTTP URLs to Metabase
      .replace(/http:\/\/139\.185\.56\.253:3000/g, proxyBase)

      // Replace src attributes (scripts, images, iframes)
      .replace(/src=(["'])\/([^"']+)\1/gi, (match, quote, path) => {
        return `src=${quote}${toProxyUrl('/' + path)}${quote}`;
      })

      // Replace href attributes (stylesheets, links)
      .replace(/href=(["'])\/([^"'#][^"']*)\1/gi, (match, quote, path) => {
        // Skip anchors and special protocols
        if (path.startsWith('#') || path.startsWith('mailto:') || path.startsWith('javascript:') || path.startsWith('tel:')) {
          return match;
        }
        return `href=${quote}${toProxyUrl('/' + path)}${quote}`;
      })

      // Replace URLs in JavaScript strings (for dynamic loading)
      .replace(/(["'`])\/app\/([^"'`]+)\1/g, (match, quote, path) => {
        return `${quote}${toProxyUrl('/app/' + path)}${quote}`;
      })
      .replace(/(["'`])\/public\/([^"'`]+)\1/g, (match, quote, path) => {
        return `${quote}${toProxyUrl('/public/' + path)}${quote}`;
      })
      .replace(/(["'`])\/api\/([^"'`]+)\1/g, (match, quote, path) => {
        return `${quote}${toProxyUrl('/api/' + path)}${quote}`;
      })
      .replace(/(["'`])\/static\/([^"'`]+)\1/g, (match, quote, path) => {
        return `${quote}${toProxyUrl('/static/' + path)}${quote}`;
      })

      // Replace CSS url() references
      .replace(/url\((["']?)\/([^)"']+)\1\)/gi, (match, quote, path) => {
        return `url(${quote}${toProxyUrl('/' + path)}${quote})`;
      })

      // Inject URL interceptor script in <head>
      .replace(/<head([^>]*)>/i, `<head$1>
        <base href="${metabaseBase}/">
        <script>
          (function() {
            var proxyBase = '${proxyBase}';
            var metabaseBase = '${metabaseBase}';

            // Helper to convert URLs
            function toProxyUrl(url) {
              if (typeof url !== 'string') return url;

              // Already proxied
              if (url.includes('/api/metabase')) return url;

              // Data/blob URLs
              if (url.startsWith('data:') || url.startsWith('blob:')) return url;

              // Absolute Metabase URLs
              if (url.startsWith(metabaseBase)) {
                var path = url.substring(metabaseBase.length);
                return proxyBase + '?path=' + encodeURIComponent(path.startsWith('/') ? path.substring(1) : path);
              }

              // Root-relative URLs
              if (url.startsWith('/')) {
                return proxyBase + '?path=' + encodeURIComponent(url.substring(1));
              }

              // Already HTTPS or other protocol
              return url;
            }

            // Override fetch
            var originalFetch = window.fetch;
            window.fetch = function(url, options) {
              return originalFetch.call(this, toProxyUrl(url), options);
            };

            // Override XMLHttpRequest
            var originalOpen = XMLHttpRequest.prototype.open;
            XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
              return originalOpen.call(this, method, toProxyUrl(url), async, user, password);
            };

            // Override dynamic script creation
            var originalCreateElement = document.createElement;
            document.createElement = function(tagName) {
              var element = originalCreateElement.call(document, tagName);

              if (tagName.toLowerCase() === 'script' || tagName.toLowerCase() === 'link' || tagName.toLowerCase() === 'img') {
                var srcDesc = Object.getOwnPropertyDescriptor(element.constructor.prototype, 'src');
                var hrefDesc = Object.getOwnPropertyDescriptor(element.constructor.prototype, 'href');

                if (srcDesc && srcDesc.set) {
                  Object.defineProperty(element, 'src', {
                    set: function(value) {
                      srcDesc.set.call(this, toProxyUrl(value));
                    },
                    get: function() {
                      return srcDesc.get.call(this);
                    }
                  });
                }

                if (hrefDesc && hrefDesc.set) {
                  Object.defineProperty(element, 'href', {
                    set: function(value) {
                      hrefDesc.set.call(this, toProxyUrl(value));
                    },
                    get: function() {
                      return hrefDesc.get.call(this);
                    }
                  });
                }
              }

              return element;
            };
          })();
        </script>
      `);

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
