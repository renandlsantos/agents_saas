'use client';

import { PropsWithChildren } from 'react';

import QueryProvider from '@/layout/GlobalProvider/Query';

export default function AdminProviders({ children }: PropsWithChildren) {
  return <QueryProvider>{children}</QueryProvider>;
}
