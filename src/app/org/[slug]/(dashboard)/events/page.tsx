export const dynamic = 'force-dynamic';
export const revalidate = 0;

import React from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/session';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Trash2, 
  Archive, 
  Calendar, 
  Monitor, 
  Smartphone, 
  Layers,
  Lock,
  QrCode,
  UsersRound,
  Eye,
  TrendingUp,
  RotateCcw,
  Clock,
  Play,
  CheckCircle2,
  FolderArchive
} from 'lucide-react';
import { archiveEventAction, deleteEventAction, startEventAction } from './actions';

export default async function EventsListPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getAdminSession();
  if (!session) {
    redirect('/login');
  }

  // 1. Fetch organization details
  const org = await db.organization.findUnique({
    where: { slug },
  });

  if (!org) {
    notFound();
  }

  // 2. Fetch all events
  const allEvents = await db.event.findMany({
    where: { organizationId: org.id },
    include: {
      candidates: {
        include: {
          votes: true
        },
        orderBy: { number: 'asc' }
      },
      votes: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const activeEvents = allEvents.filter((e: any) => e.status === 'PUBLISHED' || e.status === 'DRAFT');
  const archivedEvents = allEvents.filter((e: any) => e.status === 'ARCHIVED' || e.status === 'CLOSED');

  // Server actions wrappers
  const handleArchive = async (formData: FormData) => {
    'use server';
    const eventId = formData.get('eventId') as string;
    await archiveEventAction(eventId, org.id, slug);
  };

  const handleDelete = async (formData: FormData) => {
    'use server';
    const eventId = formData.get('eventId') as string;
    await deleteEventAction(eventId, org.id, slug);
  };

  const handleStart = async (formData: FormData) => {
    'use server';
    const eventId = formData.get('eventId') as string;
    await startEventAction(eventId, org.id, slug);
  };

  return (
    <div className="space-y-10 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-main pb-5">
        <div>
          <h3 className="text-2xl sm:text-3xl font-display font-black text-text-main tracking-tight">Daftar Agenda Pemilihan</h3>
          <p className="text-xs text-text-muted mt-1">Kelola agenda pemilihan umum, pantau suara, dan lihat arsip pemilihan sebelumnya.</p>
        </div>
        {session.role !== 'OBSERVER' && (
          <Link href={`/org/${slug}/events/new`}>
            <Button className="button-gradient gap-2 h-10 px-4 shadow-sm text-xs font-bold">
              <Plus className="w-4 h-4" />
              <span>Buat Pemilihan Baru</span>
            </Button>
          </Link>
        )}
      </div>

      {/* SECTION 1: ACTIVE / SCHEDULED ELECTIONS */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="success" className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
            AKTIF & TERJADWAL ({activeEvents.length})
          </Badge>
          <span className="text-xs text-text-muted">Agenda pemilihan yang sedang berlangsung atau siap dimulai.</span>
        </div>

        {activeEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeEvents.map((event: any) => {
              const votesCount = event.votes.length;
              const candidatesCount = event.candidates.length;
              const isLive = event.status === 'PUBLISHED';

              return (
                <Card key={event.id} hoverLift className={`flex flex-col justify-between p-6 bg-card border-2 rounded-3xl transition-all ${
                  isLive ? 'border-emerald-500/40 shadow-md shadow-emerald-500/5' : 'border-border-main'
                }`}>
                  <div>
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <Badge variant={isLive ? 'success' : 'info'} className="text-[10px] font-black uppercase tracking-wider">
                        {isLive ? 'SEDANG BERLANGSUNG' : 'DRAF / MENUNGGU HARI-H'}
                      </Badge>
                      <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
                        Mode {event.votingMode}
                      </span>
                    </div>

                    <h4 className="text-lg font-black text-text-main leading-snug mb-1">
                      {event.name}
                    </h4>
                    <p className="text-xs text-text-muted line-clamp-2 leading-relaxed mb-5">
                      {event.description || 'Tidak ada deskripsi tambahan.'}
                    </p>

                    <div className="grid grid-cols-3 gap-2.5 bg-background/60 border border-border-main p-3 rounded-2xl text-center text-xs font-semibold mb-5">
                      <div>
                        <span className="text-[9px] text-text-muted uppercase tracking-wider block font-bold">Paslon</span>
                        <span className="text-text-main font-black text-sm mt-0.5 block">{candidatesCount}</span>
                      </div>
                      <div className="border-x border-border-main/50">
                        <span className="text-[9px] text-text-muted uppercase tracking-wider block font-bold">Suara Masuk</span>
                        <span className="text-brand-primary font-black text-sm mt-0.5 block">{votesCount}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-text-muted uppercase tracking-wider block font-bold">Otentikasi</span>
                        <span className="text-text-main font-black text-[11px] mt-0.5 block truncate">{event.authMethod}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-main pt-4 mt-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {(event.votingMode === 'OFFLINE' || event.votingMode === 'HYBRID') && (
                        <Link href={`/org/${slug}/booth/${event.id}`} target="_blank">
                          <Button size="sm" variant="outline" className="gap-1.5 text-xs font-bold h-9">
                            <Monitor className="w-3.5 h-3.5" />
                            <span>Bilik Suara</span>
                          </Button>
                        </Link>
                      )}
                      {(event.votingMode === 'ONLINE' || event.votingMode === 'HYBRID') && (
                        <Link href={`/org/${slug}/vote/${event.id}`} target="_blank">
                          <Button size="sm" variant="outline" className="gap-1.5 text-xs font-bold h-9">
                            <Smartphone className="w-3.5 h-3.5" />
                            <span>Surat Suara</span>
                          </Button>
                        </Link>
                      )}
                      <Link href={`/org/${slug}/livecount`} target="_blank">
                        <Button size="sm" className="button-gradient gap-1.5 text-xs font-bold h-9">
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>Live Count</span>
                        </Button>
                      </Link>
                    </div>

                    {session.role !== 'OBSERVER' && (
                      <div className="flex items-center gap-1.5">
                        {!isLive && (
                          <form action={handleStart}>
                            <input type="hidden" name="eventId" value={event.id} />
                            <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1 text-xs font-bold h-9 px-2.5">
                              <Play className="w-3 h-3 fill-white" />
                              <span>Mulai</span>
                            </Button>
                          </form>
                        )}
                        <form action={handleArchive}>
                          <input type="hidden" name="eventId" value={event.id} />
                          <Button type="submit" variant="ghost" size="sm" className="text-text-muted hover:text-brand-primary h-9 px-2" title="Arsipkan Pemilihan">
                            <Archive className="w-4 h-4" />
                          </Button>
                        </form>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-8 text-center bg-card border-border-main rounded-3xl">
            <p className="text-xs text-text-muted">Tidak ada agenda pemilihan aktif saat ini.</p>
          </Card>
        )}
      </div>

      {/* SECTION 2: ARCHIVED & PAST ELECTIONS */}
      <div className="space-y-4 pt-4 border-t border-border-main">
        <div className="flex items-center gap-2">
          <Badge variant="default" className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
            <FolderArchive className="w-3 h-3" />
            ARSIP PEMILIHAN SELESAI ({archivedEvents.length})
          </Badge>
          <span className="text-xs text-text-muted">Riwayat agenda pemilihan terdahulu yang tersimpan permanen.</span>
        </div>

        {archivedEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {archivedEvents.map((event: any) => {
              const votesCount = event.votes.length;
              const candidatesCount = event.candidates.length;

              return (
                <Card key={event.id} className="p-5 bg-card/70 border-border-main rounded-3xl space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <Badge variant="danger" className="text-[9px] font-extrabold uppercase">
                        TERARSIP / DITUTUP
                      </Badge>
                      <span className="text-[10px] text-text-muted font-bold">
                        {new Date(event.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <h5 className="font-black text-base text-text-main leading-snug">{event.name}</h5>
                    <p className="text-[11px] text-text-muted line-clamp-2 mt-1">
                      {event.description || 'Agenda pemilihan umum.'}
                    </p>

                    <div className="flex items-center justify-between text-xs bg-background/50 p-2.5 rounded-xl border border-border-main mt-3">
                      <span className="text-text-muted">Total Suara:</span>
                      <strong className="text-brand-primary font-black">{votesCount} Suara</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-border-main pt-3">
                    <Link href={`/org/${slug}/livecount`} className="flex-1">
                      <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs font-bold h-8.5">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Lihat Rekap Hasil</span>
                      </Button>
                    </Link>

                    {session.role !== 'OBSERVER' && (
                      <form action={handleStart} className="ml-2">
                        <input type="hidden" name="eventId" value={event.id} />
                        <Button type="submit" size="sm" variant="ghost" className="text-emerald-600 hover:bg-emerald-500/10 h-8.5 px-2 text-xs font-bold gap-1" title="Buka Kembali Pemilihan">
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Buka Lagi</span>
                        </Button>
                      </form>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-6 text-center bg-card border-border-main rounded-2xl">
            <p className="text-xs text-text-muted">Belum ada arsip pemilihan yang tersimpan.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
