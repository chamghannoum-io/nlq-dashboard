/**
 * Vercel serverless function to proxy Metabase iframe content
 * This allows HTTP Metabase content to be loaded in HTTPS pages
 * Uses query parameter ?url= instead of path-based routing
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
    
    // Get the HTML content
    const html = await response.text();
    
    // Get the base URL for the Metabase server (urlObj was already created above)
    const metabaseBase = `${urlObj.protocol}//${urlObj.host}`; // http://139.185.56.253:3000
    const proxyBase = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;
    
    // Helper function to convert a URL (absolute or relative) to a proxied URL
    const toProxyUrl = (url) => {
      // If it's already an absolute HTTP URL, proxy it directly
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
      // For relative paths without leading slash, resolve against current path
      if (!url.includes('://') && !url.startsWith('data:') && !url.startsWith('blob:')) {
        const currentPath = urlObj.pathname.substring(0, urlObj.pathname.lastIndexOf('/') + 1);
        const absoluteUrl = `${metabaseBase}${currentPath}${url}`;
        return `${proxyBase}/api/proxy?url=${encodeURIComponent(absoluteUrl)}`;
      }
      // Return as-is for data URLs, blob URLs, or already proxied URLs
      return url;
    };
    
    // Replace all URLs in the HTML with proxied URLs
    let modifiedHtml = html
      // Replace src="..." (handles both absolute and relative)
      .replace(/src="([^"]+)"/g, (match, url) => {
        return `src="${toProxyUrl(url)}"`;
      })
      // Replace href="..." (handles both absolute and relative)
      .replace(/href="([^"]+)"/g, (match, url) => {
        // Don't proxy anchor links, mailto, tel, etc.
        if (url.startsWith('#') || url.startsWith('mailto:') || url.startsWith('tel:') || url.startsWith('javascript:')) {
          return match;
        }
        return `href="${toProxyUrl(url)}"`;
      })
      // Replace action="..." (handles both absolute and relative)
      .replace(/action="([^"]+)"/g, (match, url) => {
        return `action="${toProxyUrl(url)}"`;
      })
      // Replace background-image: url(...) (handles both absolute and relative)
      .replace(/url\((['"]?)([^'")]+)\1\)/g, (match, quote, url) => {
        return `url(${quote}${toProxyUrl(url)}${quote})`;
      })
      // Replace in style attributes
      .replace(/style="([^"]*)"/g, (match, style) => {
        return `style="${style.replace(/url\((['"]?)([^'")]+)\1\)/g, (m, q, url) => {
          return `url(${q}${toProxyUrl(url)}${q})`;
        })}"`;
      })
      // Add base tag to help resolve relative URLs (but we'll still proxy them)
      .replace(/<head([^>]*)>/i, `<head$1><base href="${metabaseBase}/">`);

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

