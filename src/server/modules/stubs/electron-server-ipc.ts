/**
 * Stub for @lobechat/electron-server-ipc package
 * This file replaces the electron-server-ipc package in web/Edge Runtime environments
 */

export class ElectronIpcClient {
  constructor() {}

  sendRequest(): Promise<any> {
    throw new Error('Electron IPC client not available in web environment');
  }

  invoke(): Promise<any> {
    throw new Error('Electron IPC client not available in web environment');
  }

  on(): void {
    // No-op
  }

  off(): void {
    // No-op
  }
}

export default ElectronIpcClient;
