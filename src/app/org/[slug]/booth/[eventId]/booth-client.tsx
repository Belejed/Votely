'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import jsQR from 'jsqr';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Vote, 
  QrCode, 
  Lock, 
  Camera, 
  CameraOff, 
  CheckCircle2, 
  LogOut, 
  HelpCircle, 
  User, 
  ShieldAlert,
  ArrowRight,
  RefreshCcw,
  BookOpen,
  Sparkles
} from 'lucide-react';
import { authenticateVoterAction, castVoteAction, exitVoterSessionAction } from '../actions';

interface CandidateProps {
  id: string;
  number: number;
  name: string;
  vision: string;
  mission: string;
  socialMedia: any;
}

interface BoothClientProps {
  voters?: {
    id: string;
    name: string;
    studentId: string | null;
    qrToken: string;
    votingPass: string;
    class?: string;
  }[];
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
  };
  candidates: CandidateProps[];
  settings: {
    enableBoothMode: boolean;
    enableKioskMode: boolean;
    fullscreen: boolean;
    autoLogout: boolean;
    autoReturn: boolean;
    idleTimeout: number;
    sessionTimeout: number;
    cameraScan: boolean;
  };
  slug: string;
  orgName: string;
}

type BoothState = 'SCANNER' | 'CANDIDATES' | 'CONFIRMATION' | 'SUCCESS';

export default function BoothClientPage({ event, candidates, settings, slug, orgName, voters = [] }: BoothClientProps) {
  const [boothState, setBoothState] = useState<BoothState>('SCANNER');
  const [isPending, setIsPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Voter & Ballot State
  const [activeVoter, setActiveVoter] = useState<{ id: string; name: string; studentId: string | null } | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateProps | null>(null);

  // Form State
  const [manualId, setManualId] = useState('');
  const [manualPass, setManualPass] = useState('');

  // Camera & Scanning Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const cameraActiveRef = useRef(false);
  const [cameraError, setCameraError] = useState(false);
  const scanIntervalRef = useRef<any>(null);
  const cameraRetryTimeoutRef = useRef<any>(null);

  // Timeouts & Auto-return State
  const [successCountdown, setSuccessCountdown] = useState(5);
  const successTimerRef = useRef<any>(null);
  const idleTimerRef = useRef<any>(null);

  // Reset Idle timer on mouse movement
  useEffect(() => {
    if (boothState === 'CANDIDATES' || boothState === 'CONFIRMATION') {
      resetIdleTimeout();
      window.addEventListener('mousemove', resetIdleTimeout);
      window.addEventListener('keypress', resetIdleTimeout);
      return () => {
        window.removeEventListener('mousemove', resetIdleTimeout);
        window.removeEventListener('keypress', resetIdleTimeout);
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      };
    }
  }, [boothState]);

  const resetIdleTimeout = () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      // Auto logout on idle timeout
      handleLogout();
    }, settings.idleTimeout * 1000);
  };

  // Launch Camera scanner only if election auth method utilizes QR
  useEffect(() => {
    const usesCamera = event.authMethod === 'QR_ONLY' || event.authMethod === 'ID_QR';
    if (boothState === 'SCANNER' && settings.cameraScan && usesCamera && !cameraActive) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [boothState, event.authMethod]);

  // Auto logout when success countdown reaches 0
  useEffect(() => {
    if (boothState === 'SUCCESS' && successCountdown === 0) {
      handleLogout();
    }
  }, [successCountdown, boothState]);

  // Start Camera
  const startCamera = async () => {
    setCameraError(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
        cameraActiveRef.current = true;
        // Start QR scanning loop
        scanIntervalRef.current = setInterval(scanFrame, 150);
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError(true);
      setCameraActive(false);
      cameraActiveRef.current = false;
      
      // Auto-retry starting camera after 3 seconds
      if (cameraRetryTimeoutRef.current) clearTimeout(cameraRetryTimeoutRef.current);
      cameraRetryTimeoutRef.current = setTimeout(() => {
        if (boothState === 'SCANNER' && settings.cameraScan && !cameraActiveRef.current) {
          console.log("Votely Scanner: Retrying camera access...");
          startCamera();
        }
      }, 3000);
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (cameraRetryTimeoutRef.current) {
      clearTimeout(cameraRetryTimeoutRef.current);
      cameraRetryTimeoutRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track: any) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    cameraActiveRef.current = false;
  };

  // Scan frame from video feed
  const scanFrame = () => {
    if (!videoRef.current || !canvasRef.current || !cameraActiveRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Prevent index size error if video dimensions are not initialized yet
    if (video.videoWidth === 0 || video.videoHeight === 0) return;
    
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    if (ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Enhance contrast to cancel out monitor moire lines/reflections
      ctx.filter = 'contrast(1.4) brightness(1.1)';
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Reset filter for normal rendering
      ctx.filter = 'none';
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // ESM vs CJS default export safety fallback
      const parseQR = typeof jsQR === 'function' ? jsQR : (jsQR as any).default;
      if (!parseQR) {
        console.error("Votely Scanner Debug: jsQR is undefined at runtime!");
        return;
      }
      
      try {
        const code = parseQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        });

        if (code) {
          console.log("Votely Scanner Debug: QR detected!", code.data);
          const scannedToken = code.data;
          const tokenMatch = scannedToken.match(/VTLY-[A-Z0-9]+/i);
          if (tokenMatch) {
            const cleanToken = tokenMatch[0].toUpperCase();
            console.log("Votely Scanner Debug: Valid token found!", cleanToken);
            stopCamera();
            triggerVoterAuth({ qrToken: cleanToken });
          } else {
            console.warn("Votely Scanner Debug: QR detected but token does not match VTLY- format:", scannedToken);
          }
        }
      } catch (err) {
        console.error("Votely Scanner Debug: Error decoding QR frame:", err);
      }
    }
  };

  // Trigger authentication API
  const triggerVoterAuth = (creds: { qrToken?: string; studentId?: string; votingPass?: string }) => {
    setErrorMsg(null);
    setIsPending(true);
    (async () => {
      try {
        const res = await authenticateVoterAction(slug, event.id, creds);
        if (res?.error) {
          setErrorMsg(res.error);
          if (settings.cameraScan) {
            // Restart camera scanner after 2 seconds cooldown to prevent infinite scan loops
            setTimeout(() => {
              startCamera();
            }, 2000);
          }
        } else if (res?.success && res.voter) {
          setActiveVoter(res.voter);
          setBoothState('CANDIDATES');
        }
      } catch (err) {
        console.error("Votely Scanner: Authentication error:", err);
      } finally {
        setIsPending(false);
      }
    })();
  };

  // Manual Login click
  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualId.trim() || !manualPass.trim()) {
      setErrorMsg('Please enter both student ID and passcode.');
      return;
    }
    stopCamera();
    triggerVoterAuth({ studentId: manualId, votingPass: manualPass });
  };

  // Select Candidate trigger
  const handleSelectCandidate = (candidate: CandidateProps) => {
    setSelectedCandidate(candidate);
    if (event.voteConfirmation) {
      setBoothState('CONFIRMATION');
    } else {
      handleCastVote(candidate.id);
    }
  };

  // Cast vote trigger
  const handleCastVote = async (candidateId: string) => {
    if (!activeVoter) return;
    setErrorMsg(null);
    setIsPending(true);
    try {
      const res = await castVoteAction(slug, event.id, candidateId, activeVoter.id);
      if (res?.error) {
        setErrorMsg(res.error);
        setBoothState('CANDIDATES');
      } else if (res?.success) {
        // Success checkmark, confetti burst
        setBoothState('SUCCESS');
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });
        
        // Start countdown to auto logout back to scanner
        setSuccessCountdown(5);
        successTimerRef.current = setInterval(() => {
          setSuccessCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(successTimerRef.current);
            }
            return Math.max(0, prev - 1);
          });
        }, 1000);
      }
    } catch (err) {
      console.error("Votely Scanner: Error casting vote:", err);
    } finally {
      setIsPending(false);
    }
  };

  // Logout/Return to scanner
  const handleLogout = async () => {
    if (successTimerRef.current) clearInterval(successTimerRef.current);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    
    await exitVoterSessionAction();
    setActiveVoter(null);
    setSelectedCandidate(null);
    setManualId('');
    setManualPass('');
    setErrorMsg(null);
    setBoothState('SCANNER');
  };

  // Developer simulated scans (Greenwood High Seed Voters)
  const simulateScan = (qr: string) => {
    stopCamera();
    triggerVoterAuth({ qrToken: qr });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between select-none overflow-hidden relative" suppressHydrationWarning>
      {/* Top Banner (Header) */}
      <header className="bg-card border-b border-border-main py-4 px-8 flex items-center justify-between shadow-xs shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8.5 h-8.5 rounded-lg bg-brand-primary flex items-center justify-center text-white shadow-xs">
            <Vote className="w-4.5 h-4.5" />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-sm text-text-main block leading-none">{orgName} Electronic Ballot</h2>
            <span className="text-[10px] text-text-muted font-bold block mt-1 leading-none">{event.name}</span>
          </div>
        </div>
        {activeVoter && (
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-text-muted">
              <User className="w-4 h-4 text-brand-primary" />
              <span>Voter: <strong className="text-text-main">{activeVoter.name}</strong></span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-danger hover:bg-danger/5 gap-1.5 h-9 px-3">
              <LogOut className="w-4 h-4" /> Cancel Session
            </Button>
          </div>
        )}
      </header>

      {/* Main Body */}
      <main className="flex-1 flex items-center justify-center p-8 z-10 relative overflow-y-auto">
        <AnimatePresence mode="wait">
          
          {/* STATE 1: CONTEXTUAL AUTH PORTAL */}
          {boothState === 'SCANNER' && (
            <motion.div
              key="scanner"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className={`w-full ${event.authMethod === 'ID_PASS' ? 'max-w-md mx-auto' : event.authMethod === 'QR_ONLY' ? 'max-w-lg mx-auto' : 'max-w-4xl grid md:grid-cols-2 gap-8 items-center'}`}
            >
              {/* CAMERA SCANNER CARD (Visible for QR_ONLY and ID_QR) */}
              {(event.authMethod === 'QR_ONLY' || event.authMethod === 'ID_QR') && (
                <div className="space-y-4">
                  <Card className="overflow-hidden border-2 border-brand-primary/10 shadow-xl purple-glow bg-card/90 backdrop-blur-md">
                    <div className="p-4 border-b border-border-main bg-background/30 flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-text-main flex items-center gap-1.5">
                        <Camera className="w-4.5 h-4.5 text-brand-primary" /> Camera QR Scanner
                      </span>
                      <Badge variant="success">SCANNER ACTIVE</Badge>
                    </div>
                    
                    <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                      <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                      <canvas ref={canvasRef} className="hidden" />

                      {/* Scanning Aim box */}
                      {cameraActive && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-48 h-48 border-2 border-dashed border-brand-secondary/80 rounded-2xl relative animate-pulse-slow flex items-center justify-center">
                            <QrCode className="w-8 h-8 text-white/40" />
                            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-brand-primary" />
                            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-brand-primary" />
                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-brand-primary" />
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-brand-primary" />
                          </div>
                        </div>
                      )}

                      {(!cameraActive || cameraError) && (
                        <div className="absolute inset-0 bg-slate-900 text-slate-400 flex flex-col items-center justify-center p-6 text-center gap-3">
                          <CameraOff className="w-10 h-10 text-slate-500" />
                          <div>
                            <h5 className="font-bold text-xs text-white">Camera Access Blocked / Unavailable</h5>
                            <p className="text-[10px] text-slate-400 max-w-xs mt-1">Please grant web-camera permissions in the browser to scan cards. Or enter credentials manually below.</p>
                          </div>
                          <Button size="sm" variant="outline" onClick={startCamera} className="border-slate-700 hover:bg-slate-800 text-white mt-1 gap-1.5">
                            <RefreshCcw className="w-3.5 h-3.5" /> Retry Camera
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="p-4 text-center text-xs text-text-muted">
                      Position your printed invitation QR code card directly in front of the lens.
                    </div>
                  </Card>
                </div>
              )}

              {/* ID + PASS FORM CARD (Visible for ID_PASS and ID_QR, or as standalone card) */}
              {(event.authMethod === 'ID_PASS' || event.authMethod === 'ID_QR' || event.authMethod === 'QR_ONLY') && (
                <div className="space-y-4">
                  <Card className="p-7 border-border-main bg-card shadow-xl rounded-3xl">
                    <div className="space-y-2 mb-6 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mx-auto mb-3">
                        <Lock className="w-6 h-6" />
                      </div>
                      <Badge variant="info" className="px-2.5 py-0.5 text-[10px] uppercase font-extrabold tracking-wider">
                        {event.authMethod === 'ID_PASS' ? 'Voter Passcode Verification' : 'Manual Entry Fallback'}
                      </Badge>
                      <h4 className="text-xl font-display font-extrabold text-text-main">
                        {event.authMethod === 'ID_PASS' ? 'Sign In to Ballot' : 'Manual Verification'}
                      </h4>
                      <p className="text-xs text-text-muted leading-relaxed">
                        {event.authMethod === 'ID_PASS' 
                          ? 'Enter your registered Student / Employee ID and 6-digit passcode to unlock your official ballot.'
                          : 'If you do not have a printed QR card, enter your ID and passcode manually.'}
                      </p>
                    </div>

                    {errorMsg && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 p-3.5 bg-danger/10 border border-danger/20 text-danger rounded-xl text-xs font-semibold flex items-center gap-2.5">
                        <ShieldAlert className="w-4.5 h-4.5 shrink-0" />
                        <span>{errorMsg}</span>
                      </motion.div>
                    )}

                    <form onSubmit={handleManualLogin} className="space-y-4">
                      <Input
                        label="Student / Employee ID"
                        placeholder="e.g. GW-001 / NIS"
                        value={manualId}
                        onChange={(e) => setManualId(e.target.value)}
                        required
                      />

                      <Input
                        label="6-Digit Voting Passcode"
                        type="password"
                        placeholder="••••••"
                        value={manualPass}
                        onChange={(e) => setManualPass(e.target.value)}
                        required
                      />

                      <Button type="submit" className="w-full h-11 button-gradient mt-2 font-bold shadow-md shadow-brand-primary/15" disabled={isPending}>
                        {isPending ? 'Verifying Credentials...' : 'Verify & Open Ballot'}
                      </Button>
                    </form>
                  </Card>
                </div>
              )}
            </motion.div>
          )}

          {/* STATE 2: CANDIDATE GRID PAGE */}
          {boothState === 'CANDIDATES' && activeVoter && (
            <motion.div
              key="candidates"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full max-w-5xl space-y-8"
            >
              <div className="text-center space-y-2">
                <Badge variant="info">STEP 2: BALLOT ROSTER</Badge>
                <h3 className="text-2xl sm:text-3xl font-display font-extrabold text-text-main">Select Your Candidate</h3>
                <p className="text-xs text-text-muted max-w-lg mx-auto">Please review candidate profiles carefully, then tap the Vote button to register your selection.</p>
              </div>

              {errorMsg && (
                <div className="p-3.5 bg-danger/10 border border-danger/20 text-danger rounded-xl text-xs font-semibold flex items-center gap-2.5">
                  <ShieldAlert className="w-4.5 h-4.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {candidates.map((cand: any) => (
                  <Card key={cand.id} hoverLift className="flex flex-col justify-between p-5 bg-card border-2 border-border-main hover:border-brand-primary/60 transition-all rounded-3xl relative overflow-hidden shadow-sm hover:shadow-xl">
                    {/* Candidate Number Floating Badge */}
                    <div className="absolute top-3 right-3 z-10 w-11 h-11 bg-brand-primary text-white flex items-center justify-center font-display font-black text-lg rounded-2xl shadow-md">
                      #{cand.number}
                    </div>

                    <div className="space-y-3.5">
                      {/* Proportional Photo Frame */}
                      <div className="w-full h-44 rounded-2xl overflow-hidden bg-background border border-border-main flex items-center justify-center relative">
                        {cand.photoUrl ? (
                          <img src={cand.photoUrl} alt={cand.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-1.5 text-brand-primary">
                            <User className="w-10 h-10 opacity-40" />
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
                      <Button onClick={() => handleSelectCandidate(cand)} className="w-full button-gradient font-bold h-12 text-sm shadow-md shadow-brand-primary/20" disabled={isPending}>
                        Coblos Paslon #{cand.number}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

          {/* STATE 3: BALLOT CONFIRMATION */}
          {boothState === 'CONFIRMATION' && activeVoter && selectedCandidate && (
            <motion.div
              key="confirmation"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md"
            >
              <Card className="p-6 text-center border-2 border-brand-primary/10 shadow-2xl space-y-6">
                <div className="w-16 h-16 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary mx-auto">
                  <HelpCircle className="w-8 h-8" />
                </div>
                
                <div className="space-y-2">
                  <Badge variant="warning" className="px-3 py-1 font-bold">CONFIRM BALLOT SELECTION</Badge>
                  <h4 className="text-xl font-display font-extrabold text-text-main">Submit Your Vote?</h4>
                  <p className="text-xs text-text-muted px-4 leading-relaxed">
                    You are casting your official ballot for:
                  </p>
                </div>

                <div className="p-4 bg-background border border-border-main rounded-2xl text-left space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-brand-primary/15 text-brand-primary font-bold text-xs flex items-center justify-center">
                      {selectedCandidate.number}
                    </span>
                    <strong className="text-text-main text-sm">{selectedCandidate.name}</strong>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed pl-9">
                    <strong>Vision:</strong> {selectedCandidate.vision || 'No vision statement.'}
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button onClick={() => handleCastVote(selectedCandidate.id)} className="flex-1 button-gradient h-11" disabled={isPending}>
                    {isPending ? 'Registering...' : 'Yes, Confirm Vote'}
                  </Button>
                  <Button variant="secondary" onClick={() => setBoothState('CANDIDATES')} className="w-28" disabled={isPending}>
                    Change
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* STATE 4: SUCCESS & AUTO LOGOUT */}
          {boothState === 'SUCCESS' && (
            <motion.div
              key="success"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md"
            >
              <Card className="p-8 text-center border-border-main shadow-2xl space-y-6">
                <div className="w-20 h-20 rounded-full bg-success/15 border border-success/30 flex items-center justify-center text-success mx-auto animate-pulse">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div className="space-y-2">
                  <h4 className="text-2xl font-display font-extrabold text-text-main">Ballot Registered!</h4>
                  <p className="text-xs text-text-muted px-2 leading-relaxed">
                    Your vote has been written cryptographically to the database anonymously. Thank you for participating in the election!
                  </p>
                </div>

                <div className="py-2.5 px-4 bg-background border border-border-main rounded-xl inline-flex items-center gap-2 text-xs font-bold text-text-muted uppercase tracking-wider mx-auto">
                  <div className="w-2 h-2 rounded-full bg-success animate-ping" />
                  <span>Returning to scanner in {successCountdown}...</span>
                </div>

                <Button onClick={handleLogout} className="w-full" variant="secondary">
                  Logout Session
                </Button>
              </Card>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Footer Info */}
      <footer className="py-4 px-8 border-t border-border-main/50 bg-background/50 flex items-center justify-between shrink-0 text-[10px] text-text-muted uppercase tracking-wider font-semibold z-10">
        <span>🔒 Secure Voting Node • Votely SaaS v1.0</span>
        <span>Status: Online</span>
      </footer>
    </div>
  );
}
