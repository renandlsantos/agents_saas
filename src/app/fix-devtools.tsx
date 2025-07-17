'use client';

import { useEffect } from 'react';

/**
 * Component to disable React DevTools in production
 * This helps prevent the React Error #185 related to DevTools
 */
export function DisableDevTools() {
  useEffect(() => {
    // Check if we're in production
    if (process.env.NODE_ENV === 'production' && // Disable React DevTools
      typeof window !== 'undefined' && window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        window.__REACT_DEVTOOLS_GLOBAL_HOOK__.inject = function () {};
        window.__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot = function () {};
        window.__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberUnmount = function () {};
      }
  }, []);

  return null;
}