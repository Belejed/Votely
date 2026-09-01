'use client';

import React, { useEffect, useState, useMemo } from 'react';
import QRCode from 'qrcode';
import { Vote, Lock, Printer, ArrowLeft, Layers, Filter } from 'lucide-react';
import Link from 'next/link';

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
  slug: string;
  initialClassFilter: string;
  availableClasses: string[];
  eventName: string;
  eventDate: string;
}

export default function PrintClientPage({ 
  voters, 
  layout: initialLayout, 
  orgName, 
  slug, 
  initialClassFilter, 
  availableClasses, 
  eventName, 
  eventDate 
}: PrintClientProps) {
  const [layout, setLayout] = useState<'2' | '4' | '8'>(initialLayout as any || '4');
  const [classFilter, setClassFilter] = useState<string>(initialClassFilter || 'ALL');
  const [qrUrls, setQrUrls] = useState<{ [token: string]: string }>({});
  const [loading, setLoading] = useState(true);

  // Filtered voters for printing
  const displayedVoters = useMemo(() => {
    if (classFilter === 'ALL') return voters;
    return voters.filter(v => v.class && v.class.trim() === classFilter);
  }, [voters, classFilter]);

  useEffect(() => {
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-black font-bold">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-4 border-purple-600 border-t-transparent animate-spin" />
          <span className="text-sm">Menyiapkan Lembar Kartu Undangan DPT...</span>
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

      {/* Top Floating Controls Toolbar (Hidden on Print) */}
      <div className="no-print bg-slate-900 text-white p-4 sticky top-0 z-50 shadow-xl border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/org/${slug}/voters`}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 px-3 py-2 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali
          </Link>
          <div>
            <h3 className="text-sm font-black text-white">Cetak Kartu Undangan DPT</h3>
            <p className="text-[11px] text-slate-400">
              Instansi: <span className="text-purple-400 font-bold">{orgName}</span> • Total: <span className="text-emerald-400 font-bold">{displayedVoters.length} Kartu</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Class Filter */}
          <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
            <Filter className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-xs font-bold text-slate-300">Kelas:</span>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="bg-transparent text-white text-xs font-bold focus:outline-hidden cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-white">Semua Kelas ({voters.length})</option>
              {availableClasses.map(cls => (
                <option key={cls} value={cls} className="bg-slate-900 text-white">
                  Kelas {cls} ({voters.filter(v => v.class === cls).length} Kartu)
                </option>
              ))}
            </select>
          </div>

          {/* Layout Selector */}
          <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-xs font-bold text-slate-300">Layout:</span>
            <select
              value={layout}
              onChange={(e: any) => setLayout(e.target.value)}
              className="bg-transparent text-white text-xs font-bold focus:outline-hidden cursor-pointer"
            >
              <option value="2" className="bg-slate-900 text-white">2 Kartu / Halaman</option>
              <option value="4" className="bg-slate-900 text-white">4 Kartu / Halaman</option>
              <option value="8" className="bg-slate-900 text-white">8 Kartu / Halaman (Hemat Kertas)</option>
            </select>
          </div>

          {/* Print Button */}
          <button
            onClick={() => window.print()}
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer transition-colors flex items-center gap-2 shadow-lg shadow-purple-600/30"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Simpan PDF ({displayedVoters.length} Kartu)</span>
          </button>
        </div>
      </div>

      {/* Cards Container */}
      <div className="p-6 max-w-5xl mx-auto">
        {displayedVoters.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            <p className="font-bold text-sm">Tidak ada kartu pemilih untuk filter kelas yang dipilih.</p>
          </div>
        ) : (
          <div className={`card-grid-${layout}`}>
            {displayedVoters.map((voter, index) => {
              const cardsPerPage = parseInt(layout);
              const isLastCardOnPage = (index + 1) % cardsPerPage === 0 && index !== displayedVoters.length - 1;

              return (
                <React.Fragment key={voter.id}>
                  <div className={`border-2 border-slate-800 rounded-2xl p-4 bg-white flex flex-col justify-between relative overflow-hidden shadow-xs ${
                    layout === '8' ? 'p-3' : layout === '2' ? 'p-6' : 'p-4'
                  }`}>
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-xs">
                          <Vote className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-black text-xs block text-slate-900 leading-tight uppercase tracking-wider">{orgName}</span>
                          <span className="text-[10px] text-slate-500 font-bold block">{eventName}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] bg-slate-100 text-slate-700 font-mono font-bold px-2 py-0.5 rounded-md block">
                          {voter.invitationNum}
                        </span>
                        <span className="text-[9px] text-slate-400 block mt-0.5 font-bold">KARTU SUARA DPT</span>
                      </div>
                    </div>

                    {/* Body Info & QR */}
                    <div className="flex items-center justify-between gap-3 my-2">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div>
                          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Nama Lengkap</span>
                          <span className={`font-black text-slate-900 block truncate ${layout === '8' ? 'text-xs' : 'text-sm'}`}>
                            {voter.name}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">NIS / NIK</span>
                            <span className="font-mono font-bold text-xs text-slate-800 block">
                              {voter.studentId || '-'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Kelas / Jurusan</span>
                            <span className="font-bold text-xs text-purple-700 block truncate">
                              {voter.class ? `${voter.class}` : '-'} {voter.department ? `(${voter.department})` : ''}
                            </span>
                          </div>
                        </div>

                        {/* PIN Passcode Box */}
                        <div className="mt-2 bg-slate-50 border border-slate-200 rounded-xl p-2 flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <Lock className="w-3.5 h-3.5 text-purple-600" />
                            <span className="text-[10px] font-bold">PIN Coblos:</span>
                          </div>
                          <span className="font-mono font-black text-sm text-slate-900 tracking-widest bg-white px-2 py-0.5 rounded border border-slate-300 shadow-xs">
                            {voter.votingPass}
                          </span>
                        </div>
                      </div>

                      {/* QR Code */}
                      <div className="flex flex-col items-center justify-center shrink-0">
                        {qrUrls[voter.qrToken] ? (
                          <div className="p-1 bg-white border border-slate-300 rounded-xl shadow-xs">
                            <img 
                              src={qrUrls[voter.qrToken]} 
                              alt="QR Ballot Code" 
                              className={`${layout === '8' ? 'w-18 h-18' : layout === '2' ? 'w-26 h-26' : 'w-22 h-22'} rounded-lg`} 
                            />
                          </div>
                        ) : (
                          <div className="w-20 h-20 bg-slate-100 rounded-xl flex items-center justify-center">
                            <span className="text-[9px] text-slate-400">QR Loading</span>
                          </div>
                        )}
                        <span className="text-[8px] font-mono text-slate-400 mt-1 block">Scan di Bilik</span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-slate-100 pt-2 mt-2 flex items-center justify-between text-[9px] text-slate-400 font-medium">
                      <span>Gunakan QR / PIN untuk memilih di Bilik Suara</span>
                      <span className="font-bold text-slate-500">Votely by Belejed</span>
                    </div>
                  </div>

                  {/* Page break marker */}
                  {isLastCardOnPage && <div className="page-break" />}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
