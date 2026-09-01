export const dynamic = 'force-dynamic';
export const revalidate = 0;

import React from 'react';
import { redirect, notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/session';
import LiveCountClientPage from './livecount-client';

export default async function LiveCountPage({
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

  // Tenant check
  if (session.role !== 'SUPER_ADMIN' && session.organizationId !== org.id) {
    redirect('/login');
  }

  // 2. Fetch all published events to select from
  const events = await db.event.findMany({
    where: { organizationId: org.id, status: 'PUBLISHED' },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true }
  });

  return (
    <LiveCountClientPage 
      events={events} 
      slug={slug} 
      orgName={org.name}
    />
  );
}
