'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  Users, 
  Vote, 
  Percent, 
  Award, 
  RefreshCcw, 
  Sparkles, 
  Info,
  Calendar,
  Layers,
  BarChart3,
  User
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getLiveResultsAction } from './actions';

interface EventProps {
  id: string;
  name: string;
}

interface CandidateResultProps {
  id: string;
  number: number;
  name: string;
  photoUrl?: string | null;
  vision: string;
  mission: string;
  socialMedia: any;
  votesCount: number;
}

interface LiveCountClientProps {
  events: EventProps[];
  slug: string;
  orgName: string;
}

export default function LiveCountClientPage({ events = [], slug, orgName }: LiveCountClientProps) {
  // If no event found
  const initialEventId = events.length > 0 ? events[0].id : '';
  const [selectedEventId, setSelectedEventId] = useState<string>(initialEventId);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [secondsToRefresh, setSecondsToRefresh] = useState(3);
  
  // Data State
  const [totalVoters, setTotalVoters] = useState(0);
  const [totalVotes, setTotalVotes] = useState(0);
  const [results, setResults] = useState<CandidateResultProps[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch results
  const fetchLiveCounts = async (eventId: string) => {
    if (!eventId) return;
    try {
      const res = await getLiveResultsAction(slug, eventId);
      if (res?.error) {
        setErrorMsg(res.error);
      } else if (res?.success) {
        setTotalVoters(res.totalVoters || 0);
        setTotalVotes(res.totalVotes || 0);
        setResults(res.results || []);
        setErrorMsg(null);
      }
    } catch (err) {
      console.error('Failed to poll live count:', err);
    }
  };

  // Initial fetch on select change
  useEffect(() => {
    if (selectedEventId) {
      setLoading(true);
      fetchLiveCounts(selectedEventId).finally(() => setLoading(false));
    }
  }, [selectedEventId]);

  // Real-time Polling timer
  useEffect(() => {
    if (!autoRefresh || !selectedEventId) return;

    const interval = setInterval(() => {
      setSecondsToRefresh((prev) => {
        if (prev <= 1) {
          fetchLiveCounts(selectedEventId);
          return 3;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, selectedEventId]);

  const handleManualRefresh = () => {
    setLoading(true);
    fetchLiveCounts(selectedEventId).finally(() => setLoading(false));
    setSecondsToRefresh(3);
  };

  // Turnout calculation
  const turnoutPercent = totalVoters > 0 ? ((totalVotes / totalVoters) * 100).toFixed(1) : '0.0';

  // Find leader
  const sortedByVotes = [...results].sort((a, b) => b.votesCount - a.votesCount);
  const currentLeader = sortedByVotes.length > 0 && sortedByVotes[0].votesCount > 0 ? sortedByVotes[0] : null;

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-card border border-border-main rounded-3xl space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
          <Vote className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-xl font-display font-black text-text-main">Belum Ada Agenda Pemilihan</h3>
          <p className="text-xs text-text-muted mt-1 max-w-sm">
            Tidak ada agenda pemilihan yang terdaftar. Buat agenda pemilihan baru di menu Events.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-main pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-display font-black text-text-main leading-tight">Live Vote Audit Room</h3>
            <p className="text-[11px] text-text-muted font-bold block">Proyektor perolehan suara real-time • {orgName}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Election Select */}
          <div className="relative">
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="bg-card text-text-main border border-border-main text-xs rounded-xl px-3.5 py-2.5 pr-8 font-bold focus:outline-none focus:border-brand-primary transition-all cursor-pointer shadow-xs"
            >
              {events.map((evt: any) => (
                <option key={evt.id} value={evt.id}>
                  {evt.name}
                </option>
              ))}
            </select>
          </div>

          {/* Polling Switch & Refresh Controls */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setAutoRefresh(prev => !prev)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all duration-200 cursor-pointer ${
                autoRefresh 
                  ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary' 
                  : 'bg-card border-border-main text-text-muted'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-text-muted/65'}`} />
              <span>{autoRefresh ? `Auto Refresh (${secondsToRefresh}s)` : 'Auto Refresh Off'}</span>
            </button>

            <Button
              onClick={handleManualRefresh}
              variant="outline"
              size="sm"
              className={`h-9 w-9 rounded-xl border-border-main hover:bg-brand-primary/5 hover:text-brand-primary shrink-0 p-0 ${loading ? 'animate-spin' : ''}`}
              title="Refresh Data Now"
              disabled={loading}
            >
              <RefreshCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-danger/10 border border-danger/20 text-danger rounded-2xl text-xs font-semibold flex items-center gap-2.5">
          <Info className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Roster Turnout Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Registered Voters */}
        <Card className="border-border-main bg-card shadow-xs rounded-2xl">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-text-muted uppercase tracking-wider font-bold block">Total DPT Terdaftar</span>
              <span className="text-xl font-black text-text-main block tracking-tight mt-0.5">{totalVoters} Pemilih</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Ballots Cast */}
        <Card className="border-border-main bg-card shadow-xs rounded-2xl">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
              <Vote className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-text-muted uppercase tracking-wider font-bold block">Total Suara Masuk</span>
              <span className="text-xl font-black text-text-main block tracking-tight mt-0.5">{totalVotes} Suara</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Voter Turnout Rate */}
        <Card className="border-border-main bg-card shadow-xs rounded-2xl">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-600 shrink-0">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-text-muted uppercase tracking-wider font-bold block">Tingkat Partisipasi</span>
              <span className="text-xl font-black text-text-main block tracking-tight mt-0.5">{turnoutPercent}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leader Showcase banner with candidate photo */}
      {currentLeader && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden bg-linear-to-r from-brand-primary/15 via-purple-500/10 to-brand-primary/5 border-2 border-brand-primary/30 p-6 rounded-3xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 shadow-lg"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <Sparkles className="w-28 h-28 text-brand-primary" />
          </div>

          <div className="flex items-center gap-5 relative z-10">
            {/* Leader Photo / Badge */}
            {currentLeader.photoUrl ? (
              <div className="relative shrink-0">
                <img 
                  src={currentLeader.photoUrl} 
                  alt={currentLeader.name} 
                  className="w-20 h-24 aspect-[3/4] rounded-2xl object-cover object-top border-2 border-brand-primary shadow-md" 
                />
                <div className="absolute -top-2 -right-2 w-7 h-7 bg-amber-500 text-white rounded-full flex items-center justify-center shadow-md">
                  <Award className="w-4 h-4" />
                </div>
              </div>
            ) : (
              <div className="w-20 h-24 aspect-[3/4] rounded-2xl bg-linear-to-tr from-amber-400 to-amber-600 flex flex-col items-center justify-center text-white shrink-0 shadow-md">
                <Award className="w-8 h-8 mb-1" />
                <span className="font-black text-xs">#{currentLeader.number}</span>
              </div>
            )}

            <div>
              <Badge variant="warning" className="uppercase font-black tracking-wider text-[10px] px-2.5 py-0.5 flex items-center gap-1 w-fit">
                <Crown className="w-3 h-3" /> PEROLEHAN TERTINGGI SEMENTARA
              </Badge>
              <h4 className="text-xl sm:text-2xl font-display font-black text-text-main mt-1.5">
                Paslon #{currentLeader.number} — {currentLeader.name}
              </h4>
              <p className="text-xs text-text-muted mt-0.5">
                Memimpin dengan <strong className="text-brand-primary">{currentLeader.votesCount} Suara</strong> ({((currentLeader.votesCount / (totalVotes || 1)) * 100).toFixed(1)}% dari total suara masuk).
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Candidate Cards with Photo & Progress Distribution */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-brand-primary" />
          <h4 className="text-sm font-black uppercase tracking-wider text-text-main">
            Perolehan Suara Seluruh Kandidat ({results.length})
          </h4>
        </div>

        {results.length === 0 ? (
          <Card className="p-8 text-center text-text-muted text-xs font-semibold bg-card border-border-main rounded-3xl">
            Tidak ada calon terdaftar untuk agenda ini.
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((c: any) => {
              const percent = totalVotes > 0 ? ((c.votesCount / totalVotes) * 100).toFixed(1) : '0.0';
              const isLeader = currentLeader?.id === c.id;
              
              return (
                <Card key={c.id} className={`p-5 bg-card border-2 rounded-3xl space-y-4 flex flex-col justify-between transition-all shadow-xs ${
                  isLeader ? 'border-brand-primary/60 shadow-lg shadow-brand-primary/10' : 'border-border-main'
                }`}>
                  <div className="space-y-4">
                    {/* Top Row: Photo, Number Badge, Name, & Votes */}
                    <div className="flex items-start gap-4">
                      {/* Candidate Photo */}
                      {c.photoUrl ? (
                        <img 
                          src={c.photoUrl} 
                          alt={c.name} 
                          className="w-18 h-24 aspect-[3/4] rounded-2xl object-cover object-top border-2 border-brand-primary/40 shadow-sm shrink-0" 
                        />
                      ) : (
                        <div className="w-18 h-24 aspect-[3/4] rounded-2xl bg-brand-primary/10 text-brand-primary font-black text-lg flex flex-col items-center justify-center border border-border-main shrink-0">
                          <User className="w-6 h-6 opacity-40 mb-1" />
                          <span>#{c.number}</span>
                        </div>
                      )}

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] text-brand-primary uppercase font-extrabold tracking-wider">
                            Paslon #{c.number}
                          </span>
                          {isLeader && (
                            <Badge variant="warning" className="text-[9px] px-1.5 py-0.5 font-black uppercase">
                              MEMIMPIN
                            </Badge>
                          )}
                        </div>

                        <h5 className="text-base font-black text-text-main leading-snug truncate">{c.name}</h5>
                        
                        <div className="pt-1">
                          <span className="text-2xl font-black text-brand-primary tracking-tight block">
                            {c.votesCount} <span className="text-xs font-bold text-text-muted">Suara</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="space-y-1.5 bg-background/60 p-3 rounded-2xl border border-border-main">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-text-muted text-[11px]">Persentase Suara:</span>
                        <span className="text-text-main font-black">{percent}%</span>
                      </div>
                      <div className="h-3 w-full bg-background border border-border-main rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                          className={`h-full rounded-full transition-all ${
                            isLeader 
                              ? 'bg-linear-to-r from-brand-primary to-brand-secondary' 
                              : 'bg-brand-primary/40'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Visi Misi */}
                    {c.vision && (
                      <div className="text-xs text-text-muted bg-background/40 p-2.5 rounded-xl border border-border-main">
                        <strong className="text-text-main text-[10px] block font-bold">Visi:</strong>
                        <p className="line-clamp-2 mt-0.5 text-[11px] leading-relaxed">{c.vision}</p>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Crown(props: any) {
  return <Award {...props} />;
}
