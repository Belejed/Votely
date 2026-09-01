import React from 'react';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/session';
import AdminLayoutClient from './admin-layout-client';

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // 1. Verify admin session
  const session = await getAdminSession();
  if (!session) {
    redirect('/login');
  }

  // 2. Validate tenant boundary
  if (session.role !== 'SUPER_ADMIN' && session.organizationSlug !== slug) {
    redirect('/login');
  }

  // 3. Fetch organization details
  const org = await db.organization.findUnique({
    where: { slug },
    select: { name: true, slug: true, logoUrl: true }
  });

  if (!org) {
    redirect('/login');
  }

  return (
    <AdminLayoutClient 
      org={org} 
      session={{ name: session.name, role: session.role }}
    >
      {children}
    </AdminLayoutClient>
  );
}
