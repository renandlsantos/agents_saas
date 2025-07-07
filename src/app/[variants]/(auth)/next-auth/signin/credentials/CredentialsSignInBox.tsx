'use client';

import { Button, Text } from '@lobehub/ui';
import { Col, Flex, Form, Input, Row, message } from 'antd';
import { createStyles } from 'antd-style';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
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

interface SigninFormValues {
  email: string;
  password: string;
}

export default memo(() => {
  const { styles } = useStyles();
  const { t } = useTranslation('clerk');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form] = Form.useForm<SigninFormValues>();
  const [loading, setLoading] = useState(false);

  // Redirect back to the page url
  const callbackUrl = searchParams.get('callbackUrl') ?? '/chat';

  const handleSignIn = async (values: SigninFormValues) => {
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        callbackUrl,
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        message.error('Invalid email or password');
      } else if (result?.ok) {
        router.push(callbackUrl);
      }
    } catch (error) {
      console.error('Signin error:', error);
      message.error('Failed to sign in');
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
            <Text as={'h4'} className={styles.title}>
              <div>
                <ProductLogo size={48} />
              </div>
              Sign in to Agents Chat
            </Text>
            <Text as={'p'} className={styles.description}>
              Enter your email and password to continue
            </Text>
          </div>
          {/* Content */}
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSignIn}
            requiredMark={false}
            size="large"
          >
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { message: 'Please enter your email', required: true },
                { message: 'Please enter a valid email', type: 'email' },
              ]}
            >
              <Input placeholder="user@example.com" />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[{ message: 'Please enter your password', required: true }]}
            >
              <Input.Password placeholder="••••••••" />
            </Form.Item>

            <Form.Item>
              <Button block htmlType="submit" loading={loading} type="primary">
                Sign In
              </Button>
            </Form.Item>

            <Flex gap="small" vertical>
              <Button block onClick={() => router.push('/next-auth/signin')} type="text">
                Back to other sign in options
              </Button>

              <div className={styles.text}>
                <Text>
                  Don&apos;t have an account?{' '}
                  <a
                    onClick={(e) => {
                      e.preventDefault();
                      router.push('/next-auth/signup');
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    Sign up
                  </a>
                </Text>
              </div>
            </Flex>
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
