export const dynamic = 'force-dynamic';
export const revalidate = 0;

import React from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import AnnouncementClientPage from './announcement-client';

export default async function AnnouncementsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // 1. Fetch organization
  const org = await db.organization.findUnique({
    where: { slug },
  });

  if (!org) {
    notFound();
  }

  // 2. Fetch announcements
  const announcements = await db.announcement.findMany({
    where: { organizationId: org.id },
    orderBy: { createdAt: 'desc' },
  });

  const serializedAnnouncements = announcements.map((a: any) => ({
    id: a.id,
    title: a.title,
    content: a.content,
    isPublished: a.isPublished,
    createdAt: a.createdAt.toISOString(),
  }));

  return (
    <AnnouncementClientPage 
      announcements={serializedAnnouncements} 
      slug={slug} 
      orgId={org.id} 
    />
  );
}
