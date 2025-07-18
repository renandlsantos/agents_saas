import { PropsWithChildren, memo } from 'react';

const UpgradeBadge = memo(({ children, showBadge }: PropsWithChildren<{ showBadge?: boolean }>) => {
  // Always return children without badge - notification badge has been removed
  return children;
});

export default UpgradeBadge;
