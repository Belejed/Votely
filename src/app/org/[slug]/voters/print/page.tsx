import React from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import PrintClientPage from './print-client';

export default async function PrintVotersPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ layout?: string; voterId?: string }>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const layout = resolvedSearchParams.layout || '4';
  const voterId = resolvedSearchParams.voterId;

  // 1. Fetch organization
  const org = await db.organization.findUnique({
    where: { slug },
  });

  if (!org) {
    notFound();
  }

  // 2. Fetch voters
  let voters = [];
  if (voterId) {
    // Single voter print
    voters = await db.voter.findMany({
      where: { id: voterId, organizationId: org.id },
    });
  } else {
    // Bulk print
    voters = await db.voter.findMany({
      where: { organizationId: org.id },
      orderBy: { name: 'asc' },
    });
  }

  // Fetch active event if exists to display on card
  const activeEvent = await db.event.findFirst({
    where: { organizationId: org.id, status: 'PUBLISHED' },
    select: { name: true, startDate: true }
  });

  const serializedVoters = voters.map((v: any) => ({
    id: v.id,
    name: v.name,
    studentId: v.studentId,
    class: v.class,
    department: v.department,
    qrToken: v.qrToken,
    votingPass: v.votingPass,
    invitationNum: v.invitationNum,
  }));

  return (
    <PrintClientPage 
      voters={serializedVoters} 
      layout={layout} 
      orgName={org.name} 
      eventName={activeEvent?.name || 'Votely General Election'}
      eventDate={activeEvent?.startDate ? new Date(activeEvent.startDate).toLocaleDateString() : 'Active Voting Period'}
    />
  );
}
