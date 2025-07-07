/**
 * Stub for ts-md5 module
 * This file provides a minimal implementation for web/Edge Runtime environments
 */

export const Md5 = {
  hashAsciiStr(str: string): string {
    return Md5.hashStr(str);
  },

  hashStr(str: string): string {
    // Simple hash function for stub purposes
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  },
};

export default Md5;
