export const dynamic = 'force-dynamic';
export const revalidate = 0;

import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/session';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { 
  Users, 
  Vote, 
  Calendar, 
  TrendingUp, 
  Plus, 
  ArrowRight, 
  QrCode, 
  FileSpreadsheet, 
  Megaphone,
  MonitorPlay,
  History,
  CheckCircle2,
  Sparkles,
  UserCog
} from 'lucide-react';

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getAdminSession();
  if (!session) {
    redirect('/login');
  }
  if (session.role === 'OBSERVER') {
    redirect(`/org/${slug}/livecount`);
  }

  // 1. Fetch organization details
  const org = await db.organization.findUnique({
    where: { slug },
  });

  if (!org) {
    notFound();
  }

  // 2. Fetch overall metrics
  const totalVoters = await db.voter.count({
    where: { organizationId: org.id },
  });

  const totalEvents = await db.event.count({
    where: { organizationId: org.id },
  });

  // 3. Fetch active event
  const activeEvent = await db.event.findFirst({
    where: { organizationId: org.id, status: 'PUBLISHED' },
    orderBy: { createdAt: 'desc' },
    include: {
      candidates: true,
      votes: true,
    },
  });

  const totalVotesCast = activeEvent?.votes?.length || 0;
  const participationRate = totalVoters > 0 ? Math.min(100, Math.round((totalVotesCast / totalVoters) * 100)) : 0;

  // 4. Fetch recent logs
  const recentLogs = await db.auditLog.findMany({
    where: { organizationId: org.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-brand-primary/10 via-brand-secondary/5 to-transparent border border-brand-primary/15 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <Badge variant="info" className="px-3 py-1 text-xs uppercase tracking-wider font-bold">
            ✨ Executive Dashboard
          </Badge>
          <h3 className="text-3xl font-display font-extrabold text-text-main">
            Selamat Datang, {session.name}!
          </h3>
          <p className="text-sm text-text-muted max-w-2xl leading-relaxed">
            {activeEvent 
              ? `Pemilihan aktif "${activeEvent.name}" sedang berlangsung. Akses bilik suara dan grafik analitik lengkap di tab "Pemilihan Aktif".`
              : 'Belum ada pemilihan yang aktif saat ini. Anda dapat membuat pemilihan baru atau mengimpor data DPT pemilih.'}
          </p>
        </div>

        {activeEvent ? (
          <Link href={`/org/${slug}/active-election`}>
            <Button className="button-gradient shrink-0 gap-2 h-12 px-6 shadow-md shadow-brand-primary/15 font-bold">
              <Vote className="w-5 h-5" />
              <span>Lihat Pemilihan Aktif</span>
            </Button>
          </Link>
        ) : isAdmin ? (
          <Link href={`/org/${slug}/events/new`}>
            <Button className="button-gradient shrink-0 gap-2 h-12 px-6 shadow-md shadow-brand-primary/15 font-bold">
              <Plus className="w-5 h-5" />
              <span>Buat Pemilihan Baru</span>
            </Button>
          </Link>
        ) : null}
      </div>

      {/* 2. Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card hoverLift className="flex items-center gap-5 p-5 bg-card rounded-3xl border-border-main">
          <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider block">Daftar Pemilih Tetap</span>
            <span className="text-3xl font-display font-black text-text-main">{totalVoters}</span>
          </div>
        </Card>

        <Card hoverLift className="flex items-center gap-5 p-5 bg-card rounded-3xl border-border-main">
          <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center text-success shrink-0">
            <Vote className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider block">Suara Masuk</span>
            <span className="text-3xl font-display font-black text-text-main">{totalVotesCast}</span>
          </div>
        </Card>

        <Card hoverLift className="flex items-center gap-5 p-5 bg-card rounded-3xl border-border-main">
          <div className="w-12 h-12 rounded-2xl bg-brand-secondary/15 flex items-center justify-center text-brand-secondary shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider block">Tingkat Partisipasi</span>
            <span className="text-3xl font-display font-black text-brand-primary">{participationRate}%</span>
          </div>
        </Card>

        <Card hoverLift className="flex items-center gap-5 p-5 bg-card rounded-3xl border-border-main">
          <div className="w-12 h-12 rounded-2xl bg-brand-accent/20 flex items-center justify-center text-brand-primary shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider block">Total Agenda Pemilihan</span>
            <span className="text-3xl font-display font-black text-text-main">{totalEvents}</span>
          </div>
        </Card>
      </div>

      {/* 3. Main Dashboard Overview (8 cols shortcuts + 4 cols audit) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Left Side - Quick Hub Cards (8 cols) */}
        <div className="xl:col-span-8 space-y-6">
          <Card className="p-7 rounded-3xl bg-card border-border-main">
            <h4 className="text-lg font-black text-text-main mb-1">Pusat Pintasan Cepat</h4>
            <p className="text-xs text-text-muted mb-6">Navigasi instan ke fitur-fitur utama pemilihan organisasi Anda.</p>

            <div className="grid sm:grid-cols-2 gap-4">
              {/* Shortcut 1: Pemilihan Aktif */}
              <Link href={`/org/${slug}/active-election`}>
                <div className="p-5 rounded-2xl bg-background/50 hover:bg-brand-primary/5 border border-border-main hover:border-brand-primary/30 transition-all group cursor-pointer flex flex-col justify-between h-full">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Vote className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-extrabold text-sm text-text-main group-hover:text-brand-primary transition-colors">Pemilihan Aktif</h5>
                      <span className="text-[10px] text-text-muted">{activeEvent ? 'Sedang Berlangsung' : 'Tidak Ada'}</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-brand-primary flex items-center gap-1 mt-2">
                    Buka Kontrol Pemilihan <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>

              {/* Shortcut 2: Voters Importer */}
              <Link href={`/org/${slug}/voters`}>
                <div className="p-5 rounded-2xl bg-background/50 hover:bg-success/5 border border-border-main hover:border-success/30 transition-all group cursor-pointer flex flex-col justify-between h-full">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-extrabold text-sm text-text-main group-hover:text-success transition-colors">Daftar Pemilih (DPT)</h5>
                      <span className="text-[10px] text-text-muted">{totalVoters} Terdaftar</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-success flex items-center gap-1 mt-2">
                    Kelola DPT & Cetak Kartu <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>

              {/* Shortcut 3: Live Count */}
              <Link href={`/org/${slug}/livecount`}>
                <div className="p-5 rounded-2xl bg-background/50 hover:bg-brand-secondary/5 border border-border-main hover:border-brand-secondary/30 transition-all group cursor-pointer flex flex-col justify-between h-full">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-secondary/15 text-brand-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-extrabold text-sm text-text-main group-hover:text-brand-secondary transition-colors">Live Result Count</h5>
                      <span className="text-[10px] text-text-muted">Proyektor & Saksi</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-brand-secondary flex items-center gap-1 mt-2">
                    Buka Hitung Cepat <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>

              {/* Shortcut 4: Panitia Staff / Events Wizard */}
              {isAdmin ? (
                <Link href={`/org/${slug}/users`}>
                  <div className="p-5 rounded-2xl bg-background/50 hover:bg-warning/5 border border-border-main hover:border-warning/30 transition-all group cursor-pointer flex flex-col justify-between h-full">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-warning/10 text-warning flex items-center justify-center group-hover:scale-110 transition-transform">
                        <UserCog className="w-5 h-5" />
                      </div>
                      <div>
                        <h5 className="font-extrabold text-sm text-text-main group-hover:text-warning transition-colors">Panitia & Staff</h5>
                        <span className="text-[10px] text-text-muted">Kelola Akses Petugas</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-warning flex items-center gap-1 mt-2">
                      Kelola Akun Panitia <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </Link>
              ) : (
                <div className="p-5 rounded-2xl bg-background/30 border border-border-main flex flex-col justify-between h-full opacity-60">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-extrabold text-sm text-text-main">Bilik Suara</h5>
                      <span className="text-[10px] text-text-muted">Mode Panitia</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-text-muted">Siap Melayani Pemilih</span>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Side - Audit Trail (4 cols) */}
        <div className="xl:col-span-4 space-y-6">
          <Card className="p-6 rounded-3xl bg-card border-border-main">
            <div className="flex items-center justify-between border-b border-border-main pb-3 mb-4">
              <h4 className="text-base font-extrabold text-text-main">Audit Trail</h4>
              {isAdmin ? (
                <Link href={`/org/${slug}/audit`} className="text-xs font-bold text-brand-primary hover:underline">
                  Lihat Semua
                </Link>
              ) : null}
            </div>
            
            <div className="space-y-4">
              {recentLogs.length > 0 ? (
                recentLogs.map((log: any) => (
                  <div key={log.id} className="flex gap-3 text-xs leading-normal">
                    <div className="w-2 h-2 rounded-full bg-brand-primary mt-1.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-text-main">
                        {log.details}
                      </p>
                      <span className="text-[10px] text-text-muted font-bold block mt-0.5">
                        {log.action} • {new Date(log.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-xs text-text-muted py-4">Belum ada aktivitas tercatat.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
