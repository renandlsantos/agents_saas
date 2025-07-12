import { useCleanPathname } from '@/hooks/useCleanPathname';

/**
 * Returns true if the current path has a sub slug (`/chat/mobile` or `/chat/settings`)
 */
export const useIsSubSlug = () => {
  const pathname = useCleanPathname();

  const slugs = pathname.split('/').filter(Boolean);

  return slugs.length > 1;
};
