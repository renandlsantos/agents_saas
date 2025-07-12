import { Suspense } from 'react';

import AuthSignUpBox from '@/app/[variants]/(auth)/next-auth/signup/AuthSignUpBox';
import Loading from '@/components/Loading/BrandTextLoading';

// Renderiza a página de signup diretamente sem redirecionamento
export default function SignUpPage() {
  return (
    <Suspense fallback={<Loading />}>
      <AuthSignUpBox />
    </Suspense>
  );
}
