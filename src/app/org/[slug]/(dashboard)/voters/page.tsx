export const dynamic = 'force-dynamic';
export const revalidate = 0;

import React from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import VotersClientPage from './voters-client';

export default async function VotersPage({
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

  // 2. Fetch voters list
  const voters = await db.voter.findMany({
    where: { organizationId: org.id },
    orderBy: { createdAt: 'desc' },
    include: {
      participations: true,
    }
  });

  // Fetch active event if exists to show voting status per event (latest published)
  const activeEvent = await db.event.findFirst({
    where: { organizationId: org.id, status: 'PUBLISHED' },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true }
  });

  // Map database voters to plain object list to pass to client component safely
  const serializedVoters = voters.map((v: any) => ({
    id: v.id,
    name: v.name,
    studentId: v.studentId,
    class: v.class,
    department: v.department,
    phone: v.phone,
    email: v.email,
    qrToken: v.qrToken,
    votingPass: v.votingPass,
    invitationNum: v.invitationNum,
    hasVoted: (v.participations || []).some((p: any) => p.eventId === activeEvent?.id),
    createdAt: v.createdAt instanceof Date ? v.createdAt.toISOString() : (v.createdAt ? new Date(v.createdAt).toISOString() : new Date().toISOString()),
  }));

  return (
    <VotersClientPage 
      initialVoters={serializedVoters} 
      slug={slug} 
      activeEventName={activeEvent?.name || null}
    />
  );
}
