'use server';

import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';

// Helper to generate secure random QR token
function generateQrToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = 'VTLY-';
  for (let i = 0; i < 11; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Helper to generate random 6-digit voting pass
function generateVotingPass(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper to generate unique invitation number
function generateInvitationNum(): string {
  return 'INV-' + Math.floor(10000 + Math.random() * 90000).toString();
}

export async function importVotersAction(slug: string, voterList: any[]) {
  const session = await getAdminSession();
  if (!session) {
    return { error: 'Unauthorized.' };
  }

  // Look up organization by slug
  const org = await db.organization.findUnique({
    where: { slug }
  });

  if (!org) {
    return { error: 'Organization not found.' };
  }

  // Verify boundary
  if (session.role !== 'SUPER_ADMIN' && session.organizationId !== org.id) {
    return { error: 'Tenant boundary violation.' };
  }

  try {
    let importedCount = 0;
    let skippedCount = 0;

    for (const v of voterList) {
      const studentId = v.studentId ? v.studentId.toString().trim() : null;

      // If studentId exists, make sure it is unique for this organization
      if (studentId) {
        const existing = await db.voter.findUnique({
          where: {
            organizationId_studentId: {
              organizationId: org.id,
              studentId: studentId
            }
          }
        });
        if (existing) {
          skippedCount++;
          continue;
        }
      }

      await db.voter.create({
        data: {
          organizationId: org.id,
          name: v.name ? v.name.toString().trim() : 'Anonymous Voter',
          studentId: studentId,
          class: v.class ? v.class.toString().trim() : null,
          department: v.department ? v.department.toString().trim() : null,
          phone: v.phone ? v.phone.toString().trim() : null,
          email: v.email ? v.email.toString().trim() : null,
          qrToken: generateQrToken(),
          votingPass: generateVotingPass(),
          invitationNum: generateInvitationNum(),
          customFields: v.customFields || {},
        }
      });
      importedCount++;
    }

    // Create Audit Log
    await db.auditLog.create({
      data: {
        organizationId: org.id,
        userId: session.userId,
        action: 'VOTER_IMPORT',
        details: `Imported ${importedCount} voters. Skipped ${skippedCount} duplicates.`,
      }
    });

    revalidatePath(`/org/${slug}/voters`);
    revalidatePath(`/org/${slug}/dashboard`);

    return { success: true, importedCount, skippedCount };
  } catch (error) {
    console.error('Import voters error:', error);
    return { error: 'Failed to import voters. Please check file structure and try again.' };
  }
}

export async function resetVoterStatusAction(voterId: string, slug: string) {
  const session = await getAdminSession();
  if (!session) return { error: 'Unauthorized.' };

  try {
    // 1. Delete all event participations for this voter
    await db.eventVoterParticipation.deleteMany({
      where: { voterId }
    });

    // 2. Fetch voter details
    const voter = await db.voter.findUnique({
      where: { id: voterId }
    });

    if (voter) {
      await db.auditLog.create({
        data: {
          organizationId: voter.organizationId,
          userId: session.userId,
          action: 'VOTER_RESET',
          details: `Reset voting participation status for voter: ${voter.name}`,
        }
      });
    }

    revalidatePath(`/org/${slug}/voters`);
    return { success: true };
  } catch (error) {
    console.error('Reset voter error:', error);
    return { error: 'Failed to reset voting status.' };
  }
}

export async function deleteVoterAction(voterId: string, slug: string) {
  const session = await getAdminSession();
  if (!session) return { error: 'Unauthorized.' };

  try {
    const voter = await db.voter.delete({
      where: { id: voterId }
    });

    await db.auditLog.create({
      data: {
        organizationId: voter.organizationId,
        userId: session.userId,
        action: 'VOTER_DELETE',
        details: `Deleted voter registration: ${voter.name}`,
      }
    });

    revalidatePath(`/org/${slug}/voters`);
    return { success: true };
  } catch (error) {
    return { error: 'Failed to delete voter.' };
  }
}

export async function regenerateVoterPassAction(voterId: string, slug: string) {
  const session = await getAdminSession();
  if (!session) return { error: 'Unauthorized.' };

  try {
    const voter = await db.voter.update({
      where: { id: voterId },
      data: {
        votingPass: generateVotingPass(),
        qrToken: generateQrToken(),
      }
    });

    await db.auditLog.create({
      data: {
        organizationId: voter.organizationId,
        userId: session.userId,
        action: 'VOTER_REGEN',
        details: `Regenerated credentials for voter: ${voter.name}`,
      }
    });

    revalidatePath(`/org/${slug}/voters`);
    return { success: true };
  } catch (error) {
    return { error: 'Failed to regenerate credentials.' };
  }
}
