'use client';

import { Avatar, Dropdown, Layout, Menu, theme } from 'antd';
import { createStyles } from 'antd-style';
import {
  BarChart3Icon,
  BrainCircuitIcon,
  CreditCardIcon,
  HomeIcon,
  LogOutIcon,
  ServerIcon,
  SettingsIcon,
  UsersIcon,
} from 'lucide-react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { PropsWithChildren } from 'react';
import { Center, Flexbox } from 'react-layout-kit';

import { BRANDING_LOGO_URL } from '@/const/branding';
import { useUserStore } from '@/store/user';
import { authSelectors, userProfileSelectors } from '@/store/user/selectors';
import { Locales } from '@/types/locale';

const { Header, Sider, Content } = Layout;

const useStyles = createStyles(({ css, token, responsive }) => ({
  layout: css`
    min-height: 100vh;
    background: ${token.colorBgLayout};
  `,
  header: css`
    display: flex;
    align-items: center;
    justify-content: space-between;

    padding-block: 0;
    padding-inline: ${token.paddingLG}px;
    border-block-end: 1px solid ${token.colorBorderSecondary};

    background: ${token.colorBgContainer};
  `,
  logo: css`
    display: flex;
    gap: 12px;
    align-items: center;

    font-size: 20px;
    font-weight: 600;
  `,
  logoImg: css`
    width: 32px;
    height: 32px;
  `,
  userSection: css`
    cursor: pointer;
    display: flex;
    gap: 8px;
    align-items: center;

    &:hover {
      opacity: 0.8;
    }
  `,
  userName: css`
    margin-inline-end: 8px;
    font-size: 14px;
    color: ${token.colorText};
  `,
  sider: css`
    border-inline-end: 1px solid ${token.colorBorderSecondary};
    background: ${token.colorBgContainer};

    .ant-layout-sider-trigger {
      border-block-start: 1px solid ${token.colorBorderSecondary};
      background: ${token.colorBgContainer};
    }
  `,
  content: css`
    min-height: calc(100vh - ${token.marginLG * 2 + 64}px);
    margin: ${token.marginLG}px;
    padding: ${token.paddingLG}px;
    border-radius: ${token.borderRadiusLG}px;

    background: ${token.colorBgContainer};
  `,
  menuItem: css`
    display: flex;
    gap: 8px;
    align-items: center;
  `,
}));

const menuItems = [
  {
    key: 'dashboard',
    icon: <HomeIcon size={18} />,
    label: 'Dashboard',
    path: '/admin',
  },
  {
    key: 'users',
    icon: <UsersIcon size={18} />,
    label: 'Users',
    path: '/admin/users',
  },
  {
    key: 'billing',
    icon: <CreditCardIcon size={18} />,
    label: 'Billing & Plans',
    path: '/admin/billing',
  },
  {
    key: 'models',
    icon: <ServerIcon size={18} />,
    label: 'Model Config',
    path: '/admin/models',
  },
  {
    key: 'agents',
    icon: <BrainCircuitIcon size={18} />,
    label: 'Agent Builder',
    path: '/admin/agents',
  },
  {
    key: 'analytics',
    icon: <BarChart3Icon size={18} />,
    label: 'Analytics',
    path: '/admin/analytics',
  },
];

export interface AdminLayoutProps extends PropsWithChildren {
  locale?: Locales;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { styles } = useStyles();
  const router = useRouter();
  const pathname = usePathname();
  const { token } = theme.useToken();

  const logout = useUserStore((s) => s.logout);
  const currentUser = useUserStore((s) => s.user);

  const selectedKey =
    menuItems.find(
      (item) =>
        pathname === item.path || (item.path !== '/admin' && pathname.startsWith(item.path)),
    )?.key || 'dashboard';

  const handleMenuClick = ({ key }: { key: string }) => {
    const item = menuItems.find((item) => item.key === key);
    if (item) {
      router.push(item.path);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const userMenuItems = [
    {
      key: 'settings',
      icon: <SettingsIcon size={14} />,
      label: 'Configurações',
      onClick: () => router.push('/settings'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogOutIcon size={14} />,
      label: 'Sair',
      onClick: handleLogout,
    },
  ];

  return (
    <Layout className={styles.layout}>
      <Header className={styles.header}>
        <div className={styles.logo}>
          <Image
            src={BRANDING_LOGO_URL}
            alt="Logo"
            width={32}
            height={32}
            className={styles.logoImg}
          />
          <span>Admin Panel</span>
        </div>
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
          <div className={styles.userSection}>
            <span className={styles.userName}>{currentUser?.fullName || currentUser?.email}</span>
            <Avatar src={currentUser?.avatar} size={32}>
              {currentUser?.fullName?.[0] || currentUser?.email?.[0]}
            </Avatar>
          </div>
        </Dropdown>
      </Header>
      <Layout>
        <Sider className={styles.sider} breakpoint="lg" collapsedWidth="0" width={240}>
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            onClick={handleMenuClick}
            style={{ height: '100%', borderRight: 0 }}
            items={menuItems.map((item) => ({
              key: item.key,
              icon: item.icon,
              label: item.label,
            }))}
          />
        </Sider>
        <Layout>
          <Content className={styles.content}>{children}</Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
