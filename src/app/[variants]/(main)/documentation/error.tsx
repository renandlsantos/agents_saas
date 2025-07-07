'use client';

import { Button } from 'antd';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { memo, useEffect } from 'react';
import { Center, Flexbox } from 'react-layout-kit';

const Error = memo(({ error, reset }: { error: Error; reset: () => void }) => {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Center height={'100%'} width={'100%'}>
      <Flexbox align="center" gap={24} style={{ textAlign: 'center' }}>
        <AlertCircle size={64} style={{ color: '#ff4d4f', opacity: 0.8 }} />
        <h1 style={{ fontSize: '2rem', fontWeight: 600, margin: 0 }}>Oops! Algo deu errado</h1>
        <p style={{ fontSize: '1.1rem', margin: 0, maxWidth: 400, opacity: 0.8 }}>
          Ocorreu um erro ao carregar a página de documentação.
        </p>
        <Flexbox gap={12} horizontal>
          <Button onClick={reset} size="large">
            Tentar Novamente
          </Button>
          <Button
            icon={<ArrowLeft />}
            onClick={() => router.push('/chat')}
            size="large"
            type="primary"
          >
            Voltar ao Chat
          </Button>
        </Flexbox>
      </Flexbox>
    </Center>
  );
});

Error.displayName = 'DocumentationError';

export default Error;
