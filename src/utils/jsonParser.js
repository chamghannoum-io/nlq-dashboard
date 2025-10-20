// Safely parse JSON (handles empty/non-JSON responses)
export const parseJsonSafe = async (response) => {
  const contentType = response.headers?.get?.('content-type') || '';
  
  try {
    // Try to read as text first
    const text = await response.text();
    if (!text) return null;
    
    // If content-type suggests JSON, try parsing
    if (contentType.includes('application/json')) {
      try {
        return JSON.parse(text);
      } catch (e) {
        // If JSON parsing fails, treat as plain text
        return { __text: text };
      }
    }
    
    // Try to parse as JSON anyway
    try {
      return JSON.parse(text);
    } catch (e) {
      // If it's not JSON, treat as plain text answer
      return { __text: text };
    }
  } catch (e) {
    console.error('Failed to read response:', e);
    return null;
  }
};
