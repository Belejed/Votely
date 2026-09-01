'use server';

import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';

export async function saveThemeAction(
  slug: string,
  primaryColor: string,
  secondaryColor: string,
  name: string,
  posterUrl?: string | null,
  posterEnabled?: boolean,
  posterTitle?: string,
  posterCaption?: string
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
        posterUrl: posterUrl ?? null,
        posterEnabled: posterEnabled ?? false,
        posterTitle: posterTitle ?? 'Panduan & Tata Cara Pemilihan',
        posterCaption: posterCaption ?? 'Silakan cermati informasi dan tata cara pemilihan sebelum melanjutkan pengisian surat suara.',
      }
    });

    // Log the change
    try {
      await db.auditLog.create({
        data: {
          organizationId: org.id,
          userId: session.userId,
          action: 'THEME_UPDATE',
          details: `Memperbarui tema & poster splash screen workspace. Poster Enabled: ${posterEnabled ? 'Ya' : 'Tidak'}`,
        }
      });
    } catch (auditErr) {
      console.warn('Audit log failed:', auditErr);
    }

    revalidatePath(`/org/${slug}/dashboard`);
    revalidatePath(`/org/${slug}/theme`);
    revalidatePath(`/org/${slug}/active-election`);

    return { success: true };
  } catch (error: any) {
    console.error('Update branding error:', error);
    return { error: error?.message || 'Gagal menyimpan pengaturan tema dan poster.' };
  }
}
