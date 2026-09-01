'use client';

import React, { useEffect, useState, useMemo } from 'react';
import QRCode from 'qrcode';
import { 
  Vote, 
  Lock, 
  Printer, 
  ArrowLeft, 
  Layers, 
  Filter, 
  Scissors, 
  QrCode, 
  ShieldCheck, 
  CheckCircle2,
  Calendar,
  Building2
} from 'lucide-react';
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
  logoUrl?: string | null;
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
  logoUrl,
  slug, 
  initialClassFilter, 
  availableClasses, 
  eventName, 
  eventDate 
}: PrintClientProps) {
  const [layout, setLayout] = useState<'2' | '4' | '8'>(
    initialLayout === '2' || initialLayout === '4' || initialLayout === '8' ? initialLayout : '4'
  );
  const [classFilter, setClassFilter] = useState<string>(initialClassFilter || 'ALL');
  const [qrUrls, setQrUrls] = useState<{ [token: string]: string }>({});
  const [loading, setLoading] = useState(true);

  // Filtered voters for printing
  const displayedVoters = useMemo(() => {
    if (classFilter === 'ALL') return voters;
    return voters.filter(v => v.class && v.class.trim() === classFilter);
  }, [voters, classFilter]);

  // Generate high-resolution QR codes
  useEffect(() => {
    const generateAllQrs = async () => {
      const urls: { [token: string]: string } = {};
      try {
        for (const voter of voters) {
          urls[voter.qrToken] = await QRCode.toDataURL(voter.qrToken, {
            margin: 1,
            width: 240, // Crisp high-res for crisp printing
            color: {
              dark: '#000000',
              light: '#ffffff'
            }
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
      <div className="min-h-screen flex items-center justify-center bg-white text-slate-900 font-bold">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-purple-600 border-t-transparent animate-spin" />
          <span className="text-sm font-black">Menyiapkan Lembar Kartu Undangan DPT...</span>
          <span className="text-xs text-slate-500">Membuat QR Code Beresolusi Tinggi untuk {voters.length} Pemilih</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 p-0 m-0 print:bg-white print:p-0">
      {/* CSS Print Stylesheet with Exact A4 Metric Calibration */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            @page {
              size: A4 portrait;
              margin: 8mm 8mm 8mm 8mm;
            }
            body {
              background: white !important;
              color: black !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .no-print {
              display: none !important;
            }
            .print-page-container {
              padding: 0 !important;
              margin: 0 !important;
              max-width: 100% !important;
              background: white !important;
            }
            .invitation-card {
              break-inside: avoid !important;
              page-break-inside: avoid !important;
              box-shadow: none !important;
              border-color: #0f172a !important;
            }
            .page-break {
              page-break-after: always !important;
              break-after: page !important;
            }
          }

          .print-grid-2 {
            display: grid;
            grid-template-columns: 1fr;
            gap: 20px;
          }
          .print-grid-4 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }
          .print-grid-8 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }
        `
      }} />

      {/* TOP FLOATING CONTROLS TOOLBAR (Hidden on Print) */}
      <div className="no-print bg-slate-900 text-white p-4 sticky top-0 z-50 shadow-2xl border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/org/${slug}/voters`}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3.5 py-2.5 rounded-xl transition-all shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white">Cetak Kartu Undangan DPT Resmi</h3>
              <span className="bg-purple-500/20 text-purple-300 text-[10px] font-black px-2 py-0.5 rounded-md border border-purple-500/30 uppercase">
                A4 Print Ready
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Instansi: <strong className="text-purple-300">{orgName}</strong> • Total DPT: <strong className="text-emerald-400">{displayedVoters.length} Kartu Siap Cetak</strong>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Class Filter */}
          <div className="flex items-center gap-2 bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-700 shadow-xs">
            <Filter className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold text-slate-300">Kelas:</span>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="bg-transparent text-white text-xs font-bold focus:outline-hidden cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-white">Semua Kelas ({voters.length} Kartu)</option>
              {availableClasses.map(cls => (
                <option key={cls} value={cls} className="bg-slate-900 text-white">
                  Kelas {cls} ({voters.filter(v => v.class === cls).length} Kartu)
                </option>
              ))}
            </select>
          </div>

          {/* Layout Selector */}
          <div className="flex items-center gap-2 bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-700 shadow-xs">
            <Layers className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold text-slate-300">Format:</span>
            <select
              value={layout}
              onChange={(e: any) => setLayout(e.target.value)}
              className="bg-transparent text-white text-xs font-bold focus:outline-hidden cursor-pointer"
            >
              <option value="4" className="bg-slate-900 text-white">4 Kartu / A4 (Standar Resmi)</option>
              <option value="2" className="bg-slate-900 text-white">2 Kartu / A4 (Format Besar VIP)</option>
              <option value="8" className="bg-slate-900 text-white">8 Kartu / A4 (Hemat Kertas)</option>
            </select>
          </div>

          {/* Print Button */}
          <button
            onClick={() => window.print()}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs px-5 py-2.5 rounded-xl cursor-pointer transition-all flex items-center gap-2 shadow-lg shadow-purple-600/30 active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Dokumen ({displayedVoters.length} Kartu)</span>
          </button>
        </div>
      </div>

      {/* PRINT CONTAINER WITH A4 SHEET SIMULATION */}
      <div className="print-page-container p-4 sm:p-8 max-w-5xl mx-auto">
        {displayedVoters.length === 0 ? (
          <div className="py-24 text-center bg-white rounded-3xl border-2 border-dashed border-slate-300 p-8 space-y-3">
            <p className="font-black text-base text-slate-700">Tidak ada data pemilih pada filter kelas ini.</p>
            <p className="text-xs text-slate-500">Pilih opsi "Semua Kelas" pada menu toolbar di atas.</p>
          </div>
        ) : (
          <div className={`print-grid-${layout}`}>
            {displayedVoters.map((voter, index) => {
              const cardsPerPage = parseInt(layout, 10);
              const isPageBreak = (index + 1) % cardsPerPage === 0 && index !== displayedVoters.length - 1;
              const pinDigits = voter.votingPass.split('');

              return (
                <React.Fragment key={voter.id}>
                  {/* INDIVIDUAL INVITATION CARD (MODEL C-PEMBERITAHUAN DPT RESMI) */}
                  <div className={`invitation-card bg-white text-slate-900 border-2 border-slate-900 rounded-2xl flex flex-col justify-between relative overflow-hidden shadow-sm transition-all ${
                    layout === '8' ? 'p-3.5' : layout === '2' ? 'p-7' : 'p-5'
                  }`}>
                    
                    {/* Top Cut-Guide Crop Marker */}
                    <div className="no-print absolute top-1 right-2 text-[8px] text-slate-400 font-mono flex items-center gap-1 opacity-40">
                      <Scissors className="w-2.5 h-2.5" /> Gunting di sini
                    </div>

                    {/* CARD HEADER: LOGO + INSTITUTION + EVENT */}
                    <div className="border-b-2 border-slate-900 pb-2.5 mb-3 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {logoUrl ? (
                          <div className="w-10 h-10 rounded-xl bg-white border border-slate-300 p-1 flex items-center justify-center shrink-0 shadow-2xs">
                            <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                            <Vote className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <span className="font-black text-xs sm:text-sm text-slate-900 block uppercase tracking-tight leading-tight">
                            {orgName}
                          </span>
                          <span className="text-[10px] text-purple-700 font-extrabold block uppercase tracking-wider">
                            KARTU TANDA PEMILIH (DPT RESMI)
                          </span>
                          <span className="text-[9px] text-slate-500 font-bold block">
                            {eventName} • {eventDate}
                          </span>
                        </div>
                      </div>

                      {/* Nomor Undangan Badge */}
                      <div className="text-right shrink-0">
                        <span className="text-[11px] font-mono font-black bg-slate-900 text-white px-2.5 py-1 rounded-lg block shadow-2xs">
                          {voter.invitationNum}
                        </span>
                        <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-500 block mt-0.5">
                          NO. UNDANGAN DPT
                        </span>
                      </div>
                    </div>

                    {/* CARD BODY: VOTER BIODATA + QR CODE + PIN BOX */}
                    <div className="flex items-center justify-between gap-4 my-1">
                      {/* Left: Voter Details & PIN */}
                      <div className="space-y-2 flex-1 min-w-0">
                        <div>
                          <span className="text-[9px] uppercase tracking-widest text-slate-500 font-extrabold block">
                            Nama Pemilih
                          </span>
                          <span className={`font-black text-slate-900 block truncate ${
                            layout === '8' ? 'text-xs' : 'text-sm sm:text-base'
                          }`}>
                            {voter.name}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold block">
                              NIS / NIM / ID
                            </span>
                            <span className="font-mono font-bold text-[11px] text-slate-800 block truncate">
                              {voter.studentId || '—'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold block">
                              Kelas / Jurusan
                            </span>
                            <span className="font-bold text-[11px] text-purple-800 block truncate">
                              {voter.class ? voter.class : '—'} {voter.department ? `• ${voter.department}` : ''}
                            </span>
                          </div>
                        </div>

                        {/* PIN COBLOS WITH SEGMENTED DIGIT BOXES */}
                        <div className="bg-slate-50 border-2 border-slate-300 rounded-xl p-2 sm:p-2.5 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <Lock className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                            <span className="text-[10px] font-black uppercase tracking-wider">PIN COBLOS:</span>
                          </div>

                          {/* Segmented 6 Digit Blocks */}
                          <div className="flex items-center gap-1">
                            {pinDigits.map((digit, dIdx) => (
                              <span 
                                key={dIdx}
                                className="w-5 h-6 sm:w-6 sm:h-7 rounded-md bg-white border-2 border-slate-900 text-slate-900 font-mono font-black text-xs sm:text-sm flex items-center justify-center shadow-2xs"
                              >
                                {digit}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right: Crisp High-Resolution QR Code */}
                      <div className="flex flex-col items-center justify-center shrink-0 text-center">
                        {qrUrls[voter.qrToken] ? (
                          <div className="p-1.5 bg-white border-2 border-slate-900 rounded-2xl shadow-xs">
                            <img 
                              src={qrUrls[voter.qrToken]} 
                              alt="QR Token" 
                              className={`object-contain rounded-lg ${
                                layout === '8' ? 'w-18 h-18' : layout === '2' ? 'w-28 h-28' : 'w-24 h-24 sm:w-26 sm:h-26'
                              }`} 
                            />
                          </div>
                        ) : (
                          <div className="w-24 h-24 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center">
                            <QrCode className="w-8 h-8 text-slate-400" />
                          </div>
                        )}
                        <span className="text-[8px] font-mono font-black uppercase tracking-wider text-slate-600 mt-1 block">
                          SCAN DI BILIK
                        </span>
                      </div>
                    </div>

                    {/* CARD FOOTER: VOTING INSTRUCTIONS & SECURITY WATERMARK */}
                    <div className="border-t border-slate-300 pt-2 mt-2.5 flex items-center justify-between text-[8px] sm:text-[9px] text-slate-600 font-medium">
                      <div className="flex items-center gap-1 text-slate-700">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>Bawa kartu ini ke bilik suara & jangan berikan PIN kepada orang lain.</span>
                      </div>
                      <span className="font-mono font-bold text-slate-500 shrink-0">
                        VOTELY E-VOTING
                      </span>
                    </div>

                  </div>

                  {/* Page break marker */}
                  {isPageBreak && <div className="page-break" />}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
