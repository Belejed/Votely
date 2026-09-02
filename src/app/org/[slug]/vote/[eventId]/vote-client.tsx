'use client';

import Link from 'next/link';

import React, { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  Vote, 
  Lock, 
  CheckCircle2, 
  User, 
  ShieldAlert,
  ArrowRight,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { authenticateVoterAction, castVoteAction, exitVoterSessionAction } from '../../booth/actions';

interface CandidateProps {
  id: string;
  number: number;
  name: string;
  photoUrl?: string | null;
  category?: string | null;
  vision: string;
  mission: string;
  socialMedia: any;
}

interface VoteClientProps {
  event: {
    id: string;
    name: string;
    description: string;
    authMethod: string;
    votingMode: string;
    allowLiveResult: boolean;
    hideRunningResult: boolean;
    voteConfirmation: boolean;
    anonymousVote: boolean;
    multipleCandidate?: boolean;
    maxVotes?: number;
    status: string;
  };
  candidates: CandidateProps[];
  slug: string;
  orgName: string;
  logoUrl?: string | null;
  poster?: {
    url: string | null;
    enabled: boolean;
    title: string;
    caption: string;
  };
}

type VoteState = 'LOGIN' | 'CANDIDATES' | 'CONFIRMATION' | 'SUCCESS';

export default function VoteClientPage({ event, candidates, slug, orgName, logoUrl, poster }: VoteClientProps) {
  const [voteState, setVoteState] = useState<VoteState>('LOGIN');
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Voter & Ballot State
  const [activeVoter, setActiveVoter] = useState<{ id: string; name: string; studentId: string | null } | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateProps | null>(null);
  const [selectedCandidates, setSelectedCandidates] = useState<CandidateProps[]>([]);

  // Detect distinct categories (e.g. OSIS, MPK)
  const categoriesList = Array.from(new Set(candidates.map((c) => (c.category || 'OSIS'))));
  const hasMultipleCategories = categoriesList.length > 1;

  // Selected candidate per category: { "OSIS": cand, "MPK": cand }
  const [selectedByCat, setSelectedByCat] = useState<Record<string, CandidateProps>>({});
  const [categoryStep, setCategoryStep] = useState<number>(0);

  const handleSelectCandidateForCategory = (candidate: CandidateProps) => {
    const cat = candidate.category || 'OSIS';
    setSelectedByCat((prev) => ({
      ...prev,
      [cat]: candidate
    }));

    if (!hasMultipleCategories) {
      setSelectedCandidate(candidate);
      if (event.voteConfirmation) {
        setVoteState('CONFIRMATION');
      } else {
        handleCastVote(candidate.id);
      }
    }
  };

  const isAllCategoriesChosen = hasMultipleCategories
    ? categoriesList.every((cat) => selectedByCat[cat])
    : Object.keys(selectedByCat).length > 0;

  const handleProceedToConfirmation = () => {
    if (hasMultipleCategories) {
      if (!isAllCategoriesChosen) return;
      if (event.voteConfirmation) {
        setVoteState('CONFIRMATION');
      } else {
        handleCastAllVotes();
      }
    } else {
      const chosen = Object.values(selectedByCat)[0];
      if (!chosen) return;
      handleSelectCandidate(chosen);
    }
  };

  const handleCastAllVotes = async () => {
    if (!activeVoter) return;
    const chosenList = Object.values(selectedByCat);
    if (chosenList.length === 0) return;

    setErrorMsg(null);
    startTransition(async () => {
      const candidateIds = chosenList.map((c) => c.id);
      const res = await castVoteAction(slug, event.id, candidateIds, activeVoter.id);
      if (res?.error) {
        setErrorMsg(res.error);
        setVoteState('CANDIDATES');
      } else if (res?.success) {
        setVoteState('SUCCESS');
        confettiBurst();
      }
    });
  };

  // Manual Login Form
  const [studentId, setStudentId] = useState('');
  const [votingPass, setVotingPass] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId.trim() || !votingPass.trim()) {
      setErrorMsg('Please fill in all credential fields.');
      return;
    }

    setErrorMsg(null);
    startTransition(async () => {
      const res = await authenticateVoterAction(slug, event.id, { studentId, votingPass });
      if (res?.error) {
        setErrorMsg(res.error);
      } else if (res?.success && res.voter) {
        setActiveVoter(res.voter);
        if (poster?.enabled && poster?.url) {
          setVoteState('POSTER' as any);
        } else {
          setVoteState('CANDIDATES');
        }
      }
    });
  };

  const handleSelectCandidate = (candidate: CandidateProps) => {
    setSelectedCandidate(candidate);
    if (event.voteConfirmation) {
      setVoteState('CONFIRMATION');
    } else {
      handleCastVote(candidate.id);
    }
  };

  const handleCastVote = async (candidateId: string) => {
    if (!activeVoter) return;
    setErrorMsg(null);
    startTransition(async () => {
      const res = await castVoteAction(slug, event.id, candidateId, activeVoter.id);
      if (res?.error) {
        setErrorMsg(res.error);
        setVoteState('CANDIDATES');
      } else if (res?.success) {
        setVoteState('SUCCESS');
        confettiBurst();
      }
    });
  };

  const confettiBurst = () => {
    import('canvas-confetti').then((confetti) => {
      confetti.default({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
    });
  };

  const handleExit = async () => {
    await exitVoterSessionAction();
    setActiveVoter(null);
    setSelectedCandidate(null);
    setStudentId('');
    setVotingPass('');
    setErrorMsg(null);
    setVoteState('LOGIN');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between select-none" suppressHydrationWarning>
      {/* Header */}
      <header className="bg-card border-b border-border-main py-4 px-8 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <div className="w-9 h-9 rounded-xl bg-white border border-border-main p-1 flex items-center justify-center shadow-xs shrink-0">
              <img src={logoUrl} alt={orgName} className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="w-8.5 h-8.5 rounded-lg bg-brand-primary flex items-center justify-center text-white shadow-xs shrink-0">
              <Vote className="w-4.5 h-4.5" />
            </div>
          )}
          <div>
            <h2 className="font-display font-extrabold text-sm text-text-main block leading-none">{orgName} Portal</h2>
            <span className="text-[10px] text-text-muted font-bold block mt-1 leading-none">{event.name}</span>
          </div>
        </div>
      </header>

      {/* Main Body */}
      {/* MAIN CLOSED / WAITING SCREEN GUARDS */}
      {event.status === 'CLOSED' || event.status === 'ARCHIVED' ? (
        <main className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-md w-full p-8 text-center bg-card border-2 border-danger/30 shadow-2xl space-y-6 rounded-3xl">
            <div className="w-18 h-18 rounded-full bg-danger/10 text-danger flex items-center justify-center mx-auto border border-danger/20">
              <Lock className="w-9 h-9" />
            </div>
            <div className="space-y-2">
              <Badge variant="danger">SESI PEMILIHAN DITUTUP</Badge>
              <h3 className="text-xl font-display font-black text-text-main">Surat Suara Online Ditutup</h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Pemungutan suara untuk agenda <strong className="text-text-main">{event.name}</strong> telah resmi berakhir.
              </p>
            </div>
            <Link href={`/org/${slug}/livecount`} className="block w-full">
              <Button className="w-full button-gradient font-bold h-11">
                Lihat Hasil Suara
              </Button>
            </Link>
          </Card>
        </main>
      ) : event.status === 'DRAFT' ? (
        <main className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-md w-full p-8 text-center bg-card border-2 border-brand-primary/30 shadow-2xl space-y-6 rounded-3xl">
            <div className="w-18 h-18 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center mx-auto border border-brand-primary/20 animate-pulse">
              <Clock className="w-9 h-9" />
            </div>
            <div className="space-y-2">
              <Badge variant="info">MENUNGGU HARI-H</Badge>
              <h3 className="text-xl font-display font-black text-text-main">Pemilihan Belum Dimulai</h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Surat suara online untuk <strong className="text-text-main">{event.name}</strong> menunggu panitia memulai sesi pemilihan serentak.
              </p>
            </div>
          </Card>
        </main>
      ) : (
        <main className="flex-1 flex items-center justify-center p-6">
        <AnimatePresence mode="wait">
          
          {/* LOGIN CARD */}
          {voteState === 'LOGIN' && (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full max-w-md"
            >
              <Card className="p-6 border-border-main bg-card shadow-lg">
                <div className="text-center space-y-2 mb-6">
                  <Badge variant="info">ONLINE BALLOT ENTRY</Badge>
                  <h4 className="text-xl font-display font-extrabold text-text-main">Voter Authentication</h4>
                  <p className="text-xs text-text-muted">Enter your official Student ID and security passcode to enter.</p>
                </div>

                {errorMsg && (
                  <div className="mb-4 p-3.5 bg-danger/10 border border-danger/20 text-danger rounded-xl text-xs font-semibold flex items-center gap-2.5">
                    <ShieldAlert className="w-4.5 h-4.5 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  <Input
                    label="Voter Student ID"
                    placeholder="e.g. GW-001"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    required
                  />

                  <Input
                    label="Voting Passcode"
                    type="password"
                    placeholder="e.g. 889977"
                    value={votingPass}
                    onChange={(e) => setVotingPass(e.target.value)}
                    required
                  />

                  <Button type="submit" className="w-full h-11 button-gradient mt-4" disabled={isPending}>
                    {isPending ? 'Verifying...' : 'Sign In to Ballot'}
                  </Button>
                </form>

                {/* Security info */}
                <div className="mt-6 border-t border-border-main pt-4 text-[10px] text-text-muted leading-relaxed flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                  <span>Your ballot is encrypted and submitted anonymously according to privacy protocols.</span>
                </div>
              </Card>
            </motion.div>
          )}

                    {/* POSTER SPLASH SCREEN */}
          {(voteState as any) === 'POSTER' && activeVoter && poster?.url && (
            <motion.div
              key="poster-splash"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="w-full max-w-xl mx-auto"
            >
              <Card className="p-6 bg-card border-2 border-brand-primary/40 rounded-3xl shadow-2xl space-y-6 text-center">
                <div className="flex items-center justify-between pb-3 border-b border-border-main text-left">
                  <div>
                    <Badge variant="info">PANDUAN PEMILIHAN</Badge>
                    <span className="text-xs text-text-muted block mt-0.5">Pemilih: <strong>{activeVoter.name}</strong></span>
                  </div>
                </div>

                <div className="w-full aspect-[4/3] max-h-[340px] rounded-2xl overflow-hidden border-2 border-border-main bg-black shadow-lg">
                  <img src={poster.url} alt="Poster" className="w-full h-full object-contain" />
                </div>

                <div className="space-y-1 text-center">
                  <h4 className="text-lg font-black text-text-main">{poster.title}</h4>
                  <p className="text-xs text-text-muted leading-relaxed">{poster.caption}</p>
                </div>

                <Button 
                  onClick={() => setVoteState('CANDIDATES')} 
                  className="w-full button-gradient font-black text-sm h-12 rounded-2xl shadow-lg shadow-brand-primary/25"
                >
                  Saya Mengerti, Masuk ke Surat Suara ➔
                </Button>
              </Card>
            </motion.div>
          )}

          {/* CANDIDATE SELECT ROSTER — 2-screen step wizard */}
          {voteState === 'CANDIDATES' && activeVoter && (() => {
            const currentCatName = categoriesList[categoryStep] || 'OSIS';
            const currentCatCandidates = candidates.filter((c) => (c.category || 'OSIS') === currentCatName);
            const currentSelected = selectedByCat[currentCatName];
            const isLastCategory = categoryStep === categoriesList.length - 1;

            return (
            <motion.div
              key={`candidates-step-${categoryStep}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full max-w-4xl space-y-6 pb-8"
            >
              {/* Multi-Step Category Indicator */}
              {hasMultipleCategories && (
                <div className="bg-card border-2 border-border-main p-3.5 rounded-2xl shadow-xs">
                  <div className="flex items-center justify-between gap-2 text-xs font-black">
                    {categoriesList.map((cat, idx) => {
                      const isDone = Boolean(selectedByCat[cat]);
                      const isCurrent = idx === categoryStep;
                      return (
                        <div key={cat} className="flex-1 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setCategoryStep(idx)}
                            className={`flex-1 py-2 px-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                              isCurrent
                                ? 'bg-brand-primary text-white border-brand-primary shadow-md'
                                : isDone
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700'
                                : 'bg-background border-border-main text-text-muted hover:border-brand-primary/40'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                                isCurrent ? 'bg-white text-brand-primary' : isDone ? 'bg-emerald-600 text-white' : 'bg-border-main text-text-muted'
                              }`}>
                                {isDone ? '✓' : idx + 1}
                              </span>
                              <span className="truncate">{cat === 'MPK' ? '🏛️ MPK' : '🗳️ OSIS'}</span>
                            </div>
                            {isDone && !isCurrent && (
                              <span className="text-[10px] font-bold opacity-80 shrink-0">#{selectedByCat[cat].number}</span>
                            )}
                          </button>
                          {idx < categoriesList.length - 1 && (
                            <span className="text-text-muted/40 font-black">→</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="text-center space-y-1">
                <Badge variant="info">
                  {hasMultipleCategories ? `LANGKAH ${categoryStep + 1} DARI ${categoriesList.length}: ${currentCatName}` : 'SURAT SUARA DIGITAL'}
                </Badge>
                <h3 className="text-2xl font-display font-extrabold text-text-main">
                  {currentCatName === 'MPK' ? '🏛️ Pemilihan Pengurus MPK' : '🗳️ Pemilihan Ketua & Wakil OSIS'}
                </h3>
                <p className="text-xs text-text-muted">
                  Login sebagai: <strong>{activeVoter.name}</strong>
                  {hasMultipleCategories && <> · Pilih 1 paslon untuk kategori <strong>{currentCatName}</strong></>}
                </p>
              </div>

              {errorMsg && (
                <div className="p-3.5 bg-danger/10 border border-danger/20 text-danger rounded-xl text-xs font-semibold flex items-center gap-2.5">
                  <ShieldAlert className="w-4.5 h-4.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {currentCatCandidates.length === 0 ? (
                <Card className="p-8 text-center text-text-muted text-xs font-semibold bg-card border-border-main rounded-3xl">
                  Tidak ada paslon terdaftar untuk kategori ini.
                </Card>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentCatCandidates.map((cand: any) => {
                    const isSelected = currentSelected?.id === cand.id;
                    return (
                      <Card
                        key={cand.id}
                        hoverLift
                        className={`flex flex-col justify-between p-5 bg-card border-2 transition-all rounded-3xl relative overflow-hidden shadow-sm hover:shadow-xl cursor-pointer ${
                          isSelected
                            ? 'border-brand-primary ring-4 ring-brand-primary/20 bg-brand-primary/5'
                            : 'border-border-main hover:border-brand-primary/60'
                        }`}
                        onClick={() => handleSelectCandidateForCategory(cand)}
                      >
                        <div className={`absolute top-3 right-3 z-10 w-10 h-10 flex items-center justify-center font-display font-black text-sm rounded-2xl shadow-md ${
                          isSelected ? 'bg-emerald-600 text-white' : 'bg-brand-primary text-white'
                        }`}>
                          {isSelected ? '✓' : `#${cand.number}`}
                        </div>

                        <div className="space-y-3.5">
                          <div className="w-full aspect-[3/4] max-h-72 rounded-2xl overflow-hidden bg-background/80 border-2 border-border-main flex items-center justify-center relative shadow-xs">
                            {cand.photoUrl ? (
                              <img src={cand.photoUrl} alt={cand.name} className="w-full h-full object-cover object-top" />
                            ) : (
                              <div className="flex flex-col items-center justify-center gap-2 text-brand-primary">
                                <User className="w-12 h-12 opacity-40" />
                                <span className="font-black text-sm">Paslon #{cand.number}</span>
                              </div>
                            )}
                          </div>

                          <div className="text-center pt-1">
                            <div className="flex items-center justify-center gap-1.5 mb-1">
                              <span className="text-[10px] text-brand-primary uppercase font-extrabold tracking-widest block">Paslon #{cand.number}</span>
                              <span className="text-[9px] font-black px-1.5 rounded bg-background border border-border-main text-text-muted">{currentCatName}</span>
                            </div>
                            <h4 className="font-black text-lg text-text-main leading-snug">{cand.name}</h4>
                          </div>

                          <div className="space-y-2 text-xs bg-background/60 p-3 rounded-xl border border-border-main text-text-muted">
                            <div>
                              <strong className="text-text-main text-[11px] block font-bold">Visi:</strong>
                              <p className="leading-relaxed mt-0.5 line-clamp-2">{cand.vision || '—'}</p>
                            </div>
                            {cand.mission && (
                              <div>
                                <strong className="text-text-main text-[11px] block font-bold">Misi:</strong>
                                <p className="leading-relaxed mt-0.5 line-clamp-2">{cand.mission}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="pt-4 border-t border-border-main mt-4">
                          <Button
                            onClick={(e) => { e.stopPropagation(); handleSelectCandidateForCategory(cand); }}
                            className={`w-full font-bold h-11 text-xs transition-all ${
                              isSelected ? 'bg-emerald-600 text-white shadow-md' : 'button-gradient text-white shadow-md shadow-brand-primary/20'
                            }`}
                            disabled={isPending}
                          >
                            {isSelected ? `✓ Paslon #${cand.number} Terpilih` : `Pilih Paslon #${cand.number}`}
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Sticky Wizard Navigation Bar */}
              <div className="sticky bottom-6 left-0 right-0 z-40 pt-2">
                <div className="max-w-xl mx-auto bg-card/95 backdrop-blur-md border-2 border-brand-primary rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    {hasMultipleCategories && categoryStep > 0 && (
                      <Button variant="outline" size="sm" onClick={() => setCategoryStep(categoryStep - 1)} className="rounded-xl h-10 px-3 text-xs font-bold">
                        ← Kembali
                      </Button>
                    )}
                    <div>
                      <span className="text-xs font-black text-brand-primary block">
                        {currentSelected ? `✓ Paslon #${currentSelected.number} (${currentCatName})` : `Belum pilih ${currentCatName}`}
                      </span>
                      <span className="text-[11px] text-text-muted block">
                        {isLastCategory
                          ? (isAllCategoriesChosen ? 'Semua kategori lengkap!' : 'Pilih paslon untuk lanjut.')
                          : `Langkah ${categoryStep + 1} dari ${categoriesList.length}`}
                      </span>
                    </div>
                  </div>

                  {isLastCategory ? (
                    <Button
                      onClick={handleProceedToConfirmation}
                      disabled={!isAllCategoriesChosen}
                      className="button-gradient text-xs font-black px-5 h-11 rounded-xl shadow-lg shadow-brand-primary/30 shrink-0"
                    >
                      Lanjut Konfirmasi <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  ) : (
                    <Button
                      onClick={() => { if (currentSelected) setCategoryStep(categoryStep + 1); }}
                      disabled={!currentSelected}
                      className="button-gradient text-xs font-black px-5 h-11 rounded-xl shadow-lg shadow-brand-primary/30 shrink-0"
                    >
                      Lanjut ke {categoriesList[categoryStep + 1] === 'MPK' ? '🏛️ MPK' : 'Tahap 2'} <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
            );
          })()}

          {/* BALLOT CONFIRMATION */}
          {voteState === 'CONFIRMATION' && activeVoter && (Object.keys(selectedByCat).length > 0 || selectedCandidate) && (
            <motion.div
              key="confirmation"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm"
            >
              <Card className="p-6 text-center border border-border-main shadow-xl space-y-6">
                <div className="w-14 h-14 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary mx-auto">
                  <HelpCircle className="w-7 h-7" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-lg font-bold text-text-main">Konfirmasi Suara Anda</h4>
                  <p className="text-xs text-text-muted">
                    {hasMultipleCategories
                      ? 'Suara Anda untuk masing-masing kategori:'
                      : `Anda akan memilih Paslon #${selectedCandidate?.number}:`}
                  </p>
                </div>

                <div className="space-y-2 text-left">
                  {(hasMultipleCategories ? Object.values(selectedByCat) : (selectedCandidate ? [selectedCandidate] : [])).map((cand) => (
                    <div key={cand.id} className="p-3 bg-background border border-border-main rounded-xl flex items-center gap-3">
                      {cand.photoUrl ? (
                        <img src={cand.photoUrl} alt={cand.name} className="w-10 h-14 aspect-[3/4] rounded-lg object-cover border border-border-main shrink-0" />
                      ) : (
                        <span className="w-10 h-14 rounded-lg bg-brand-primary/10 text-brand-primary font-black text-xs flex items-center justify-center shrink-0 border border-border-main">
                          #{cand.number}
                        </span>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-brand-primary font-bold uppercase">Paslon #{cand.number}</span>
                          <span className="text-[9px] font-black px-1 rounded bg-card border border-border-main text-text-muted uppercase">{cand.category || 'OSIS'}</span>
                        </div>
                        <strong className="text-text-main text-sm block truncate">{cand.name}</strong>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={hasMultipleCategories ? handleCastAllVotes : () => handleCastVote(selectedCandidate?.id || '')}
                    className="flex-1 button-gradient h-10"
                    disabled={isPending}
                  >
                    {isPending ? 'Mengirim...' : 'Ya, Kirim Suara'}
                  </Button>
                  <Button variant="secondary" onClick={() => setVoteState('CANDIDATES')} className="w-24" disabled={isPending}>
                    Ubah
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* SUCCESS SCREEN */}
          {voteState === 'SUCCESS' && (
            <motion.div
              key="success"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm"
            >
              <Card className="p-8 text-center border border-border-main shadow-2xl space-y-6">
                <div className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center text-success mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <h4 className="text-xl font-display font-extrabold text-text-main">Vote Submitted!</h4>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Thank you. Your vote has been recorded securely and anonymously. You can now close this browser tab.
                  </p>
                </div>

                <Button onClick={handleExit} className="w-full" variant="secondary">
                  Exit Session
                </Button>
              </Card>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
      )}

      {/* Footer */}
      <footer className="py-4 border-t border-border-main bg-background/50 text-center text-[10px] text-text-muted uppercase tracking-wider font-semibold">
        🔒 Votely Encryption Node
      </footer>
    </div>
  );
}
