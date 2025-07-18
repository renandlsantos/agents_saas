'use client';

import { ActionIcon, SideNav } from '@lobehub/ui';
import { theme } from 'antd';
import { createStyles } from 'antd-style';
import {
  BarChart3Icon,
  BrainCircuitIcon,
  CreditCardIcon,
  FileTextIcon,
  HomeIcon,
  MessageSquareIcon,
  ServerIcon,
  UsersIcon,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { PropsWithChildren, useMemo } from 'react';
import { Flexbox } from 'react-layout-kit';

import { Locales } from '@/types/locale';

const useStyles = createStyles(({ css, token }) => ({
  container: css`
    position: relative;
    display: flex;
    width: 100%;
    height: 100vh;
  `,
  content: css`
    position: relative;

    overflow: hidden;
    display: flex;
    flex: 1;
    flex-direction: column;

    background: ${token.colorBgLayout};
  `,
  main: css`
    overflow: hidden auto;
    flex: 1;
    padding: ${token.paddingLG}px;
  `,
  pageContent: css`
    min-height: calc(100vh - ${token.paddingLG * 2}px);
    padding: ${token.paddingLG}px;
    border-radius: ${token.borderRadiusLG}px;
    background: ${token.colorBgContainer};
  `,
}));

export interface AdminLayoutProps extends PropsWithChildren {
  locale?: Locales;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { styles } = useStyles();
  const router = useRouter();
  const pathname = usePathname();
  const { token } = theme.useToken();

  // Extract current key from pathname
  const currentKey = useMemo(() => {
    if (pathname === '/admin' || pathname === '/admin/dashboard') return 'dashboard';
    if (pathname.startsWith('/admin/users')) return 'users';
    if (pathname.startsWith('/admin/billing')) return 'billing';
    if (pathname.startsWith('/admin/models')) return 'models';
    if (pathname.startsWith('/admin/agents')) return 'agents';
    if (pathname.startsWith('/admin/analytics')) return 'analytics';
    if (pathname.startsWith('/files')) return 'files';
    return 'dashboard';
  }, [pathname]);

  const topActions = useMemo(
    () => (
      <Flexbox gap={8}>
        <ActionIcon
          active={currentKey === 'dashboard'}
          icon={HomeIcon}
          onClick={() => router.push('/admin')}
          size={{ blockSize: 40, size: 24, strokeWidth: 2 }}
          title="Dashboard"
          tooltipProps={{ placement: 'right' }}
        />
        <ActionIcon
          active={currentKey === 'users'}
          icon={UsersIcon}
          onClick={() => router.push('/admin/users')}
          size={{ blockSize: 40, size: 24, strokeWidth: 2 }}
          title="Usuários"
          tooltipProps={{ placement: 'right' }}
        />
        <ActionIcon
          active={currentKey === 'billing'}
          icon={CreditCardIcon}
          onClick={() => router.push('/admin/billing')}
          size={{ blockSize: 40, size: 24, strokeWidth: 2 }}
          title="Cobrança"
          tooltipProps={{ placement: 'right' }}
        />
        <ActionIcon
          active={currentKey === 'models'}
          icon={ServerIcon}
          onClick={() => router.push('/admin/models')}
          size={{ blockSize: 40, size: 24, strokeWidth: 2 }}
          title="Modelos"
          tooltipProps={{ placement: 'right' }}
        />
        <ActionIcon
          active={currentKey === 'agents'}
          icon={BrainCircuitIcon}
          onClick={() => router.push('/admin/agents')}
          size={{ blockSize: 40, size: 24, strokeWidth: 2 }}
          title="Agentes"
          tooltipProps={{ placement: 'right' }}
        />
        <ActionIcon
          active={currentKey === 'files'}
          icon={FileTextIcon}
          onClick={() => router.push('/files')}
          size={{ blockSize: 40, size: 24, strokeWidth: 2 }}
          title="Arquivos"
          tooltipProps={{ placement: 'right' }}
        />
        <ActionIcon
          active={currentKey === 'analytics'}
          icon={BarChart3Icon}
          onClick={() => router.push('/admin/analytics')}
          size={{ blockSize: 40, size: 24, strokeWidth: 2 }}
          title="Analytics"
          tooltipProps={{ placement: 'right' }}
        />
      </Flexbox>
    ),
    [router, currentKey],
  );

  const bottomActions = useMemo(
    () => (
      <Flexbox gap={8}>
        <ActionIcon
          icon={MessageSquareIcon}
          onClick={() => router.push('/chat')}
          size={{ blockSize: 36, size: 20, strokeWidth: 1.5 }}
          title="Mudar para Chat"
          tooltipProps={{ placement: 'right' }}
        />
      </Flexbox>
    ),
    [router],
  );

  return (
    <div className={styles.container}>
      <SideNav
        bottomActions={bottomActions}
        style={{
          backgroundColor: 'transparent',
        }}
        topActions={topActions}
      />
      <div className={styles.content}>
        <main className={styles.main}>
          <div className={styles.pageContent}>{children}</div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
