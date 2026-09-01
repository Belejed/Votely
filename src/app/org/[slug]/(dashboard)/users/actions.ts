'use server';

import { db } from '@/lib/db';
import { hashPassword } from '@/lib/crypto';
import { getAdminSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';

export async function createStaffUserAction(
  slug: string,
  data: {
    name: string;
    username: string;
    password: string;
    role: 'ADMIN' | 'STAFF' | 'OBSERVER';
  }
) {
  const session = await getAdminSession();
  if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'ADMIN')) {
    return { error: 'Unauthorized. Hanya admin yang dapat membuat akun panitia.' };
  }

  const { name, username, password, role } = data;
  const cleanUsername = (username || '').trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');

  if (!name.trim() || !cleanUsername || !password.trim()) {
    return { error: 'Harap lengkapi semua kolom yang wajib diisi.' };
  }

  if (password.length < 6) {
    return { error: 'Password minimal 6 karakter.' };
  }

  try {
    const org = await db.organization.findUnique({
      where: { slug }
    });

    if (!org) {
      return { error: 'Organisasi tidak ditemukan.' };
    }

    if (session.role !== 'SUPER_ADMIN' && session.organizationId !== org.id) {
      return { error: 'Unauthorized: tenant boundary violation.' };
    }

    // Check if username is already taken in this organization
    const orgUsers = await db.user.findMany({
      where: { organizationId: org.id }
    });

    const isDuplicate = orgUsers.some((u: any) => 
      u.username && u.username.toLowerCase() === cleanUsername
    );

    if (isDuplicate) {
      return { error: `Username "${cleanUsername}" sudah digunakan oleh panitia lain di instansi ini.` };
    }

    const passwordHash = await hashPassword(password);

    const newUser = await db.user.create({
      data: {
        name: name.trim(),
        email: `${cleanUsername}@${slug}.local`,
        passwordHash,
        role: role || 'STAFF',
        organizationId: org.id,
      }
    });

    // Record Audit Log
    await db.auditLog.create({
      data: {
        organizationId: org.id,
        userId: session.userId,
        action: 'STAFF_CREATE',
        details: `Admin ${session.name} membuat akun panitia: ${name} (Username: ${cleanUsername}, Role: ${role})`
      }
    });

    revalidatePath(`/org/${slug}/users`);
    revalidatePath(`/org/${slug}/dashboard`);

    return {
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        username: cleanUsername,
        role: newUser.role,
        createdAt: newUser.createdAt.toISOString()
      }
    };
  } catch (error: any) {
    console.error('Create staff error:', error);
    return { error: error.message || 'Gagal membuat akun panitia.' };
  }
}

export async function deleteStaffUserAction(slug: string, userId: string) {
  const session = await getAdminSession();
  if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'ADMIN')) {
    return { error: 'Unauthorized.' };
  }

  if (session.userId === userId) {
    return { error: 'Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif login.' };
  }

  try {
    const org = await db.organization.findUnique({
      where: { slug }
    });

    if (!org) {
      return { error: 'Organisasi tidak ditemukan.' };
    }

    if (session.role !== 'SUPER_ADMIN' && session.organizationId !== org.id) {
      return { error: 'Unauthorized: tenant boundary violation.' };
    }

    const targetUser = await db.user.findUnique({
      where: { id: userId }
    });

    if (!targetUser || targetUser.organizationId !== org.id) {
      return { error: 'Akun panitia tidak ditemukan.' };
    }

    await db.user.delete({
      where: { id: userId }
    });

    // Record Audit Log
    await db.auditLog.create({
      data: {
        organizationId: org.id,
        userId: session.userId,
        action: 'STAFF_DELETE',
        details: `Admin ${session.name} menghapus akun panitia: ${targetUser.name}`
      }
    });

    revalidatePath(`/org/${slug}/users`);
    revalidatePath(`/org/${slug}/dashboard`);

    return { success: true };
  } catch (error: any) {
    console.error('Delete staff error:', error);
    return { error: 'Gagal menghapus akun panitia.' };
  }
}
