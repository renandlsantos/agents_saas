/**
 * Web/Edge Runtime safe version of ElectronIPCClient
 * This module provides a no-op implementation for web environments
 */

class WebElectronIpcClient {
  getDatabasePath = async (): Promise<string> => {
    throw new Error('Electron IPC client not available in web environment');
  };

  getUserDataPath = async (): Promise<string> => {
    throw new Error('Electron IPC client not available in web environment');
  };

  getDatabaseSchemaHash = async (): Promise<string> => {
    throw new Error('Electron IPC client not available in web environment');
  };

  setDatabaseSchemaHash = async (): Promise<void> => {
    throw new Error('Electron IPC client not available in web environment');
  };

  getFilePathById = async (): Promise<string> => {
    throw new Error('Electron IPC client not available in web environment');
  };

  deleteFiles = async (): Promise<{
    errors?: { message: string; path: string }[];
    success: boolean;
  }> => {
    throw new Error('Electron IPC client not available in web environment');
  };
}

export const electronIpcClient = new WebElectronIpcClient();
