'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  RefreshCcw, 
  Users, 
  Vote, 
  Percent, 
  Award, 
  Sparkles,
  Info,
  Calendar
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

export default function LiveCountClientPage({ events, slug, orgName }: LiveCountClientProps) {
  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || '');
  const [totalVoters, setTotalVoters] = useState(0);
  const [totalVotes, setTotalVotes] = useState(0);
  const [results, setResults] = useState<CandidateResultProps[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [secondsToRefresh, setSecondsToRefresh] = useState(5);
  
  const timerRef = useRef<any>(null);
  const countdownRef = useRef<any>(null);

  // Fetch results handler
  const fetchResults = async (eventId: string) => {
    if (!eventId) return;
    setLoading(true);
    const res = await getLiveResultsAction(slug, eventId);
    setLoading(false);
    if (res?.error) {
      setErrorMsg(res.error);
    } else if (res?.success) {
      setErrorMsg(null);
      setTotalVoters(res.totalVoters || 0);
      setTotalVotes(res.totalVotes || 0);
      setResults(res.results || []);
    }
  };

  // Fetch on change of eventId
  useEffect(() => {
    if (selectedEventId) {
      fetchResults(selectedEventId);
      setSecondsToRefresh(5);
    }
  }, [selectedEventId]);

  // Handle Polling and Countdown Timers
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    if (autoRefresh && selectedEventId) {
      // Refresh database records every 5 seconds
      timerRef.current = setInterval(() => {
        fetchResults(selectedEventId);
        setSecondsToRefresh(5);
      }, 5000);

      // Smooth 1s countdown clock for progress display
      countdownRef.current = setInterval(() => {
        setSecondsToRefresh((prev) => (prev <= 1 ? 5 : prev - 1));
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [autoRefresh, selectedEventId]);

  const handleManualRefresh = () => {
    fetchResults(selectedEventId);
    setSecondsToRefresh(5);
  };

  // Math variables
  const turnoutPercent = totalVoters > 0 ? ((totalVotes / totalVoters) * 100).toFixed(1) : '0.0';
  
  // Find current leader (highest votes)
  const sortedCandidates = [...results].sort((a, b) => b.votesCount - a.votesCount);
  const currentLeader = totalVotes > 0 && sortedCandidates[0]?.votesCount > 0 ? sortedCandidates[0] : null;

  if (events.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-display font-extrabold text-text-main">Live Results</h3>
        </div>
        <Card className="border-2 border-dashed border-border-main p-12 text-center bg-card/50 backdrop-blur-md">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-text-main">No Published Elections Found</h4>
            <p className="text-xs text-text-muted">
              There are currently no published elections in this organization. Go to the Events Wizard to create and publish a new election first.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Controller Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/60 border border-border-main p-4 rounded-2xl shadow-xs backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-display font-extrabold text-text-main leading-tight">Live Vote Audit Room</h3>
            <p className="text-[10px] text-text-muted font-bold block">Real-time election tracking console</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3.5">
          {/* Election Select */}
          <div className="relative">
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="bg-card text-text-main border border-border-main text-xs rounded-xl px-3.5 py-2.5 pr-8 font-bold focus:outline-none focus:border-brand-primary transition-all cursor-pointer appearance-none shadow-xs"
            >
              {events.map((evt: any) => (
                <option key={evt.id} value={evt.id}>
                  {evt.name}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
              ▼
            </div>
          </div>

          {/* Polling Switch & Refresh Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoRefresh(prev => !prev)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all duration-200
                ${autoRefresh 
                  ? 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary' 
                  : 'bg-card border-border-main text-text-muted'
                }
              `}
            >
              <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-success animate-pulse' : 'bg-text-muted/65'}`} />
              <span>{autoRefresh ? `Auto Refreshing (${secondsToRefresh}s)` : 'Auto Refresh Off'}</span>
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
        <Card className="border-border-main bg-card shadow-xs">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-text-muted uppercase tracking-wider font-bold block">Registered Roster</span>
              <span className="text-xl font-extrabold text-text-main block tracking-tight mt-0.5">{totalVoters}</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Ballots Cast */}
        <Card className="border-border-main bg-card shadow-xs">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-secondary/10 flex items-center justify-center text-brand-secondary shrink-0">
              <Vote className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-text-muted uppercase tracking-wider font-bold block">Ballots Cast</span>
              <span className="text-xl font-extrabold text-text-main block tracking-tight mt-0.5">{totalVotes}</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Voter Turnout Rate */}
        <Card className="border-border-main bg-card shadow-xs">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center text-success shrink-0">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-text-muted uppercase tracking-wider font-bold block">Turnout Rate</span>
              <span className="text-xl font-extrabold text-text-main block tracking-tight mt-0.5">{turnoutPercent}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leader Showcase banner if exists */}
      {currentLeader && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden bg-linear-to-r from-brand-primary/10 via-brand-secondary/10 to-brand-primary/5 border border-brand-primary/20 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          {/* Sparkle effects */}
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Sparkles className="w-24 h-24 text-brand-primary" />
          </div>

          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-linear-to-tr from-yellow-400 to-amber-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-yellow-500/10">
              <Award className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <Badge variant="warning" className="uppercase font-bold tracking-wider text-[9px] px-2 py-0.5">CURRENT LEADER</Badge>
              <h4 className="text-md font-display font-extrabold text-text-main mt-1">
                Candidate #{currentLeader.number} — {currentLeader.name}
              </h4>
              <p className="text-xs text-text-muted">Leading with {currentLeader.votesCount} votes cast ({((currentLeader.votesCount / totalVotes) * 100).toFixed(1)}%).</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Candidate Bars Chart Panel */}
      <Card className="border-border-main bg-card shadow-xs">
        <CardContent className="p-6 space-y-6">
          <div className="border-b border-border-main pb-4">
            <h4 className="text-md font-display font-extrabold text-text-main">Voter Preference Distribution</h4>
            <p className="text-xs text-text-muted">Visual distribution chart of candidate votes</p>
          </div>

          {results.length === 0 ? (
            <div className="text-center py-10 text-text-muted text-xs font-semibold">
              No candidates registered for this event.
            </div>
          ) : (
            <div className="space-y-6">
              {results.map((c: any) => {
                const percent = totalVotes > 0 ? ((c.votesCount / totalVotes) * 100).toFixed(1) : '0.0';
                const isLeader = currentLeader?.id === c.id;
                
                return (
                  <div key={c.id} className="space-y-2.5">
                    {/* Header info */}
                    <div className="flex items-center justify-between text-xs font-bold">
                      <div className="flex items-center gap-2">
                        <span className={`w-5.5 h-5.5 rounded-lg flex items-center justify-center text-[10px] font-extrabold text-white shrink-0
                          ${isLeader ? 'bg-brand-primary' : 'bg-text-muted/65'}
                        `}>
                          {c.number}
                        </span>
                        <span className={`text-sm tracking-tight ${isLeader ? 'text-brand-primary font-black' : 'text-text-main'}`}>
                          {c.name}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-text-muted">{c.votesCount} votes</span>
                        <Badge variant={isLeader ? 'success' : 'default'} className="font-extrabold text-[10px] px-2 py-0.5">
                          {percent}%
                        </Badge>
                      </div>
                    </div>

                    {/* Visual bar chart */}
                    <div className="h-5 w-full bg-background border border-border-main rounded-xl overflow-hidden relative shadow-inner">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className={`h-full rounded-r-lg transition-all
                          ${isLeader 
                            ? 'bg-linear-to-r from-brand-primary to-brand-secondary shadow-md' 
                            : 'bg-text-muted/20'
                          }
                        `}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
