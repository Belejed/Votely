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
  QrCode, 
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  UserCheck,
  Sparkles
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
  // Layouts: '1' (1 Lembar Penuh A4), '2' (2 Surat / A4), '4' (4 Kartu / A4)
  const [layout, setLayout] = useState<'1' | '2' | '4'>(
    initialLayout === '2' || initialLayout === '4' ? initialLayout : '1'
  );
  const [classFilter, setClassFilter] = useState<string>(initialClassFilter || 'ALL');
  
  // Customizable Day, Date & Time (User-Editable via Toolbar)
  const [customDate, setCustomDate] = useState<string>(
    eventDate && eventDate !== 'Hari Pelaksanaan' ? eventDate : '1 September 2026'
  );
  const [customTime, setCustomTime] = useState<string>('08.00 WIB s.d. Selesai');

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
            width: 280,
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
          <span className="text-sm font-black">Menyiapkan Lembar Surat Pemberitahuan Pemilih...</span>
          <span className="text-xs text-slate-500">Memproses {voters.length} Lembar A4</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-900 p-0 m-0 print:bg-white print:p-0">
      {/* CSS Print Stylesheet with Exact 1-Page per Sheet Metric Calibration */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            @page {
              size: A4 portrait;
              margin: 10mm 12mm 10mm 12mm;
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
            .official-a4-letter {
              break-inside: avoid !important;
              page-break-inside: avoid !important;
              break-after: page !important;
              page-break-after: always !important;
              box-shadow: none !important;
              border-color: #0f172a !important;
              height: 100% !important;
              min-height: 270mm !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            .page-break {
              page-break-after: always !important;
              break-after: page !important;
            }
          }
        `
      }} />

      {/* TOP FLOATING CONTROLS TOOLBAR (Hidden on Print) */}
      <div className="no-print bg-slate-950/90 backdrop-blur-md text-white p-4 sticky top-0 z-50 shadow-2xl border-b border-purple-900/30 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/org/${slug}/voters`}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3.5 py-2 rounded-xl transition-all shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white">Cetak Kartu Akses Pemilih</h3>
              <span className="bg-purple-500/20 text-purple-300 text-[10px] font-black px-2 py-0.5 rounded-md border border-purple-500/30 uppercase">
                1 Lembar A4
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Instansi: <strong className="text-purple-300">{orgName}</strong> • Total: <strong className="text-emerald-400">{displayedVoters.length} Lembar Siap Cetak</strong>
            </p>
          </div>
        </div>

        {/* Toolbar Controls: Date & Time Customizer, Class Filter, Format, Print */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Editable Day / Date */}
          <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700 shadow-xs">
            <Calendar className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="text-xs font-bold text-slate-300">Tanggal:</span>
            <input
              type="text"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              placeholder="e.g. 1 September 2026"
              className="bg-slate-950 text-white text-xs font-bold px-2 py-1 rounded-lg border border-slate-700 focus:outline-none focus:border-purple-500 w-40"
              title="Ketik hari & tanggal pelaksanaan yang ingin dicetak pada surat"
            />
          </div>

          {/* Editable Time */}
          <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700 shadow-xs">
            <Clock className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="text-xs font-bold text-slate-300">Waktu:</span>
            <input
              type="text"
              value={customTime}
              onChange={(e) => setCustomTime(e.target.value)}
              placeholder="e.g. 08.00 s.d Selesai"
              className="bg-slate-950 text-white text-xs font-bold px-2 py-1 rounded-lg border border-slate-700 focus:outline-none focus:border-purple-500 w-36"
              title="Ketik jam pelaksanaan yang ingin dicetak pada surat"
            />
          </div>

          {/* Class Filter */}
          <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700 shadow-xs">
            <Filter className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-xs font-bold text-slate-300">Kelas:</span>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="bg-transparent text-white text-xs font-bold focus:outline-hidden cursor-pointer"
            >
              <option value="ALL" className="bg-slate-950 text-white">Semua Kelas ({voters.length})</option>
              {availableClasses.map(cls => (
                <option key={cls} value={cls} className="bg-slate-950 text-white">
                  Kelas {cls} ({voters.filter(v => v.class === cls).length})
                </option>
              ))}
            </select>
          </div>

          {/* Layout Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700 shadow-xs">
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <select
              value={layout}
              onChange={(e: any) => setLayout(e.target.value)}
              className="bg-transparent text-white text-xs font-bold focus:outline-hidden cursor-pointer"
            >
              <option value="1" className="bg-slate-950 text-white">1 Lembar Penuh A4</option>
              <option value="2" className="bg-slate-950 text-white">2 Surat / A4</option>
              <option value="4" className="bg-slate-950 text-white">4 Kartu / A4</option>
            </select>
          </div>

          {/* Print Button */}
          <button
            onClick={() => window.print()}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs px-4.5 py-2.5 rounded-xl cursor-pointer transition-all flex items-center gap-2 shadow-lg shadow-purple-600/30 active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* PRINT CONTAINER WITH FULL A4 SHEETS */}
      <div className="print-page-container p-4 sm:p-8 max-w-4xl mx-auto space-y-8 print:space-y-0">
        {displayedVoters.length === 0 ? (
          <div className="py-24 text-center bg-white rounded-3xl border-2 border-dashed border-slate-300 p-8 space-y-3">
            <p className="font-black text-base text-slate-700">Tidak ada surat pemilih pada filter kelas ini.</p>
            <p className="text-xs text-slate-500">Pilih opsi "Semua Kelas" pada menu toolbar di atas.</p>
          </div>
        ) : (
          displayedVoters.map((voter, index) => {
            const pinDigits = voter.votingPass.split('');

            return (
              <div
                key={voter.id}
                className="official-a4-letter bg-white text-slate-900 rounded-3xl border-2 border-slate-900/90 p-8 sm:p-12 shadow-2xl print:shadow-none flex flex-col justify-between"
              >
                <div>
                  {/* 1. KOP SURAT RESMI DENGAN TEMA VOTELY */}
                  <div className="border-b-4 border-double border-slate-900 pb-5 mb-6">
                    <div className="flex items-center justify-between gap-6">
                      {/* Logo Instansi di Kiri */}
                      {logoUrl ? (
                        <div className="w-20 h-20 rounded-2xl bg-white border-2 border-slate-900/20 p-2 flex items-center justify-center shrink-0 shadow-xs">
                          <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        <div className="w-18 h-18 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-lg shrink-0 shadow-xs">
                          <Vote className="w-10 h-10 text-purple-400" />
                        </div>
                      )}

                      {/* Header Teks di Sebelah Kanan Logo (Aligned Right & Clean) */}
                      <div className="flex-1 text-right space-y-0.5">
                        <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-600">
                          PANITIA PEMILIHAN KETUA & WAKIL KETUA OSIS / SUARA MAHASISWA
                        </h4>
                        <h1 className="font-black text-2xl sm:text-3xl text-slate-900 uppercase tracking-tight leading-tight">
                          {orgName}
                        </h1>
                        <div className="flex items-center justify-end gap-2 pt-0.5">
                          <span className="bg-purple-100 text-purple-800 text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-purple-200">
                            KARTU TANDA PEMILIH RESMI (DPT)
                          </span>
                          <span className="text-xs font-black text-slate-700">
                            • {eventName.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. HERO CARD DATA PEMILIH (FULL-WIDTH, GEDE, MEMBENTANG KE KANAN) */}
                  <div className="bg-gradient-to-r from-purple-50 via-slate-50 to-purple-50/50 border-2 border-slate-900 rounded-2xl p-5 sm:p-6 mb-6 shadow-xs">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      
                      {/* Left Side: Large Voter Name & Badges */}
                      <div className="space-y-1 flex-1 min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-widest text-purple-700 block">
                          NAMA LENGKAP PEMILIH TETAP
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight truncate leading-none">
                          {voter.name}
                        </h2>

                        <div className="flex items-center gap-3 pt-2">
                          <div className="bg-white border border-slate-300 px-3 py-1 rounded-lg text-xs font-black text-purple-900 shadow-2xs">
                            Kelas: <strong>{voter.class || '—'}</strong>
                          </div>
                          <div className="bg-white border border-slate-300 px-3 py-1 rounded-lg text-xs font-mono font-bold text-slate-800 shadow-2xs">
                            NIS / ID: <strong>{voter.studentId || '—'}</strong>
                          </div>
                        </div>
                      </div>

                      {/* Right Side: Large Invitation Badge */}
                      <div className="text-center sm:text-right shrink-0 bg-white border-2 border-slate-900 rounded-xl p-3.5 shadow-xs">
                        <span className="text-[9px] uppercase font-black tracking-widest text-slate-500 block">
                          NO. UNDANGAN DPT
                        </span>
                        <span className="font-mono font-black text-base sm:text-lg text-slate-900 tracking-wider block mt-0.5">
                          {voter.invitationNum}
                        </span>
                      </div>

                    </div>
                  </div>

                  {/* 3. TABEL JADWAL & LOKASI PEMUNGUTAN SUARA */}
                  <div className="bg-slate-50 border-2 border-slate-900/80 rounded-2xl p-5 mb-6 text-xs sm:text-sm shadow-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2.5">
                        <div className="flex items-start gap-2.5">
                          <Calendar className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-slate-500 font-bold block text-[11px]">Hari / Tanggal Pelaksanaan</span>
                            <span className="font-black text-slate-900 text-sm">{customDate}</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-2.5">
                          <Clock className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-slate-500 font-bold block text-[11px]">Waktu Pemungutan Suara</span>
                            <span className="font-black text-slate-900 text-sm">{customTime}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        <div className="flex items-start gap-2.5">
                          <MapPin className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-slate-500 font-bold block text-[11px]">Tempat / Lokasi TPS</span>
                            <span className="font-black text-slate-900 text-sm">Bilik Suara E-Voting Kiosk ({orgName})</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-2.5">
                          <ShieldCheck className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-slate-500 font-bold block text-[11px]">Status Hak Pilih</span>
                            <span className="font-black text-emerald-700 text-sm">Terverifikasi & Aktif (1 Hak Suara Sah)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4. KOTAK KREDENSIAL AKSES BILIK SUARA (DIGITAL BALLOT PASS) */}
                  <div className="border-2 border-slate-900 rounded-2xl p-6 bg-white mb-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                      {/* Left: Large Segmented PIN */}
                      <div className="space-y-3 flex-1 text-center sm:text-left">
                        <div className="space-y-1">
                          <span className="text-[11px] font-black uppercase tracking-wider text-purple-800 block">
                            KREDENSIAL AKSES BILIK SUARA (DIGITAL PASS)
                          </span>
                          <h4 className="font-black text-base text-slate-900">
                            KODE PIN RAHASIA PEMILIH (6-DIGIT):
                          </h4>
                        </div>

                        {/* Large Segmented PIN Boxes */}
                        <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                          {pinDigits.map((digit, dIdx) => (
                            <span 
                              key={dIdx}
                              className="w-10 h-12 sm:w-11 sm:h-13 rounded-xl bg-purple-50/50 border-2 border-slate-900 text-slate-900 font-mono font-black text-xl flex items-center justify-center shadow-xs"
                            >
                              {digit}
                            </span>
                          ))}
                        </div>

                        <p className="text-[11px] text-slate-500 italic pt-1 leading-relaxed">
                          * Jaga kerahasiaan PIN ini. Jangan berikan kepada siapa pun demi keaslian suara Anda.
                        </p>
                      </div>

                      {/* Right: Big Crisp QR Code with bottom padding */}
                      <div className="flex flex-col items-center justify-center shrink-0 border-l-0 sm:border-l-2 border-slate-200 pl-0 sm:pl-6 pb-2">
                        {qrUrls[voter.qrToken] ? (
                          <div className="p-2 bg-white border-2 border-slate-900 rounded-2xl shadow-sm">
                            <img 
                              src={qrUrls[voter.qrToken]} 
                              alt="QR Token" 
                              className="w-32 h-32 sm:w-36 sm:h-36 object-contain rounded-lg" 
                            />
                          </div>
                        ) : (
                          <div className="w-36 h-36 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center">
                            <QrCode className="w-10 h-10 text-slate-400" />
                          </div>
                        )}
                        <span className="text-[9px] font-mono font-black uppercase tracking-widest text-slate-700 mt-2 block">
                          SCAN TOKEN DI BILIK
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 5. PETUNJUK COBLOS DI BILIK SUARA */}
                  <div className="text-xs text-slate-700 bg-slate-50 border border-slate-300 rounded-xl p-4 mb-6 space-y-1.5">
                    <strong className="text-slate-900 block font-bold text-xs">PETUNJUK PENGGUNAAN DI BILIK SUARA:</strong>
                    <ol className="list-decimal pl-5 space-y-1 leading-relaxed text-[11px]">
                      <li>Bawa lembar ini ke lokasi <strong>Bilik Suara Kiosk (TPS)</strong> yang telah disediakan panitia.</li>
                      <li>Arahkan <strong>QR Code</strong> di atas ke kamera pemindai bilik, atau ketik <strong>PIN 6-Digit</strong> Anda pada layar sentuh.</li>
                      <li>Cermati foto dan visi-misi calon, lalu klik tombol <strong>Coblos</strong> pada Pasangan Calon pilihan Anda.</li>
                      <li>Tekan tombol <strong>Konfirmasi Suara</strong> untuk menyelesaikan proses pencoblosan secara sah dan terenkripsi.</li>
                    </ol>
                  </div>
                </div>

                {/* 6. CLEAN BOTTOM SECURITY WATERMARK */}
                <div className="pt-6 border-t-2 border-slate-300 flex items-center justify-between text-xs text-slate-500 font-medium">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Dokumen Resmi Panitia Pemilihan • Sah & Terenkripsi</span>
                  </div>
                  <span className="font-mono font-bold text-slate-600">
                    VOTELY E-VOTING SYSTEM • {orgName.toUpperCase()}
                  </span>
                </div>

              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
