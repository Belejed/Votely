import React from 'react';
import { Loader2, Vote } from 'lucide-react';

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center animate-fade-in">
      <div className="w-14 h-14 rounded-3xl bg-brand-primary/10 text-brand-primary flex items-center justify-center shadow-lg mb-4 animate-bounce">
        <Vote className="w-7 h-7" />
      </div>
      <div className="flex items-center gap-2.5 text-text-main font-bold text-sm">
        <Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
        <span>Memuat Votely...</span>
      </div>
    </div>
  );
}
