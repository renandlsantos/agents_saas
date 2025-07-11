'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import Loading from '@/components/Loading/BrandTextLoading';
import { DEFAULT_LANG , LOBE_LOCALE_COOKIE } from '@/const/locale';
import { LOBE_THEME_APPEARANCE } from '@/const/theme';

// Página de redirecionamento para /chat com detecção de preferências
export default function ChatRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Tenta obter o locale e tema dos cookies ou usa os padrões
    const cookieLocale = document.cookie
      .split('; ')
      .find((row) => row.startsWith(LOBE_LOCALE_COOKIE + '='))
      ?.split('=')[1];

    const cookieTheme = document.cookie
      .split('; ')
      .find((row) => row.startsWith(LOBE_THEME_APPEARANCE + '='))
      ?.split('=')[1];

    const locale = cookieLocale || DEFAULT_LANG; // pt-BR
    const theme = cookieTheme || 'light';
    const device = '0'; // desktop por padrão

    // Redireciona para a página de chat com o formato de variants correto
    router.replace(`/${locale}__${device}__${theme}/chat`);
  }, [router]);

  return <Loading />;
}
