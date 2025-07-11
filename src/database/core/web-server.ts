import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { drizzle as neonDrizzle } from 'drizzle-orm/neon-serverless';
import { drizzle as nodeDrizzle } from 'drizzle-orm/node-postgres';
import { Pool as NodePool } from 'pg';
import ws from 'ws';

import { serverDBEnv } from '@/config/db';
import { isServerMode } from '@/const/version';
import * as schema from '@/database/schemas';

import { LobeChatDatabase } from '../type';

export const getDBInstance = (): LobeChatDatabase => {
  console.log('[getDBInstance] Starting database initialization');
  console.log('[getDBInstance] isServerMode:', isServerMode);
  
  if (!isServerMode) {
    console.log('[getDBInstance] Not in server mode, returning empty object');
    return {} as any;
  }

  console.log('[getDBInstance] KEY_VAULTS_SECRET exists:', !!serverDBEnv.KEY_VAULTS_SECRET);
  if (!serverDBEnv.KEY_VAULTS_SECRET) {
    throw new Error(
      ` \`KEY_VAULTS_SECRET\` is not set, please set it in your environment variables.

If you don't have it, please run \`openssl rand -base64 32\` to create one.
`,
    );
  }

  let connectionString = serverDBEnv.DATABASE_URL;
  console.log('[getDBInstance] DATABASE_URL exists:', !!connectionString);
  console.log('[getDBInstance] DATABASE_DRIVER:', serverDBEnv.DATABASE_DRIVER);

  if (!connectionString) {
    throw new Error(`You are try to use database, but "DATABASE_URL" is not set correctly`);
  }

  if (serverDBEnv.DATABASE_DRIVER === 'node') {
    console.log('[getDBInstance] Using Node.js PostgreSQL driver');
    const client = new NodePool({ connectionString });
    return nodeDrizzle(client, { schema });
  }

  if (process.env.MIGRATION_DB === '1') {
    console.log('[getDBInstance] Migration mode enabled');
    // https://github.com/neondatabase/serverless/blob/main/CONFIG.md#websocketconstructor-typeof-websocket--undefined
    neonConfig.webSocketConstructor = ws;
  }

  console.log('[getDBInstance] Using Neon serverless driver');
  const client = new NeonPool({ connectionString });
  return neonDrizzle(client, { schema });
};
