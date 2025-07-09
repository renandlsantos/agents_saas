/**
 * ElectronIPCClient module with Edge Runtime safety
 *
 * This module provides a unified interface that works in both Edge Runtime
 * and Node.js environments. In Edge Runtime or non-Electron environments,
 * it provides a stub implementation that throws appropriate errors.
 */

// Edge Runtime detection - check for lack of Node.js globals
const isEdgeRuntime = typeof process === 'undefined' || !process.versions?.node;
const isElectronEnvironment =
  !isEdgeRuntime &&
  typeof window === 'undefined' &&
  typeof process !== 'undefined' &&
  process.versions?.electron &&
  process.versions?.node !== undefined;

class LobeHubElectronIpcClient {
  private client: any;
  private clientPromise: Promise<any> | null = null;

  constructor() {
    // Initialize client lazily to avoid Edge Runtime issues
    this.client = null;
  }

  private async ensureClient(): Promise<any> {
    if (this.client) return this.client;
    
    if (!isElectronEnvironment) {
      throw new Error('Electron IPC client not available in this environment');
    }

    // Use cached promise to avoid multiple initializations
    if (this.clientPromise) return this.clientPromise;

    this.clientPromise = this.initializeClient();
    this.client = await this.clientPromise;
    return this.client;
  }

  private async initializeClient(): Promise<any> {
    try {
      // Dynamic imports only when actually needed
      const [electronModule, desktopPkg] = await Promise.all([
        import('@lobechat/electron-server-ipc'),
        import('@/../apps/desktop/package.json')
      ]);
      
      const ElectronIpcClient = electronModule.ElectronIpcClient;
      const packageJSON = desktopPkg.default;
      
      return new ElectronIpcClient(packageJSON.name);
    } catch (error) {
      console.error('Failed to initialize Electron IPC client:', error);
      throw new Error('Failed to initialize Electron IPC client');
    }
  }

  // 获取数据库路径
  getDatabasePath = async (): Promise<string> => {
    const client = await this.ensureClient();
    return client.sendRequest('getDatabasePath');
  };

  // 获取用户数据路径
  getUserDataPath = async (): Promise<string> => {
    const client = await this.ensureClient();
    return client.sendRequest('getUserDataPath');
  };

  getDatabaseSchemaHash = async (): Promise<string> => {
    const client = await this.ensureClient();
    return client.sendRequest('getDatabaseSchemaHash');
  };

  setDatabaseSchemaHash = async (hash: string | undefined): Promise<void> => {
    if (!hash) return;
    const client = await this.ensureClient();
    return client.sendRequest('setDatabaseSchemaHash', hash);
  };

  getFilePathById = async (id: string): Promise<string> => {
    const client = await this.ensureClient();
    return client.sendRequest('getStaticFilePath', id);
  };

  deleteFiles = async (
    paths: string[],
  ): Promise<{ errors?: { message: string; path: string }[]; success: boolean }> => {
    const client = await this.ensureClient();
    return client.sendRequest('deleteFiles', paths);
  };
}

// Export the appropriate client based on environment
// In Edge Runtime, this will be a stub that throws errors when methods are called
// In Electron environment, this will be the real client with lazy initialization
export const electronIpcClient = new LobeHubElectronIpcClient();