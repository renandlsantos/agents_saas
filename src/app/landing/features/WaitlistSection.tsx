'use client';

import { MailOutlined } from '@ant-design/icons';
import { Button, Input, message } from 'antd';
import { useTheme } from 'antd-style';
import { useState } from 'react';
import { Center, Flexbox } from 'react-layout-kit';

const WaitlistSection = () => {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoinWaitlist = async () => {
    if (!email || !email.includes('@')) {
      message.error('Por favor, insira um email válido');
      return;
    }

    setLoading(true);

    // Simular envio para lista de espera
    setTimeout(() => {
      message.success('Você entrou na lista de espera! Entraremos em contato em breve.');
      setEmail('');
      setLoading(false);
    }, 1500);
  };

  return (
    <Center
      id="waitlist-section"
      padding={80}
      style={{
        backgroundColor: theme.colorBgContainer,
        borderTop: `1px solid ${theme.colorBorderSecondary}`,
        borderBottom: `1px solid ${theme.colorBorderSecondary}`,
      }}
    >
      <Flexbox gap={24} style={{ maxWidth: 600, textAlign: 'center' }}>
        <h2
          style={{
            color: theme.colorText,
            fontSize: 36,
            fontWeight: 'bold',
            margin: 0,
          }}
        >
          Entre na Lista de Espera
        </h2>

        <p
          style={{
            color: theme.colorTextSecondary,
            fontSize: 18,
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          Seja um dos primeiros a ter acesso ao Agents Chat. Cadastre-se agora e receba acesso
          antecipado com benefícios exclusivos.
        </p>

        <Flexbox
          horizontal
          gap={12}
          style={{
            marginTop: 24,
            width: '100%',
          }}
        >
          <Input
            size="large"
            placeholder="Seu melhor email"
            prefix={<MailOutlined />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onPressEnter={handleJoinWaitlist}
            style={{ flex: 1 }}
          />

          <Button
            type="primary"
            size="large"
            loading={loading}
            onClick={handleJoinWaitlist}
            style={{
              background: theme.colorPrimary,
              borderColor: theme.colorPrimary,
              minWidth: 180,
            }}
          >
            Entrar na Fila
          </Button>
        </Flexbox>

        <p
          style={{
            color: theme.colorTextTertiary,
            fontSize: 14,
            margin: '16px 0 0 0',
          }}
        >
          🔒 Respeitamos sua privacidade. Sem spam, pode cancelar a qualquer momento.
        </p>
      </Flexbox>
    </Center>
  );
};

export default WaitlistSection;
