import { Suspense } from 'react';

import AuthSignInBox from '@/app/[variants]/(auth)/next-auth/signin/AuthSignInBox';
import Loading from '@/components/Loading/BrandTextLoading';

export default () => (
  <Suspense fallback={<Loading />}>
    <AuthSignInBox />
  </Suspense>
);
