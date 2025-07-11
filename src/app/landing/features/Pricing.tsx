'use client';

import { Icon } from '@lobehub/ui';
import { Button, Tag, Typography } from 'antd';
import { createStyles, useTheme } from 'antd-style';
import { Check, Star, Zap } from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import { Center, Flexbox } from 'react-layout-kit';

const { Title, Paragraph } = Typography;

const useStyles = createStyles(({ css, token }) => ({
  section: css`
    padding: 100px 24px;
    background: ${token.colorBgLayout};
    
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
  
  pricingGrid: css`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 24px;
  `,
  
  pricingCard: css`
    background: ${token.colorBgElevated};
    border: 1px solid ${token.colorBorder};
    border-radius: 12px;
    padding: 32px;
    position: relative;
    transition: all 0.3s ease;
    
    &:hover {
      transform: translateY(-4px);
      box-shadow: ${token.boxShadowSecondary};
    }
  `,
  
  popularCard: css`
    border-color: ${token.colorPrimary};
    
    &:hover {
      border-color: ${token.colorPrimary};
    }
  `,
  
  planName: css`
    font-size: 24px;
    font-weight: 700;
    color: ${token.colorText};
    margin-bottom: 8px;
  `,
  
  price: css`
    font-size: 40px;
    font-weight: 800;
    color: ${token.colorText};
    margin-bottom: 4px;
    
    span {
      font-size: 16px;
      font-weight: 400;
      color: ${token.colorTextSecondary};
    }
  `,
  
  description: css`
    color: ${token.colorTextSecondary};
    margin-bottom: 32px;
    font-size: 14px;
  `,
  
  featureList: css`
    list-style: none;
    padding: 0;
    margin: 0 0 32px;
  `,
  
  feature: css`
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
    color: ${token.colorTextSecondary};
    font-size: 14px;
  `,
  
  ctaButton: css`
    width: 100%;
    height: 40px;
    font-size: 14px;
    border-radius: 8px;
  `,
}));

const plans = [
  {
    name: 'Starter',
    price: 'R$ 0',
    period: '/mês',
    description: 'Ideal para explorar a plataforma',
    features: [
      '1.000 requisições/mês',
      'GPT-3.5 e Claude Instant',
      'Interface web completa',
      'Retenção de dados: 7 dias',
      'Comunidade e documentação',
    ],
    cta: 'Criar Conta Grátis',
    href: '/signup',
  },
  {
    name: 'Professional',
    price: 'R$ 149',
    period: '/usuário/mês',
    description: 'Para equipes que precisam escalar',
    features: [
      '100.000 requisições/mês',
      'Todos os 40+ modelos de IA',
      'Processamento multimodal',
      'TTS/STT em 95+ idiomas',
      'Plugins e integrações ilimitadas',
      'API REST completa',
      'Suporte prioritário em PT-BR',
      'Analytics e dashboards',
      'Backup e exportação de dados',
    ],
    cta: 'Teste Grátis 14 Dias',
    href: '/signup?plan=professional',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Sob Consulta',
    description: 'Solução completa para grandes operações',
    features: [
      'Volume ilimitado + SLA 99.9%',
      'Deploy dedicado ou on-premise',
      'Modelos fine-tuned exclusivos',
      'Integração com ERP/CRM',
      'Onboarding e treinamento',
      'Suporte 24/7 com SLA',
      'Compliance LGPD/SOC2/ISO',
      'White-label completo',
      'Desenvolvimento customizado',
    ],
    cta: 'Agendar Demonstração',
    href: '/contact',
  },
];

const Pricing = () => {
  const { styles } = useStyles();
  const theme = useTheme();
  
  return (
    <Center className={styles.section} id="pricing">
      <Flexbox align="center" className={styles.container}>
        <Title className={styles.sectionTitle}>
          Investimento Transparente
        </Title>
        <Paragraph className={styles.sectionSubtitle}>
          Planos flexíveis que crescem com seu negócio. Sem taxas ocultas ou surpresas.
        </Paragraph>
        
        <div className={styles.pricingGrid}>
          {plans.map((plan, index) => (
            <div 
              key={index}
              className={`${styles.pricingCard} ${plan.popular ? styles.popularCard : ''}`}
            >
              {plan.popular && (
                <Tag 
                  color={theme.colorPrimary}
                  style={{ 
                    position: 'absolute', 
                    top: -12, 
                    right: 24,
                    padding: '4px 16px',
                    borderRadius: '20px',
                  }}
                >
                  <Icon icon={Star} size={14} style={{ marginRight: 4 }} />
                  Mais Popular
                </Tag>
              )}
              
              <h3 className={styles.planName}>
                {plan.name}
              </h3>
              
              <div className={styles.price}>
                {plan.price}
                {plan.period && <span>{plan.period}</span>}
              </div>
              
              <p className={styles.description}>
                {plan.description}
              </p>
              
              <ul className={styles.featureList}>
                {plan.features.map((feature, idx) => (
                  <li key={idx} className={styles.feature}>
                    <Icon 
                      icon={Check} 
                      size={16} 
                      style={{ color: theme.colorPrimary }} 
                    />
                    {feature}
                  </li>
                ))}
              </ul>
              
              <Link href={plan.href}>
                <Button 
                  type={plan.popular ? 'primary' : 'default'}
                  className={styles.ctaButton}
                  icon={plan.popular ? <Icon icon={Zap} size={14} /> : null}
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </Flexbox>
    </Center>
  );
};

export default Pricing;