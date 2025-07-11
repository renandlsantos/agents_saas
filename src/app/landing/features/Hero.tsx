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
    min-height: calc(100vh - 64px);
    padding: 80px 24px;
    position: relative;
    
    @media (max-width: 768px) {
      padding: 40px 16px;
    }
  `,
  
  container: css`
    max-width: 1200px;
    width: 100%;
  `,
  
  logoContainer: css`
    margin-bottom: 48px;
  `,
  
  title: css`
    font-size: 64px;
    font-weight: 800;
    line-height: 1.2;
    text-align: center;
    margin: 0 0 24px;
    color: ${token.colorText};
    
    @media (max-width: 768px) {
      font-size: 40px;
    }
  `,
  
  subtitle: css`
    font-size: 20px;
    color: ${token.colorTextDescription};
    text-align: center;
    margin: 0 0 48px;
    max-width: 680px;
    line-height: 1.6;
    
    @media (max-width: 768px) {
      font-size: 16px;
      margin: 0 0 32px;
    }
  `,
  
  buttonGroup: css`
    gap: 16px;
    justify-content: center;
  `,
  
  button: css`
    height: 48px;
    padding: 0 32px;
    font-size: 16px;
    border-radius: 8px;
  `,
  
  badge: css`
    background: ${token.colorFillSecondary};
    border-radius: 20px;
    padding: 4px 16px;
    font-size: 14px;
    color: ${token.colorTextSecondary};
    margin-bottom: 24px;
    display: inline-block;
  `,
  
  highlight: css`
    color: ${token.colorPrimary};
    font-weight: 600;
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
        
        <span className={styles.badge}>
          ✨ Plataforma líder em agentes de IA conversacional
        </span>
        
        <h1 className={styles.title}>
          {BRANDING_NAME}
        </h1>
        
        <p className={styles.subtitle}>
          Construa experiências extraordinárias com <span className={styles.highlight}>+40 modelos de IA</span>,
          processamento multimodal avançado e arquitetura extensível.
          Transforme conversas em resultados com a plataforma mais completa do mercado.
        </p>
        
        <Flexbox horizontal className={styles.buttonGroup}>
          <Link href="/signup">
            <Button 
              type="primary" 
              size="large"
              className={styles.button}
              icon={<Icon icon={Sparkles} />}
            >
              Começar Agora
            </Button>
          </Link>
          
          <Link href="/login">
            <Button 
              size="large"
              className={styles.button}
            >
              Fazer Login
            </Button>
          </Link>
        </Flexbox>
      </Flexbox>
    </Center>
  );
};

export default Hero;