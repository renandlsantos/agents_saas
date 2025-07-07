import { isDesktop } from '@/const/version';

import { S3StaticFileImpl } from './s3';
import { FileServiceImpl } from './type';

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
 * 创建文件服务模块
 * 根据环境自动选择使用S3或桌面本地文件实现
 */
export const createFileServiceModule = async (): Promise<FileServiceImpl> => {
  // In Edge Runtime, always use S3 implementation
  if (isEdgeRuntime()) {
    return new S3StaticFileImpl();
  }

  // 如果在桌面应用环境，使用本地文件实现
  if (isDesktop) {
    // 动态导入，避免在 Edge Runtime 中加载 Node.js 依赖
    const { DesktopLocalFileImpl } = await import('./local');
    return new DesktopLocalFileImpl();
  }

  return new S3StaticFileImpl();
};

export type { FileServiceImpl } from './type';
