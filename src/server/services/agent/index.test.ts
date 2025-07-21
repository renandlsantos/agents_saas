// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionModel } from '@/database/models/session';
import { UserModel } from '@/database/models/user';
import { parseAgentConfig } from '@/server/globalConfig/parseDefaultAgent';

import { AgentService } from './index';

vi.mock('@/envs/app', () => ({
  appEnv: {
    DEFAULT_AGENT_CONFIG: 'model=gpt-4;temperature=0.7',
  },
  getAppConfig: () => ({
    DEFAULT_AGENT_CONFIG: 'model=gpt-4;temperature=0.7',
  }),
}));

vi.mock('@/server/globalConfig/parseDefaultAgent', () => ({
  parseAgentConfig: vi.fn(),
}));

vi.mock('@/database/models/session', () => ({
  SessionModel: vi.fn(),
}));

vi.mock('@/database/models/user', () => ({
  UserModel: vi.fn(),
}));

vi.mock('@/server/modules/KeyVaultsEncrypt', () => ({
  KeyVaultsGateKeeper: {
    decrypt: vi.fn(),
  },
}));

describe('AgentService', () => {
  let service: AgentService;
  const mockDb = {} as any;
  const mockUserId = 'test-user-id';

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AgentService(mockDb, mockUserId);
  });

  describe('createInbox', () => {
    it('should create inbox with server default config when user has no personalized settings', async () => {
      const mockServerConfig = { model: 'gpt-4', temperature: 0.7 };
      const mockSessionModel = {
        createInbox: vi.fn(),
      };
      const mockUserModel = {
        getUserState: vi.fn().mockResolvedValue({
          settings: {},
        }),
      };

      (SessionModel as any).mockImplementation(() => mockSessionModel);
      (UserModel as any).mockImplementation(() => mockUserModel);
      (parseAgentConfig as any).mockReturnValue(mockServerConfig);

      await service.createInbox();

      expect(SessionModel).toHaveBeenCalledWith(mockDb, mockUserId);
      expect(UserModel).toHaveBeenCalledWith(mockDb, mockUserId);
      expect(parseAgentConfig).toHaveBeenCalledWith('model=gpt-4;temperature=0.7');
      expect(mockSessionModel.createInbox).toHaveBeenCalledWith(mockServerConfig);
    });

    it('should create inbox with user personalized settings merged with server defaults', async () => {
      const mockServerConfig = { model: 'gpt-4', temperature: 0.7 };
      const mockUserDefaultAgent = {
        systemRole: 'You are a helpful assistant with custom instructions.',
        model: 'gpt-4-turbo',
      };
      const mockSessionModel = {
        createInbox: vi.fn(),
      };
      const mockUserModel = {
        getUserState: vi.fn().mockResolvedValue({
          settings: {
            defaultAgent: mockUserDefaultAgent,
          },
        }),
      };

      (SessionModel as any).mockImplementation(() => mockSessionModel);
      (UserModel as any).mockImplementation(() => mockUserModel);
      (parseAgentConfig as any).mockReturnValue(mockServerConfig);

      await service.createInbox();

      expect(mockSessionModel.createInbox).toHaveBeenCalledWith({
        model: 'gpt-4-turbo', // User's model overrides server default
        temperature: 0.7, // Server default preserved
        systemRole: 'You are a helpful assistant with custom instructions.', // User's systemRole added
      });
    });

    it('should create inbox with server config if parseAgentConfig returns undefined', async () => {
      const mockSessionModel = {
        createInbox: vi.fn(),
      };
      const mockUserModel = {
        getUserState: vi.fn().mockResolvedValue({
          settings: {},
        }),
      };

      (SessionModel as any).mockImplementation(() => mockSessionModel);
      (UserModel as any).mockImplementation(() => mockUserModel);
      (parseAgentConfig as any).mockReturnValue(undefined);

      await service.createInbox();

      expect(SessionModel).toHaveBeenCalledWith(mockDb, mockUserId);
      expect(parseAgentConfig).toHaveBeenCalledWith('model=gpt-4;temperature=0.7');
      expect(mockSessionModel.createInbox).toHaveBeenCalledWith({});
    });
  });
});
