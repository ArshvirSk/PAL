/**
 * Clear old/invalid tokens from localStorage
 * Call this on app initialization
 */
export function clearOldTokens() {
  if (typeof window === 'undefined') return;
  
  const token = localStorage.getItem('token');
  
  // Check if token looks like a test token (old format)
  if (token && token.startsWith('test-token-')) {
    console.log('Clearing old test token');
    localStorage.clear();
  }
  
  // Check if token is malformed (not a JWT)
  if (token && !token.includes('.')) {
    console.log('Clearing malformed token');
    localStorage.clear();
  }
}
