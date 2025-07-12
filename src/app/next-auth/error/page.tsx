import { Suspense } from 'react';

import AuthErrorPage from '@/app/[variants]/(auth)/next-auth/error/AuthErrorPage';
import Loading from '@/components/Loading/BrandTextLoading';

// Renderiza a página de erro diretamente sem redirecionamento
export default function ErrorPage() {
  return (
    <Suspense fallback={<Loading />}>
      <AuthErrorPage />
    </Suspense>
  );
}
