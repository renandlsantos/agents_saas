'use client';

import { Construction } from 'lucide-react';
import { memo } from 'react';
import { Center, Flexbox } from 'react-layout-kit';

const DocumentationPage = memo(() => {
  return (
    <Center height={'100%'} width={'100%'}>
      <Flexbox align="center" gap={24} style={{ textAlign: 'center' }}>
        <Construction size={64} style={{ opacity: 0.5 }} />
        <h1 style={{ fontSize: '2.5rem', fontWeight: 600, margin: 0 }}>Em construção</h1>
        <p style={{ fontSize: '1.2rem', margin: 0, maxWidth: 400, opacity: 0.8 }}>
          Esta página está sendo desenvolvida e em breve estará disponível.
        </p>
      </Flexbox>
    </Center>
  );
});

DocumentationPage.displayName = 'DocumentationPage';

export default DocumentationPage;
