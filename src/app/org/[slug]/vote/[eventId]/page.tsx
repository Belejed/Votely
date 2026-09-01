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
    multipleCandidate: event.multipleCandidate || false,
    maxVotes: event.maxVotes || 1,
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

  const posterConfig = {
    url: org.posterUrl || null,
    enabled: org.posterEnabled || false,
    title: org.posterTitle || 'Panduan & Tata Cara Pemilihan',
    caption: org.posterCaption || 'Silakan cermati tata cara dan informasi pemilihan sebelum melanjutkan ke pengisian surat suara.',
  };

  return (
    <VoteClientPage 
      event={serializedEvent} 
      candidates={serializedCandidates} 
      slug={slug} 
      orgName={org.name}
      logoUrl={org.logoUrl || null}
      poster={posterConfig}
    />
  );
}
