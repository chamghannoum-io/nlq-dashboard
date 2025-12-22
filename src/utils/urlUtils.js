/**
 * Convert HTTP Metabase URLs to use proxy to avoid mixed content errors
 * Uses path-based routing: /api/metabase/public/question/... instead of query params
 * @param {string} url - The URL to convert
 * @returns {string} - The proxied URL or original if already HTTPS
 */
export function convertToHttps(url) {
  if (!url || typeof url !== 'string') {
    return url;
  }

  // If it's already HTTPS or a relative URL starting with /api/metabase, return as-is
  if (url.startsWith('https://') || url.startsWith('/api/metabase') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }

  // For HTTP Metabase URLs, convert to path-based proxy
  if (url.startsWith('http://139.185.56.253:3000')) {
    // Extract the path and hash/fragment
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      const hash = urlObj.hash;
      const search = urlObj.search;
      // Convert to proxy path: /api/metabase/public/question/...
      return `/api/metabase${path}${search}${hash}`;
    } catch (e) {
      // If URL parsing fails, try simple string replacement
      return url.replace('http://139.185.56.253:3000', '/api/metabase');
    }
  }

  // For other HTTP URLs, use the old proxy method as fallback
  if (url.startsWith('http://')) {
    const encodedUrl = encodeURIComponent(url);
    return `/api/proxy?url=${encodedUrl}`;
  }

  // If no protocol, assume HTTPS for absolute URLs
  if (url.includes('://')) {
    return url; // Already has a protocol (not http or https)
  }

  return url;
}

/**
 * Check if a URL is HTTP (needs conversion)
 * @param {string} url - The URL to check
 * @returns {boolean} - True if the URL is HTTP
 */
export function isHttpUrl(url) {
  return url && typeof url === 'string' && url.startsWith('http://');
}

