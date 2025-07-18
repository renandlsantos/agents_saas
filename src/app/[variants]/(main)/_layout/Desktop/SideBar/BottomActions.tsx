import { ActionIcon, ActionIconProps } from '@lobehub/ui';
import { Book, ShieldIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { featureFlagsSelectors, useServerConfigStore } from '@/store/serverConfig';
import { useUserStore } from '@/store/user';
import { userProfileSelectors } from '@/store/user/selectors';

const ICON_SIZE: ActionIconProps['size'] = {
  blockSize: 36,
  size: 20,
  strokeWidth: 1.5,
};

const BottomActions = memo(() => {
  const { t } = useTranslation('common');
  const { hideDocs } = useServerConfigStore(featureFlagsSelectors);
  const userProfile = useUserStore(userProfileSelectors.userProfile);
  const isAdmin = userProfile?.isAdmin || false;
  const router = useRouter();

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
      {isAdmin && (
        <ActionIcon
          icon={ShieldIcon}
          onClick={() => router.push('/admin')}
          size={ICON_SIZE}
          title="Painel Admin"
          tooltipProps={{ placement: 'right' }}
        />
      )}
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
