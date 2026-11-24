import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, readSession } from '@/lib/auth/session';
import { backendConfigured } from '@/lib/backend-check';
import Panel from '@/components/users/Panel';
import '@/components/users/users.css';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function UsersPage() {
  const cookieStore = await cookies();
  const session = readSession(cookieStore.get(SESSION_COOKIE)?.value);
  if (!session) redirect('/login');

  return <Panel username={session.username} backendReady={backendConfigured()} />;
}
