'use client';

import { Button } from 'antd';
import { useTheme } from 'antd-style';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ReactNode, memo } from 'react';
import { Flexbox } from 'react-layout-kit';

type Props = { children: ReactNode };

const MobileLayout = memo(({ children }: Props) => {
  const theme = useTheme();
  const router = useRouter();

  return (
    <Flexbox
      style={{
        background: theme.colorBgContainer,
        height: '100%',
        position: 'relative',
        width: '100%',
      }}
    >
      {/* Header with return button */}
      <Flexbox
        align="center"
        style={{
          background: theme.colorBgContainer,
          borderBottom: `1px solid ${theme.colorBorderSecondary}`,
          padding: '12px 16px',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <Button icon={<ArrowLeft />} onClick={() => router.push('/chat')} size="middle" type="text">
          Voltar
        </Button>
      </Flexbox>

      {/* Main content */}
      <Flexbox
        align="center"
        justify="center"
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '16px',
        }}
      >
        {children}
      </Flexbox>
    </Flexbox>
  );
});

MobileLayout.displayName = 'MobileDocumentationLayout';

export default MobileLayout;
