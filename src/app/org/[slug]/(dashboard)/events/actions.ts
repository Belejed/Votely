'use server';

import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';

export async function createEventAction(slug: string, wizardData: any) {
  const session = await getAdminSession();
  if (!session) {
    return { error: 'Sesi login telah berakhir. Silakan login kembali.' };
  }

  // Resolve organization ID by slug
  const org = await db.organization.findUnique({
    where: { slug },
  });

  if (!org) {
    return { error: 'Organisasi tidak ditemukan.' };
  }

  // Verify boundary (allow if matching orgId or orgSlug or SUPER_ADMIN)
  if (
    session.role !== 'SUPER_ADMIN' && 
    session.organizationId !== org.id &&
    session.organizationSlug !== slug
  ) {
    return { error: 'Akses ditolak: Anda tidak memiliki izin pada organisasi ini.' };
  }

  try {
    const {
      name,
      description,
      votingMode,
      authMethod,
      allowLiveResult,
      hideRunningResult,
      voteConfirmation,
      anonymousVote,
      multipleCandidate,
      maxVotes,
      autoClose,
      candidates,
      // Booth settings
      enableBoothMode,
      enableKioskMode,
      fullscreen,
      autoLogout,
      autoReturn,
      idleTimeout,
      sessionTimeout,
      cameraScan,
    } = wizardData;

    // Archive previously published events in this org so new election is active
    try {
      await db.event.updateMany({
        where: { organizationId: org.id, status: 'PUBLISHED' },
        data: { status: 'ARCHIVED' },
      });
    } catch (archErr) {
      console.warn('Could not archive previous events:', archErr);
    }

    // 1. Create Event
    const event = await db.event.create({
      data: {
        organizationId: org.id,
        name,
        description: description || '',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days
        votingMode,
        authMethod,
        allowLiveResult: allowLiveResult ?? true,
        hideRunningResult: hideRunningResult ?? false,
        voteConfirmation: voteConfirmation ?? true,
        anonymousVote: anonymousVote ?? true,
        multipleCandidate: multipleCandidate ?? false,
        maxVotes: parseInt(maxVotes) || 1,
        autoClose: autoClose ?? false,
        status: wizardData.status || 'PUBLISHED', // Respect draft or live for instant testing
      },
    });

    // 2. Create Candidates
    if (candidates && candidates.length > 0) {
      await db.candidate.createMany({
        data: candidates.map((c: any, index: number) => ({
          eventId: event.id,
          number: index + 1,
          name: c.name,
          photoUrl: c.photoUrl || null,
          vision: c.vision || '',
          mission: c.mission || '',
          socialMedia: c.socialMedia || {},
        })),
      });
    }

    // 3. Create Booth Settings if applicable
    if (votingMode === 'OFFLINE' || votingMode === 'HYBRID') {
      await db.offlineBoothSetting.create({
        data: {
          eventId: event.id,
          enableBoothMode: enableBoothMode ?? true,
          enableKioskMode: enableKioskMode ?? false,
          fullscreen: fullscreen ?? false,
          autoLogout: autoLogout ?? true,
          autoReturn: autoReturn ?? true,
          idleTimeout: parseInt(idleTimeout) || 60,
          sessionTimeout: parseInt(sessionTimeout) || 300,
          cameraScan: cameraScan ?? true,
        },
      });
    }

    // 4. Create Audit Log
    try {
      await db.auditLog.create({
        data: {
          organizationId: org.id,
          userId: session.userId,
          action: 'EVENT_CREATE',
          details: `Membuat pemilihan baru: ${name} (${votingMode})`,
        },
      });
    } catch (auditErr) {
      console.warn('Audit log creation failed, continuing:', auditErr);
    }

    revalidatePath(`/org/${slug}/dashboard`);
    revalidatePath(`/org/${slug}/events`);
    revalidatePath(`/org/${slug}/active-election`);
    revalidatePath(`/org/${slug}/livecount`);

    return { success: true, eventId: event.id };
  } catch (error: any) {
    console.error('Create event error:', error);
    return { error: error?.message || 'Gagal membuat pemilihan. Silakan periksa kembali formulir.' };
  }
}

export async function archiveEventAction(eventId: string, orgId: string, slug: string) {
  const session = await getAdminSession();
  if (!session || (session.role !== 'SUPER_ADMIN' && session.organizationId !== orgId)) {
    return { error: 'Unauthorized.' };
  }

  try {
    await db.event.update({
      where: { id: eventId },
      data: { status: 'ARCHIVED' },
    });

    revalidatePath(`/org/${slug}/events`);
    revalidatePath(`/org/${slug}/dashboard`);
    revalidatePath(`/org/${slug}/active-election`);
    revalidatePath(`/org/${slug}/livecount`);
    return { success: true };
  } catch (error) {
    return { error: 'Failed to archive event.' };
  }
}

export async function deleteEventAction(eventId: string, orgId: string, slug: string) {
  const session = await getAdminSession();
  if (!session || (session.role !== 'SUPER_ADMIN' && session.organizationId !== orgId)) {
    return { error: 'Unauthorized.' };
  }

  try {
    // Delete all child relations
    await db.candidate.deleteMany({ where: { eventId } });
    await db.offlineBoothSetting.deleteMany({ where: { eventId } });
    await db.vote.deleteMany({ where: { eventId } });
    await db.eventVoterParticipation.deleteMany({ where: { eventId } });
    
    // Delete event
    await db.event.delete({
      where: { id: eventId },
    });

    revalidatePath(`/org/${slug}/events`);
    revalidatePath(`/org/${slug}/dashboard`);
    revalidatePath(`/org/${slug}/active-election`);
    revalidatePath(`/org/${slug}/livecount`);
    return { success: true };
  } catch (error) {
    console.error('Delete event error:', error);
    return { error: 'Failed to delete event.' };
  }
}

export async function updateCandidatePhotoAction(candidateId: string, photoUrl: string, slug: string) {
  const session = await getAdminSession();
  if (!session) return { error: 'Unauthorized.' };

  try {
    await db.candidate.update({
      where: { id: candidateId },
      data: { photoUrl },
    });

    revalidatePath(`/org/${slug}/active-election`);
    revalidatePath(`/org/${slug}/events`);
    revalidatePath(`/org/${slug}/livecount`);
    return { success: true };
  } catch (error: any) {
    return { error: error?.message || 'Failed to update candidate photo.' };
  }
}

export async function startEventAction(eventId: string, orgId: string, slug: string) {
  const session = await getAdminSession();
  if (!session || (session.role !== 'SUPER_ADMIN' && session.organizationId !== orgId)) {
    return { error: 'Unauthorized.' };
  }

  try {
    // Archive other published events
    await db.event.updateMany({
      where: { organizationId: orgId, status: 'PUBLISHED' },
      data: { status: 'ARCHIVED' },
    });

    // Start this event
    await db.event.update({
      where: { id: eventId },
      data: {
        status: 'PUBLISHED',
        startDate: new Date(),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    try {
      await db.auditLog.create({
        data: {
          organizationId: orgId,
          userId: session.userId,
          action: 'EVENT_START',
          details: `Panitia memulai pemungutan suara serentak untuk pemilihan ID ${eventId}`,
        },
      });
    } catch (auditErr) {
      console.warn('Audit log failed:', auditErr);
    }

    revalidatePath(`/org/${slug}/events`);
    revalidatePath(`/org/${slug}/dashboard`);
    revalidatePath(`/org/${slug}/active-election`);
    revalidatePath(`/org/${slug}/livecount`);
    revalidatePath(`/org/${slug}/booth/${eventId}`);
    revalidatePath(`/org/${slug}/vote/${eventId}`);
    return { success: true };
  } catch (error: any) {
    return { error: error?.message || 'Failed to start election.' };
  }
}

export async function closeEventAction(eventId: string, orgId: string, slug: string) {
  const session = await getAdminSession();
  if (!session || (session.role !== 'SUPER_ADMIN' && session.organizationId !== orgId)) {
    return { error: 'Unauthorized.' };
  }

  try {
    await db.event.update({
      where: { id: eventId },
      data: {
        status: 'CLOSED',
        endDate: new Date(),
      },
    });

    try {
      await db.auditLog.create({
        data: {
          organizationId: orgId,
          userId: session.userId,
          action: 'EVENT_CLOSE',
          details: `Panitia resmi menutup pemungutan suara untuk pemilihan ID ${eventId}`,
        },
      });
    } catch (auditErr) {
      console.warn('Audit log failed:', auditErr);
    }

    revalidatePath(`/org/${slug}/events`);
    revalidatePath(`/org/${slug}/dashboard`);
    revalidatePath(`/org/${slug}/active-election`);
    revalidatePath(`/org/${slug}/livecount`);
    revalidatePath(`/org/${slug}/booth/${eventId}`);
    revalidatePath(`/org/${slug}/vote/${eventId}`);
    return { success: true };
  } catch (error: any) {
    return { error: error?.message || 'Failed to close election.' };
  }
}
