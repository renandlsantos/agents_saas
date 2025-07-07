/**
 * ElectronIPCClient module with Edge Runtime safety
 *
 * This module conditionally loads electron-specific dependencies only in
 * Node.js environments with Electron, preventing Edge Runtime errors.
 */

// Edge Runtime detection - check for lack of Node.js globals
const isEdgeRuntime = typeof process === 'undefined' || !process.versions?.node;
const isElectronEnvironment =
  !isEdgeRuntime &&
  typeof window === 'undefined' &&
  typeof process !== 'undefined' &&
  process.versions?.electron &&
  process.versions?.node !== undefined;

// Only import in desktop environment to avoid Edge Runtime errors
let ElectronIpcClient: any;
let packageJSON: any;

// Only attempt to load electron modules in actual Electron environment
if (isElectronEnvironment) {
  try {
    ElectronIpcClient = require('@lobechat/electron-server-ipc').ElectronIpcClient;
    packageJSON = require('@/../apps/desktop/package.json');
  } catch (error) {
    // Silently fail if modules cannot be loaded
    console.warn('Failed to load electron modules:', error);
  }
}

class LobeHubElectronIpcClient {
  private client: any;

  constructor() {
    if (isElectronEnvironment && ElectronIpcClient && packageJSON) {
      this.client = new ElectronIpcClient(packageJSON.name);
    }
  }

  // 获取数据库路径
  getDatabasePath = async (): Promise<string> => {
    if (!this.client) throw new Error('Electron IPC client not available');
    return this.client.sendRequest('getDatabasePath');
  };

  // 获取用户数据路径
  getUserDataPath = async (): Promise<string> => {
    if (!this.client) throw new Error('Electron IPC client not available');
    return this.client.sendRequest('getUserDataPath');
  };

  getDatabaseSchemaHash = async (): Promise<string> => {
    if (!this.client) throw new Error('Electron IPC client not available');
    return this.client.sendRequest('setDatabaseSchemaHash');
  };

  setDatabaseSchemaHash = async (hash: string | undefined): Promise<void> => {
    if (!this.client) throw new Error('Electron IPC client not available');
    if (!hash) return;

    return this.client.sendRequest('setDatabaseSchemaHash', hash);
  };

  getFilePathById = async (id: string): Promise<string> => {
    if (!this.client) throw new Error('Electron IPC client not available');
    return this.client.sendRequest('getStaticFilePath', id);
  };

  deleteFiles = async (
    paths: string[],
  ): Promise<{ errors?: { message: string; path: string }[]; success: boolean }> => {
    if (!this.client) throw new Error('Electron IPC client not available');
    return this.client.sendRequest('deleteFiles', paths);
  };
}

// Export the appropriate client based on environment
// In Edge Runtime, this will be a stub that throws errors
// In Electron environment, this will be the real client
export const electronIpcClient = new LobeHubElectronIpcClient();
