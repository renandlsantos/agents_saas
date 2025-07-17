import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { PropsWithChildren } from 'react';

import { users } from '@/database/schemas';
import { serverDB } from '@/database/server';
import AdminLayout from '@/features/Admin/Layout';
import { getUserAuth } from '@/utils/server/auth';

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

  return <AdminLayout>{children}</AdminLayout>;
}
