import { Suspense } from 'react';

import Loading from '@/components/Loading/BrandTextLoading';

import CredentialsSignInBox from './CredentialsSignInBox';

export default () => (
  <Suspense fallback={<Loading />}>
    <CredentialsSignInBox />
  </Suspense>
);
