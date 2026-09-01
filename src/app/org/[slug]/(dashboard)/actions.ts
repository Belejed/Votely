'use server';

import { clearAdminSession } from '@/lib/session';
import { redirect } from 'next/navigation';

export async function adminLogoutAction() {
  await clearAdminSession();
  redirect('/login');
}
