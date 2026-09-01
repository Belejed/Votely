import React from 'react';
import Link from 'next/link';
import { Vote, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RootNotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-card border-2 border-border-main rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mx-auto shadow-md">
          <Vote className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-4xl font-display font-black text-brand-primary tracking-tight">404</span>
          <h3 className="text-xl font-display font-black text-text-main">Halaman Tidak Ditemukan</h3>
          <p className="text-xs text-text-muted leading-relaxed">
            Alamat atau halaman pemilihan yang Anda tuju tidak ditemukan atau telah dipindahkan.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Link href="/">
            <Button className="button-gradient text-xs font-bold gap-2 rounded-xl h-10 px-5">
              <Home className="w-4 h-4" />
              <span>Kembali ke Beranda</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
