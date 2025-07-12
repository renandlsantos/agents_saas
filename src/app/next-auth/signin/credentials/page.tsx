import { Suspense } from 'react';

import CredentialsSignInBox from '@/app/[variants]/(auth)/next-auth/signin/credentials/CredentialsSignInBox';
import Loading from '@/components/Loading/BrandTextLoading';

export default () => (
  <Suspense fallback={<Loading />}>
    <CredentialsSignInBox />
  </Suspense>
);
