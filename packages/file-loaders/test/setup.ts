// Import and install DOMMatrix polyfill for pdfjs-dist in Node.js environment
import '../src/polyfills/dom-matrix';

// Polyfill URL.createObjectURL and URL.revokeObjectURL for pdfjs-dist
if (typeof global.URL.createObjectURL === 'undefined') {
  global.URL.createObjectURL = () => 'blob:http://localhost/fake-blob-url';
}
if (typeof global.URL.revokeObjectURL === 'undefined') {
  global.URL.revokeObjectURL = () => {
    /* no-op */
  };
}
