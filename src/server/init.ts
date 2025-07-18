/**
 * Server initialization module
 * This file is imported at the very beginning of the server startup
 * to ensure all necessary polyfills are loaded before any other modules
 */
// Load canvas polyfills for pdfjs-dist
import './polyfills/canvas';

// Export to ensure the module is not tree-shaken
export const serverInitialized = true;
