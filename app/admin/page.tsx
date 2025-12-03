import { redirect } from 'next/navigation';
import { verifySession } from '@/app/lib/auth';
import AdminDashboard from './components/AdminDashboard';

export default async function AdminPage() {
  const session = await verifySession();

  if (!session) {
    redirect('/admin/login');
  }

  return <AdminDashboard />;
}

