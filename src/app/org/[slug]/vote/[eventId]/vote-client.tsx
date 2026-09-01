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

          {/* CANDIDATE SELECT ROSTER */}
          {voteState === 'CANDIDATES' && activeVoter && (
            <motion.div
              key="candidates"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full max-w-4xl space-y-6"
            >
              <div className="text-center space-y-1">
                <h3 className="text-2xl font-display font-extrabold text-text-main">Voter Ballot</h3>
                <p className="text-xs text-text-muted">Logged in as: <strong>{activeVoter.name}</strong></p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {candidates.map((cand: any) => (
                  <Card key={cand.id} hoverLift className="flex flex-col justify-between p-5 bg-card border-2 border-border-main hover:border-brand-primary/60 transition-all rounded-3xl relative overflow-hidden shadow-sm hover:shadow-xl">
                    <div className="absolute top-3 right-3 z-10 w-10 h-10 bg-brand-primary text-white flex items-center justify-center font-display font-black text-sm rounded-2xl shadow-md">
                      #{cand.number}
                    </div>

                    <div className="space-y-3.5">
                      {/* 3:4 Official Portrait Photo Frame */}
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
                        <span className="text-[10px] text-brand-primary uppercase font-extrabold tracking-widest block">Kandidat Paslon #{cand.number}</span>
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
                      <Button onClick={() => handleSelectCandidate(cand)} className="w-full button-gradient font-bold h-11 text-xs shadow-md shadow-brand-primary/20" disabled={isPending}>
                        Coblos Paslon #{cand.number}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

          {/* BALLOT CONFIRMATION */}
          {voteState === 'CONFIRMATION' && activeVoter && selectedCandidate && (
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
                  <h4 className="text-lg font-bold text-text-main">Submit Your Vote?</h4>
                  <p className="text-xs text-text-muted">You are voting for Candidate #{selectedCandidate.number}:</p>
                </div>

                <div className="p-4 bg-background border border-border-main rounded-xl text-left">
                  <strong className="text-text-main text-sm block">{selectedCandidate.name}</strong>
                  <span className="text-[10px] text-text-muted mt-1 block leading-relaxed">{selectedCandidate.vision}</span>
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => handleCastVote(selectedCandidate.id)} className="flex-1 button-gradient h-10" disabled={isPending}>
                    Confirm Vote
                  </Button>
                  <Button variant="secondary" onClick={() => setVoteState('CANDIDATES')} className="w-24" disabled={isPending}>
                    Cancel
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
