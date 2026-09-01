'use server';

import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';

export async function saveThemeAction(
  slug: string,
  primaryColor: string,
  secondaryColor: string,
  name: string
) {
  const session = await getAdminSession();
  if (!session) {
    return { error: 'Unauthorized.' };
  }

  // Fetch organization
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
    await db.organization.update({
      where: { id: org.id },
      data: {
        name,
        primaryColor,
        secondaryColor,
      }
    });

    // Log the change
    await db.auditLog.create({
      data: {
        organizationId: org.id,
        userId: session.userId,
        action: 'THEME_UPDATE',
        details: `Updated workspace branding. Primary: ${primaryColor}, Secondary: ${secondaryColor}`,
      }
    });

    revalidatePath(`/org/${slug}/dashboard`);
    revalidatePath(`/org/${slug}/theme`);

    return { success: true };
  } catch (error) {
    console.error('Update branding error:', error);
    return { error: 'Failed to save branding preferences.' };
  }
}
