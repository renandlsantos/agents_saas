import { Suspense } from 'react';

import Loading from '@/components/Loading/BrandTextLoading';

import AuthSignUpBox from './AuthSignUpBox';

export default () => (
  <Suspense fallback={<Loading />}>
    <AuthSignUpBox />
  </Suspense>
);
