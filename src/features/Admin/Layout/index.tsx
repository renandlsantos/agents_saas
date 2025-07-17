'use client';

import { Layout, Menu, theme } from 'antd';
import { createStyles } from 'antd-style';
import {
  BarChart3Icon,
  BrainCircuitIcon,
  CreditCardIcon,
  HomeIcon,
  ServerIcon,
  UsersIcon,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { PropsWithChildren } from 'react';
import { Center, Flexbox } from 'react-layout-kit';

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
    font-size: 24px;
    font-weight: bold;
    color: ${token.colorPrimary};
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

  return (
    <Layout className={styles.layout}>
      <Header className={styles.header}>
        <div className={styles.logo}>Admin Panel</div>
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
