'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Vote, Lock, HelpCircle } from 'lucide-react';

interface PrintVoterProps {
  id: string;
  name: string;
  studentId: string | null;
  class: string | null;
  department: string | null;
  qrToken: string;
  votingPass: string;
  invitationNum: string;
}

interface PrintClientProps {
  voters: PrintVoterProps[];
  layout: string;
  orgName: string;
  eventName: string;
  eventDate: string;
}

export default function PrintClientPage({ voters, layout, orgName, eventName, eventDate }: PrintClientProps) {
  const [qrUrls, setQrUrls] = useState<{ [token: string]: string }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Generate QR codes for all voters
    const generateAllQrs = async () => {
      const urls: { [token: string]: string } = {};
      try {
        for (const voter of voters) {
          urls[voter.qrToken] = await QRCode.toDataURL(voter.qrToken, {
            margin: 1,
            width: 150,
          });
        }
        setQrUrls(urls);
        setLoading(false);
      } catch (err) {
        console.error('Error generating print QRs:', err);
        setLoading(false);
      }
    };

    generateAllQrs();
  }, [voters]);

  useEffect(() => {
    if (!loading && Object.keys(qrUrls).length === voters.length && voters.length > 0) {
      // Small timeout to allow images to paint in DOM, then open print dialog
      const timer = setTimeout(() => {
        window.print();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [loading, qrUrls, voters]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-text-main font-bold">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-4 border-brand-primary border-t-transparent animate-spin" />
          <span>Generating Printable QR Ballots...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black p-0 m-0 print-root">
      {/* CSS print-specific overrides */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            body {
              background: white !important;
              color: black !important;
            }
            .print-root {
              padding: 0 !important;
              margin: 0 !important;
            }
            .no-print {
              display: none !important;
            }
            .page-break {
              page-break-after: always;
            }
          }
          .card-grid-2 {
            display: grid;
            grid-template-columns: 1fr;
            gap: 20px;
          }
          .card-grid-4 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
          }
          .card-grid-8 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: repeat(4, auto);
            gap: 10px;
          }
        `
      }} />

      {/* Floating no-print controls */}
      <div className="no-print bg-slate-900 text-white p-4 fixed bottom-6 right-6 rounded-2xl shadow-xl flex items-center gap-4 z-50">
        <span className="text-xs font-bold font-mono">PRINT MODE ACTIVE ({voters.length} Cards)</span>
        <button 
          onClick={() => window.print()}
          className="bg-brand-primary hover:bg-purple-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl cursor-pointer transition-colors"
        >
          Print Sheet
        </button>
        <button 
          onClick={() => window.close()}
          className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl cursor-pointer transition-colors"
        >
          Close Tab
        </button>
      </div>

      {/* Renders cards in grid based on choice */}
      <div className={`p-4 mx-auto max-w-4xl ${
        layout === '2' ? 'card-grid-2' : 
        layout === '8' ? 'card-grid-8' : 'card-grid-4'
      }`}>
        {voters.map((voter, index) => {
          // Calculate page breaks for multiple pages
          const cardsPerPage = parseInt(layout);
          const isPageBreak = (index + 1) % cardsPerPage === 0 && index + 1 !== voters.length;

          return (
            <React.Fragment key={voter.id}>
              {/* Card Container */}
              <div className="border border-slate-300 rounded-2xl p-4 bg-white flex flex-col justify-between aspect-[1.41/1] overflow-hidden text-left relative page-card shadow-xs">
                {/* Visual cut markers for printing */}
                <div className="absolute top-0 left-0 w-3 h-[1px] bg-slate-300" />
                <div className="absolute top-0 left-0 w-[1px] h-3 bg-slate-300" />
                <div className="absolute top-0 right-0 w-3 h-[1px] bg-slate-300" />
                <div className="absolute top-0 right-0 w-[1px] h-3 bg-slate-300" />
                <div className="absolute bottom-0 left-0 w-3 h-[1px] bg-slate-300" />
                <div className="absolute bottom-0 left-0 w-[1px] h-3 bg-slate-300" />
                <div className="absolute bottom-0 right-0 w-3 h-[1px] bg-slate-300" />
                <div className="absolute bottom-0 right-0 w-[1px] h-3 bg-slate-300" />

                {/* Card Top Brand */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <Vote className="w-4.5 h-4.5 text-purple-700" />
                    <div>
                      <span className="font-extrabold text-[11px] block leading-none">{orgName}</span>
                      <span className="text-[8px] text-slate-500 font-bold block mt-0.5">{eventName}</span>
                    </div>
                  </div>
                  <span className="font-mono text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    {voter.invitationNum}
                  </span>
                </div>

                {/* Card Middle Body */}
                <div className="flex items-center gap-4 flex-1">
                  {/* Voter Info */}
                  <div className="flex-1 space-y-1">
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Official Ballot Voter</span>
                    <h5 className="font-extrabold text-sm text-slate-900 leading-tight truncate">{voter.name}</h5>
                    <p className="text-[10px] text-slate-500">ID: {voter.studentId || '—'}</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5 leading-none">
                      {voter.class || ''} {voter.department ? `• ${voter.department}` : ''}
                    </p>
                  </div>

                  {/* QR Image */}
                  <div className="w-24 h-24 shrink-0 flex items-center justify-center border border-slate-200 rounded-xl bg-white">
                    {qrUrls[voter.qrToken] ? (
                      <img src={qrUrls[voter.qrToken]} alt="Voter QR" className="w-22 h-22" />
                    ) : (
                      <div className="text-[8px]">QR Loading...</div>
                    )}
                  </div>
                </div>

                {/* Card Bottom Instructions & Passcode */}
                <div className="border-t border-slate-200 pt-2 mt-2 flex items-center justify-between text-[9px] text-slate-500 leading-relaxed font-semibold">
                  <div className="flex items-center gap-1.5 bg-purple-50 text-purple-800 border border-purple-100 rounded-lg px-2.5 py-1.5 font-bold">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Passcode: <span className="font-mono text-sm tracking-wider font-extrabold ml-1">{voter.votingPass}</span></span>
                  </div>
                  <div className="text-right text-[8px] text-slate-400 font-bold uppercase leading-none">
                    <span>Scan QR at booth to vote</span>
                  </div>
                </div>
              </div>

              {/* Page break marker */}
              {isPageBreak && <div className="page-break" />}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
