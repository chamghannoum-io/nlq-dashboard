export const parseJsonSafe = async (response) => {
  const contentType = response.headers?.get?.('content-type') || '';
  
  try {
    const text = await response.text();
    if (!text) return null;
    
    if (contentType.includes('application/json')) {
      try {
        return JSON.parse(text);
      } catch (e) {
        return { __text: text };
      }
    }
    
    try {
      return JSON.parse(text);
    } catch (e) {
      return { __text: text };
    }
  } catch (e) {
    console.error('Failed to read response:', e);
    return null;
  }
};
