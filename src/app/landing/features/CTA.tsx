'use client';

import { Icon } from '@lobehub/ui';
import { Button, Typography } from 'antd';
import { createStyles, useTheme } from 'antd-style';
import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import { Center, Flexbox } from 'react-layout-kit';

const { Title, Paragraph } = Typography;

const useStyles = createStyles(({ css, token }) => ({
  section: css`
    padding-block: 100px;
    padding-inline: 24px;
    background: ${token.colorBgContainer};

    @media (max-width: 768px) {
      padding-block: 60px;
      padding-inline: 16px;
    }
  `,

  container: css`
    width: 100%;
    max-width: 800px;
    text-align: center;
  `,

  ctaTitle: css`
    margin-block-end: 16px;

    font-size: 48px;
    font-weight: 800;
    line-height: 1.2;
    color: ${token.colorText};

    @media (max-width: 768px) {
      font-size: 32px;
    }
  `,

  ctaSubtitle: css`
    margin-block-end: 48px;
    font-size: 18px;
    color: ${token.colorTextSecondary};

    @media (max-width: 768px) {
      margin-block-end: 32px;
      font-size: 16px;
    }
  `,

  buttonGroup: css`
    gap: 16px;
    justify-content: center;
    margin-block-end: 80px;
  `,

  button: css`
    height: 48px;
    padding-block: 0;
    padding-inline: 32px;
    border-radius: 8px;

    font-size: 16px;
  `,

  stats: css`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 48px;

    max-width: 600px;
    margin-block: 0;
    margin-inline: auto;
  `,

  stat: css`
    text-align: center;
  `,

  statValue: css`
    margin-block-end: 8px;
    font-size: 40px;
    font-weight: 800;
    color: ${token.colorPrimary};
  `,

  statLabel: css`
    font-size: 16px;
    color: ${token.colorTextSecondary};
  `,
}));

const CTA = () => {
  const { styles } = useStyles();
  const theme = useTheme();

  return (
    <Center className={styles.section}>
      <Flexbox align="center" className={styles.container}>
        <Title className={styles.ctaTitle}>Transforme seu negócio com IA de última geração</Title>

        <Paragraph className={styles.ctaSubtitle}>
          Implemente agentes inteligentes em minutos e veja resultados imediatos
        </Paragraph>

        <Flexbox horizontal className={styles.buttonGroup}>
          <Link href="/signup">
            <Button
              type="primary"
              size="large"
              className={styles.button}
              icon={<Icon icon={Sparkles} />}
            >
              Teste Grátis por 14 Dias
            </Button>
          </Link>

          <Link href="mailto:contato@ai4learning.com.br?subject=Solicitar Demo Agents Chat">
            <Button size="large" className={styles.button} icon={<Icon icon={ArrowRight} />}>
              Agendar Demo
            </Button>
          </Link>
        </Flexbox>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <div className={styles.statValue}>25K+</div>
            <div className={styles.statLabel}>Empresas Ativas</div>
          </div>

          <div className={styles.stat}>
            <div className={styles.statValue}>50M+</div>
            <div className={styles.statLabel}>Interações Processadas</div>
          </div>

          <div className={styles.stat}>
            <div className={styles.statValue}>99.9%</div>
            <div className={styles.statLabel}>SLA Garantido</div>
          </div>
        </div>
      </Flexbox>
    </Center>
  );
};

export default CTA;
