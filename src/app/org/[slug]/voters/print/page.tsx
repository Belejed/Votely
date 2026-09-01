import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/session';
import PrintClientPage from './print-client';

export default async function PrintVotersPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ layout?: string; voterId?: string; classFilter?: string; sortBy?: string }>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const layout = resolvedSearchParams.layout || '4';

  // SECURITY: Require authenticated admin session
  const session = await getAdminSession();
  if (!session) {
    redirect('/login');
  }
  if (session.role !== 'SUPER_ADMIN' && session.organizationSlug !== slug) {
    redirect('/login');
  }
  const voterId = resolvedSearchParams.voterId;
  const classFilter = resolvedSearchParams.classFilter;
  const sortBy = resolvedSearchParams.sortBy || 'class_asc';

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
    voters = await db.voter.findMany({
      where: { id: voterId, organizationId: org.id },
    });
  } else if (classFilter) {
    voters = await db.voter.findMany({
      where: { organizationId: org.id, class: classFilter },
    });
  } else {
    voters = await db.voter.findMany({
      where: { organizationId: org.id },
    });
  }

  // Apply sorting
  voters.sort((a: any, b: any) => {
    if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
    if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
    if (sortBy === 'class_asc') {
      const cComp = (a.class || '').localeCompare(b.class || '');
      if (cComp !== 0) return cComp;
      return a.name.localeCompare(b.name);
    }
    if (sortBy === 'id_asc') return (a.studentId || '').localeCompare(b.studentId || '');
    return 0;
  });

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

  // Also fetch all unique classes for interactive switching on print toolbar
  const allOrgVoters = await db.voter.findMany({
    where: { organizationId: org.id },
    select: { class: true }
  });
  const availableClasses = Array.from(new Set(allOrgVoters.map((v: any) => v.class).filter(Boolean))).sort() as string[];

  return (
    <PrintClientPage 
      voters={serializedVoters} 
      layout={layout} 
      orgName={org.name} 
      slug={slug}
      initialClassFilter={classFilter || 'ALL'}
      availableClasses={availableClasses}
      eventName={activeEvent?.name || 'Votely General Election'}
      eventDate={activeEvent?.startDate ? new Date(activeEvent.startDate).toLocaleDateString() : 'Active Voting Period'}
    />
  );
}
