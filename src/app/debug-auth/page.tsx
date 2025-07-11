'use client';

import { Button, Card, Typography } from 'antd';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Center, Flexbox } from 'react-layout-kit';

const { Title, Paragraph, Text } = Typography;

export default function DebugAuthPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [cookies, setCookies] = useState<Record<string, string>>({});
  const [envVars, setEnvVars] = useState<Record<string, string>>({});

  useEffect(() => {
    // Parse cookies
    const cookieObj: Record<string, string> = {};
    document.cookie.split('; ').forEach((cookie) => {
      const [key, value] = cookie.split('=');
      if (key) cookieObj[key] = value || '';
    });
    setCookies(cookieObj);

    // Get relevant env vars
    setEnvVars({
      NEXT_PUBLIC_ENABLE_NEXT_AUTH: process.env.NEXT_PUBLIC_ENABLE_NEXT_AUTH || 'undefined',
      NEXT_PUBLIC_DEFAULT_LOCALE: process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'undefined',
      NEXT_PUBLIC_SERVICE_MODE: process.env.NEXT_PUBLIC_SERVICE_MODE || 'undefined',
      NODE_ENV: process.env.NODE_ENV || 'undefined',
    });
  }, []);

  return (
    <Center style={{ minHeight: '100vh', padding: 24, background: '#f5f5f5' }}>
      <Flexbox gap={24} style={{ maxWidth: 800, width: '100%' }}>
        <Card>
          <Title level={2}>🔍 Debug de Autenticação</Title>

          <Title level={4}>Status da Sessão</Title>
          <Paragraph>
            <Text strong>Status: </Text>
            <Text
              type={
                status === 'authenticated' ? 'success' : status === 'loading' ? 'warning' : 'danger'
              }
            >
              {status}
            </Text>
          </Paragraph>

          {session && (
            <>
              <Title level={4}>Dados da Sessão</Title>
              <pre
                style={{ background: '#f0f0f0', padding: 12, borderRadius: 4, overflow: 'auto' }}
              >
                {JSON.stringify(session, null, 2)}
              </pre>
            </>
          )}
        </Card>

        <Card>
          <Title level={4}>Cookies</Title>
          <pre style={{ background: '#f0f0f0', padding: 12, borderRadius: 4, overflow: 'auto' }}>
            {JSON.stringify(cookies, null, 2)}
          </pre>
        </Card>

        <Card>
          <Title level={4}>Variáveis de Ambiente</Title>
          <pre style={{ background: '#f0f0f0', padding: 12, borderRadius: 4, overflow: 'auto' }}>
            {JSON.stringify(envVars, null, 2)}
          </pre>
        </Card>

        <Card>
          <Title level={4}>URLs de Teste</Title>
          <Flexbox gap={12}>
            <Button onClick={() => router.push('/next-auth/signin')}>
              Ir para Login (NextAuth)
            </Button>
            <Button onClick={() => router.push('/login')}>Ir para Login (Redirect)</Button>
            <Button onClick={() => router.push('/chat')}>Ir para Chat</Button>
            <Button
              onClick={() =>
                router.push(
                  `/${cookies.LOBE_LOCALE || 'pt-BR'}__0__${cookies.LOBE_THEME_APPEARANCE || 'light'}/chat`,
                )
              }
            >
              Ir para Chat (Variant)
            </Button>
          </Flexbox>
        </Card>

        <Card>
          <Title level={4}>Diagnóstico</Title>
          <Paragraph>
            <Text strong>Locale detectado: </Text>
            {cookies.LOBE_LOCALE || 'não definido (usando pt-BR como padrão)'}
          </Paragraph>
          <Paragraph>
            <Text strong>Tema detectado: </Text>
            {cookies.LOBE_THEME_APPEARANCE || 'não definido (usando light como padrão)'}
          </Paragraph>
          <Paragraph>
            <Text strong>NextAuth habilitado: </Text>
            {process.env.NEXT_PUBLIC_ENABLE_NEXT_AUTH === '1' ? 'Sim' : 'Não'}
          </Paragraph>
        </Card>
      </Flexbox>
    </Center>
  );
}
