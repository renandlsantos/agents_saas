'use client';

import { Icon } from '@lobehub/ui';
import { Typography } from 'antd';
import { createStyles, useTheme } from 'antd-style';
import { 
  Brain, 
  Code, 
  Globe, 
  MessageSquare, 
  Mic, 
  Palette, 
  Shield, 
  Zap 
} from 'lucide-react';
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
    max-width: 1200px;
    width: 100%;
  `,
  
  sectionTitle: css`
    font-size: 48px;
    font-weight: 800;
    text-align: center;
    margin-bottom: 16px;
    color: ${token.colorText};
    
    @media (max-width: 768px) {
      font-size: 32px;
    }
  `,
  
  sectionSubtitle: css`
    font-size: 18px;
    color: ${token.colorTextSecondary};
    text-align: center;
    margin-bottom: 64px;
    max-width: 600px;
    
    @media (max-width: 768px) {
      font-size: 16px;
      margin-bottom: 40px;
    }
  `,
  
  featuresGrid: css`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 24px;
  `,
  
  featureCard: css`
    background: ${token.colorBgElevated};
    border: 1px solid ${token.colorBorder};
    border-radius: 12px;
    padding: 32px;
    transition: all 0.3s ease;
    
    &:hover {
      transform: translateY(-4px);
      box-shadow: ${token.boxShadowSecondary};
      border-color: ${token.colorPrimary};
    }
  `,
  
  featureIcon: css`
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    background: ${token.colorPrimaryBg};
    color: ${token.colorPrimary};
  `,
  
  featureTitle: css`
    font-size: 20px;
    font-weight: 600;
    color: ${token.colorText};
    margin-bottom: 8px;
  `,
  
  featureDescription: css`
    font-size: 14px;
    color: ${token.colorTextSecondary};
    line-height: 1.6;
    margin: 0;
  `,
}));

const features = [
  {
    icon: Brain,
    title: 'Inteligência Unificada',
    description: 'Integre +40 modelos de IA líderes de mercado em uma única plataforma. OpenAI GPT-4, Claude 3, Gemini Pro e muito mais.',
  },
  {
    icon: MessageSquare,
    title: 'Processamento Multimodal',
    description: 'Análise avançada de texto, imagem, áudio e documentos. Crie fluxos de trabalho complexos com entrada e saída multimodal.',
  },
  {
    icon: Mic,
    title: 'Voz Neural Avançada',
    description: 'Síntese de voz ultra-realista e transcrição precisa em 95+ idiomas. Ideal para assistentes virtuais e atendimento.',
  },
  {
    icon: Code,
    title: 'Arquitetura Extensível',
    description: 'Framework de plugins robusto com APIs RESTful e webhooks. Integre com seus sistemas existentes sem fricção.',
  },
  {
    icon: Shield,
    title: 'Segurança Corporativa',
    description: 'Certificações SOC 2 e ISO 27001. Criptografia AES-256, SSO/SAML, auditoria completa e conformidade LGPD/GDPR.',
  },
  {
    icon: Globe,
    title: 'Infraestrutura Global',
    description: 'Deploy em múltiplas regiões com latência < 100ms. Suporte nativo para Kubernetes, Docker e edge computing.',
  },
  {
    icon: Zap,
    title: 'Performance Enterprise',
    description: 'Processamento paralelo com até 10k req/s. Cache distribuído, balanceamento inteligente e SLA 99.9%.',
  },
  {
    icon: Palette,
    title: 'White-Label Completo',
    description: 'Personalize 100% da interface, domínio próprio, temas ilimitados e experiências únicas para cada cliente.',
  },
];

const Features = () => {
  const { styles } = useStyles();
  const theme = useTheme();
  
  return (
    <Center className={styles.section}>
      <Flexbox align="center" className={styles.container}>
        <Title className={styles.sectionTitle}>
          Capacidades Enterprise
        </Title>
        <Paragraph className={styles.sectionSubtitle}>
          Infraestrutura robusta e recursos avançados para transformar sua operação com IA
        </Paragraph>
        
        <div className={styles.featuresGrid}>
          {features.map((feature, index) => (
            <div key={index} className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Icon icon={feature.icon} size={24} />
              </div>
              <h3 className={styles.featureTitle}>
                {feature.title}
              </h3>
              <p className={styles.featureDescription}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </Flexbox>
    </Center>
  );
};

export default Features;