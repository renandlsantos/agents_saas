/**
 * Stub for electron module
 * This file replaces the electron module in web/Edge Runtime environments
 */

export const app = {
  getName: () => 'web-app',
  getPath: () => '',
  getVersion: () => '0.0.0',
  on: () => {},
  quit: () => {},
};

export const ipcMain = {
  handle: () => {},
  on: () => {},
  removeHandler: () => {},
};

export const BrowserWindow = class {
  constructor() {}
  loadURL() {}
  on() {}
  webContents = {
    send: () => {},
  };
};

export const shell = {
  openExternal: () => Promise.resolve(),
};

export const dialog = {
  showOpenDialog: () => Promise.resolve({ canceled: true, filePaths: [] }),
  showSaveDialog: () => Promise.resolve({ canceled: true, filePath: undefined }),
};

export default {
  BrowserWindow,
  app,
  dialog,
  ipcMain,
  shell,
};
