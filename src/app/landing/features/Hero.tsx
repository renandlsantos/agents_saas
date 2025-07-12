'use client';

import { Icon } from '@lobehub/ui';
import { Button } from 'antd';
import { createStyles, useTheme } from 'antd-style';
import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import { Center, Flexbox } from 'react-layout-kit';

import CustomLogo from '@/components/Branding/ProductLogo/Custom';
import { BRANDING_NAME } from '@/const/branding';

const useStyles = createStyles(({ css, token }) => ({
  hero: css`
    position: relative;

    min-height: calc(100vh - 64px);
    padding-block: 80px;
    padding-inline: 24px;

    background-color: ${token.colorBgLayout};

    @media (max-width: 768px) {
      padding-block: 40px;
      padding-inline: 16px;
    }
  `,

  container: css`
    width: 100%;
    max-width: 1200px;
  `,

  logoContainer: css`
    margin-block-end: 48px;
  `,

  title: css`
    margin-block: 0 24px;
    margin-inline: 0;

    font-size: 64px;
    font-weight: 800;
    line-height: 1.2;
    color: ${token.colorText};
    text-align: center;

    @media (max-width: 768px) {
      font-size: 40px;
    }
  `,

  subtitle: css`
    max-width: 680px;
    margin-block: 0 48px;
    margin-inline: 0;

    font-size: 20px;
    line-height: 1.6;
    color: ${token.colorTextDescription};
    text-align: center;

    @media (max-width: 768px) {
      margin-block: 0 32px;
      margin-inline: 0;
      font-size: 16px;
    }
  `,

  buttonGroup: css`
    gap: 16px;
    justify-content: center;
  `,

  button: css`
    height: 48px;
    padding-block: 0;
    padding-inline: 32px;
    border-radius: 8px;

    font-size: 16px;
  `,

  badge: css`
    display: inline-block;

    margin-block-end: 24px;
    padding-block: 4px;
    padding-inline: 16px;
    border-radius: 20px;

    font-size: 14px;
    color: ${token.colorTextSecondary};

    background: ${token.colorFillSecondary};
  `,

  highlight: css`
    font-weight: 600;
    color: ${token.colorPrimary};
  `,
}));

const Hero = () => {
  const { styles } = useStyles();
  const theme = useTheme();

  return (
    <Center className={styles.hero}>
      <Flexbox align="center" className={styles.container}>
        <div className={styles.logoContainer}>
          <CustomLogo size={80} type="3d" />
        </div>

        <span className={styles.badge}>✨ Plataforma líder em agentes de IA conversacional</span>

        <h1 className={styles.title}>{BRANDING_NAME}</h1>

        <p className={styles.subtitle}>
          Construa experiências extraordinárias com{' '}
          <span className={styles.highlight}>+40 modelos de IA</span>, processamento multimodal
          avançado e arquitetura extensível. Transforme conversas em resultados com a plataforma
          mais completa do mercado.
        </p>

        <Flexbox horizontal className={styles.buttonGroup}>
          <Button
            type="primary"
            size="large"
            className={styles.button}
            icon={<Icon icon={Sparkles} />}
            onClick={() => {
              document.getElementById('waitlist-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Entrar na Fila de Espera
          </Button>

          <Link href="/login">
            <Button size="large" className={styles.button}>
              Fazer Login
            </Button>
          </Link>
        </Flexbox>
      </Flexbox>
    </Center>
  );
};

export default Hero;
