import * as AiModels from '@/config/aiModels';
import { getLLMConfig } from '@/config/llm';
import { ModelProvider } from '@/libs/model-runtime';
import { AiFullModelCard } from '@/types/aiModel';
import { ProviderConfig } from '@/types/user/settings';
import { extractEnabledModels, transformToAiChatModelList } from '@/utils/parseModels';

interface ProviderSpecificConfig {
  enabled?: boolean;
  enabledKey?: string;
  fetchOnClient?: boolean;
  modelListKey?: string;
  withDeploymentName?: boolean;
}

export const genServerAiProvidersConfig = (specificConfig: Record<any, ProviderSpecificConfig>) => {
  try {
    console.log('[genServerAiProvidersConfig] Starting provider config generation');
    const llmConfig = getLLMConfig() as Record<string, any>;
    console.log('[genServerAiProvidersConfig] LLM config keys:', Object.keys(llmConfig || {}));

    return Object.values(ModelProvider).reduce(
      (config, provider) => {
        try {
          const providerUpperCase = provider.toUpperCase();
          const providerCard = AiModels[provider] as AiFullModelCard[];

          if (!providerCard) {
            console.error(`[genServerAiProvidersConfig] Provider [${provider}] not found in aiModels`);
            throw new Error(
              `Provider [${provider}] not found in aiModels, please make sure you have exported the provider in the \`aiModels/index.ts\``,
            );
          }

          const providerConfig = specificConfig[provider as keyof typeof specificConfig] || {};
          const providerModelList =
            process.env[providerConfig.modelListKey ?? `${providerUpperCase}_MODEL_LIST`];

          const defaultChatModels = providerCard.filter((c) => c.type === 'chat');

          config[provider] = {
            enabled:
              typeof providerConfig.enabled !== 'undefined'
                ? providerConfig.enabled
                : llmConfig[providerConfig.enabledKey || `ENABLED_${providerUpperCase}`],

            enabledModels: extractEnabledModels(
              providerModelList,
              providerConfig.withDeploymentName || false,
            ),
            serverModelLists: transformToAiChatModelList({
              defaultChatModels: defaultChatModels || [],
              modelString: providerModelList,
              providerId: provider,
              withDeploymentName: providerConfig.withDeploymentName || false,
            }),
            ...(providerConfig.fetchOnClient !== undefined && {
              fetchOnClient: providerConfig.fetchOnClient,
            }),
          };

          return config;
        } catch (error) {
          console.error(`[genServerAiProvidersConfig] Error processing provider ${provider}:`, error);
          throw error;
        }
      },
      {} as Record<string, ProviderConfig>,
    );
  } catch (error) {
    console.error('[genServerAiProvidersConfig] Fatal error:', error);
    throw error;
  }
};
