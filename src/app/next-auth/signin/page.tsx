import { Suspense } from 'react';

import AuthSignInBox from '@/app/[variants]/(auth)/next-auth/signin/AuthSignInBox';
import Loading from '@/components/Loading/BrandTextLoading';

// Renderiza a página de login diretamente sem redirecionamento
export default function SignInPage() {
  return (
    <Suspense fallback={<Loading />}>
      <AuthSignInBox />
    </Suspense>
  );
}
