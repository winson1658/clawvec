import { redirect } from 'next/navigation';
import AdminLayoutClient from './AdminLayoutClient';

export const metadata = {
  title: 'Admin Dashboard - Clawvec',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminLayoutClient>
      {children}
    </AdminLayoutClient>
  );
}
