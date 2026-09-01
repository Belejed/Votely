'use client';

import React, { useState, useTransition } from 'react';
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
  TrendingUp,
  Play,
  Square,
  RefreshCw,
  Lock,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { startEventAction, closeEventAction } from '../events/actions';

interface CandidateProps {
  id: string;
  number: number;
  name: string;
  photoUrl: string | null;
  vision: string | null;
  mission: string | null;
  votesCount: number;
  percentage: number;
}

interface ActiveElectionClientProps {
  event: {
    id: string;
    name: string;
    description: string | null;
    status: string;
    votingMode: string;
    authMethod: string;
    startDate: string;
    endDate: string;
    organizationId: string;
  } | null;
  candidates: CandidateProps[];
  totalVoters: number;
  totalVotesCast: number;
  turnoutPercentage: number;
  slug: string;
  orgName: string;
  userRole: string;
}

export default function ActiveElectionClient({
  event,
  candidates,
  totalVoters,
  totalVotesCast,
  turnoutPercentage,
  slug,
  orgName,
  userRole
}: ActiveElectionClientProps) {
  const [isPending, startTransition] = useTransition();
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);
  const [confirmAction, setConfirmAction] = useState<'START' | 'CLOSE' | null>(null);

  const handleStartElection = () => {
    if (!event) return;
    setStatusMsg(null);
    setConfirmAction(null);
    startTransition(async () => {
      const res = await startEventAction(event.id, event.organizationId, slug);
      if (res?.error) {
        setStatusMsg({ type: 'danger', text: res.error });
      } else {
        setStatusMsg({ type: 'success', text: 'Pemilihan berhasil dimulai serentak! Seluruh bilik suara sekarang aktif.' });
      }
    });
  };

  const handleCloseElection = () => {
    if (!event) return;
    setStatusMsg(null);
    setConfirmAction(null);
    startTransition(async () => {
      const res = await closeEventAction(event.id, event.organizationId, slug);
      if (res?.error) {
        setStatusMsg({ type: 'danger', text: res.error });
      } else {
        setStatusMsg({ type: 'success', text: 'Pemilihan resmi ditutup. Seluruh bilik suara telah dikunci.' });
      }
    });
  };

  if (!event) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-main pb-5">
          <div>
            <h3 className="text-2xl font-display font-black text-text-main tracking-tight">Status Pemilihan</h3>
            <p className="text-xs text-text-muted mt-1">Pantau agenda pemilihan umum dan operasional bilik suara.</p>
          </div>
          {userRole !== 'OBSERVER' && (
            <Link href={`/org/${slug}/events/new`}>
              <Button className="button-gradient gap-2 text-xs font-bold h-10 shadow-sm">
                <Plus className="w-4 h-4" /> Buat Pemilihan Baru
              </Button>
            </Link>
          )}
        </div>

        <Card className="p-12 text-center bg-card border-border-main rounded-3xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mx-auto">
            <Vote className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h4 className="text-lg font-bold text-text-main">Belum Ada Agenda Pemilihan</h4>
            <p className="text-xs text-text-muted max-w-md mx-auto">
              Belum ada agenda pemilihan yang terdaftar. Buat agenda pemilihan baru untuk mengaktifkan Bilik Suara dan Surat Suara Online.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const isLive = event.status === 'PUBLISHED';
  const isDraft = event.status === 'DRAFT';
  const isClosed = event.status === 'CLOSED' || event.status === 'ARCHIVED';

  return (
    <div className="space-y-6">
      {/* Header with Title & Action Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border-main pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-2xl font-display font-black text-text-main tracking-tight">{event.name}</h3>
            {isLive && (
              <Badge variant="success" className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                LIVE / AKTIF
              </Badge>
            )}
            {isDraft && (
              <Badge variant="info" className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
                DRAF / MENUNGGU HARI-H
              </Badge>
            )}
            {isClosed && (
              <Badge variant="danger" className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
                TELAH DITUTUP
              </Badge>
            )}
          </div>
          <p className="text-xs text-text-muted mt-1">
            Instansi: <strong className="text-text-main">{orgName}</strong> • Mode: <strong className="text-brand-primary">{event.votingMode}</strong>
          </p>
        </div>

        {/* Start / Close Live Election Buttons */}
        {userRole !== 'OBSERVER' && (
          <div className="flex flex-wrap items-center gap-2.5">
            {isDraft && (
              <Button
                onClick={() => setConfirmAction('START')}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                disabled={isPending}
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Mulai Pemilihan Serentak</span>
              </Button>
            )}

            {isLive && (
              <Button
                onClick={() => setConfirmAction('CLOSE')}
                className="bg-danger hover:bg-red-700 text-white font-black text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-danger/20"
                disabled={isPending}
              >
                <Square className="w-4 h-4 fill-white" />
                <span>Tutup / Akhiri Pemilihan</span>
              </Button>
            )}

            {isClosed && (
              <Button
                onClick={() => setConfirmAction('START')}
                className="bg-brand-primary hover:bg-purple-700 text-white font-black text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-brand-primary/20"
                disabled={isPending}
              >
                <RefreshCw className="w-4 h-4" />
                <span>Buka Kembali Pemilihan</span>
              </Button>
            )}

            <Link href={`/org/${slug}/events/new`}>
              <Button variant="outline" className="text-xs font-bold h-10 gap-1.5">
                <Plus className="w-4 h-4" /> Buat Agenda Baru
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Status Alert Notification */}
      {statusMsg && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-3 border ${
          statusMsg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-danger/10 border-danger/20 text-danger'
        }`}>
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full p-6 bg-card border-border-main rounded-3xl shadow-2xl space-y-5">
            <div className="flex items-center gap-3 text-text-main">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                confirmAction === 'START' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-danger/10 text-danger'
              }`}>
                {confirmAction === 'START' ? <Play className="w-6 h-6 fill-current" /> : <Lock className="w-6 h-6" />}
              </div>
              <div>
                <h4 className="font-black text-base text-text-main">
                  {confirmAction === 'START' ? 'Mulai Pemilihan Serentak?' : 'Tutup Sesi Pemilihan?'}
                </h4>
                <span className="text-xs text-text-muted block">Konfirmasi aksi agenda pemilihan</span>
              </div>
            </div>

            <p className="text-xs text-text-muted leading-relaxed">
              {confirmAction === 'START' 
                ? 'Seluruh bilik suara dan surat suara online akan langsung DIBUKA serentak untuk pemilih.'
                : 'Seluruh bilik suara dan surat suara online akan langsung DITUTUP. Pemilih tidak akan bisa lagi mencoblos suara.'}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setConfirmAction(null)} disabled={isPending}>
                Batal
              </Button>
              <Button 
                onClick={confirmAction === 'START' ? handleStartElection : handleCloseElection} 
                className={`font-black text-xs px-4 h-10 ${
                  confirmAction === 'START' ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-danger hover:bg-red-700 text-white'
                }`}
                disabled={isPending}
              >
                {isPending ? 'Memproses...' : confirmAction === 'START' ? 'Ya, Buka & Mulai Sekarang' : 'Ya, Tutup Pemilihan'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-card border-border-main rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider block">Total DPT</span>
            <span className="text-lg font-black text-text-main">{totalVoters} Pemilih</span>
          </div>
        </Card>

        <Card className="p-4 bg-card border-border-main rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider block">Suara Masuk</span>
            <span className="text-lg font-black text-text-main">{totalVotesCast} Suara</span>
          </div>
        </Card>

        <Card className="p-4 bg-card border-border-main rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider block">Partisipasi</span>
            <span className="text-lg font-black text-text-main">{turnoutPercentage}%</span>
          </div>
        </Card>

        <Card className="p-4 bg-card border-border-main rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider block">Status Bilik</span>
            <span className="text-xs font-black text-text-main">
              {isLive ? 'Bilik Aktif' : isDraft ? 'Menunggu Mulai' : 'Bilik Terkunci'}
            </span>
          </div>
        </Card>
      </div>

      {/* Quick Launch Hub */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href={`/org/${slug}/booth/${event.id}`} target="_blank" className="block">
          <Card hoverLift className="p-5 bg-card border-border-main rounded-2xl flex items-center justify-between group">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center font-black">
                <MonitorPlay className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-sm text-text-main block">Bilik Suara Kiosk</span>
                <span className="text-[11px] text-text-muted block">Mode layar penuh pemungutan suara</span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
          </Card>
        </Link>

        <Link href={`/org/${slug}/vote/${event.id}`} target="_blank" className="block">
          <Card hoverLift className="p-5 bg-card border-border-main rounded-2xl flex items-center justify-between group">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-sm text-text-main block">Surat Suara Online</span>
                <span className="text-[11px] text-text-muted block">Link pemilihan siswa via HP</span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
          </Card>
        </Link>

        <Link href={`/org/${slug}/livecount`} target="_blank" className="block">
          <Card hoverLift className="p-5 bg-card border-border-main rounded-2xl flex items-center justify-between group">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-black">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-sm text-text-main block">Proyektor Live Count</span>
                <span className="text-[11px] text-text-muted block">Layar lebar hasil suara real-time</span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
          </Card>
        </Link>
      </div>

      {/* Candidate Roster Cards */}
      <div className="space-y-4 pt-2">
        <h4 className="text-sm font-black uppercase tracking-wider text-text-muted flex items-center gap-2">
          <Users className="w-4 h-4 text-brand-primary" />
          <span>Daftar Pasangan Calon & Hasil Sementara ({candidates.length})</span>
        </h4>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {candidates.map((cand) => (
            <Card key={cand.id} className="p-5 bg-card border-border-main rounded-3xl space-y-4 relative overflow-hidden shadow-xs">
              <div className="flex items-center gap-3.5">
                {cand.photoUrl ? (
                  <img src={cand.photoUrl} alt={cand.name} className="w-16 h-20 aspect-[3/4] rounded-2xl object-cover object-top border-2 border-brand-primary/40 shadow-sm shrink-0" />
                ) : (
                  <div className="w-16 h-20 aspect-[3/4] rounded-2xl bg-brand-primary/10 text-brand-primary font-black text-base flex items-center justify-center border border-border-main shrink-0">
                    #{cand.number}
                  </div>
                )}
                <div className="min-w-0">
                  <span className="text-[10px] text-brand-primary uppercase font-extrabold tracking-wider block">
                    Paslon #{cand.number}
                  </span>
                  <h5 className="text-base font-black text-text-main truncate">{cand.name}</h5>
                  <span className="text-xs font-bold text-text-muted mt-1 block">
                    {cand.votesCount} Suara ({cand.percentage}%)
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="w-full bg-background rounded-full h-2.5 overflow-hidden border border-border-main">
                  <div 
                    className="bg-linear-to-r from-brand-primary to-brand-secondary h-full rounded-full transition-all duration-500"
                    style={{ width: `${cand.percentage}%` }}
                  />
                </div>
              </div>

              {/* Vision Mission */}
              <div className="text-xs bg-background/60 p-3 rounded-xl border border-border-main text-text-muted space-y-1.5">
                <div>
                  <strong className="text-text-main text-[11px] block font-bold">Visi:</strong>
                  <p className="leading-relaxed line-clamp-2">{cand.vision || '—'}</p>
                </div>
                {cand.mission && (
                  <div>
                    <strong className="text-text-main text-[11px] block font-bold">Misi:</strong>
                    <p className="leading-relaxed line-clamp-2">{cand.mission}</p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
