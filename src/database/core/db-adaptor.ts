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

/**
 * Check if we're in a desktop environment
 * This check is Edge Runtime safe
 */
const isDesktopEnvironment = () => {
  // In Edge Runtime, always return false
  if (isEdgeRuntime()) return false;

  // In Node.js runtime, check the environment variable
  return typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_IS_DESKTOP_APP === '1';
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
    // For now, always use web server database to avoid webpack issues
    cachedDB = getDBInstance();
    return cachedDB;
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    throw error;
  }
};

export const serverDB = getDBInstance();
