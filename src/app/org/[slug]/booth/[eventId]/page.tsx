import React from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import BoothClientPage from './booth-client';

export default async function BoothPage({
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

  // 2. Fetch event details
  const event = await db.event.findUnique({
    where: { id: eventId },
    include: {
      candidates: {
        orderBy: { number: 'asc' }
      },
      boothSetting: true,
    }
  });

  if (!event || event.organizationId !== org.id) {
    notFound();
  }

  // 3. Fetch or initialize sample voters for this organization
  let voters = await db.voter.findMany({
    where: { organizationId: org.id },
    take: 6
  });

  if (voters.length === 0) {
    // Auto-create sample voters for instant testing
    const v1 = await db.voter.create({
      data: {
        organizationId: org.id,
        name: 'Budi Santoso',
        studentId: 'KP-001',
        class: '12-A',
        department: 'Sains',
        phone: '081234567890',
        email: 'budi@' + slug + '.app',
        qrToken: 'VTLY-' + Math.random().toString(36).substring(2, 12).toUpperCase(),
        votingPass: '123456',
        invitationNum: 'INV-10001'
      }
    });

    const v2 = await db.voter.create({
      data: {
        organizationId: org.id,
        name: 'Siti Rahma',
        studentId: 'KP-002',
        class: '12-B',
        department: 'Sosial',
        phone: '081234567891',
        email: 'siti@' + slug + '.app',
        qrToken: 'VTLY-' + Math.random().toString(36).substring(2, 12).toUpperCase(),
        votingPass: '654321',
        invitationNum: 'INV-10002'
      }
    });
    voters = [v1, v2];
  }

  // 4. Serialize data
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

  // NOTE: We do NOT serialize voter credentials (qrToken, votingPass) to client props.
  // That would expose secrets to anyone viewing the page source / network tab.
  // Voter authentication happens server-side in booth/actions.ts.

  const serializedSettings = event.boothSetting ? {
    enableBoothMode: event.boothSetting.enableBoothMode,
    enableKioskMode: event.boothSetting.enableKioskMode,
    fullscreen: event.boothSetting.fullscreen,
    autoLogout: event.boothSetting.autoLogout,
    autoReturn: event.boothSetting.autoReturn,
    idleTimeout: event.boothSetting.idleTimeout,
    sessionTimeout: event.boothSetting.sessionTimeout,
    cameraScan: event.boothSetting.cameraScan,
  } : {
    enableBoothMode: true,
    enableKioskMode: false,
    fullscreen: false,
    autoLogout: true,
    autoReturn: true,
    idleTimeout: 30,
    sessionTimeout: 120,
    cameraScan: true,
  };

  const posterConfig = {
    url: org.posterUrl || null,
    enabled: org.posterEnabled || false,
    title: org.posterTitle || 'Panduan & Tata Cara Pemilihan',
    caption: org.posterCaption || 'Silakan cermati tata cara dan informasi pemilihan sebelum melanjutkan ke pengisian surat suara.',
  };

  return (
    <BoothClientPage 
      event={serializedEvent} 
      candidates={serializedCandidates} 
      settings={serializedSettings} 
      slug={slug} 
      orgName={org.name}
      logoUrl={org.logoUrl || null}
      poster={posterConfig}
    />
  );
}
