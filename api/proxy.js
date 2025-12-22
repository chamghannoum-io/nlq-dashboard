/**
 * Vercel serverless function to proxy Metabase iframe content
 * This allows HTTP Metabase content to be loaded in HTTPS pages
 * Uses query parameter ?url= instead of path-based routing
 */

module.exports = async function handler(req, res) {
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
    let decodedUrl;
    try {
      decodedUrl = decodeURIComponent(targetUrl);
    } catch (e) {
      decodedUrl = targetUrl; // If decoding fails, use as-is
    }
    
    // Only allow HTTP URLs (for Metabase) - security check
    if (!decodedUrl.startsWith('http://')) {
      return res.status(400).json({ error: 'Only HTTP URLs are allowed for security' });
    }

    // Additional security: only allow specific Metabase domain
    const allowedDomains = [
      '139.185.56.253:3000',
      'localhost:3000'
    ];
    
    const urlObj = new URL(decodedUrl);
    const host = urlObj.host;
    
    if (!allowedDomains.some(domain => host.includes(domain))) {
      return res.status(403).json({ error: 'Domain not allowed' });
    }

    console.log('Proxying Metabase URL:', decodedUrl);

    // Create timeout controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    // Fetch the content from Metabase
    const response = await fetch(decodedUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('Metabase response not OK:', response.status);
      return res.status(response.status).json({ 
        error: 'Failed to fetch content from Metabase',
        status: response.status 
      });
    }

    // Get content type
    const contentType = response.headers.get('content-type') || 'text/html';
    
    // Get the base URL for the Metabase server (urlObj was already created above)
    // Declare these once at the top level
    const metabaseBase = `${urlObj.protocol}//${urlObj.host}`; // http://139.185.56.253:3000
    const proxyBase = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;
    
    // Helper function to convert HTTP URLs to proxy URLs
    const toProxyUrl = (url) => {
      // If it's already an absolute HTTP URL, proxy it
      if (url.startsWith('http://')) {
        return `${proxyBase}/api/proxy?url=${encodeURIComponent(url)}`;
      }
      // If it's a relative URL (starts with /), make it absolute first
      if (url.startsWith('/')) {
        const absoluteUrl = `${metabaseBase}${url}`;
        return `${proxyBase}/api/proxy?url=${encodeURIComponent(absoluteUrl)}`;
      }
      // If it's a protocol-relative URL (starts with //), add http:
      if (url.startsWith('//')) {
        const absoluteUrl = `http:${url}`;
        return `${proxyBase}/api/proxy?url=${encodeURIComponent(absoluteUrl)}`;
      }
      // Return as-is for data URLs, blob URLs, or already proxied URLs
      return url;
    };
    
    // Check if this is an asset file that needs URL rewriting
    const isJavaScript = contentType.includes('application/javascript') ||
                         contentType.includes('text/javascript') ||
                         urlObj.pathname.match(/\.js$/i);
    
    const isCSS = contentType.includes('text/css') ||
                   urlObj.pathname.match(/\.css$/i);
    
    const isBinaryAsset = contentType.includes('image/') ||
                          contentType.includes('font/') ||
                          urlObj.pathname.match(/\.(png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico)$/i);
    
    // For binary assets (images, fonts), pass through directly
    if (isBinaryAsset) {
      const content = await response.arrayBuffer();
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      res.status(response.status);
      
      res.send(Buffer.from(content));
      return;
    }
    
    // For JavaScript files, rewrite HTTP URLs to proxy URLs
    if (isJavaScript) {
      const jsContent = await response.text();
      
      // Replace HTTP URLs in JavaScript code
      // Handle various patterns: strings, template literals, fetch, XMLHttpRequest
      let modifiedJs = jsContent
        // Replace http:// URLs in double-quoted strings
        .replace(/"http:\/\/([^"]+)"/g, (match, url) => {
          return `"${toProxyUrl(`http://${url}`)}"`;
        })
        // Replace http:// URLs in single-quoted strings
        .replace(/'http:\/\/([^']+)'/g, (match, url) => {
          return `'${toProxyUrl(`http://${url}`)}'`;
        })
        // Replace http:// URLs in template literals (backticks)
        .replace(/`http:\/\/([^`]+)`/g, (match, url) => {
          return `\`${toProxyUrl(`http://${url}`)}\``;
        })
        // Replace relative URLs starting with /api/ or /app/ in strings
        .replace(/"(\/api\/[^"]+)"/g, (match, url) => {
          return `"${toProxyUrl(url)}"`;
        })
        .replace(/"(\/app\/[^"]+)"/g, (match, url) => {
          return `"${toProxyUrl(url)}"`;
        })
        .replace(/'(\/api\/[^']+)'/g, (match, url) => {
          return `'${toProxyUrl(url)}'`;
        })
        .replace(/'(\/app\/[^']+)'/g, (match, url) => {
          return `'${toProxyUrl(url)}'`;
        })
        // Replace in template literals
        .replace(/`(\/api\/[^`]+)`/g, (match, url) => {
          return `\`${toProxyUrl(url)}\``;
        })
        .replace(/`(\/app\/[^`]+)`/g, (match, url) => {
          return `\`${toProxyUrl(url)}\``;
        })
        // Replace fetch() calls with HTTP URLs
        .replace(/fetch\s*\(\s*["']http:\/\/([^"']+)["']/g, (match, url) => {
          return `fetch("${toProxyUrl(`http://${url}`)}"`;
        })
        // Replace XMLHttpRequest.open() calls
        .replace(/\.open\s*\(\s*["'](GET|POST|PUT|DELETE|PATCH)["']\s*,\s*["']http:\/\/([^"']+)["']/g, (match, method, url) => {
          return `.open("${method}", "${toProxyUrl(`http://${url}`)}"`;
        })
        // Replace base URL patterns (common in Metabase)
        .replace(/(["'])http:\/\/139\.185\.56\.253:3000([^"']*)\1/g, (match, quote, path) => {
          return `${quote}${toProxyUrl(`http://139.185.56.253:3000${path}`)}${quote}`;
        });
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      res.status(response.status);
      
      res.send(modifiedJs);
      return;
    }
    
    // For CSS files, rewrite HTTP URLs to proxy URLs
    if (isCSS) {
      const cssContent = await response.text();
      
      // Replace HTTP URLs in CSS
      let modifiedCSS = cssContent
        .replace(/url\((['"]?)(http:\/\/[^'")]+)\1\)/g, (match, quote, url) => {
          return `url(${quote}${toProxyUrl(url)}${quote})`;
        })
        .replace(/url\((['"]?)(\/[^'")]+)\1\)/g, (match, quote, url) => {
          // Only proxy if it looks like an asset path
          if (url.match(/^\/(app|api|static|assets)/)) {
            return `url(${quote}${toProxyUrl(url)}${quote})`;
          }
          return match;
        });
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      res.status(response.status);
      
      res.send(modifiedCSS);
      return;
    }
    
    // For HTML content, rewrite URLs
    const html = await response.text();
    
    // Variables metabaseBase, proxyBase, and toProxyUrl are already declared above
    // Replace all URLs in the HTML with proxied URLs
    // Use more comprehensive regex patterns to catch all cases
    let modifiedHtml = html
      // Replace src="..." or src='...' in script tags (most important for JS files)
      .replace(/(<script[^>]*\ssrc=)(["'])([^"']+)(\2)/gi, (match, prefix, quote, url, suffix) => {
        return `${prefix}${quote}${toProxyUrl(url)}${quote}`;
      })
      // Replace href="..." or href='...' in link tags (for CSS stylesheets)
      .replace(/(<link[^>]*\shref=)(["'])([^"']+)(\2)/gi, (match, prefix, quote, url, suffix) => {
        // Don't proxy special URLs
        if (url.startsWith('#') || url.startsWith('mailto:') || url.startsWith('tel:') || url.startsWith('javascript:')) {
          return match;
        }
        return `${prefix}${quote}${toProxyUrl(url)}${quote}`;
      })
      // Replace src="..." or src='...' in img tags
      .replace(/(<img[^>]*\ssrc=)(["'])([^"']+)(\2)/gi, (match, prefix, quote, url, suffix) => {
        return `${prefix}${quote}${toProxyUrl(url)}${quote}`;
      })
      // Replace src="..." or src='...' in iframe tags
      .replace(/(<iframe[^>]*\ssrc=)(["'])([^"']+)(\2)/gi, (match, prefix, quote, url, suffix) => {
        return `${prefix}${quote}${toProxyUrl(url)}${quote}`;
      })
      // Replace href="..." or href='...' in anchor tags
      .replace(/(<a[^>]*\shref=)(["'])([^"']+)(\2)/gi, (match, prefix, quote, url, suffix) => {
        // Don't proxy special URLs
        if (url.startsWith('#') || url.startsWith('mailto:') || url.startsWith('tel:') || url.startsWith('javascript:')) {
          return match;
        }
        return `${prefix}${quote}${toProxyUrl(url)}${quote}`;
      })
      // Replace action="..." or action='...' in form tags
      .replace(/(<form[^>]*\saction=)(["'])([^"']+)(\2)/gi, (match, prefix, quote, url, suffix) => {
        return `${prefix}${quote}${toProxyUrl(url)}${quote}`;
      })
      // Replace background-image: url(...) in style attributes and style tags
      .replace(/url\((['"]?)([^'")]+)\1\)/g, (match, quote, url) => {
        // Skip data URLs and blob URLs
        if (url.startsWith('data:') || url.startsWith('blob:')) {
          return match;
        }
        return `url(${quote}${toProxyUrl(url)}${quote})`;
      })
      // Replace in inline style attributes
      .replace(/style=(["'])([^"']*)\1/g, (match, quote, style) => {
        return `style=${quote}${style.replace(/url\((['"]?)([^'")]+)\1\)/g, (m, q, url) => {
          if (url.startsWith('data:') || url.startsWith('blob:')) {
            return m;
          }
          return `url(${q}${toProxyUrl(url)}${q})`;
        })}${quote}`;
      })
      // Catch-all: Replace any remaining HTTP URLs in attribute values
      // This catches URLs that might not have been caught by the specific patterns above
      .replace(/(\s)(src|href|action)=(["'])(http:\/\/[^"']+)(\3)/gi, (match, space, attr, quote, url, endQuote) => {
        return `${space}${attr}=${quote}${toProxyUrl(url)}${endQuote}`;
      })
      // Add base tag to help resolve relative URLs (but we'll still proxy them)
      .replace(/<head([^>]*)>/i, `<head$1><base href="${metabaseBase}/">
      <script>
        (function() {
          // Override fetch to intercept HTTP requests
          const originalFetch = window.fetch;
          window.fetch = function(url, options) {
            if (typeof url === 'string' && url.startsWith('http://')) {
              url = '${proxyBase}/api/proxy?url=' + encodeURIComponent(url);
            } else if (typeof url === 'string' && url.startsWith('/')) {
              url = '${proxyBase}/api/proxy?url=' + encodeURIComponent('${metabaseBase}' + url);
            }
            return originalFetch.call(this, url, options);
          };
          
          // Override XMLHttpRequest to intercept HTTP requests
          const originalOpen = XMLHttpRequest.prototype.open;
          XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
            if (typeof url === 'string' && url.startsWith('http://')) {
              url = '${proxyBase}/api/proxy?url=' + encodeURIComponent(url);
            } else if (typeof url === 'string' && url.startsWith('/')) {
              url = '${proxyBase}/api/proxy?url=' + encodeURIComponent('${metabaseBase}' + url);
            }
            return originalOpen.call(this, method, url, async, user, password);
          };
          
          // Override Image constructor to intercept HTTP image requests
          const originalImage = window.Image;
          window.Image = function(width, height) {
            const img = new originalImage(width, height);
            const originalSrcSetter = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src').set;
            Object.defineProperty(img, 'src', {
              set: function(value) {
                if (typeof value === 'string' && value.startsWith('http://')) {
                  value = '${proxyBase}/api/proxy?url=' + encodeURIComponent(value);
                } else if (typeof value === 'string' && value.startsWith('/')) {
                  value = '${proxyBase}/api/proxy?url=' + encodeURIComponent('${metabaseBase}' + value);
                }
                originalSrcSetter.call(this, value);
              },
              get: function() {
                return this.getAttribute('src');
              }
            });
            return img;
          };
        })();
      </script>`);
    
    // Set response headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('X-Frame-Options', 'ALLOWALL');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "frame-ancestors 'self' *");
    res.status(response.status);

    res.send(modifiedHtml);
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

