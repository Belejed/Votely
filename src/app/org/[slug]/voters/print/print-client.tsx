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
  CheckCircle2,
  FileText,
  Stamp
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
  // Layouts: '1' (Full A4 Letter), '2' (Half A4 Model C6), '4' (Quarter A4 Card)
  const [layout, setLayout] = useState<'1' | '2' | '4'>(
    initialLayout === '1' || initialLayout === '2' || initialLayout === '4' ? initialLayout : '2'
  );
  const [classFilter, setClassFilter] = useState<string>(initialClassFilter || 'ALL');
  const [qrUrls, setQrUrls] = useState<{ [token: string]: string }>({});
  const [loading, setLoading] = useState(true);

  // Filtered voters for printing
  const displayedVoters = useMemo(() => {
    if (classFilter === 'ALL') return voters;
    return voters.filter(v => v.class && v.class.trim() === classFilter);
  }, [voters, classFilter]);

  // Generate crisp QR codes
  useEffect(() => {
    const generateAllQrs = async () => {
      const urls: { [token: string]: string } = {};
      try {
        for (const voter of voters) {
          urls[voter.qrToken] = await QRCode.toDataURL(voter.qrToken, {
            margin: 1,
            width: 260,
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
          <span className="text-sm font-black">Menyiapkan Surat Pemberitahuan Pemilih (Model C)...</span>
          <span className="text-xs text-slate-500">Memproses {voters.length} Surat Resmi DPT</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-200 text-slate-900 p-0 m-0 print:bg-white print:p-0">
      {/* CSS Print Stylesheet with Exact Metric Calibration */}
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
            .official-letter-card {
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

          .print-grid-1 {
            display: grid;
            grid-template-columns: 1fr;
            gap: 0px;
          }
          .print-grid-2 {
            display: grid;
            grid-template-columns: 1fr;
            gap: 16px;
          }
          .print-grid-4 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
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
            <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white">Cetak Surat Pemberitahuan Pemilih (Model C-6)</h3>
              <span className="bg-purple-500/20 text-purple-300 text-[10px] font-black px-2 py-0.5 rounded-md border border-purple-500/30 uppercase">
                Format Surat Resmi
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Instansi: <strong className="text-purple-300">{orgName}</strong> • Total: <strong className="text-emerald-400">{displayedVoters.length} Surat Siap Cetak</strong>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Class Filter */}
          <div className="flex items-center gap-2 bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-700 shadow-xs">
            <Filter className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold text-slate-300">Filter Kelas:</span>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="bg-transparent text-white text-xs font-bold focus:outline-hidden cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-white">Semua Kelas ({voters.length} Surat)</option>
              {availableClasses.map(cls => (
                <option key={cls} value={cls} className="bg-slate-900 text-white">
                  Kelas {cls} ({voters.filter(v => v.class === cls).length} Surat)
                </option>
              ))}
            </select>
          </div>

          {/* Layout Selector */}
          <div className="flex items-center gap-2 bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-700 shadow-xs">
            <Layers className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold text-slate-300">Format Kertas:</span>
            <select
              value={layout}
              onChange={(e: any) => setLayout(e.target.value)}
              className="bg-transparent text-white text-xs font-bold focus:outline-hidden cursor-pointer"
            >
              <option value="2" className="bg-slate-900 text-white">2 Surat / A4 (Model C6 Setengah A4 — Standar)</option>
              <option value="1" className="bg-slate-900 text-white">1 Surat / A4 (Format Surat Penuh A4)</option>
              <option value="4" className="bg-slate-900 text-white">4 Surat / A4 (Format Kartu Kompak)</option>
            </select>
          </div>

          {/* Print Button */}
          <button
            onClick={() => window.print()}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs px-5 py-2.5 rounded-xl cursor-pointer transition-all flex items-center gap-2 shadow-lg shadow-purple-600/30 active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Simpan PDF ({displayedVoters.length} Surat)</span>
          </button>
        </div>
      </div>

      {/* PRINT CONTAINER */}
      <div className="print-page-container p-4 sm:p-8 max-w-4xl mx-auto">
        {displayedVoters.length === 0 ? (
          <div className="py-24 text-center bg-white rounded-3xl border-2 border-dashed border-slate-300 p-8 space-y-3">
            <p className="font-black text-base text-slate-700">Tidak ada surat pemilih pada filter kelas ini.</p>
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
                  {/* SURAT RESMI PEMBERITAHUAN PEMUNGUTAN SUARA */}
                  <div className={`official-letter-card bg-white text-slate-900 border-2 border-slate-900 rounded-xl flex flex-col justify-between relative overflow-hidden shadow-md print:shadow-none ${
                    layout === '1' ? 'p-10 min-h-[960px]' : layout === '2' ? 'p-6 min-h-[460px]' : 'p-4 min-h-[290px]'
                  }`}>
                    
                    {/* Cut Guide Scissors for multi-card layout */}
                    {layout !== '1' && (
                      <div className="no-print absolute top-1 right-3 text-[9px] text-slate-400 font-mono flex items-center gap-1 opacity-50">
                        <Scissors className="w-3 h-3" /> Garis Potong
                      </div>
                    )}

                    {/* 1. KOP SURAT RESMI */}
                    <div className="border-b-4 border-double border-slate-900 pb-3 mb-3">
                      <div className="flex items-center gap-4">
                        {/* Logo */}
                        {logoUrl ? (
                          <div className="w-14 h-14 rounded-lg bg-white border border-slate-300 p-1 flex items-center justify-center shrink-0">
                            <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-sm shrink-0">
                            <Vote className="w-7 h-7" />
                          </div>
                        )}

                        {/* Kop Title Centered */}
                        <div className="flex-1 text-center pr-4">
                          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                            PANITIA PEMILIHAN KETUA & WAKIL KETUA OSIS / SUARA MAHASISWA
                          </h4>
                          <h2 className="font-black text-sm sm:text-base text-slate-900 uppercase tracking-tight leading-tight">
                            {orgName}
                          </h2>
                          <p className="text-[10px] text-slate-600 font-medium">
                            Sistem Elektronik E-Voting Resmi Votely • Tahun {new Date().getFullYear()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 2. JUDUL SURAT & NOMOR FORMULIR */}
                    <div className="text-center my-2 space-y-0.5">
                      <h3 className="font-black text-xs sm:text-sm uppercase tracking-tight text-slate-900 underline decoration-slate-900 decoration-1">
                        SURAT PEMBERITAHUAN PEMUNGUTAN SUARA KEPADA PEMILIH
                      </h3>
                      <div className="flex items-center justify-center gap-3 text-[10px] font-bold text-slate-600">
                        <span>MODEL C.PEMBERITAHUAN - DPT</span>
                        <span>•</span>
                        <span>NO. DPT: <strong className="text-slate-900 font-mono font-black">{voter.invitationNum}</strong></span>
                      </div>
                    </div>

                    {/* 3. PARAGRAF PEMBUKA */}
                    <div className="text-[11px] text-slate-800 leading-relaxed my-1">
                      <p>
                        Bersama ini diberitahukan bahwa Saudara/i terdaftar sebagai <strong>Pemilih Tetap (DPT)</strong> pada agenda <strong>{eventName}</strong> dengan rincian data sebagai berikut:
                      </p>
                    </div>

                    {/* 4. TABEL BIODATA PEMILIH & KOTAK AKSES BILIK SUARA */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 my-2 border border-slate-300 rounded-xl p-3 bg-slate-50/70">
                      
                      {/* Left 7 cols: Biodata Rinci */}
                      <div className="md:col-span-7 space-y-1.5 text-xs">
                        <div className="grid grid-cols-3 gap-1">
                          <span className="text-slate-500 font-bold text-[11px]">Nama Pemilih</span>
                          <span className="col-span-2 font-black text-slate-900 text-xs uppercase">: {voter.name}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          <span className="text-slate-500 font-bold text-[11px]">NIS / NIM</span>
                          <span className="col-span-2 font-mono font-bold text-slate-800 text-xs">: {voter.studentId || '—'}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          <span className="text-slate-500 font-bold text-[11px]">Kelas / Jurusan</span>
                          <span className="col-span-2 font-bold text-purple-900 text-xs">: {voter.class || '—'} {voter.department ? `(${voter.department})` : ''}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          <span className="text-slate-500 font-bold text-[11px]">Tempat (TPS)</span>
                          <span className="col-span-2 font-bold text-slate-800 text-xs">: Bilik Suara E-Voting ({orgName})</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          <span className="text-slate-500 font-bold text-[11px]">Hari / Tanggal</span>
                          <span className="col-span-2 font-bold text-slate-800 text-xs">: {eventDate}</span>
                        </div>
                      </div>

                      {/* Right 5 cols: Segmented PIN & QR Code Box */}
                      <div className="md:col-span-5 bg-white border-2 border-slate-900 rounded-xl p-2.5 flex flex-col items-center justify-center text-center space-y-2 shrink-0 shadow-2xs">
                        
                        {/* PIN Segmen Digits */}
                        <div className="w-full">
                          <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                            KODE PIN RAHASIA (6-DIGIT):
                          </span>
                          <div className="flex items-center justify-center gap-1">
                            {pinDigits.map((digit, dIdx) => (
                              <span 
                                key={dIdx}
                                className="w-5 h-6 rounded bg-slate-100 border border-slate-900 text-slate-900 font-mono font-black text-xs flex items-center justify-center"
                              >
                                {digit}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* QR Code */}
                        {qrUrls[voter.qrToken] && (
                          <div className="flex flex-col items-center">
                            <img 
                              src={qrUrls[voter.qrToken]} 
                              alt="QR Token" 
                              className="w-20 h-20 object-contain rounded border border-slate-300 p-0.5" 
                            />
                            <span className="text-[8px] font-mono font-bold text-slate-500 mt-0.5">
                              SCAN TOKEN DI BILIK
                            </span>
                          </div>
                        )}
                      </div>

                    </div>

                    {/* 5. TATA TERTIB / PETUNJUK RESMI */}
                    <div className="text-[10px] text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-1">
                      <strong className="text-slate-900 block font-bold text-[10px]">TATA CARA PEMBERIAN SUARA:</strong>
                      <ol className="list-decimal pl-4 space-y-0.5 leading-snug">
                        <li>Membawa surat pemberitahuan ini ke lokasi <strong>Bilik Suara (TPS)</strong> yang telah disiapkan panitia.</li>
                        <li>Arahkan <strong>QR Code</strong> ke kamera pemindai bilik atau masukkan <strong>PIN 6-Digit</strong> di layar.</li>
                        <li>Pilih/coblos Pasangan Calon pilihan Anda, lalu tekan tombol <strong>Konfirmasi Suara</strong>.</li>
                        <li>Surat ini bersifat <strong>Rahasia & Sah</strong> hanya untuk 1 (satu) kali pemberian suara.</li>
                      </ol>
                    </div>

                    {/* 6. TITIK MANGSA & TANDA TANGAN RESMI KETUA PANITIA */}
                    <div className="pt-3 grid grid-cols-2 gap-4 text-[10px] text-slate-800">
                      <div className="space-y-1">
                        <p className="text-[9px] text-slate-500 italic">
                          * Surat ini dikeluarkan secara resmi oleh Panitia Pemilihan Votely.
                        </p>
                      </div>

                      <div className="text-right space-y-10">
                        <div>
                          <p>Ditetapkan di: {orgName}</p>
                          <p className="font-bold">Ketua Panitia Pemilihan,</p>
                        </div>

                        <div className="space-y-0.5">
                          <p className="font-bold underline uppercase">( PANITIA PEMILIHAN )</p>
                          <p className="text-[9px] text-slate-500">NIP/NIS. Ketua Panitia</p>
                        </div>
                      </div>
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
