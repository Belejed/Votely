export const dynamic = 'force-dynamic';
export const revalidate = 0;

import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/session';
import ActiveElectionClient from './active-election-client';

export default async function ActiveElectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getAdminSession();
  if (!session) {
    redirect('/login');
  }
  if (session.role === 'OBSERVER') {
    redirect(`/org/${slug}/livecount`);
  }

  // 1. Fetch organization
  const org = await db.organization.findUnique({
    where: { slug },
  });

  if (!org) {
    notFound();
  }

  // 2. Fetch Active Event (Published first, otherwise newest draft/closed)
  let activeEvent = await db.event.findFirst({
    where: { organizationId: org.id, status: 'PUBLISHED' },
    orderBy: { createdAt: 'desc' },
    include: {
      candidates: {
        include: {
          votes: true
        },
        orderBy: { number: 'asc' }
      },
      votes: true
    }
  });

  if (!activeEvent) {
    activeEvent = await db.event.findFirst({
      where: { organizationId: org.id },
      orderBy: { createdAt: 'desc' },
      include: {
        candidates: {
          include: {
            votes: true
          },
          orderBy: { number: 'asc' }
        },
        votes: true
      }
    });
  }

  // 3. Fetch voters count
  const totalVoters = await db.voter.count({
    where: { organizationId: org.id }
  });

  const totalVotesCast = activeEvent ? (activeEvent.votes?.length || 0) : 0;
  const turnoutPercentage = totalVoters > 0 ? Math.round((totalVotesCast / totalVoters) * 100) : 0;

  const serializedEvent = activeEvent ? {
    id: activeEvent.id,
    name: activeEvent.name,
    description: activeEvent.description,
    status: activeEvent.status,
    votingMode: activeEvent.votingMode,
    authMethod: activeEvent.authMethod,
    startDate: activeEvent.startDate ? new Date(activeEvent.startDate).toISOString() : '',
    endDate: activeEvent.endDate ? new Date(activeEvent.endDate).toISOString() : '',
    organizationId: activeEvent.organizationId,
    multipleCandidate: activeEvent.multipleCandidate || false,
    maxVotes: activeEvent.maxVotes || 1,
  } : null;

  const serializedCandidates = (activeEvent?.candidates || []).map((cand: any, idx: number) => {
    const candVotes = cand.votes?.length || 0;
    const candPercentage = totalVotesCast > 0 ? Math.round((candVotes / totalVotesCast) * 100) : 0;
    return {
      id: cand.id,
      number: cand.number || idx + 1,
      name: cand.name,
      photoUrl: cand.photoUrl || null,
      vision: cand.vision || null,
      mission: cand.mission || null,
      votesCount: candVotes,
      percentage: candPercentage,
    };
  });

  return (
    <ActiveElectionClient
      event={serializedEvent}
      candidates={serializedCandidates}
      totalVoters={totalVoters}
      totalVotesCast={totalVotesCast}
      turnoutPercentage={turnoutPercentage}
      slug={slug}
      orgName={org.name}
      userRole={session.role}
    />
  );
}
