'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminDashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin');
  }, [router]);

  return null;
}
