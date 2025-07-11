'use client';

import { Button, Text } from '@lobehub/ui';
import { Col, Flex, Form, Input, Row, message } from 'antd';
import { createStyles } from 'antd-style';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import BrandWatermark from '@/components/BrandWatermark';
import { ProductLogo } from '@/components/Branding/ProductLogo';
import { DOCUMENTS_REFER_URL, PRIVACY_URL, TERMS_URL } from '@/const/url';

const useStyles = createStyles(({ css, token }) => ({
  container: css`
    min-width: 360px;
    border: 1px solid ${token.colorBorder};
    border-radius: ${token.borderRadiusLG}px;
    background: ${token.colorBgContainer};
  `,
  contentCard: css`
    padding-block: 2.5rem;
    padding-inline: 2rem;
  `,
  description: css`
    margin: 0;
    color: ${token.colorTextSecondary};
  `,
  footer: css`
    padding: 1rem;
    border-block-start: 1px solid ${token.colorBorder};
    border-radius: 0 0 8px 8px;

    color: ${token.colorTextDescription};

    background: ${token.colorBgElevated};
  `,
  text: css`
    text-align: center;
  `,
  title: css`
    margin: 0;
    color: ${token.colorTextHeading};
  `,
}));

interface SignupFormValues {
  confirmPassword: string;
  email: string;
  password: string;
  username?: string;
}

export default memo(() => {
  const { styles } = useStyles();
  const { t } = useTranslation('clerk');
  const router = useRouter();
  const [form] = Form.useForm<SignupFormValues>();
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (values: SignupFormValues) => {
    setLoading(true);

    try {
      // Call API to create user
      const response = await fetch('/api/auth/signup', {
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          username: values.username,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Falha ao criar conta');
      }

      message.success('Conta criada com sucesso! Fazendo login...');

      // Auto sign in after successful signup
      const result = await signIn('credentials', {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error('Falha ao fazer login após o registro');
      }

      router.push('/chat');
    } catch (error) {
      console.error('Signup error:', error);
      message.error(error instanceof Error ? error.message : 'Falha ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  const footerBtns = [
    { href: DOCUMENTS_REFER_URL, id: 0, label: t('footerPageLink__help') },
    { href: PRIVACY_URL, id: 1, label: t('footerPageLink__privacy') },
    { href: TERMS_URL, id: 2, label: t('footerPageLink__terms') },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.contentCard}>
        {/* Card Body */}
        <Flex gap="large" vertical>
          {/* Header */}
          <div className={styles.text}>
            <div>
              <ProductLogo size={48} />
            </div>
            <Text as={'h4'} className={styles.title}>
              {t('signUp.start.title')}
            </Text>
            <Text as={'p'} className={styles.description}>
              {t('signUp.start.subtitle')}
            </Text>
          </div>
          {/* Content */}
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSignUp}
            requiredMark={false}
            size="large"
          >
            <Form.Item
              label={t('formFieldLabel__username') + ' (' + t('formFieldHintText__optional') + ')'}
              name="username"
              rules={[
                { message: 'O nome de usuário deve ter pelo menos 3 caracteres', min: 3 },
                {
                  message: 'O nome de usuário só pode conter letras, números, underscores e hífens',
                  pattern: /^[\w-]+$/,
                },
              ]}
            >
              <Input placeholder="joaosilva" />
            </Form.Item>

            <Form.Item
              label={t('formFieldLabel__emailAddress')}
              name="email"
              rules={[
                { message: 'Campo obrigatório', required: true },
                { message: 'Por favor, insira um e-mail válido', type: 'email' },
              ]}
            >
              <Input placeholder="usuario@exemplo.com" />
            </Form.Item>

            <Form.Item
              label={t('formFieldLabel__password')}
              name="password"
              rules={[
                { message: 'Campo obrigatório', required: true },
                { message: 'A senha deve ter pelo menos 6 caracteres', min: 6 },
              ]}
            >
              <Input.Password placeholder="••••••••" />
            </Form.Item>

            <Form.Item
              dependencies={['password']}
              label={t('formFieldLabel__confirmPassword')}
              name="confirmPassword"
              rules={[
                { message: 'Campo obrigatório', required: true },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error(t('formFieldError__notMatchingPasswords')));
                  },
                }),
              ]}
            >
              <Input.Password placeholder="••••••••" />
            </Form.Item>

            <Form.Item>
              <Button block htmlType="submit" loading={loading} type="primary">
                {t('signUp.start.actionLink')}
              </Button>
            </Form.Item>

            <div className={styles.text}>
              <Text>
                {t('signUp.continue.actionText')}{' '}
                <a
                  onClick={(e) => {
                    e.preventDefault();
                    router.push('/next-auth/signin');
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {t('signUp.continue.actionLink')}
                </a>
              </Text>
            </div>
          </Form>
        </Flex>
      </div>
      <div className={styles.footer}>
        {/* Footer */}
        <Row>
          <Col span={12}>
            <Flex justify="left" style={{ height: '100%' }}>
              <BrandWatermark />
            </Flex>
          </Col>
          <Col offset={4} span={8}>
            <Flex justify="right">
              {footerBtns.map((btn) => (
                <Button key={btn.id} onClick={() => router.push(btn.href)} size="small" type="text">
                  {btn.label}
                </Button>
              ))}
            </Flex>
          </Col>
        </Row>
      </div>
    </div>
  );
});
