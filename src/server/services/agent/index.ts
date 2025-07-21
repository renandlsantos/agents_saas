import { SessionModel } from '@/database/models/session';
import { UserModel } from '@/database/models/user';
import { LobeChatDatabase } from '@/database/type';
import { getServerDefaultAgentConfig } from '@/server/globalConfig';
import { KeyVaultsGateKeeper } from '@/server/modules/KeyVaultsEncrypt';
import { merge } from '@/utils/merge';

export class AgentService {
  private readonly userId: string;
  private readonly db: LobeChatDatabase;

  constructor(db: LobeChatDatabase, userId: string) {
    this.userId = userId;
    this.db = db;
  }

  async createInbox() {
    const sessionModel = new SessionModel(this.db, this.userId);
    const userModel = new UserModel(this.db, this.userId);
    
    // Get server default config
    const serverDefaultConfig = getServerDefaultAgentConfig();
    
    // Get user's personalized default agent settings
    const userState = await userModel.getUserState(KeyVaultsGateKeeper.decrypt);
    const userDefaultAgent = userState?.settings?.defaultAgent;
    
    // Merge server defaults with user's personalized settings
    // User settings take precedence over server defaults
    const finalConfig = userDefaultAgent ? merge(serverDefaultConfig, userDefaultAgent) : serverDefaultConfig;
    
    await sessionModel.createInbox(finalConfig);
  }
}
