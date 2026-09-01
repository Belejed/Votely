'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="p-12 text-center bg-card border-2 border-border-main rounded-3xl space-y-5 my-8">
      <div className="w-14 h-14 rounded-2xl bg-danger/10 text-danger flex items-center justify-center mx-auto shadow-sm">
        <AlertTriangle className="w-7 h-7" />
      </div>

      <div className="space-y-1.5 max-w-md mx-auto">
        <h4 className="text-lg font-black text-text-main">Gagal Memuat Data Halaman</h4>
        <p className="text-xs text-text-muted">
          Terjadi kesalahan saat memproses data. Silakan klik tombol di bawah untuk mencoba kembali.
        </p>
      </div>

      <Button onClick={() => reset()} className="button-gradient text-xs font-bold gap-2 rounded-xl h-10 px-5">
        <RotateCcw className="w-4 h-4" />
        <span>Muat Ulang Panel</span>
      </Button>
    </div>
  );
}
