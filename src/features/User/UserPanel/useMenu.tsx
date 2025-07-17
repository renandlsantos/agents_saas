import { Hotkey, Icon } from '@lobehub/ui';
import { ItemType } from 'antd/es/menu/interface';
import {
  Book,
  CircleUserRound,
  Cloudy,
  Download,
  HardDriveDownload,
  LogOut,
  Settings2,
  ShieldIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import type { MenuProps } from '@/components/Menu';
import { enableAuth } from '@/const/auth';
import { LOBE_CHAT_CLOUD } from '@/const/branding';
import { DEFAULT_HOTKEY_CONFIG } from '@/const/settings';
import { OFFICIAL_URL, UTM_SOURCE } from '@/const/url';
import { isDesktop } from '@/const/version';
import DataImporter from '@/features/DataImporter';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { featureFlagsSelectors, useServerConfigStore } from '@/store/serverConfig';
import { useUserStore } from '@/store/user';
import { authSelectors } from '@/store/user/selectors';

export const useMenu = () => {
  const { canInstall, install } = usePWAInstall();
  const { t } = useTranslation(['common', 'setting', 'auth']);
  const { showCloudPromotion, hideDocs } = useServerConfigStore(featureFlagsSelectors);
  const [isLogin, isLoginWithAuth, user] = useUserStore((s) => [
    authSelectors.isLogin(s),
    authSelectors.isLoginWithAuth(s),
    s.user,
  ]);

  const profile: MenuProps['items'] = [
    {
      icon: <Icon icon={CircleUserRound} />,
      key: 'profile',
      label: <Link href={'/profile'}>{t('userPanel.profile')}</Link>,
    },
  ];

  const settings: MenuProps['items'] = [
    {
      extra: isDesktop ? (
        <div>
          <Hotkey keys={DEFAULT_HOTKEY_CONFIG.openSettings} />
        </div>
      ) : undefined,
      icon: <Icon icon={Settings2} />,
      key: 'setting',
      label: <Link href={'/settings/common'}>{t('userPanel.setting')}</Link>,
    },
    // Show admin panel link if user is admin
    user?.isAdmin && {
      icon: <Icon icon={ShieldIcon} />,
      key: 'admin',
      label: <Link href={'/admin/dashboard'}>Painel Admin</Link>,
    },
    {
      type: 'divider',
    },
  ].filter(Boolean) as ItemType[];

  /* ↓ cloud slot ↓ */

  /* ↑ cloud slot ↑ */

  const pwa: MenuProps['items'] = [
    {
      icon: <Icon icon={Download} />,
      key: 'pwa',
      label: t('installPWA'),
      onClick: () => install(),
    },
    {
      type: 'divider',
    },
  ];

  const data = !isLogin
    ? []
    : ([
        {
          icon: <Icon icon={HardDriveDownload} />,
          key: 'import',
          label: <DataImporter>{t('importData')}</DataImporter>,
        },
        {
          type: 'divider',
        },
      ].filter(Boolean) as ItemType[]);

  const helps: MenuProps['items'] = [
    showCloudPromotion && {
      icon: <Icon icon={Cloudy} />,
      key: 'cloud',
      label: (
        <Link href={`${OFFICIAL_URL}?utm_source=${UTM_SOURCE}`} target={'_blank'}>
          {t('userPanel.cloud', { name: LOBE_CHAT_CLOUD })}
        </Link>
      ),
    },
    {
      icon: <Icon icon={Book} />,
      key: 'docs',
      label: <Link href={'/documentation'}>{t('userPanel.docs')}</Link>,
    },
    {
      type: 'divider',
    },
  ].filter(Boolean) as ItemType[];

  const mainItems = [
    {
      type: 'divider',
    },
    ...(!enableAuth || (enableAuth && isLoginWithAuth) ? profile : []),
    ...(isLogin ? settings : []),
    /* ↓ cloud slot ↓ */

    /* ↑ cloud slot ↑ */
    ...(canInstall ? pwa : []),
    ...data,
    ...(!hideDocs ? helps : []),
  ].filter(Boolean) as MenuProps['items'];

  const logoutItems: MenuProps['items'] = isLoginWithAuth
    ? [
        {
          icon: <Icon icon={LogOut} />,
          key: 'logout',
          label: <span>{t('signout', { ns: 'auth' })}</span>,
        },
      ]
    : [];

  return { logoutItems, mainItems };
};
