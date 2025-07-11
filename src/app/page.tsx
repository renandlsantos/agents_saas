import { redirect } from 'next/navigation';
import NextAuthEdge from '@/libs/next-auth/edge';

export default async function RootPage() {
  const session = await NextAuthEdge.auth();
  
  // Se não estiver autenticado, redireciona para landing page
  if (!session) {
    redirect('/landing');
  }
  
  // Se estiver autenticado, redireciona para o chat
  redirect('/chat');
}