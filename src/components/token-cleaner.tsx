"use client";

import { useEffect } from "react";

export function TokenCleaner() {
  useEffect(() => {
    // Clear old/invalid tokens on mount
    const token = localStorage.getItem('token');
    
    // Check if token looks like a test token (old format)
    if (token && token.startsWith('test-token-')) {
      console.log('Clearing old test token');
      localStorage.clear();
    }
    
    // Check if token is malformed (not a JWT - should have 2 dots)
    if (token && (token.split('.').length !== 3)) {
      console.log('Clearing malformed token');
      localStorage.clear();
    }
  }, []);

  return null; // This component doesn't render anything
}
