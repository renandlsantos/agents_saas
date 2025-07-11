import { redirect } from 'next/navigation';

export default function SignupPage() {
  redirect('/next-auth/signup');
}