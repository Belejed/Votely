'use server';

import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';

export async function createAnnouncementAction(slug: string, title: string, content: string) {
  const session = await getAdminSession();
  if (!session) return { error: 'Unauthorized.' };

  // Fetch organization
  const org = await db.organization.findUnique({
    where: { slug }
  });

  if (!org) return { error: 'Organization not found.' };

  // Verify boundary
  if (session.role !== 'SUPER_ADMIN' && session.organizationId !== org.id) {
    return { error: 'Tenant boundary violation.' };
  }

  if (!title.trim() || !content.trim()) {
    return { error: 'Both title and content are required.' };
  }

  try {
    await db.announcement.create({
      data: {
        organizationId: org.id,
        title,
        content,
        isPublished: true,
      }
    });

    // Create Audit Log
    await db.auditLog.create({
      data: {
        organizationId: org.id,
        userId: session.userId,
        action: 'ANNOUNCE_CREATE',
        details: `Published announcement: ${title}`,
      }
    });

    revalidatePath(`/org/${slug}/announcements`);
    revalidatePath(`/org/${slug}/dashboard`);

    return { success: true };
  } catch (error) {
    console.error('Create announcement error:', error);
    return { error: 'Failed to publish announcement.' };
  }
}

export async function deleteAnnouncementAction(id: string, orgId: string, slug: string) {
  const session = await getAdminSession();
  if (!session || (session.role !== 'SUPER_ADMIN' && session.organizationId !== orgId)) {
    return { error: 'Unauthorized.' };
  }

  try {
    await db.announcement.delete({
      where: { id }
    });

    revalidatePath(`/org/${slug}/announcements`);
    return { success: true };
  } catch (error) {
    return { error: 'Failed to delete announcement.' };
  }
}
