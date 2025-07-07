'use client';

import { Button } from 'antd';
import { useTheme } from 'antd-style';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ReactNode, memo } from 'react';
import { Flexbox } from 'react-layout-kit';

type Props = { children: ReactNode };

const Layout = memo(({ children }: Props) => {
  const theme = useTheme();
  const router = useRouter();

  return (
    <Flexbox
      style={{
        background: theme.colorBgContainer,
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        width: '100%',
      }}
    >
      {/* Return button in the top left corner */}
      <Flexbox
        style={{
          left: 24,
          position: 'absolute',
          top: 24,
          zIndex: 10,
        }}
      >
        <Button
          icon={<ArrowLeft />}
          onClick={() => router.push('/chat')}
          size="large"
          style={{
            alignItems: 'center',
            display: 'flex',
            gap: 8,
          }}
          type="text"
        >
          Voltar ao Chat
        </Button>
      </Flexbox>

      {/* Main content */}
      <Flexbox
        align="center"
        justify="center"
        style={{
          height: '100%',
          overflow: 'auto',
          width: '100%',
        }}
      >
        {children}
      </Flexbox>
    </Flexbox>
  );
});

Layout.displayName = 'DesktopDocumentationLayout';

export default Layout;
