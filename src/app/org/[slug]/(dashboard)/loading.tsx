import React from 'react';
import { Loader2 } from 'lucide-react';

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse pb-10">
      {/* Top Header Skeleton */}
      <div className="flex justify-between items-center pb-4 border-b border-border-main">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-card border border-border-main rounded-xl" />
          <div className="h-4 w-72 bg-card border border-border-main rounded-lg" />
        </div>
        <div className="h-10 w-32 bg-card border border-border-main rounded-xl" />
      </div>

      {/* Metrics Row Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-card border border-border-main rounded-2xl p-4 space-y-3">
            <div className="h-4 w-24 bg-background rounded-md" />
            <div className="h-7 w-16 bg-background rounded-lg" />
          </div>
        ))}
      </div>

      {/* Main Content Box Skeleton */}
      <div className="h-80 bg-card border border-border-main rounded-3xl p-6 flex flex-col items-center justify-center text-text-muted gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
        <span className="text-xs font-bold">Memuat data workspace...</span>
      </div>
    </div>
  );
}
