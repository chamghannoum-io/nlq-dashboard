/**
 * Convert HTTP URLs to HTTPS to avoid mixed content errors
 * @param {string} url - The URL to convert
 * @returns {string} - The URL with HTTPS protocol
 */
export function convertToHttps(url) {
  if (!url || typeof url !== 'string') {
    return url;
  }

  // If it's already HTTPS or a relative URL, return as-is
  if (url.startsWith('https://') || url.startsWith('/') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }

  // Convert HTTP to HTTPS
  if (url.startsWith('http://')) {
    return url.replace('http://', 'https://');
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

