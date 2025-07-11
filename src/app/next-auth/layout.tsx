import { PropsWithChildren } from 'react';

export default function NextAuthLayout({ children }: PropsWithChildren) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#f5f5f5',
      }}
    >
      {children}
    </div>
  );
}
