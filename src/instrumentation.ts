/**
 * Next.js instrumentation file
 * This file is loaded once when the server starts
 * Used to initialize server-side polyfills and configurations
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Load server initialization including canvas polyfills
    await import('./server/init');
    console.log('Server initialization complete');
  }
}
