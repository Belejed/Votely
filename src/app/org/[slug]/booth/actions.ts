'use server';

import { db } from '@/lib/db';
import { setVoterSession, getVoterSession, clearVoterSession } from '@/lib/session';
import { headers } from 'next/headers';
import { checkRateLimit } from '@/lib/rate-limit';

export async function authenticateVoterAction(
  slug: string,
  eventId: string,
  credentials: { qrToken?: string; studentId?: string; votingPass?: string }
) {
  try {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || '127.0.0.1';
    const rl = checkRateLimit(`voter_auth:${ip}`, 15, 60);
    if (!rl.success) {
      return { error: `Terlalu banyak percobaan login pemilih. Harap tunggu ${rl.resetSeconds} detik.` };
    }
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

    // Check dates — reject if outside voting window
    let now = new Date();
    if (now < new Date(event.startDate) || now > new Date(event.endDate)) {
      return { error: 'Pemilihan belum dibuka atau sudah ditutup. Hubungi panitia.' };
    }

    // 3. Find Voter with Flexible Multi-Identifier Authentication
    let voter: any = null;

    const orgVoters = await db.voter.findMany({
      where: { organizationId: org.id }
    });

    if (credentials.qrToken) {
      const cleanToken = credentials.qrToken.trim().toUpperCase();
      voter = orgVoters.find((v: any) => 
        (v.qrToken && v.qrToken.trim().toUpperCase() === cleanToken) ||
        (v.votingPass && v.votingPass.trim() === cleanToken) ||
        (v.invitationNum && v.invitationNum.trim().toUpperCase() === cleanToken)
      );
      if (!voter) {
        return { error: 'Token Kartu QR / PIN Pemilih tidak valid.' };
      }
    } else if (credentials.votingPass) {
      const sPass = credentials.votingPass.trim();
      const sId = (credentials.studentId || '').trim().toLowerCase();

      if (sId) {
        // Try matching by Student ID / NIS or Name or Invitation Number
        voter = orgVoters.find((v: any) => {
          const vId = (v.studentId || '').trim().toLowerCase();
          const vName = (v.name || '').trim().toLowerCase();
          const vInv = (v.invitationNum || '').trim().toLowerCase();
          const passMatch = v.votingPass && v.votingPass.trim() === sPass;
          return passMatch && (vId === sId || vName === sId || vInv === sId);
        });
      }

      // If not matched or no studentId supplied, check PIN uniquely
      if (!voter) {
        const pinMatches = orgVoters.filter((v: any) => v.votingPass && v.votingPass.trim() === sPass);
        if (pinMatches.length === 1) {
          voter = pinMatches[0];
        } else if (pinMatches.length > 1 && sId) {
          voter = pinMatches.find((v: any) => (v.studentId || '').toLowerCase() === sId || (v.name || '').toLowerCase() === sId);
        }
      }

      if (!voter) {
        return { error: 'Kombinasi NIS / Nama dan PIN Pemilih (6-digit) tidak ditemukan.' };
      }
    } else {
      return { error: 'Harap masukkan PIN atau scan QR Pemilih.' };
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
    // 0. SECURITY: Verify voter session cookie — reject unauthenticated requests
    const voterSession = await getVoterSession();
    if (!voterSession) {
      return { error: 'Sesi pemilih tidak valid atau sudah berakhir. Silakan login ulang.' };
    }
    if (voterSession.voterId !== voterId || voterSession.eventId !== eventId) {
      return { error: 'Sesi pemilih tidak cocok. Silakan login ulang.' };
    }

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
