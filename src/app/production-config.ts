/**
 * Production configuration to prevent React DevTools issues
 */

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  // Disable React DevTools in production
  if ((window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__.inject = () => {};
    (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot = () => {};
    (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberUnmount = () => {};
    (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__.supportsFiber = false;
  }

  // Prevent iframe injections
  if (window.parent !== window) {
    console.warn('Application loaded in iframe, some features may be limited');
  }
}

export {};