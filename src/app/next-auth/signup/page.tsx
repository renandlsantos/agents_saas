import { Suspense } from 'react';

import AuthSignUpBox from '@/app/[variants]/(auth)/next-auth/signup/AuthSignUpBox';
import Loading from '@/components/Loading/BrandTextLoading';

export default () => (
  <Suspense fallback={<Loading />}>
    <AuthSignUpBox />
  </Suspense>
);
