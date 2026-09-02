'use server';

import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/session';

export async function getLiveResultsAction(slug: string, eventId: string) {
  const session = await getAdminSession();
  if (!session) return { error: 'Unauthorized.' };

  try {
    const org = await db.organization.findUnique({ where: { slug } });
    if (!org) return { error: 'Organization not found.' };

    if (session.role !== 'SUPER_ADMIN' && session.organizationSlug !== slug && session.organizationId !== org.id) {
      return { error: 'Unauthorized: tenant boundary violation.' };
    }

    const event = await db.event.findUnique({
      where: { id: eventId },
      include: {
        candidates: true   // db.ts adapter otomatis batch-fetch vote counts per kandidat
      }
    });

    if (!event || event.organizationId !== org.id) {
      return { error: 'Event not found.' };
    }

    const totalVoters = await db.voter.count({
      where: { organizationId: org.id }
    });

    // Count unique voters who have cast at least one vote (participation-based)
    const totalParticipants = await db.eventVoterParticipation.count({
      where: { eventId }
    });

    // Total raw vote records (OSIS + MPK combined)
    const totalVotes = await db.vote.count({
      where: { eventId }
    });

    const results = (event.candidates || []).map((c: any) => {
      return {
        id: c.id,
        number: c.number,
        name: c.name,
        category: c.category || 'OSIS',
        photoUrl: c.photoUrl || null,
        vision: c.vision || '',
        mission: c.mission || '',
        socialMedia: c.socialMedia || {},
        votesCount: c._count?.votes ?? 0,
      };
    });

    return {
      success: true,
      totalVoters,
      totalVotes: totalParticipants,  // unique voters who participated
      totalRawVotes: totalVotes,       // total vote records (OSIS + MPK)
      results,
    };
  } catch (error) {
    console.error('Live results fetch error:', error);
    return { error: 'Failed to fetch live results.' };
  }
}
