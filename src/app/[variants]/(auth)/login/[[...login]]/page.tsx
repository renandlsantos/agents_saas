import { SignIn } from '@clerk/nextjs';
import { redirect } from 'next/navigation';

import { enableClerk } from '@/const/auth';
import { BRANDING_NAME } from '@/const/branding';
import { metadataModule } from '@/server/metadata';
import { translation } from '@/server/translation';
import { DynamicLayoutProps } from '@/types/next';
import { RouteVariants } from '@/utils/server/routeVariants';

export const generateMetadata = async (props: DynamicLayoutProps) => {
  const locale = await RouteVariants.getLocale(props);
  const { t } = await translation('clerk', locale);
  return metadataModule.generate({
    description: t('signIn.start.subtitle'),
    title: t('signIn.start.title', { applicationName: BRANDING_NAME }),
    url: '/login',
  });
};

const Page = () => {
  // Se não estiver usando Clerk, redireciona para a página de login do NextAuth
  if (!enableClerk) return redirect('/next-auth/signin');

  return <SignIn path="/login" />;
};

Page.displayName = 'Login';

export default Page;
