import { Suspense } from 'react';

import AuthErrorPage from '@/app/[variants]/(auth)/next-auth/error/AuthErrorPage';
import Loading from '@/components/Loading/BrandTextLoading';

// Force dynamic rendering to avoid build errors with useSearchParams
export const dynamic = 'force-dynamic';

export default () => (
  <Suspense fallback={<Loading />}>
    <AuthErrorPage />
  </Suspense>
);
