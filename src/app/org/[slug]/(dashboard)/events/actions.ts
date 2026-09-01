'use server';

import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';

export async function createEventAction(slug: string, wizardData: any) {
  const session = await getAdminSession();
  if (!session) {
    return { error: 'Unauthorized session.' };
  }

  // Resolve organization ID by slug
  const org = await db.organization.findUnique({
    where: { slug },
  });

  if (!org) {
    return { error: 'Organization not found.' };
  }

  // Verify boundary
  if (session.role !== 'SUPER_ADMIN' && session.organizationId !== org.id) {
    return { error: 'Tenant boundary violation.' };
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

    // Use transaction to write Event, Candidates, and Booth settings
    const newEvent = await db.$transaction(async (tx: any) => {
      // 1. Create Event
      const event = await tx.event.create({
        data: {
          organizationId: org.id,
          name,
          description: description || '',
          startDate: new Date(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days
          votingMode,
          authMethod,
          allowLiveResult,
          hideRunningResult,
          voteConfirmation,
          anonymousVote,
          multipleCandidate,
          maxVotes: parseInt(maxVotes) || 1,
          autoClose,
          status: 'PUBLISHED', // Auto-publish for instant testing
        },
      });

      // 2. Create Candidates
      if (candidates && candidates.length > 0) {
        await tx.candidate.createMany({
          data: candidates.map((c: any, index: number) => ({
            eventId: event.id,
            number: index + 1,
            name: c.name,
            vision: c.vision || '',
            mission: c.mission || '',
            socialMedia: c.socialMedia || {},
          })),
        });
      }

      // 3. Create Booth Settings if applicable
      if (votingMode === 'OFFLINE' || votingMode === 'HYBRID') {
        await tx.offlineBoothSetting.create({
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
      await tx.auditLog.create({
        data: {
          organizationId: org.id,
          userId: session.userId,
          action: 'EVENT_CREATE',
          details: `Created new election: ${name} (${votingMode})`,
        },
      });

      return event;
    });

    revalidatePath(`/org/${slug}/dashboard`);
    revalidatePath(`/org/${slug}/events`);
    revalidatePath(`/org/${slug}/livecount`);

    return { success: true, eventId: newEvent.id };
  } catch (error) {
    console.error('Create event error:', error);
    return { error: 'Failed to create election. Please try again.' };
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
    revalidatePath(`/org/${slug}/livecount`);
    return { success: true };
  } catch (error) {
    console.error('Delete event error:', error);
    return { error: 'Failed to delete event.' };
  }
}
