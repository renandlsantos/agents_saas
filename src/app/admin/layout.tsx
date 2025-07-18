import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { PropsWithChildren } from 'react';

import { DEFAULT_LANG } from '@/const/locale';
import { users } from '@/database/schemas';
import { serverDB } from '@/database/server';
import AdminLayout from '@/features/Admin/Layout';
import AuthProvider from '@/layout/AuthProvider';
import GlobalProvider from '@/layout/GlobalProvider';
import { getUserAuth } from '@/utils/server/auth';

import AdminProviders from './AdminProviders';

export default async function Layout({ children }: PropsWithChildren) {
  const { userId } = await getUserAuth();

  if (!userId) {
    redirect('/login');
  }

  // Check if user has admin privileges
  const db = await serverDB;
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      isAdmin: true,
    },
  });

  if (!user?.isAdmin) {
    redirect('/unauthorized');
  }

  // Provide default values for admin panel
  return (
    <NuqsAdapter>
      <GlobalProvider appearance="light" isMobile={false} locale={DEFAULT_LANG}>
        <AuthProvider>
          <AdminProviders>
            <AdminLayout>{children}</AdminLayout>
          </AdminProviders>
        </AuthProvider>
      </GlobalProvider>
    </NuqsAdapter>
  );
}
