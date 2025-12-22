/**
 * Convert HTTP URLs to use proxy to avoid mixed content errors
 * For iframes, we need to use a proxy since browsers block HTTP iframes in HTTPS pages
 * @param {string} url - The URL to convert
 * @returns {string} - The proxied URL or original if already HTTPS
 */
export function convertToHttps(url) {
  if (!url || typeof url !== 'string') {
    return url;
  }

  // If it's already HTTPS or a relative URL, return as-is
  if (url.startsWith('https://') || url.startsWith('/') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }

  // For HTTP URLs, use the proxy endpoint
  // Note: This requires the Metabase server to be accessible from Vercel
  if (url.startsWith('http://')) {
    // Encode the URL for use as a query parameter
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

