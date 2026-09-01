'use client';

import React, { useState, startTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Vote, ArrowLeft, ShieldAlert, Building2, User, Sparkles } from 'lucide-react';
import { signupAction } from './actions';

export default function SignupPage() {
  const router = useRouter();
  const [orgName, setOrgName] = useState('');
  const [slug, setSlug] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  // Auto-slugify organization name
  const handleOrgNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setOrgName(val);
    const autoSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
    setSlug(autoSlug);
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSlug(val);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsPending(true);

    const formData = new FormData(e.currentTarget);
    formData.set('slug', slug);

    startTransition(async () => {
      const res = await signupAction(null, formData);
      setIsPending(false);

      if (res?.error) {
        setErrorMsg(res.error);
      } else if (res?.success && res.slug) {
        router.push(`/org/${res.slug}/dashboard`);
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 relative select-none" suppressHydrationWarning>
      <Link href="/" className="static sm:absolute sm:top-8 sm:left-8 mb-6 sm:mb-0 self-start flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-text-muted hover:text-brand-primary transition-colors">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg my-8"
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
              <span className="text-[10px] text-text-muted font-bold block mt-0.5">by Belejed</span>
            </div>
          </div>
        </div>

        <Card className="border-brand-primary/10 shadow-2xl purple-glow bg-card/90 backdrop-blur-md rounded-3xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-black">Daftarkan Workspace Organisasi</CardTitle>
            <CardDescription>
              Buat sistem e-voting mandiri untuk sekolah atau instansi Anda
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

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Organization Info Section */}
              <div className="space-y-3.5 pb-3 border-b border-border-main/60">
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-primary flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" /> Data Instansi / Sekolah
                </span>

                <div>
                  <Input
                    id="orgName"
                    name="orgName"
                    label="Nama Instansi / Sekolah"
                    placeholder="e.g. SMAN 71 Jakarta"
                    value={orgName}
                    onChange={handleOrgNameChange}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="slug" className="text-xs font-bold text-text-main block mb-1.5">
                    Kode Instansi / Workspace URL Slug
                  </label>
                  <div className="flex items-center rounded-xl border border-border-main bg-background px-3 focus-within:border-brand-primary focus-within:ring-1 focus-within:ring-brand-primary transition-all">
                    <span className="text-xs text-text-muted font-bold select-none pr-1">votely.app/org/</span>
                    <input
                      id="slug"
                      name="slug"
                      type="text"
                      placeholder="sman71"
                      value={slug}
                      onChange={handleSlugChange}
                      required
                      className="flex-1 h-10 bg-transparent text-xs text-text-main font-bold outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-text-muted mt-1 block">
                    Panitia Anda akan mengakses dashboard di <code className="text-brand-primary font-bold">/org/{slug || 'kode-instansi'}/dashboard</code>
                  </span>
                </div>
              </div>

              {/* Admin Info Section */}
              <div className="space-y-3.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-primary flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Akun Administrator Utama
                </span>

                <div>
                  <Input
                    id="adminName"
                    name="adminName"
                    label="Nama Lengkap Administrator"
                    placeholder="e.g. Arya Ghiffari"
                    required
                  />
                </div>

                <div>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    label="Username Login Administrator"
                    placeholder="e.g. admin / arya"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      label="Password"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <div>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      label="Konfirmasi Password"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 button-gradient mt-4 font-bold shadow-md shadow-brand-primary/15" 
                disabled={isPending}
              >
                {isPending ? 'Membuat Workspace...' : 'Selesaikan Pendaftaran & Luncurkan'}
              </Button>
            </form>

            <div className="mt-6 pt-5 border-t border-border-main text-center text-xs text-text-muted">
              Sudah memiliki workspace?{' '}
              <Link href="/login" className="text-brand-primary font-bold hover:underline">
                Masuk ke Portal
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
