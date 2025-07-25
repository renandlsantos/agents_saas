import { z } from 'zod';

import { AiProviderModel } from '@/database/models/aiProvider';
import { UserModel } from '@/database/models/user';
import { AiInfraRepos } from '@/database/repositories/aiInfra';
import { authedProcedure, router } from '@/libs/trpc/lambda';
import { serverDatabase } from '@/libs/trpc/lambda/middleware';
import { getServerGlobalConfig } from '@/server/globalConfig';
import { KeyVaultsGateKeeper } from '@/server/modules/KeyVaultsEncrypt';
import {
  AiProviderDetailItem,
  AiProviderRuntimeState,
  CreateAiProviderSchema,
  UpdateAiProviderConfigSchema,
  UpdateAiProviderSchema,
} from '@/types/aiProvider';
import { ProviderConfig } from '@/types/user/settings';

const aiProviderProcedure = authedProcedure.use(serverDatabase).use(async (opts) => {
  const { ctx } = opts;

  try {
    console.log('[aiProviderProcedure] Starting middleware initialization');
    console.log('[aiProviderProcedure] Context userId:', ctx.userId);
    
    const { aiProvider } = await getServerGlobalConfig();
    console.log('[aiProviderProcedure] Global config loaded, aiProvider keys:', Object.keys(aiProvider || {}));

    const gateKeeper = await KeyVaultsGateKeeper.initWithEnvKey();
    console.log('[aiProviderProcedure] KeyVaultsGateKeeper initialized');

    return opts.next({
      ctx: {
        aiInfraRepos: new AiInfraRepos(
          ctx.serverDB,
          ctx.userId,
          aiProvider as Record<string, ProviderConfig>,
        ),
        aiProviderModel: new AiProviderModel(ctx.serverDB, ctx.userId),
        gateKeeper,
        userModel: new UserModel(ctx.serverDB, ctx.userId),
      },
    });
  } catch (error) {
    console.error('[aiProviderProcedure] Error in middleware:', error);
    throw error;
  }
});

export const aiProviderRouter = router({
  createAiProvider: aiProviderProcedure
    .input(CreateAiProviderSchema)
    .mutation(async ({ input, ctx }) => {
      const data = await ctx.aiProviderModel.create(input, ctx.gateKeeper.encrypt);

      return data?.id;
    }),

  getAiProviderById: aiProviderProcedure
    .input(z.object({ id: z.string() }))

    .query(async ({ input, ctx }): Promise<AiProviderDetailItem | undefined> => {
      return ctx.aiInfraRepos.getAiProviderDetail(input.id, KeyVaultsGateKeeper.getUserKeyVaults);
    }),

  getAiProviderList: aiProviderProcedure.query(async ({ ctx }) => {
    return await ctx.aiInfraRepos.getAiProviderList();
  }),

  getAiProviderRuntimeState: aiProviderProcedure
    .input(z.object({ isLogin: z.boolean().optional() }))
    .query(async ({ ctx }): Promise<AiProviderRuntimeState> => {
      try {
        console.log('[getAiProviderRuntimeState] Starting query');
        console.log('[getAiProviderRuntimeState] Context exists:', !!ctx);
        console.log('[getAiProviderRuntimeState] aiInfraRepos exists:', !!ctx.aiInfraRepos);
        
        const result = await ctx.aiInfraRepos.getAiProviderRuntimeState(KeyVaultsGateKeeper.getUserKeyVaults);
        console.log('[getAiProviderRuntimeState] Result obtained successfully');
        
        return result;
      } catch (error) {
        console.error('[getAiProviderRuntimeState] Error in query:', error);
        console.error('[getAiProviderRuntimeState] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        throw error;
      }
    }),

  removeAiProvider: aiProviderProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.aiProviderModel.delete(input.id);
    }),

  toggleProviderEnabled: aiProviderProcedure
    .input(
      z.object({
        enabled: z.boolean(),
        id: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.aiProviderModel.toggleProviderEnabled(input.id, input.enabled);
    }),

  updateAiProvider: aiProviderProcedure
    .input(
      z.object({
        id: z.string(),
        value: UpdateAiProviderSchema,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.aiProviderModel.update(input.id, input.value);
    }),

  updateAiProviderConfig: aiProviderProcedure
    .input(
      z.object({
        id: z.string(),
        value: UpdateAiProviderConfigSchema,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.aiProviderModel.updateConfig(input.id, input.value, ctx.gateKeeper.encrypt);
    }),

  updateAiProviderOrder: aiProviderProcedure
    .input(
      z.object({
        sortMap: z.array(
          z.object({
            id: z.string(),
            sort: z.number(),
          }),
        ),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.aiProviderModel.updateOrder(input.sortMap);
    }),
});

export type AiProviderRouter = typeof aiProviderRouter;
