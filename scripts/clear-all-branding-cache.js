/**
 * Script to clear ALL localStorage data and force refresh
 * Run this in the browser console to completely clear cache
 */

console.log('=== Clearing ALL localStorage data ===');

// Get all keys before clearing
const keys = Object.keys(localStorage);
console.log(`Found ${keys.length} keys in localStorage:`, keys);

// Clear all localStorage
localStorage.clear();
console.log('✅ All localStorage cleared');

// Clear sessionStorage too
sessionStorage.clear();
console.log('✅ All sessionStorage cleared');

// Clear IndexedDB (if used)
if ('indexedDB' in window) {
  const databases = await indexedDB.databases();
  for (const db of databases) {
    indexedDB.deleteDatabase(db.name);
    console.log(`✅ Deleted IndexedDB: ${db.name}`);
  }
}

// Clear cache storage (service workers)
if ('caches' in window) {
  const names = await caches.keys();
  for (const name of names) {
    caches.delete(name);
    console.log(`✅ Deleted cache: ${name}`);
  }
}

console.log('=== All cache cleared! ===');
console.log('🔄 Refreshing page in 2 seconds...');

// Force reload after 2 seconds
setTimeout(() => {
  window.location.reload(true);
}, 2000);
