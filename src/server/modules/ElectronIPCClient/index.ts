// Only import in desktop environment to avoid Edge Runtime errors
let ElectronIpcClient: any;
let packageJSON: any;

if (typeof window === 'undefined' && typeof process !== 'undefined' && process.versions?.electron) {
  ElectronIpcClient = require('@lobechat/electron-server-ipc').ElectronIpcClient;
  packageJSON = require('@/../apps/desktop/package.json');
}

class LobeHubElectronIpcClient {
  private client: any;

  constructor() {
    if (ElectronIpcClient && packageJSON) {
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

export const electronIpcClient = new LobeHubElectronIpcClient();
