import { getLLMConfig } from '@/config/llm';
import { JWTPayload } from '@/const/auth';
import { AgentRuntime, ModelProvider } from '@/libs/model-runtime';
import { getAdminProviderSettings } from '@/server/globalConfig/adminProviderConfig';

import apiKeyManager from './apiKeyManager';

export * from './trace';

/**
 * Retrieves the options object from environment and apikeymanager
 * based on the provider and payload.
 *
 * @param provider - The model provider.
 * @param payload - The JWT payload.
 * @returns The options object.
 */
const getParamsFromPayload = async (provider: string, payload: JWTPayload) => {
  const llmConfig = getLLMConfig() as Record<string, any>;

  // Try to get admin-configured settings first
  const adminSettings = await getAdminProviderSettings(provider);

  switch (provider) {
    default: {
      let upperProvider = provider.toUpperCase();

      if (!(`${upperProvider}_API_KEY` in llmConfig)) {
        upperProvider = ModelProvider.OpenAI.toUpperCase(); // Use OpenAI options as default
      }

      // Priority: 1. User payload, 2. Admin config, 3. Environment variables
      const apiKey = apiKeyManager.pick(
        payload?.apiKey || adminSettings?.apiKey || llmConfig[`${upperProvider}_API_KEY`],
      );
      const baseURL =
        payload?.baseURL || adminSettings?.baseURL || process.env[`${upperProvider}_PROXY_URL`];

      return baseURL ? { apiKey, baseURL } : { apiKey };
    }

    case ModelProvider.Ollama: {
      const baseURL = payload?.baseURL || adminSettings?.baseURL || process.env.OLLAMA_PROXY_URL;

      return { baseURL };
    }

    case ModelProvider.Azure: {
      const { AZURE_API_KEY, AZURE_API_VERSION, AZURE_ENDPOINT } = llmConfig;
      const apiKey = apiKeyManager.pick(payload?.apiKey || adminSettings?.apiKey || AZURE_API_KEY);
      const baseURL =
        payload?.baseURL || adminSettings?.endpoint || adminSettings?.baseURL || AZURE_ENDPOINT;
      const apiVersion = payload?.azureApiVersion || adminSettings?.apiVersion || AZURE_API_VERSION;
      return { apiKey, apiVersion, baseURL };
    }

    case ModelProvider.AzureAI: {
      const { AZUREAI_ENDPOINT, AZUREAI_ENDPOINT_KEY } = llmConfig;
      const apiKey = payload?.apiKey || adminSettings?.apiKey || AZUREAI_ENDPOINT_KEY;
      const baseURL =
        payload?.baseURL || adminSettings?.endpoint || adminSettings?.baseURL || AZUREAI_ENDPOINT;
      return { apiKey, baseURL };
    }

    case ModelProvider.Bedrock: {
      const { AWS_SECRET_ACCESS_KEY, AWS_ACCESS_KEY_ID, AWS_REGION, AWS_SESSION_TOKEN } = llmConfig;
      let accessKeyId: string | undefined = AWS_ACCESS_KEY_ID;
      let accessKeySecret: string | undefined = AWS_SECRET_ACCESS_KEY;
      let region = AWS_REGION;
      let sessionToken: string | undefined = AWS_SESSION_TOKEN;

      // Priority: 1. User payload, 2. Admin config, 3. Environment variables
      if (payload.apiKey) {
        accessKeyId = payload?.awsAccessKeyId;
        accessKeySecret = payload?.awsSecretAccessKey;
        sessionToken = payload?.awsSessionToken;
        region = payload?.awsRegion;
      } else if (adminSettings) {
        accessKeyId = adminSettings.accessKeyId || AWS_ACCESS_KEY_ID;
        accessKeySecret = adminSettings.secretAccessKey || AWS_SECRET_ACCESS_KEY;
        region = adminSettings.region || AWS_REGION;
        sessionToken = adminSettings.sessionToken || AWS_SESSION_TOKEN;
      }
      return { accessKeyId, accessKeySecret, region, sessionToken };
    }

    case ModelProvider.Cloudflare: {
      const { CLOUDFLARE_API_KEY, CLOUDFLARE_BASE_URL_OR_ACCOUNT_ID } = llmConfig;

      const apiKey = apiKeyManager.pick(
        payload?.apiKey || adminSettings?.apiKey || CLOUDFLARE_API_KEY,
      );
      const baseURLOrAccountID =
        payload.apiKey && payload.cloudflareBaseURLOrAccountID
          ? payload.cloudflareBaseURLOrAccountID
          : adminSettings?.baseURLOrAccountID || CLOUDFLARE_BASE_URL_OR_ACCOUNT_ID;

      return { apiKey, baseURLOrAccountID };
    }

    case ModelProvider.GiteeAI: {
      const { GITEE_AI_API_KEY } = llmConfig;

      const apiKey = apiKeyManager.pick(
        payload?.apiKey || adminSettings?.apiKey || GITEE_AI_API_KEY,
      );

      return { apiKey };
    }

    case ModelProvider.Github: {
      const { GITHUB_TOKEN } = llmConfig;

      const apiKey = apiKeyManager.pick(payload?.apiKey || adminSettings?.apiKey || GITHUB_TOKEN);

      return { apiKey };
    }

    case ModelProvider.TencentCloud: {
      const { TENCENT_CLOUD_API_KEY } = llmConfig;

      const apiKey = apiKeyManager.pick(
        payload?.apiKey || adminSettings?.apiKey || TENCENT_CLOUD_API_KEY,
      );

      return { apiKey };
    }
  }
};

/**
 * Initializes the agent runtime with the user payload in backend
 * @param provider - The provider name.
 * @param payload - The JWT payload.
 * @param params
 * @returns A promise that resolves when the agent runtime is initialized.
 */
export const initAgentRuntimeWithUserPayload = async (
  provider: string,
  payload: JWTPayload,
  params: any = {},
) => {
  const providerParams = await getParamsFromPayload(provider, payload);
  return AgentRuntime.initializeWithProvider(provider, {
    ...providerParams,
    ...params,
  });
};
