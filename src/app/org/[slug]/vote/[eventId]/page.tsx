export const dynamic = 'force-dynamic';
export const revalidate = 0;

import React from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import VoteClientPage from './vote-client';

export default async function OnlineVotePage({
  params,
}: {
  params: Promise<{ slug: string; eventId: string }>;
}) {
  const { slug, eventId } = await params;

  // 1. Fetch organization
  const org = await db.organization.findUnique({
    where: { slug },
  });

  if (!org) {
    notFound();
  }

  // 2. Fetch event
  const event = await db.event.findUnique({
    where: { id: eventId },
    include: {
      candidates: {
        orderBy: { number: 'asc' }
      }
    }
  });

  if (!event || event.organizationId !== org.id) {
    notFound();
  }

  const serializedEvent = {
    id: event.id,
    name: event.name,
    description: event.description,
    authMethod: event.authMethod,
    votingMode: event.votingMode,
    allowLiveResult: event.allowLiveResult,
    hideRunningResult: event.hideRunningResult,
    voteConfirmation: event.voteConfirmation,
    anonymousVote: event.anonymousVote,
    status: event.status,
  };

  const serializedCandidates = (event.candidates || []).map((c: any) => ({
    id: c.id,
    number: c.number,
    name: c.name,
    photoUrl: c.photoUrl || null,
    vision: c.vision,
    mission: c.mission,
    socialMedia: c.socialMedia,
  }));

  return (
    <VoteClientPage 
      event={serializedEvent} 
      candidates={serializedCandidates} 
      slug={slug} 
      orgName={org.name}
    />
  );
}
