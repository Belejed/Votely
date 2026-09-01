'use server';

import { db } from '@/lib/db';
import { verifyPassword } from '@/lib/crypto';
import { setAdminSession, clearAdminSession } from '@/lib/session';

export async function loginAction(prevState: any, formData: FormData) {
  const orgSlug = (formData.get('orgSlug') as string || '').trim().toLowerCase();
  const username = (formData.get('username') as string || '').trim().toLowerCase();
  const password = (formData.get('password') as string || '').trim();

  if (!orgSlug || !username || !password) {
    return { error: 'Harap isi Kode Instansi, Username, dan Password.' };
  }

  try {
    // 1. Find Organization
    const allOrgs = await db.organization.findMany();
    const org = allOrgs.find((o) => o.slug && o.slug.toLowerCase().trim() === orgSlug);

    if (!org) {
      return { error: `Kode instansi "${orgSlug}" tidak ditemukan. Silakan periksa kembali.` };
    }

    // 2. Find User in this organization by username, name, or email prefix
    const usersInOrg = await db.user.findMany({
      where: { organizationId: org.id }
    });

    const user = usersInOrg.find((u) => {
      const uName = (u.name || '').toLowerCase().trim();
      const uEmail = (u.email || '').toLowerCase().trim();
      const uEmailPrefix = uEmail.split('@')[0];
      return uEmail === username || uEmailPrefix === username || uName === username;
    });

    if (!user) {
      return { error: `Username "${username}" tidak terdaftar pada instansi ${org.name}.` };
    }

    // 3. Verify Password
    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return { error: 'Password yang Anda masukkan salah.' };
    }

    // 4. Create Session
    const sessionData = {
      userId: user.id,
      name: user.name,
      email: user.email || `${username}@${org.slug}.local`,
      role: user.role,
      organizationId: org.id,
      organizationSlug: org.slug,
    };

    await setAdminSession(sessionData);

    return {
      success: true,
      role: user.role,
      slug: org.slug,
    };
  } catch (error: any) {
    console.error('Login action error:', error);
    return { error: error?.message || 'Terjadi kesalahan koneksi database. Silakan coba lagi.' };
  }
}

export async function logoutAction() {
  await clearAdminSession();
}
