'use client';

import { useTheme } from 'antd-style';
import { PropsWithChildren } from 'react';
import { Flexbox } from 'react-layout-kit';

import Hero from './features/Hero';
import Features from './features/Features';
import Pricing from './features/Pricing';
import CTA from './features/CTA';
import Footer from './features/Footer';

const LandingPage = () => {
  const theme = useTheme();
  
  return (
    <Flexbox 
      style={{ 
        minHeight: '100vh',
        background: theme.colorBgLayout,
      }}
    >
      <Hero />
      <Features />
      <Pricing />
      <CTA />
      <Footer />
    </Flexbox>
  );
};

export default LandingPage;