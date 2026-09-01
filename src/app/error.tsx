'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled app error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-card border-2 border-border-main rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-danger/10 text-danger flex items-center justify-center mx-auto shadow-md">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-display font-black text-text-main">Terjadi Kendala Teknis</h3>
          <p className="text-xs text-text-muted leading-relaxed">
            Halaman mengalami kendala saat memproses permintaan Anda. Silakan coba muat ulang halaman.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Button onClick={() => reset()} className="button-gradient text-xs font-bold gap-2 rounded-xl h-10 px-5">
            <RotateCcw className="w-4 h-4" />
            <span>Coba Lagi</span>
          </Button>

          <Link href="/">
            <Button variant="outline" className="text-xs font-bold gap-2 rounded-xl h-10 px-4 border-border-main">
              <Home className="w-4 h-4" />
              <span>Beranda</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
