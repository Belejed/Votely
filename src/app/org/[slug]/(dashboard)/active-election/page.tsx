export const dynamic = 'force-dynamic';
export const revalidate = 0;

import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/session';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { 
  Vote, 
  MonitorPlay, 
  Smartphone, 
  Users, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  QrCode, 
  Plus, 
  ArrowRight,
  TrendingUp
} from 'lucide-react';

export default async function ActiveElectionPage({
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

  // 1. Fetch organization
  const org = await db.organization.findUnique({
    where: { slug },
  });

  if (!org) {
    notFound();
  }

  // 2. Fetch Active Published Event
  const activeEvent = await db.event.findFirst({
    where: { organizationId: org.id, status: 'PUBLISHED' },
    orderBy: { createdAt: 'desc' },
    include: {
      candidates: {
        include: {
          votes: true
        }
      },
      votes: true
    }
  });

  // 3. Fetch voters count
  const totalVoters = await db.voter.count({
    where: { organizationId: org.id }
  });

  const totalVotesCast = activeEvent?.votes?.length || 0;
  const participationRate = totalVoters > 0 ? Math.min(100, Math.round((totalVotesCast / totalVoters) * 100)) : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-3xl font-display font-extrabold text-text-main">Pemilihan Aktif</h3>
            {activeEvent ? (
              <Badge variant="success" className="font-extrabold text-[10px] uppercase animate-pulse">
                ● SEDANG BERLANGSUNG
              </Badge>
            ) : (
              <Badge variant="default" className="font-extrabold text-[10px] uppercase">
                TIDAK ADA PEMILIHAN
              </Badge>
            )}
          </div>
          <p className="text-sm text-text-muted mt-1">
            Pusat kontrol dan pemantauan bilik suara untuk pemilihan yang sedang berjalan di {org.name}.
          </p>
        </div>

        {activeEvent && (
          <div className="flex items-center gap-3">
            <Link href={`/org/${slug}/booth/${activeEvent.id}`} target="_blank">
              <Button className="button-gradient gap-2 h-11 px-5 shadow-md shadow-brand-primary/10 font-bold">
                <MonitorPlay className="w-4.5 h-4.5" />
                <span>Buka Bilik Suara Kiosk</span>
              </Button>
            </Link>

            {activeEvent.votingMode === 'HYBRID' || activeEvent.votingMode === 'ONLINE' ? (
              <Link href={`/org/${slug}/vote/${activeEvent.id}`} target="_blank">
                <Button variant="outline" className="gap-2 h-11 px-4 font-bold border-border-main">
                  <Smartphone className="w-4 h-4 text-success" />
                  <span>Buka Surat Suara Online</span>
                </Button>
              </Link>
            ) : null}
          </div>
        )}
      </div>

      {activeEvent ? (
        <div className="space-y-8">
          {/* Main Info Card */}
          <Card className="p-8 border-brand-primary/20 bg-card shadow-lg rounded-3xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-border-main">
              <div>
                <span className="text-xs font-bold text-brand-primary uppercase tracking-wider block mb-1">
                  Nama Agenda Pemilihan
                </span>
                <h2 className="text-2xl sm:text-3xl font-display font-black text-text-main">
                  {activeEvent.name}
                </h2>
                <p className="text-xs text-text-muted mt-1">
                  Mulai: {new Date(activeEvent.startDate).toLocaleString()} • Selesai: {new Date(activeEvent.endDate).toLocaleString()}
                </p>
              </div>

              <div className="flex items-center gap-4 bg-background/60 p-4 rounded-2xl border border-border-main">
                <div className="text-center px-3">
                  <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider block">Mode Pemilihan</span>
                  <span className="text-sm font-extrabold text-brand-primary mt-0.5 block">{activeEvent.votingMode}</span>
                </div>
                <div className="w-px h-8 bg-border-main" />
                <div className="text-center px-3">
                  <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider block">Autentikasi</span>
                  <span className="text-sm font-extrabold text-text-main mt-0.5 block">{activeEvent.authMethod}</span>
                </div>
                <div className="w-px h-8 bg-border-main" />
                <div className="text-center px-3">
                  <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider block">Total Paslon</span>
                  <span className="text-sm font-extrabold text-text-main mt-0.5 block">{activeEvent.candidates?.length || 0} Kandidat</span>
                </div>
              </div>
            </div>

            {/* Real Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6">
              <div className="p-4 rounded-2xl bg-background/40 border border-border-main/50">
                <span className="text-xs font-bold text-text-muted block">Total Hak Suara (DPT)</span>
                <span className="text-2xl font-black text-text-main mt-1 block">{totalVoters} Pemilih</span>
              </div>
              <div className="p-4 rounded-2xl bg-background/40 border border-border-main/50">
                <span className="text-xs font-bold text-text-muted block">Total Suara Masuk</span>
                <span className="text-2xl font-black text-success mt-1 block">{totalVotesCast} Suara</span>
              </div>
              <div className="p-4 rounded-2xl bg-background/40 border border-border-main/50">
                <span className="text-xs font-bold text-text-muted block">Tingkat Partisipasi</span>
                <span className="text-2xl font-black text-brand-primary mt-1 block">{participationRate}%</span>
              </div>
            </div>
          </Card>

          {/* Candidates Roster with Real Vote Percentages */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-text-main flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-primary" />
              <span>Daftar Pasangan Calon & Hasil Sementara ({activeEvent.candidates?.length || 0})</span>
            </h4>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(activeEvent.candidates || []).map((cand: any, idx: number) => {
                const candVotes = cand.votes?.length || cand._count?.votes || 0;
                const votePct = totalVotesCast > 0 ? Math.round((candVotes / totalVotesCast) * 100) : 0;

                return (
                  <Card key={cand.id || idx} className="p-6 bg-card border border-border-main rounded-3xl flex flex-col justify-between shadow-xs">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center font-black text-base border border-brand-primary/20">
                          {cand.number || idx + 1}
                        </div>
                        <Badge variant="info" className="font-extrabold text-[10px]">
                          Paslon #{cand.number || idx + 1}
                        </Badge>
                      </div>

                      <h5 className="font-black text-lg text-text-main">{cand.name}</h5>
                      <p className="text-xs text-text-muted mt-2 line-clamp-3 leading-relaxed">
                        <strong>Visi:</strong> {cand.vision}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-border-main">
                      <div className="flex items-center justify-between text-xs font-bold text-text-muted mb-1.5">
                        <span>Perolehan Suara Nyata</span>
                        <span className="text-brand-primary font-black">{candVotes} suara ({votePct}%)</span>
                      </div>
                      <div className="w-full h-2 bg-background rounded-full overflow-hidden border border-border-main">
                        <div 
                          className="h-full bg-linear-to-r from-brand-primary to-brand-secondary rounded-full transition-all duration-500" 
                          style={{ width: `${votePct}%` }}
                        />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <Card className="p-12 text-center border-dashed border-2 border-brand-primary/20 rounded-3xl flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-brand-primary/5 flex items-center justify-center text-brand-primary border border-brand-primary/10">
            <Vote className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-text-main">Tidak Ada Pemilihan yang Sedang Aktif</h4>
            <p className="text-sm text-text-muted max-w-md mt-1 mx-auto">
              Saat ini belum ada pemilihan dengan status dipublikasikan. Buat dan jadwalkan pemilihan baru melalui Events Wizard.
            </p>
          </div>
          {session.role === 'ADMIN' || session.role === 'SUPER_ADMIN' ? (
            <Link href={`/org/${slug}/events/new`}>
              <Button className="button-gradient gap-2 h-11 px-6 mt-2 font-bold shadow-md shadow-brand-primary/15">
                <Plus className="w-4.5 h-4.5" />
                <span>Buat Pemilihan Baru</span>
              </Button>
            </Link>
          ) : null}
        </Card>
      )}
    </div>
  );
}
