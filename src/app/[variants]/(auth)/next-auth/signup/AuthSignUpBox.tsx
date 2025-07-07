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
        throw new Error(data.message || 'Failed to create account');
      }

      message.success('Account created successfully! Signing you in...');

      // Auto sign in after successful signup
      const result = await signIn('credentials', {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error('Failed to sign in after registration');
      }

      router.push('/chat');
    } catch (error) {
      console.error('Signup error:', error);
      message.error(error instanceof Error ? error.message : 'Failed to create account');
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
              Create your Agents Chat account
            </Text>
            <Text as={'p'} className={styles.description}>
              Sign up to start using Agents Chat
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
              label="Username (optional)"
              name="username"
              rules={[
                { message: 'Username must be at least 3 characters', min: 3 },
                {
                  message: 'Username can only contain letters, numbers, underscores and hyphens',
                  pattern: /^[\w-]+$/,
                },
              ]}
            >
              <Input placeholder="johndoe" />
            </Form.Item>

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
              rules={[
                { message: 'Please enter your password', required: true },
                { message: 'Password must be at least 6 characters', min: 6 },
              ]}
            >
              <Input.Password placeholder="••••••••" />
            </Form.Item>

            <Form.Item
              dependencies={['password']}
              label="Confirm Password"
              name="confirmPassword"
              rules={[
                { message: 'Please confirm your password', required: true },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Passwords do not match'));
                  },
                }),
              ]}
            >
              <Input.Password placeholder="••••••••" />
            </Form.Item>

            <Form.Item>
              <Button block htmlType="submit" loading={loading} type="primary">
                Create Account
              </Button>
            </Form.Item>

            <div className={styles.text}>
              <Text>
                Already have an account?{' '}
                <a
                  onClick={(e) => {
                    e.preventDefault();
                    router.push('/next-auth/signin');
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  Sign in
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
