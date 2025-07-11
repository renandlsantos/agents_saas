import { redirect } from 'next/navigation';

export default function LoginPage() {
  redirect('/next-auth/signin');
}