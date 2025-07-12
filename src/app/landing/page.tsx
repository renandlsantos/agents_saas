'use client';

import { useTheme } from 'antd-style';
import { Flexbox } from 'react-layout-kit';

import CTA from './features/CTA';
import Features from './features/Features';
import Footer from './features/Footer';
import Hero from './features/Hero';
import WaitlistSection from './features/WaitlistSection';

const LandingPage = () => {
  const theme = useTheme();

  return (
    <Flexbox
      style={{
        minHeight: '100vh',
        backgroundColor: theme.colorBgLayout,
        color: theme.colorText,
      }}
    >
      <Hero />
      <Features />
      <WaitlistSection />
      <CTA />
      <Footer />
    </Flexbox>
  );
};

export default LandingPage;
