/**
 * Stub for electron database
 * This file replaces the electron database in web/Edge Runtime environments
 */

export const getPgliteInstance = async (): Promise<any> => {
  throw new Error('Electron database not available in web environment');
};

export default {
  getPgliteInstance,
};
