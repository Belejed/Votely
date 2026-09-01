export const dynamic = 'force-dynamic';
export const revalidate = 0;

import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/session';
import UsersClientPage from './users-client';

export default async function UsersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getAdminSession();
  if (!session) {
    redirect('/login');
  }

  // 1. Fetch organization
  const org = await db.organization.findUnique({
    where: { slug },
  });

  if (!org) {
    notFound();
  }

  // 2. Fetch all committee staff users for this organization
  const users = await db.user.findMany({
    where: { organizationId: org.id },
    orderBy: { createdAt: 'asc' },
  });

  const serializedUsers = users.map((u: any) => ({
    id: u.id,
    name: u.name,
    username: u.username || (u.email ? u.email.split('@')[0] : 'admin'),
    role: u.role,
    createdAt: u.createdAt ? u.createdAt.toISOString() : new Date().toISOString(),
  }));

  return (
    <UsersClientPage 
      users={serializedUsers} 
      slug={slug} 
      currentUserId={session.userId} 
      orgName={org.name}
    />
  );
}
