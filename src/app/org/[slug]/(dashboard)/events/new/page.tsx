'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  HelpCircle, 
  Info, 
  Sparkles, 
  Crown, 
  Plus, 
  Trash, 
  Vote, 
  Monitor, 
  Smartphone, 
  Layers,
  Lock,
  QrCode,
  UserCheck,
  Mail,
  MessageSquare,
  UsersRound
} from 'lucide-react';
import { createEventAction } from '../actions';

interface CandidateInput {
  name: string;
  photoUrl?: string;
  vision: string;
  mission: string;
}

export default function NewEventWizardPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  // Let's mock fetching the organization. We'll pass slug and get the details inside actions.
  // We can hardcode orgId for Greenwood High School (seeding ID) or resolve dynamically.
  // To make it fully dynamic, we can fetch from a server side layout, but wait! We can pass organization slug
  // and resolve organizationId on the server inside the Server Action! That is much safer and easier.
  // We'll pass the org ID. To do that, we can retrieve org slug. Greenwood High's slug is 'school-a'.
  // In the action, we look up the organization by slug. This makes the client-side independent of organization IDs!

  const [step, setStep] = useState(1);
  const [isPending, startCreateTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    votingMode: 'ONLINE', // ONLINE, OFFLINE, HYBRID
    authMethod: 'QR_ONLY', // QR_ONLY, ID_PASS, ID_QR, EMAIL_OTP, WHATSAPP_OTP, GOOGLE_LOGIN
    allowLiveResult: true,
    hideRunningResult: false,
    voteConfirmation: true,
    anonymousVote: true,
    multipleCandidate: false,
    maxVotes: 1,
    autoClose: true,
    
    // Booth settings (Step 5)
    enableBoothMode: true,
    enableKioskMode: false,
    fullscreen: false,
    autoLogout: true,
    autoReturn: true,
    idleTimeout: 30,
    sessionTimeout: 120,
    cameraScan: true,
  });

  const [candidates, setCandidates] = useState<CandidateInput[]>([
    { name: 'Jane Doe', photoUrl: '', vision: 'Student empowerment', mission: 'Creating interactive clubs' },
    { name: 'John Smith', photoUrl: '', vision: 'Tech campus', mission: 'Expansion of campus Wi-Fi' }
  ]);

  const [newCand, setNewCand] = useState<CandidateInput>({ name: '', photoUrl: '', vision: '', mission: '' });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const rawDataUrl = evt.target?.result as string;
      const img = new Image();
      img.onload = () => {
        // High quality canvas compression (max 480x480) for instant upload & crisp display
        const canvas = document.createElement('canvas');
        const maxDim = 480;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedB64 = canvas.toDataURL('image/jpeg', 0.85);
          setNewCand(prev => ({ ...prev, photoUrl: compressedB64 }));
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const addCandidate = () => {
    if (!newCand.name.trim()) return;
    setCandidates([...candidates, newCand]);
    setNewCand({ name: '', photoUrl: '', vision: '', mission: '' });
  };

  const removeCandidate = (idx: number) => {
    setCandidates(candidates.filter((_, i) => i !== idx));
  };

  // Step names
  const steps = [
    { num: 1, name: 'Info' },
    { num: 2, name: 'Mode' },
    { num: 3, name: 'Auth' },
    { num: 4, name: 'Rules' },
    { num: 5, name: 'Booth' },
    { num: 6, name: 'Review' }
  ];

  // Helper to check if we can skip step 5 (booth settings)
  const isOnlineOnly = formData.votingMode === 'ONLINE';

  const handleNext = () => {
    setErrorMsg(null);
    if (step === 1 && !formData.name.trim()) {
      setErrorMsg('Election name is required.');
      return;
    }
    


    if (step === 4 && isOnlineOnly) {
      // Skip step 5 (booth settings) for Online only
      setStep(6);
    } else {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setErrorMsg(null);
    if (step === 6 && isOnlineOnly) {
      setStep(4);
    } else {
      setStep(step - 1);
    }
  };

  const handlePublish = () => {
    if (candidates.length < 2) {
      setErrorMsg('Please add at least two candidates.');
      return;
    }

    startCreateTransition(async () => {
      const res = await createEventAction(slug, { ...formData, candidates });
      if (res?.error) {
        setErrorMsg(res.error);
      } else if (res?.success) {
        router.push(`/org/${slug}/active-election`);
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Back to Events Link */}
      <div className="flex items-center justify-between">
        <Link href={`/org/${slug}/dashboard`} className="flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-text-muted hover:text-brand-primary transition-colors">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>
        <span className="text-xs font-bold text-text-muted">Step {step} of 6</span>
      </div>

      {/* Progress Stepper Bar */}
      <div className="w-full bg-card border border-border-main rounded-2xl p-4 flex items-center justify-between gap-2 shadow-xs">
        {steps.map((s: any) => {
          const isActive = step === s.num;
          const isCompleted = step > s.num || (s.num === 5 && isOnlineOnly && step > 4);
          return (
            <div key={s.num} className="flex-1 flex items-center gap-2 last:flex-none">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                  isActive ? 'bg-brand-primary text-white scale-110 shadow-md shadow-brand-primary/15' : 
                  isCompleted ? 'bg-success text-white' : 'bg-background text-text-muted border border-border-main'
                }`}>
                  {isCompleted ? <Check className="w-4.5 h-4.5" /> : s.num}
                </div>
                <span className={`text-xs font-bold uppercase tracking-wider hidden sm:block ${
                  isActive ? 'text-brand-primary' : isCompleted ? 'text-success' : 'text-text-muted/65'
                }`}>{s.name}</span>
              </div>
              {s.num !== 6 && <div className={`flex-1 h-[2px] bg-border-main rounded-full mx-2 hidden sm:block ${isCompleted ? 'bg-success/55' : ''}`} />}
            </div>
          );
        })}
      </div>

      {errorMsg && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3.5 bg-danger/10 border border-danger/20 text-danger rounded-xl text-xs font-semibold flex items-center gap-2.5">
          <Info className="w-4.5 h-4.5 shrink-0" />
          <span>{errorMsg}</span>
        </motion.div>
      )}

      {/* Steps Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          {/* STEP 1: EVENT INFORMATION */}
          {step === 1 && (
            <Card className="p-6 space-y-6">
              <div className="space-y-1">
                <h4 className="text-xl font-display font-extrabold text-text-main">Event Information</h4>
                <p className="text-sm text-text-muted">Give your election event a clean name, banner, and descriptive layout details.</p>
              </div>

              <div className="space-y-4">
                <Input
                  label="Election Name"
                  placeholder="e.g. Student Council President 2026"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Description / Vision</label>
                  <textarea
                    rows={4}
                    className="flex w-full rounded-xl border border-border-main bg-background px-4 py-2 text-sm text-text-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:border-brand-primary/60 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
                    placeholder="Enter the election statement or student rules summary..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>
            </Card>
          )}

          {/* STEP 2: VOTING MODE */}
          {step === 2 && (
            <Card className="p-6 space-y-6">
              <div className="space-y-1">
                <h4 className="text-xl font-display font-extrabold text-text-main">Choose Voting Mode</h4>
                <p className="text-sm text-text-muted">Select how voters will access the candidate rosters and cast ballot entries.</p>
              </div>

              <div className="grid md:grid-cols-3 gap-5">
                {[
                  {
                    mode: 'OFFLINE',
                    title: 'Offline Booth',
                    icon: Monitor,
                    recommend: true,
                    desc: 'Admin configures a central electronic kiosk/booth machine. Voters approach the booth, scan their invitation QR, cast ballot, and logout.'
                  },
                  {
                    mode: 'ONLINE',
                    title: 'Online Client',
                    icon: Smartphone,
                    recommend: false,
                    desc: 'Voters access the voting roster remotely via their web browsers, using safe OTP or password logins from home.'
                  },
                  {
                    mode: 'HYBRID',
                    title: 'Hybrid Blend',
                    icon: Layers,
                    recommend: false,
                    desc: 'Enable both central offline polling station machines and remote online logins to maximize turnout rates.'
                  }
                ].map((item: any) => (
                  <button
                    key={item.mode}
                    type="button"
                    onClick={() => setFormData({ ...formData, votingMode: item.mode })}
                    className={`p-5 rounded-2xl border text-left flex flex-col items-start gap-4 transition-all duration-200 cursor-pointer ${
                      formData.votingMode === item.mode ? 'bg-brand-primary/5 border-brand-primary shadow-xs' : 'bg-card border-border-main hover:bg-background'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-brand-primary/5 flex items-center justify-center text-brand-primary border border-brand-primary/10">
                      <item.icon className="w-5.5 h-5.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-text-main">{item.title}</span>
                        {item.recommend && <Badge variant="info" className="px-1.5 py-0.5 text-[8px] uppercase tracking-wider font-extrabold">Recommended</Badge>}
                      </div>
                      <p className="text-xs text-text-muted mt-2 leading-relaxed">{item.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* STEP 3: AUTHENTICATION */}
          {step === 3 && (
            <Card className="p-6 space-y-6">
              <div className="space-y-1">
                <h4 className="text-xl font-display font-extrabold text-text-main">Voter Authentication Method</h4>
                <p className="text-sm text-text-muted">Select how voters prove their identity to unlock the digital ballot.</p>
              </div>

              <div className="grid sm:grid-cols-3 gap-5">
                {[
                  {
                    method: 'QR_ONLY',
                    title: 'QR Code Scan',
                    icon: QrCode,
                    desc: 'Voter scans their printed QR card to the camera. Fast, secure, and recommended for offline voting booths.',
                    recommended: true
                  },
                  {
                    method: 'ID_PASS',
                    title: 'ID + Voting Pass',
                    icon: Lock,
                    desc: 'Voter manually types their Student/Employee ID (NIS/NIK) plus their unique 6-digit PIN code.',
                    recommended: false
                  },
                  {
                    method: 'ID_QR',
                    title: 'ID + QR Dual Auth',
                    icon: UserCheck,
                    desc: 'Dual authentication requiring both Student ID entry and QR card scanning.',
                    recommended: false
                  }
                ].map((item: any) => (
                  <button
                    key={item.method}
                    type="button"
                    onClick={() => setFormData({ ...formData, authMethod: item.method })}
                    className={`p-4 rounded-xl border text-left flex items-start gap-4 transition-all duration-200 cursor-pointer ${
                      formData.authMethod === item.method ? 'bg-brand-primary/5 border-brand-primary shadow-xs' : 'bg-card border-border-main hover:bg-background'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-brand-primary/5 flex items-center justify-center text-brand-primary border border-brand-primary/10 shrink-0 mt-0.5">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="font-bold text-xs text-text-main">{item.title}</span>
                        {item.recommended && (
                          <Badge variant="info" className="px-1.5 py-0.5 text-[8px] uppercase tracking-wider font-extrabold">
                            Recommended
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-text-muted mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          )}

                    {/* STEP 4: VOTING RULES */}
          {step === 4 && (
            <Card className="p-6 space-y-6">
              <div className="space-y-1">
                <h4 className="text-xl font-display font-extrabold text-text-main">Configure Election Rules</h4>
                <p className="text-sm text-text-muted">Define the behavior of live results, ballot confirmation, and anonymity protections.</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-6 bg-background/50 border border-border-main p-6 rounded-2xl">
                <Switch
                  label="Allow Live Result"
                  description="Permit live vote tallies to be projected on the Live Count screen."
                  checked={formData.allowLiveResult}
                  onChange={(e) => setFormData({ ...formData, allowLiveResult: e.target.checked })}
                />
                <Switch
                  label="Hide Running Results from Voters"
                  description="Do not disclose total counts to voters before their submission."
                  checked={formData.hideRunningResult}
                  onChange={(e) => setFormData({ ...formData, hideRunningResult: e.target.checked })}
                />
                <Switch
                  label="Ballot Confirmation Modal"
                  description="Prompt voter with a confirmation step before submitting their ballot."
                  checked={formData.voteConfirmation}
                  onChange={(e) => setFormData({ ...formData, voteConfirmation: e.target.checked })}
                />
                <Switch
                  label="Strict Ballot Anonymity"
                  description="Record votes anonymously without linking ballots back to individual voter IDs."
                  checked={formData.anonymousVote}
                  onChange={(e) => setFormData({ ...formData, anonymousVote: e.target.checked })}
                />
              </div>
            </Card>
          )}

          {/* STEP 5: OFFLINE BOOTH SETTINGS */}
          {step === 5 && (
            <Card className="p-6 space-y-6">
              <div className="space-y-1">
                <h4 className="text-xl font-display font-extrabold text-text-main">Offline Booth Settings</h4>
                <p className="text-sm text-text-muted">Configure the interface limits of the physical voting machine kiosk booth.</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-6 bg-background/50 border border-border-main p-6 rounded-2xl">
                <Switch
                  label="Kiosk Mode Lock"
                  description="Run booth in isolated shell without navbar or sidebar displays."
                  checked={formData.enableKioskMode}
                  onChange={(e) => setFormData({ ...formData, enableKioskMode: e.target.checked })}
                />
                <Switch
                  label="Auto Logout"
                  description="Log voter out immediately after success screen completes."
                  checked={formData.autoLogout}
                  onChange={(e) => setFormData({ ...formData, autoLogout: e.target.checked })}
                />
                <Switch
                  label="Auto Return to Scan"
                  description="Return interface back to QR scanner without admin reload."
                  checked={formData.autoReturn}
                  onChange={(e) => setFormData({ ...formData, autoReturn: e.target.checked })}
                />
                <Switch
                  label="Camera Scanning Scan"
                  description="Enable camera feed scanning by default inside booth scanner."
                  checked={formData.cameraScan}
                  onChange={(e) => setFormData({ ...formData, cameraScan: e.target.checked })}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Idle Timeout Warning (seconds)"
                  type="number"
                  value={formData.idleTimeout}
                  onChange={(e) => setFormData({ ...formData, idleTimeout: parseInt(e.target.value) || 30 })}
                />
                <Input
                  label="Maximum Session Duration (seconds)"
                  type="number"
                  value={formData.sessionTimeout}
                  onChange={(e) => setFormData({ ...formData, sessionTimeout: parseInt(e.target.value) || 120 })}
                />
              </div>
            </Card>
          )}

          {/* STEP 6: CANDIDATE CONFIG & REVIEW */}
          {step === 6 && (
            <Card className="p-6 space-y-8">
              <div className="space-y-1">
                <h4 className="text-xl font-display font-extrabold text-text-main">Candidates & Review</h4>
                <p className="text-sm text-text-muted">Configure your election candidate roster, then review details and publish.</p>
              </div>

              {/* 1. Candidates List Manager */}
              <div className="space-y-4">
                <h5 className="text-sm font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                  <UsersRound className="w-4 h-4 text-brand-primary" />
                  <span>Candidate Roster ({candidates.length})</span>
                </h5>

                <div className="grid gap-3">
                  {candidates.map((cand, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-background/50 border border-border-main rounded-xl">
                      <div className="flex items-center gap-3.5">
                        {cand.photoUrl ? (
                          <img src={cand.photoUrl} alt={cand.name} className="w-12 h-12 rounded-xl object-cover border border-brand-primary/30 shadow-xs" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-linear-to-br from-brand-primary/20 to-brand-secondary/20 text-brand-primary font-black text-sm flex items-center justify-center border border-border-main">
                            #{idx + 1}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-brand-primary/10 text-brand-primary text-[11px] font-bold">
                              Paslon #{idx + 1}
                            </span>
                            <span className="font-bold text-sm text-text-main">{cand.name}</span>
                          </div>
                          <p className="text-xs text-text-muted mt-1 leading-normal">
                            <strong>Visi:</strong> {cand.vision || '-'}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeCandidate(idx)} className="text-danger hover:bg-danger/5">
                        <Trash className="w-4.5 h-4.5" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Candidate Add Form */}
                <div className="p-4.5 bg-background/30 border border-dashed border-border-main rounded-xl space-y-4">
                  <span className="text-xs font-bold text-text-main block">Tambah Calon / Paslon Baru:</span>
                  
                  <div className="grid sm:grid-cols-3 gap-3">
                    <Input
                      placeholder="Nama Calon / Paslon"
                      value={newCand.name}
                      onChange={(e) => setNewCand({ ...newCand, name: e.target.value })}
                    />
                    <Input
                      placeholder="Visi Calon"
                      value={newCand.vision}
                      onChange={(e) => setNewCand({ ...newCand, vision: e.target.value })}
                    />
                    <Input
                      placeholder="Misi Calon"
                      value={newCand.mission}
                      onChange={(e) => setNewCand({ ...newCand, mission: e.target.value })}
                    />
                  </div>

                  {/* Photo Upload & URL Inputs */}
                  <div className="grid sm:grid-cols-2 gap-3 items-center bg-card/60 p-3 rounded-xl border border-border-main">
                    <div className="flex items-center gap-3">
                      {newCand.photoUrl ? (
                        <img src={newCand.photoUrl} alt="Preview" className="w-10 h-10 rounded-lg object-cover border border-brand-primary" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-background border border-dashed border-border-main flex items-center justify-center text-text-muted text-[10px]">
                          Foto
                        </div>
                      )}
                      <label className="cursor-pointer bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary text-xs font-bold px-3 py-2 rounded-xl transition-colors">
                        <span>Upload File Foto</span>
                        <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                      </label>
                    </div>
                    <Input
                      placeholder="Atau Paste URL Foto (https://...)"
                      value={newCand.photoUrl || ''}
                      onChange={(e) => setNewCand({ ...newCand, photoUrl: e.target.value })}
                    />
                  </div>

                  <Button type="button" variant="outline" size="sm" onClick={addCandidate} className="gap-1.5 h-10 w-full justify-center">
                    <Plus className="w-4 h-4" /> Tambah Calon ke Daftar Roster
                  </Button>
                </div>
              </div>

              {/* 2. Review Config Summary */}
              <div className="border-t border-border-main pt-6 space-y-4">
                <h5 className="text-sm font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-success" />
                  <span>Configuration Summary</span>
                </h5>

                <div className="grid sm:grid-cols-2 gap-4 text-xs font-medium text-text-muted leading-relaxed">
                  <div className="space-y-1.5 bg-background p-4 rounded-xl border border-border-main">
                    <span className="font-bold text-text-main block">GENERAL</span>
                    <p>Name: <strong className="text-text-main">{formData.name}</strong></p>
                    <p>Voting Mode: <strong className="text-text-main">{formData.votingMode}</strong></p>
                    <p>Auth Method: <strong className="text-text-main">{formData.authMethod}</strong></p>
                  </div>
                  <div className="space-y-1.5 bg-background p-4 rounded-xl border border-border-main">
                    <span className="font-bold text-text-main block">VOTING RULES</span>
                    <p>Anonymous: <strong className="text-text-main">{formData.anonymousVote ? 'YES' : 'NO'}</strong></p>
                    <p>Multiple: <strong className="text-text-main">{formData.multipleCandidate ? `YES (Max ${formData.maxVotes})` : 'NO'}</strong></p>
                    <p>Live Result: <strong className="text-text-main">{formData.allowLiveResult ? 'ALLOWED' : 'HIDDEN'}</strong></p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Stepper Navigation Buttons */}
          <div className="flex items-center justify-between pt-4">
            {step > 1 ? (
              <Button type="button" variant="secondary" onClick={handleBack} disabled={isPending}>
                <ArrowLeft className="w-4.5 h-4.5 mr-2" /> Back
              </Button>
            ) : (
              <div />
            )}

            {step < 6 ? (
              <Button type="button" onClick={handleNext}>
                Next <ArrowRight className="w-4.5 h-4.5 ml-2" />
              </Button>
            ) : (
              <Button type="button" onClick={handlePublish} disabled={isPending} className="button-gradient shadow-md shadow-brand-primary/10">
                {isPending ? 'Publishing...' : 'Publish Election & Launch'}
              </Button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
