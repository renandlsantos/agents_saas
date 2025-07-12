import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

/**
 * Returns the pathname without the route variants prefix
 * Example: /pt-BR__0__dark/chat -> /chat
 */
export const useCleanPathname = () => {
  const pathname = usePathname();

  return useMemo(() => {
    // Remove variant prefix pattern: /locale__device__theme/path
    return pathname.replace(/^\/[^/]+__\d+__[^/]+/, '');
  }, [pathname]);
};

/**
 * Utility function to clean a pathname string
 */
export const cleanPathname = (pathname: string) => {
  return pathname.replace(/^\/[^/]+__\d+__[^/]+/, '');
};
