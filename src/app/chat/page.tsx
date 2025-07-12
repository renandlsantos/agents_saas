import { redirect } from 'next/navigation';

// Simples redirecionamento do /chat raiz para evitar confusão
// O middleware irá lidar com as preferências de usuário internamente
export default async function ChatPage() {
  redirect('/');
}
