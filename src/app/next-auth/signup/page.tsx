'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { DEFAULT_LANG , LOBE_LOCALE_COOKIE } from '@/const/locale';

export default function SignUpRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Pega o idioma do cookie ou usa o padrão
    const cookieLocale = document.cookie
      .split('; ')
      .find((row) => row.startsWith(LOBE_LOCALE_COOKIE))
      ?.split('=')[1];

    const locale = cookieLocale || DEFAULT_LANG;
    const theme = 'light'; // ou pegar do cookie também

    // Redireciona para a página correta com variants
    router.replace(`/${locale}__0__${theme}/next-auth/signup`);
  }, [router]);

  return <div>Redirecting...</div>;
}
