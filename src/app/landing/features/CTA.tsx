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
    padding: 100px 24px;
    background: ${token.colorBgContainer};
    
    @media (max-width: 768px) {
      padding: 60px 16px;
    }
  `,
  
  container: css`
    max-width: 800px;
    width: 100%;
    text-align: center;
  `,
  
  ctaTitle: css`
    font-size: 48px;
    font-weight: 800;
    margin-bottom: 16px;
    color: ${token.colorText};
    line-height: 1.2;
    
    @media (max-width: 768px) {
      font-size: 32px;
    }
  `,
  
  ctaSubtitle: css`
    font-size: 18px;
    color: ${token.colorTextSecondary};
    margin-bottom: 48px;
    
    @media (max-width: 768px) {
      font-size: 16px;
      margin-bottom: 32px;
    }
  `,
  
  buttonGroup: css`
    gap: 16px;
    justify-content: center;
    margin-bottom: 80px;
  `,
  
  button: css`
    height: 48px;
    padding: 0 32px;
    font-size: 16px;
    border-radius: 8px;
  `,
  
  stats: css`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 48px;
    max-width: 600px;
    margin: 0 auto;
  `,
  
  stat: css`
    text-align: center;
  `,
  
  statValue: css`
    font-size: 40px;
    font-weight: 800;
    color: ${token.colorPrimary};
    margin-bottom: 8px;
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
        <Title className={styles.ctaTitle}>
          Transforme seu negócio com IA de última geração
        </Title>
        
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
          
          <Link href="/demo">
            <Button 
              size="large"
              className={styles.button}
              icon={<Icon icon={ArrowRight} />}
            >
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