import { ReactNode } from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Agentes SaaS - Plataforma de IA Conversacional',
  description: 'A plataforma definitiva de IA conversacional com múltiplos modelos, síntese de voz avançada e sistema extensível de plugins.',
  keywords: 'IA, chatbot, inteligência artificial, chat GPT, automação, agentes, SaaS',
  openGraph: {
    title: 'Agentes SaaS - Plataforma de IA Conversacional',
    description: 'Transforme sua empresa com a plataforma de IA mais avançada do mercado',
    images: ['/og-image.png'],
  },
};

export default function LandingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}