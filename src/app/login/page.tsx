'use client';

import React, { useState, startTransition, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Vote, ArrowLeft, ShieldAlert, UserCog, User } from 'lucide-react';
import { loginAction } from './actions';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialOrg = searchParams.get('org') || '';

  const [orgSlug, setOrgSlug] = useState(initialOrg);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleAdminSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsPending(true);

    const formData = new FormData();
    formData.append('orgSlug', orgSlug);
    formData.append('username', username);
    formData.append('password', password);
    
    startTransition(async () => {
      const res = await loginAction(null, formData);
      setIsPending(false);
      
      if (res?.error) {
        setErrorMsg(res.error);
      } else if (res?.success) {
        if (res.role === 'SUPER_ADMIN') {
          router.push('/superadmin');
        } else if (res.role === 'OBSERVER' && res.slug) {
          router.push(`/org/${res.slug}/livecount`);
        } else if (res.slug) {
          router.push(`/org/${res.slug}/dashboard`);
        }
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative select-none" suppressHydrationWarning>
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-text-muted hover:text-brand-primary transition-colors">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-brand-primary to-brand-secondary flex items-center justify-center text-white font-bold shadow-md shadow-brand-primary/20">
              <Vote className="w-5.5 h-5.5" />
            </div>
            <div>
              <span className="font-display font-extrabold text-2xl tracking-tight text-text-main block leading-none">
                Votely
              </span>
              <span className="text-[10px] text-text-muted font-bold block mt-0.5">by arya</span>
            </div>
          </div>
        </div>

        <Card className="border-brand-primary/10 shadow-2xl purple-glow bg-card/90 backdrop-blur-md rounded-3xl">
          <CardHeader className="text-center pb-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mx-auto mb-3">
              <UserCog className="w-6 h-6" />
            </div>
            <CardTitle className="text-2xl font-black">Login Panitia & Staff</CardTitle>
            <CardDescription>
              Masukkan kode instansi, username, dan password panitia Anda
            </CardDescription>
          </CardHeader>

          <CardContent>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-4 p-3.5 bg-danger/10 border border-danger/20 text-danger rounded-xl text-xs font-semibold flex items-center gap-2.5"
              >
                <ShieldAlert className="w-4.5 h-4.5 shrink-0" />
                <span>{errorMsg}</span>
              </motion.div>
            )}

            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <Input
                  id="orgSlug"
                  name="orgSlug"
                  label="Kode Instansi / Workspace"
                  placeholder="e.g. kposman71"
                  value={orgSlug}
                  onChange={(e) => setOrgSlug(e.target.value)}
                  required
                />
              </div>

              <div>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  label="Username Panitia / Petugas"
                  placeholder="e.g. admin / bilik1"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  label="Password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full h-11 button-gradient mt-2 font-bold shadow-md shadow-brand-primary/15" disabled={isPending}>
                {isPending ? 'Mengautentikasi...' : 'Masuk Control Panel'}
              </Button>
            </form>

            <div className="mt-8 border-t border-border-main pt-6 text-center space-y-3">
              <p className="text-xs text-text-muted">
                Belum punya workspace?{' '}
                <Link href="/signup" className="text-brand-primary font-bold hover:underline">
                  Daftarkan Organisasi Baru
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <LoginFormContent />
    </Suspense>
  );
}
