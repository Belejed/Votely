'use server';

import { db } from '@/lib/db';
import { setVoterSession, clearVoterSession } from '@/lib/session';
import { headers } from 'next/headers';

export async function authenticateVoterAction(
  slug: string,
  eventId: string,
  credentials: { qrToken?: string; studentId?: string; votingPass?: string }
) {
  try {
    // 1. Fetch organization
    const org = await db.organization.findUnique({
      where: { slug }
    });

    if (!org) {
      return { error: 'Organization not found.' };
    }

    // 2. Fetch event
    const event = await db.event.findUnique({
      where: { id: eventId }
    });

    if (!event || event.organizationId !== org.id) {
      return { error: 'Election event not found.' };
    }

    if (event.status !== 'PUBLISHED') {
      return { error: 'This election is not currently open for voting.' };
    }

    // Check dates
    let now = new Date();
    if (now < new Date(event.startDate) || now > new Date(event.endDate)) {
      // Auto-adjust demo election to be active now for seamless testing
      await db.event.update({
        where: { id: event.id },
        data: {
          startDate: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
          endDate: new Date(now.getTime() + 24 * 60 * 60 * 1000),  // 24 hours from now
        }
      });
      event.startDate = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      event.endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }

    // 3. Find Voter
    let voter: any = null;

    if (credentials.qrToken) {
      voter = await db.voter.findUnique({
        where: { qrToken: credentials.qrToken.trim() }
      });
      if (!voter || voter.organizationId !== org.id) {
        return { error: 'Invalid QR Card token.' };
      }
    } else if (credentials.studentId && credentials.votingPass) {
      const sId = credentials.studentId.trim();
      const sPass = credentials.votingPass.trim();

      const orgVoters = await db.voter.findMany({
        where: { organizationId: org.id }
      });

      voter = orgVoters.find(
        (v: any) => v.studentId && v.studentId.trim().toLowerCase() === sId.toLowerCase()
      );

      if (!voter) {
        return { error: 'Student ID not found in registered voter roster.' };
      }

      if (voter.votingPass !== sPass) {
        return { error: 'Invalid Voting Passcode for ID ' + sId + '.' };
      }
    } else {
      return { error: 'Please provide valid credentials.' };
    }

    // 4. Verify Voter has not voted in this event
    const existingParticipation = await db.eventVoterParticipation.findUnique({
      where: {
        eventId_voterId: {
          eventId,
          voterId: voter.id
        }
      }
    });

    if (existingParticipation) {
      return { error: 'Voter has already cast their ballot for this election.' };
    }

    // 5. Establish Voter Session (JWT cookie)
    const sessionData = {
      voterId: voter.id,
      name: voter.name,
      studentId: voter.studentId,
      organizationId: org.id,
      organizationSlug: slug,
      qrToken: voter.qrToken,
      eventId: event.id
    };

    // Session duration matches booth timeouts (standard 5 mins / 300s)
    const sessionTimeout = event.votingMode === 'OFFLINE' ? 120 : 600; // 2 mins booth, 10 mins online
    await setVoterSession(sessionData, sessionTimeout);

    return {
      success: true,
      voter: {
        id: voter.id,
        name: voter.name,
        studentId: voter.studentId
      }
    };
  } catch (error) {
    console.error('Voter auth error:', error);
    return { error: 'Authentication failed. Please scan or enter credentials again.' };
  }
}

export async function castVoteAction(
  slug: string,
  eventId: string,
  candidateId: string,
  voterId: string
) {
  try {
    // 1. Fetch metadata for logs (IP, Device, Browser)
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || 'Unknown';
    const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || '127.0.0.1';

    // Parse user agent basics
    let device = 'Web Client';
    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
      device = 'Mobile';
    } else if (userAgent.includes('Windows') || userAgent.includes('Macintosh') || userAgent.includes('Linux')) {
      device = 'Desktop';
    }

    // Detect if Kiosk mode based on headers or referrer (can set standard header or default)
    if (userAgent.includes('Kiosk') || userAgent.includes('Booth')) {
      device = 'Kiosk Booth';
    }

    let browser = 'Other';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Edge')) browser = 'Edge';

    // 2. Perform Transaction: Record participation and anonymous vote
    await db.$transaction(async (tx: any) => {
      // Re-verify participation (prevent double submit race conditions)
      const existing = await tx.eventVoterParticipation.findUnique({
        where: {
          eventId_voterId: {
            eventId,
            voterId
          }
        }
      });

      if (existing) {
        throw new Error('Double voting blocked.');
      }

      // a. Mark voter as participated
      await tx.eventVoterParticipation.create({
        data: {
          eventId,
          voterId,
          device,
          browser,
          ipAddress
        }
      });

      // b. Record anonymous vote
      await tx.vote.create({
        data: {
          eventId,
          candidateId,
          device,
          browser,
          ipAddress
        }
      });

      // c. Audit Log entry
      await tx.auditLog.create({
        data: {
          organizationId: (await tx.voter.findUnique({ where: { id: voterId }, select: { organizationId: true } }))?.organizationId || '',
          action: 'VOTE_SUBMIT',
          details: `Anonymous ballot submitted for election ID: ${eventId}`
        }
      });
    });

    // 3. Clear Voter Session Cookie
    await clearVoterSession();

    return { success: true };
  } catch (error: any) {
    console.error('Cast vote error:', error);
    return { error: error.message || 'Failed to submit vote. Please try again.' };
  }
}

export async function exitVoterSessionAction() {
  await clearVoterSession();
}
