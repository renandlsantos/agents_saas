import { isDesktop } from '@/const/version';
import { getDBInstance } from '@/database/core/web-server';
import { LobeChatDatabase } from '@/database/type';

/**
 * 懒加载数据库实例
 * 避免每次模块导入时都初始化数据库
 */
let cachedDB: LobeChatDatabase | null = null;

/**
 * Check if we're in Edge Runtime
 */
const isEdgeRuntime = () => {
  // Check for Edge Runtime
  // In Edge Runtime, process and many Node globals are undefined
  return (
    typeof process === 'undefined' || (typeof process !== 'undefined' && !process.versions?.node)
  );
};

export const getServerDB = async (): Promise<LobeChatDatabase> => {
  // 如果已经有缓存的实例，直接返回
  if (cachedDB) return cachedDB;

  try {
    // In Edge Runtime, always use the web server database
    if (isEdgeRuntime()) {
      cachedDB = getDBInstance();
      return cachedDB;
    }

    // 根据环境选择合适的数据库实例
    if (isDesktop) {
      // 动态导入 electron 模块，避免在 Edge Runtime 中加载
      const { getPgliteInstance } = await import('./electron');
      cachedDB = await getPgliteInstance();
    } else {
      cachedDB = getDBInstance();
    }
    return cachedDB;
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    throw error;
  }
};

export const serverDB = getDBInstance();
