import { and, eq } from 'drizzle-orm';

import { aiProviders } from '@/database/schemas/aiInfra';
import { serverDB } from '@/database/server';
import { KeyVaultsGateKeeper } from '@/server/modules/KeyVaultsEncrypt';
import { UserKeyVaults } from '@/types/user/settings';

// Cache for admin provider configurations
let adminProviderCache: Record<string, any> | null = null;
let cacheExpiry: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Load admin-configured AI provider settings from database
 * These will override environment variables for all users
 */
export async function getAdminProviderConfig(): Promise<UserKeyVaults> {
  // Check cache first
  if (adminProviderCache && Date.now() < cacheExpiry) {
    return adminProviderCache;
  }

  try {
    // Find admin user (you might want to use a specific admin user ID here)
    const adminProviders = await serverDB.query.aiProviders.findMany({
      where: and(eq(aiProviders.source, 'builtin'), eq(aiProviders.enabled, true)),
    });

    const keyVaultsGateKeeper = await KeyVaultsGateKeeper.initWithEnvKey();
    const mergedKeyVaults: UserKeyVaults = {};

    // Process each provider
    for (const provider of adminProviders) {
      if (provider.keyVaults) {
        try {
          // Decrypt the keyVaults
          const { plaintext, wasAuthentic } = await keyVaultsGateKeeper.decrypt(provider.keyVaults);
          if (wasAuthentic) {
            const keyVaults = JSON.parse(plaintext);
            // Map provider ID to keyVaults structure
            mergedKeyVaults[provider.id as keyof UserKeyVaults] = keyVaults;
          }
        } catch (error) {
          console.error(`Failed to decrypt keyVaults for provider ${provider.id}:`, error);
        }
      }
    }

    // Update cache
    adminProviderCache = mergedKeyVaults;
    cacheExpiry = Date.now() + CACHE_DURATION;

    return mergedKeyVaults;
  } catch (error) {
    console.error('Failed to load admin provider configuration:', error);
    return {};
  }
}

/**
 * Clear the admin provider cache (useful after updates)
 */
export function clearAdminProviderCache() {
  adminProviderCache = null;
  cacheExpiry = 0;
}

/**
 * Get API key for a specific provider from admin configuration
 */
export async function getAdminApiKey(providerId: string): Promise<string | undefined> {
  const config = await getAdminProviderConfig();
  const providerConfig = config[providerId as keyof UserKeyVaults] as any;

  if (!providerConfig) return undefined;

  // Handle different provider structures
  if (typeof providerConfig === 'string') {
    return providerConfig; // Simple string API key
  }

  // Most providers use apiKey field
  return providerConfig.apiKey || providerConfig.api_key;
}

/**
 * Get full provider configuration including baseURL, endpoints, etc.
 */
export async function getAdminProviderSettings(
  providerId: string,
): Promise<Record<string, any> | undefined> {
  const config = await getAdminProviderConfig();
  const providerConfig = config[providerId as keyof UserKeyVaults];

  if (!providerConfig || typeof providerConfig === 'string') {
    return providerConfig ? { apiKey: providerConfig } : undefined;
  }

  return providerConfig as Record<string, any>;
}
