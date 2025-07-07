/**
 * Stub for node:fs module
 * This file replaces the fs module in web/Edge Runtime environments
 */

export const existsSync = (): boolean => false;

export const readFileSync = (): string => {
  throw new Error('fs.readFileSync not available in web environment');
};

export const writeFileSync = (): void => {
  throw new Error('fs.writeFileSync not available in web environment');
};

export const unlinkSync = (): void => {
  throw new Error('fs.unlinkSync not available in web environment');
};

export const statSync = (): any => {
  throw new Error('fs.statSync not available in web environment');
};

export const mkdirSync = (): void => {
  throw new Error('fs.mkdirSync not available in web environment');
};

export const readdirSync = (): string[] => {
  throw new Error('fs.readdirSync not available in web environment');
};

export const promises = {
  mkdir: () => Promise.reject(new Error('fs.promises.mkdir not available in web environment')),
  readFile: () =>
    Promise.reject(new Error('fs.promises.readFile not available in web environment')),
  readdir: () => Promise.reject(new Error('fs.promises.readdir not available in web environment')),
  stat: () => Promise.reject(new Error('fs.promises.stat not available in web environment')),
  unlink: () => Promise.reject(new Error('fs.promises.unlink not available in web environment')),
  writeFile: () =>
    Promise.reject(new Error('fs.promises.writeFile not available in web environment')),
};

export default {
  existsSync,
  mkdirSync,
  promises,
  readFileSync,
  readdirSync,
  statSync,
  unlinkSync,
  writeFileSync,
};
