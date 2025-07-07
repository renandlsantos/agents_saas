import { ActionIcon, ActionIconProps } from '@lobehub/ui';
import { Book } from 'lucide-react';
import Link from 'next/link';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { featureFlagsSelectors, useServerConfigStore } from '@/store/serverConfig';

const ICON_SIZE: ActionIconProps['size'] = {
  blockSize: 36,
  size: 20,
  strokeWidth: 1.5,
};

const BottomActions = memo(() => {
  const { t } = useTranslation('common');
  const { hideDocs } = useServerConfigStore(featureFlagsSelectors);

  return (
    <Flexbox gap={8}>
      {/* GitHub link removed
      {!hideGitHub && (
        <Link aria-label={'GitHub'} href={GITHUB} target={'_blank'}>
          <ActionIcon
            icon={Github}
            size={ICON_SIZE}
            title={'GitHub'}
            tooltipProps={{ placement: 'right' }}
          />
        </Link>
      )}
      */}
      {!hideDocs && (
        <Link aria-label={t('document')} href={'/documentation'}>
          <ActionIcon
            icon={Book}
            size={ICON_SIZE}
            title={t('document')}
            tooltipProps={{ placement: 'right' }}
          />
        </Link>
      )}
    </Flexbox>
  );
});

export default BottomActions;
