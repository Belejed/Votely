'use server';

import { db } from '@/lib/db';
import { hashPassword } from '@/lib/crypto';
import { setAdminSession } from '@/lib/session';

export async function signupAction(prevState: any, formData: FormData) {
  const orgName = (formData.get('orgName') as string || '').trim();
  const slug = (formData.get('slug') as string || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
  const adminName = (formData.get('adminName') as string || '').trim();
  const username = (formData.get('username') as string || '').trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!orgName || !slug || !adminName || !username || !password) {
    return { error: 'Harap lengkapi semua data pendaftaran.' };
  }

  if (slug.length < 3) {
    return { error: 'Kode instansi / slug URL minimal 3 karakter.' };
  }

  if (password.length < 6) {
    return { error: 'Password minimal 6 karakter.' };
  }

  if (password !== confirmPassword) {
    return { error: 'Konfirmasi password tidak cocok.' };
  }

  try {
    // 1. Check if slug is already taken
    const existingOrg = await db.organization.findUnique({
      where: { slug }
    });

    if (existingOrg) {
      return { error: `Kode instansi "${slug}" sudah digunakan. Silakan pilih kode yang lain.` };
    }

    // 2. Hash password
    const passwordHash = await hashPassword(password);

    // 3. Create Organization
    const newOrg = await db.organization.create({
      data: {
        name: orgName,
        slug: slug,
        primaryColor: '#7C3AED',
        secondaryColor: '#A78BFA',
        plan: 'FREE',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // 4. Create Admin User
    const newUser = await db.user.create({
      data: {
        name: adminName,
        email: `${username}@${slug}.local`,
        passwordHash: passwordHash,
        role: 'ADMIN',
        organizationId: newOrg.id,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // 5. Automatically create an audit log
    await db.auditLog.create({
      data: {
        organizationId: newOrg.id,
        userId: newUser.id,
        action: 'ORGANIZATION_CREATED',
        details: `Workspace "${orgName}" didaftarkan oleh ${adminName} (Username: ${username})`,
        createdAt: new Date()
      }
    });

    // 6. Establish admin session
    await setAdminSession({
      userId: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: 'ADMIN',
      organizationId: newOrg.id,
      organizationSlug: newOrg.slug
    });

    return {
      success: true,
      slug: newOrg.slug
    };
  } catch (error) {
    console.error('Signup error:', error);
    return { error: 'Gagal membuat workspace organisasi. Silakan coba lagi.' };
  }
}
