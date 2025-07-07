/**
 * Edge Runtime safe version of ElectronIPCClient
 * This module provides a no-op implementation for Edge Runtime environments
 */

class EdgeSafeElectronIpcClient {
  getDatabasePath = async (): Promise<string> => {
    throw new Error('Electron IPC client not available in Edge Runtime');
  };

  getUserDataPath = async (): Promise<string> => {
    throw new Error('Electron IPC client not available in Edge Runtime');
  };

  getDatabaseSchemaHash = async (): Promise<string> => {
    throw new Error('Electron IPC client not available in Edge Runtime');
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setDatabaseSchemaHash = async (_hash: string | undefined): Promise<void> => {
    throw new Error('Electron IPC client not available in Edge Runtime');
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getFilePathById = async (_id: string): Promise<string> => {
    throw new Error('Electron IPC client not available in Edge Runtime');
  };

  deleteFiles = async (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _paths: string[],
  ): Promise<{ errors?: { message: string; path: string }[]; success: boolean }> => {
    throw new Error('Electron IPC client not available in Edge Runtime');
  };
}

export const electronIpcClient = new EdgeSafeElectronIpcClient();
