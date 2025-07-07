/**
 * Script to clear old branding data from localStorage
 * This can be run in the browser console to clear any cached LobeChat branding
 */

// Clear specific localStorage keys that might contain old branding
const keysToCheck = [
  'LOBE_PREFERENCE',
  'LOBE_SYSTEM_STATUS',
  'LOBE_GLOBAL',
  'LOBE_GLOBAL_PREFERENCE',
];

console.log('=== Clearing old branding data from localStorage ===');

keysToCheck.forEach((key) => {
  const data = localStorage.getItem(key);
  if (data) {
    try {
      const parsed = JSON.parse(data);
      console.log(`Found data in ${key}:`, parsed);

      // You can optionally clear these keys
      // localStorage.removeItem(key);
      // console.log(`Removed ${key}`);
    } catch {
      console.log(`${key} contains non-JSON data:`, data);
    }
  }
});

// Clear all localStorage (use with caution!)
// localStorage.clear();
// console.log('All localStorage cleared');

console.log('=== Cache clearing complete ===');
console.log(
  'Note: To actually clear the data, uncomment the localStorage.removeItem() or localStorage.clear() lines',
);
