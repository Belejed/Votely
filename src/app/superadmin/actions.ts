'use server';

import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/session';
import { hashPassword } from '@/lib/crypto';
import { revalidatePath } from 'next/cache';

export async function createOrganizationAction(name: string, slug: string, plan: 'FREE' | 'PRO') {
  const session = await getAdminSession();
  if (!session || session.role !== 'SUPER_ADMIN') {
    return { error: 'Unauthorized.' };
  }

  const cleanedSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
  if (!name.trim() || !cleanedSlug) {
    return { error: 'Invalid name or slug.' };
  }

  try {
    // Check if slug exists
    const existing = await db.organization.findUnique({
      where: { slug: cleanedSlug }
    });

    if (existing) {
      return { error: 'An organization with this subdomain slug already exists.' };
    }

    const org = await db.organization.create({
      data: {
        name,
        slug: cleanedSlug,
        plan
      }
    });

    // Create default admin user for this org
    const defaultEmail = `admin-${cleanedSlug}@votely.app`;
    const defaultPassHash = await hashPassword('AdminPass123!');
    
    await db.user.create({
      data: {
        name: `${name} Administrator`,
        email: defaultEmail,
        passwordHash: defaultPassHash,
        role: 'ADMIN',
        organizationId: org.id
      }
    });

    revalidatePath('/superadmin');
    return { success: true, email: defaultEmail };
  } catch (error) {
    console.error('Create org error:', error);
    return { error: 'Failed to create organization.' };
  }
}

export async function upgradePlanAction(orgId: string, plan: 'FREE' | 'PRO') {
  const session = await getAdminSession();
  if (!session || session.role !== 'SUPER_ADMIN') {
    return { error: 'Unauthorized. Super Admin access required.' };
  }

  try {
    await db.organization.update({
      where: { id: orgId },
      data: { plan }
    });

    revalidatePath('/superadmin');
    return { success: true };
  } catch (error) {
    return { error: 'Failed to update plan.' };
  }
}

export async function deleteOrganizationAction(orgId: string) {
  const session = await getAdminSession();
  if (!session || session.role !== 'SUPER_ADMIN') {
    return { error: 'Unauthorized.' };
  }

  try {
    await db.organization.delete({
      where: { id: orgId }
    });

    revalidatePath('/superadmin');
    return { success: true };
  } catch (error) {
    return { error: 'Failed to delete organization.' };
  }
}
