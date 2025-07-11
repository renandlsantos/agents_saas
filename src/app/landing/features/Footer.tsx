'use client';

import { Icon } from '@lobehub/ui';
import { Typography } from 'antd';
import { createStyles, useTheme } from 'antd-style';
import { Github, MessageSquare, Mail, FileText } from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import { Center, Flexbox } from 'react-layout-kit';

import CustomLogo from '@/components/Branding/ProductLogo/Custom';
import { BRANDING_NAME } from '@/const/branding';

const { Text } = Typography;

const useStyles = createStyles(({ css, token }) => ({
  footer: css`
    background: ${token.colorBgLayout};
    border-top: 1px solid ${token.colorBorder};
    padding: 80px 24px 40px;
    
    @media (max-width: 768px) {
      padding: 60px 16px 32px;
    }
  `,
  
  footerContent: css`
    max-width: 1200px;
    width: 100%;
  `,
  
  footerTop: css`
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr;
    gap: 48px;
    margin-bottom: 48px;
    
    @media (max-width: 768px) {
      grid-template-columns: 1fr;
      gap: 32px;
    }
  `,
  
  footerSection: css`
    h4 {
      font-size: 16px;
      font-weight: 600;
      color: ${token.colorText};
      margin-bottom: 24px;
    }
  `,
  
  footerLink: css`
    display: block;
    color: ${token.colorTextSecondary};
    font-size: 14px;
    margin-bottom: 16px;
    transition: color 0.2s ease;
    
    &:hover {
      color: ${token.colorPrimary};
    }
  `,
  
  brandSection: css`
    display: flex;
    flex-direction: column;
    gap: 16px;
    
    p {
      color: ${token.colorTextSecondary};
      font-size: 14px;
      line-height: 1.8;
      margin-bottom: 24px;
      max-width: 400px;
    }
  `,
  
  logoWrapper: css`
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
  `,
  
  brandName: css`
    font-size: 20px;
    font-weight: 700;
    color: ${token.colorText};
  `,
  
  socialLinks: css`
    display: flex;
    gap: 12px;
  `,
  
  socialIcon: css`
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: ${token.colorFillSecondary};
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    color: ${token.colorTextSecondary};
    
    &:hover {
      background: ${token.colorPrimaryBg};
      color: ${token.colorPrimary};
      transform: translateY(-2px);
    }
  `,
  
  footerBottom: css`
    border-top: 1px solid ${token.colorBorder};
    padding-top: 32px;
    text-align: center;
    
    p {
      color: ${token.colorTextSecondary};
      font-size: 14px;
      margin: 0;
    }
  `,
}));

const Footer = () => {
  const { styles } = useStyles();
  const theme = useTheme();
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className={styles.footer}>
      <Center>
        <div className={styles.footerContent}>
          <div className={styles.footerTop}>
            <div className={`${styles.footerSection} ${styles.brandSection}`}>
              <div className={styles.logoWrapper}>
                <CustomLogo size={32} type="3d" />
                <span className={styles.brandName}>{BRANDING_NAME}</span>
              </div>
              <p>
                Plataforma enterprise de agentes de IA com suporte a +40 modelos, 
                processamento multimodal e arquitetura extensível para transformar 
                sua operação com inteligência artificial.
              </p>
              <div className={styles.socialLinks}>
                <a 
                  href="https://github.com/agentes-chat" 
                  className={styles.socialIcon}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon icon={Github} size={18} />
                </a>
                <a 
                  href="/docs" 
                  className={styles.socialIcon}
                >
                  <Icon icon={FileText} size={18} />
                </a>
                <a 
                  href="/community" 
                  className={styles.socialIcon}
                >
                  <Icon icon={MessageSquare} size={18} />
                </a>
                <a 
                  href="mailto:support@agenteschat.com" 
                  className={styles.socialIcon}
                >
                  <Icon icon={Mail} size={18} />
                </a>
              </div>
            </div>
            
            <div className={styles.footerSection}>
              <h4>Produto</h4>
              <Link href="/features" className={styles.footerLink}>
                Recursos
              </Link>
              <Link href="#pricing" className={styles.footerLink}>
                Preços
              </Link>
              <Link href="/integrations" className={styles.footerLink}>
                Integrações
              </Link>
              <Link href="/changelog" className={styles.footerLink}>
                Changelog
              </Link>
              <Link href="/roadmap" className={styles.footerLink}>
                Roadmap
              </Link>
            </div>
            
            <div className={styles.footerSection}>
              <h4>Recursos</h4>
              <Link href="/docs" className={styles.footerLink}>
                Documentação
              </Link>
              <Link href="/api" className={styles.footerLink}>
                API Reference
              </Link>
              <Link href="/guides" className={styles.footerLink}>
                Guias
              </Link>
              <Link href="/community" className={styles.footerLink}>
                Comunidade
              </Link>
              <Link href="/support" className={styles.footerLink}>
                Suporte
              </Link>
            </div>
            
            <div className={styles.footerSection}>
              <h4>Legal</h4>
              <Link href="/privacy" className={styles.footerLink}>
                Privacidade
              </Link>
              <Link href="/terms" className={styles.footerLink}>
                Termos de Uso
              </Link>
              <Link href="/security" className={styles.footerLink}>
                Segurança
              </Link>
              <Link href="/compliance" className={styles.footerLink}>
                Compliance
              </Link>
              <Link href="/lgpd" className={styles.footerLink}>
                LGPD
              </Link>
            </div>
          </div>
          
          <div className={styles.footerBottom}>
            <p>
              © {currentYear} {BRANDING_NAME}. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </Center>
    </footer>
  );
};

export default Footer;