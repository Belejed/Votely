'use server';

import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';

async function verifyAdminTenant(slug: string, allowedRoles: string[] = ['SUPER_ADMIN', 'ADMIN']) {
  const session = await getAdminSession();
  if (!session) {
    return { error: 'Sesi login telah berakhir. Silakan login kembali.' };
  }

  const org = await db.organization.findUnique({ where: { slug } });
  if (!org) {
    return { error: 'Organisasi tidak ditemukan.' };
  }

  // Look up user in DB to prevent cookie desynchronization
  const user = await db.user.findUnique({
    where: { id: session.userId },
    include: { organization: true }
  });

  if (!user) {
    return { error: 'Akun pengguna tidak ditemukan. Silakan login kembali.' };
  }

  const isSuperAdmin = session.role === 'SUPER_ADMIN' || user.role === 'SUPER_ADMIN';
  const effectiveRole = user.role;

  if (!isSuperAdmin) {
    const belongsToOrg = user.organizationId === org.id || user.organization?.slug === slug;
    if (!belongsToOrg) {
      return { error: 'Unauthorized: Akun Anda tidak memiliki akses ke instansi ini.' };
    }
  }

  if (allowedRoles.length > 0 && !isSuperAdmin && !allowedRoles.includes(effectiveRole)) {
    return { error: `Unauthorized: Wewenang ini khusus untuk role ${allowedRoles.join('/')}.` };
  }

  return { session, org, user };
}

export async function createEventAction(slug: string, wizardData: any) {
  const auth = await verifyAdminTenant(slug, ['SUPER_ADMIN', 'ADMIN']);
  if (auth.error || !auth.org || !auth.session) return { error: auth.error };
  const { org, session } = auth;

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
      enableBoothMode,
      enableKioskMode,
      fullscreen,
      autoLogout,
      autoReturn,
      idleTimeout,
      sessionTimeout,
      cameraScan,
    } = wizardData;

    try {
      await db.event.updateMany({
        where: { organizationId: org.id, status: 'PUBLISHED' },
        data: { status: 'ARCHIVED' },
      });
    } catch (archErr) {
      console.warn('Could not archive previous events:', archErr);
    }

    const event = await db.event.create({
      data: {
        organizationId: org.id,
        name,
        description: description || '',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        votingMode,
        authMethod,
        allowLiveResult: allowLiveResult ?? true,
        hideRunningResult: hideRunningResult ?? false,
        voteConfirmation: voteConfirmation ?? true,
        anonymousVote: anonymousVote ?? true,
        multipleCandidate: multipleCandidate ?? false,
        maxVotes: parseInt(maxVotes) || 1,
        autoClose: autoClose ?? false,
        status: wizardData.status || 'PUBLISHED',
      },
    });

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

export async function archiveEventAction(eventId: string, slug: string) {
  const auth = await verifyAdminTenant(slug, ['SUPER_ADMIN', 'ADMIN']);
  if (auth.error || !auth.org) return { error: auth.error };
  const { org } = auth;

  try {
    const event = await db.event.findUnique({ where: { id: eventId } });
    if (!event || event.organizationId !== org.id) {
      return { error: 'Unauthorized: Pemilihan tidak ditemukan.' };
    }
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

export async function deleteEventAction(eventId: string, slug: string) {
  const auth = await verifyAdminTenant(slug, ['SUPER_ADMIN', 'ADMIN']);
  if (auth.error || !auth.org) return { error: auth.error };
  const { org } = auth;

  try {
    const event = await db.event.findUnique({ where: { id: eventId } });
    if (!event || event.organizationId !== org.id) {
      return { error: 'Unauthorized: Pemilihan tidak ditemukan.' };
    }

    await db.candidate.deleteMany({ where: { eventId } });
    await db.offlineBoothSetting.deleteMany({ where: { eventId } });
    await db.vote.deleteMany({ where: { eventId } });
    await db.eventVoterParticipation.deleteMany({ where: { eventId } });
    
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
  const auth = await verifyAdminTenant(slug, ['SUPER_ADMIN', 'ADMIN']);
  if (auth.error || !auth.org) return { error: auth.error };
  const { org } = auth;

  try {
    const candidate = await db.candidate.findUnique({
      where: { id: candidateId },
      include: { event: true }
    });

    if (!candidate || !candidate.event || candidate.event.organizationId !== org.id) {
      return { error: 'Unauthorized: Kandidat tidak ditemukan pada instansi ini.' };
    }

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

export async function startEventAction(eventId: string, slug: string) {
  const auth = await verifyAdminTenant(slug, ['SUPER_ADMIN', 'ADMIN']);
  if (auth.error || !auth.org || !auth.session) return { error: auth.error };
  const { org, session } = auth;

  try {
    const event = await db.event.findUnique({ where: { id: eventId } });
    if (!event || event.organizationId !== org.id) {
      return { error: 'Unauthorized: Pemilihan tidak ditemukan.' };
    }

    await db.event.updateMany({
      where: { organizationId: org.id, status: 'PUBLISHED' },
      data: { status: 'ARCHIVED' },
    });

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
          organizationId: org.id,
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

export async function closeEventAction(eventId: string, slug: string) {
  const auth = await verifyAdminTenant(slug, ['SUPER_ADMIN', 'ADMIN']);
  if (auth.error || !auth.org || !auth.session) return { error: auth.error };
  const { org, session } = auth;

  try {
    const event = await db.event.findUnique({ where: { id: eventId } });
    if (!event || event.organizationId !== org.id) {
      return { error: 'Unauthorized: Pemilihan tidak ditemukan.' };
    }

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
          organizationId: org.id,
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

export async function updateCandidateDetailsAction(
  candidateId: string,
  slug: string,
  data: { name: string; vision: string; mission: string; photoUrl?: string | null }
) {
  const auth = await verifyAdminTenant(slug, ['SUPER_ADMIN', 'ADMIN']);
  if (auth.error || !auth.org || !auth.session) return { error: auth.error };
  const { org, session } = auth;

  try {
    const candidate = await db.candidate.findUnique({
      where: { id: candidateId },
      include: { event: true }
    });

    if (!candidate || !candidate.event || candidate.event.organizationId !== org.id) {
      return { error: 'Unauthorized: Kandidat tidak ditemukan pada instansi ini.' };
    }

    await db.candidate.update({
      where: { id: candidateId },
      data: {
        name: data.name,
        vision: data.vision,
        mission: data.mission,
        photoUrl: data.photoUrl !== undefined ? data.photoUrl : candidate.photoUrl,
      }
    });

    try {
      await db.auditLog.create({
        data: {
          organizationId: org.id,
          userId: session.userId,
          action: 'CANDIDATE_UPDATE',
          details: `Memperbarui profil calon nomor urut #${candidate.number} (${data.name})`,
        }
      });
    } catch (err) {
      console.warn('Audit log error:', err);
    }

    revalidatePath(`/org/${slug}/active-election`);
    revalidatePath(`/org/${slug}/events`);
    revalidatePath(`/org/${slug}/livecount`);

    return { success: true };
  } catch (error: any) {
    return { error: error?.message || 'Failed to update candidate details.' };
  }
}
