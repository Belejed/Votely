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
  Settings2,
  Download,
  Loader2,
  Info
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
  const [exportingPdf, setExportingPdf] = useState(false);

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
            width: 240,
            color: {
              dark: '#2D1B46',
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

  // Direct PDF Export using jsPDF + html2canvas
  const handleDownloadPDF = async () => {
    setExportingPdf(true);
    try {
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const sheets = document.querySelectorAll('.print-sheet-item');
      for (let i = 0; i < sheets.length; i++) {
        const sheet = sheets[i] as HTMLElement;
        const canvas = await html2canvas(sheet, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        if (i > 0) doc.addPage('a4', 'portrait');
        doc.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      }

      doc.save(`Surat_Undangan_DPT_${slug}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('Error generating PDF file:', err);
      // Fallback to native print
      window.print();
    } finally {
      setExportingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F5EF] text-[#2D1B46] font-bold">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-[#7C3AED] border-t-transparent animate-spin" />
          <span className="text-sm font-black">Menyiapkan Lembar Surat Pemberitahuan Pemilih...</span>
          <span className="text-xs text-[#5E4E73]">Memproses {voters.length} Lembar A4</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F5EF] text-[#2D1B46] p-0 m-0 print:bg-white print:p-0">
      {/* CSS Print Stylesheet: @page margin: 0 completely removes Chrome's headers (date, URL, title) */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            @page {
              size: A4 portrait;
              margin: 0 !important; /* HIDES CHROME DEFAULT HEADER (DATE/TITLE) & FOOTER (URL/PAGE NUMBER) */
            }
            body {
              background: white !important;
              color: #2D1B46 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .no-print {
              display: none !important;
            }
            .print-page-container {
              padding: 0 !important;
              margin: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              background: white !important;
            }
            
            /* 1 Lembar Penuh A4 Strict Calibration (297mm height with 10mm top/bottom padding) */
            .print-sheet-item {
              box-sizing: border-box !important;
              width: 190mm !important;
              height: 275mm !important;
              max-height: 275mm !important;
              margin: 10mm auto !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              page-break-after: always !important;
              break-after: page !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              padding: 5mm 6mm !important;
              border: 2px solid #2D1B46 !important;
              border-radius: 16px !important;
              box-shadow: none !important;
              background: white !important;
            }
            .page-break {
              page-break-after: always !important;
              break-after: page !important;
            }
          }
        `
      }} />

      {/* FLOATING CONTROL PANEL ON THE RIGHT (VOTELY THEME) */}
      <aside className="no-print fixed top-6 right-6 z-50 w-80 bg-white/95 backdrop-blur-xl border-2 border-[#EEE7DA] rounded-3xl p-5 shadow-2xl space-y-5 text-[#2D1B46] max-h-[92vh] overflow-y-auto">
        {/* Panel Header */}
        <div className="flex items-center justify-between border-b border-[#EEE7DA] pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
              <Settings2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black text-[#2D1B46] uppercase tracking-wider">Panel Cetak DPT</h3>
              <p className="text-[10px] text-[#5E4E73] font-semibold">{orgName}</p>
            </div>
          </div>

          <Link
            href={`/org/${slug}/voters`}
            className="flex items-center gap-1 text-[11px] font-bold text-[#5E4E73] hover:text-[#2D1B46] bg-[#F8F5EF] hover:bg-[#EEE7DA] px-3 py-1.5 rounded-xl transition-all border border-[#EEE7DA]"
            title="Kembali ke Direktori Pemilih"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Tutup</span>
          </Link>
        </div>

        {/* Action Buttons: Direct Download PDF & Print Dialog */}
        <div className="space-y-2">
          <button
            onClick={handleDownloadPDF}
            disabled={exportingPdf}
            className="w-full bg-gradient-to-r from-[#E11D48] via-[#C026D3] to-[#7C3AED] hover:opacity-95 text-white font-black text-xs py-3.5 rounded-2xl cursor-pointer transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 active:scale-95 disabled:opacity-50"
          >
            {exportingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses File PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download File PDF ({displayedVoters.length})</span>
              </>
            )}
          </button>

          <button
            onClick={() => window.print()}
            disabled={exportingPdf}
            className="w-full bg-[#F8F5EF] hover:bg-[#EEE7DA] text-[#2D1B46] font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 border border-[#EEE7DA]"
          >
            <Printer className="w-4 h-4 text-[#7C3AED]" />
            <span>Buka Dialog Cetak / Print</span>
          </button>
        </div>

        {/* Section 1: Tanggal & Waktu Pelaksanaan */}
        <div className="space-y-3 bg-[#F8F5EF] border border-[#EEE7DA] rounded-2xl p-3.5">
          <span className="text-[10px] uppercase font-black tracking-wider text-[#7C3AED] block">
            Jadwal di Surat
          </span>

          <div className="space-y-2.5 text-xs">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#2D1B46] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span>Hari / Tanggal:</span>
              </label>
              <input
                type="text"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                placeholder="e.g. 1 September 2026"
                className="w-full bg-white text-[#2D1B46] text-xs font-bold px-3 py-2 rounded-xl border border-[#EEE7DA] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-purple-500/10 shadow-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#2D1B46] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span>Waktu Pelaksanaan:</span>
              </label>
              <input
                type="text"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                placeholder="e.g. 08.00 s.d Selesai"
                className="w-full bg-white text-[#2D1B46] text-xs font-bold px-3 py-2 rounded-xl border border-[#EEE7DA] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-purple-500/10 shadow-xs"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Filter Kelas */}
        <div className="space-y-3 bg-[#F8F5EF] border border-[#EEE7DA] rounded-2xl p-3.5">
          <span className="text-[10px] uppercase font-black tracking-wider text-[#7C3AED] block">
            Filter Data
          </span>

          <div className="space-y-1 text-xs">
            <label className="text-[11px] font-bold text-[#2D1B46] flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-[#7C3AED]" />
              <span>Filter Kelas:</span>
            </label>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full bg-white text-[#2D1B46] text-xs font-bold px-3 py-2 rounded-xl border border-[#EEE7DA] focus:outline-none focus:border-[#7C3AED] cursor-pointer shadow-xs"
            >
              <option value="ALL">Semua Kelas ({voters.length} Lembar)</option>
              {availableClasses.map(cls => (
                <option key={cls} value={cls}>
                  Kelas {cls} ({voters.filter(v => v.class === cls).length})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Info Box: Tips Bersih */}
        <div className="p-3 bg-purple-50/60 border border-purple-200/60 rounded-2xl text-[11px] text-[#5E4E73] space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-[#7C3AED]">
            <Info className="w-3.5 h-3.5" />
            <span>Hasil Cetak Super Bersih</span>
          </div>
          <p>
            Header bawaan Chrome (tanggal/URL) telah otomatis disembunyikan via CSS sistem & tombol Download PDF.
          </p>
        </div>

        {/* Panel Footer Status */}
        <div className="p-3 bg-red-50/60 border border-red-200/60 rounded-2xl text-center">
          <p className="text-[11px] font-bold text-[#2D1B46]">
            Total Siap Cetak: <strong className="text-red-600 font-black">{displayedVoters.length} Lembar</strong>
          </p>
        </div>
      </aside>

      {/* PRINT CONTAINER WITH CRISP OUTLINE BORDERS */}
      <div className="print-page-container p-4 sm:p-8 max-w-4xl mx-auto space-y-8 print:space-y-0">
        {displayedVoters.length === 0 ? (
          <div className="py-24 text-center bg-white rounded-3xl border-2 border-dashed border-[#EEE7DA] p-8 space-y-3 shadow-sm">
            <p className="font-black text-base text-[#2D1B46]">Tidak ada surat pemilih pada filter kelas ini.</p>
            <p className="text-xs text-[#5E4E73]">Pilih opsi "Semua Kelas" pada panel pengaturan di sebelah kanan.</p>
          </div>
        ) : (
          displayedVoters.map((voter) => {
            const pinDigits = voter.votingPass.split('');

            return (
              <div
                key={voter.id}
                className="print-sheet-item bg-white text-[#2D1B46] rounded-3xl border-2 border-[#2D1B46] p-6 sm:p-8 shadow-xl print:shadow-none flex flex-col justify-between"
              >
                <div>
                  {/* 1. KOP SURAT RESMI */}
                  <div className="border-b-4 border-double border-[#2D1B46] pb-3 mb-3.5">
                    <div className="flex items-center justify-between gap-4">
                      {/* Logo Instansi di Kiri */}
                      {logoUrl ? (
                        <div className="w-16 h-16 rounded-2xl bg-white border-2 border-[#EEE7DA] p-1.5 flex items-center justify-center shrink-0 shadow-xs">
                          <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-red-50 border-2 border-red-200 text-red-600 flex items-center justify-center font-black text-base shrink-0 shadow-xs">
                          <Vote className="w-8 h-8" />
                        </div>
                      )}

                      {/* Header Teks di Sebelah Kanan Logo (Aligned Right & Clean) */}
                      <div className="flex-1 text-right space-y-0.5">
                        <h4 className="font-extrabold text-[11px] uppercase tracking-wider text-[#5E4E73]">
                          PANITIA PEMILIHAN KETUA & WAKIL KETUA OSIS / SUARA MAHASISWA
                        </h4>
                        <h1 className="font-black text-xl sm:text-2xl text-[#2D1B46] uppercase tracking-tight leading-tight">
                          {orgName}
                        </h1>
                        <div className="flex items-center justify-end gap-2 pt-0.5">
                          <span className="bg-red-50 text-red-600 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-red-200">
                            KARTU TANDA PEMILIH RESMI (DPT)
                          </span>
                          <span className="text-[11px] font-black text-[#2D1B46]">
                            • {eventName.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. HERO CARD DATA PEMILIH (DENGAN OUTLINE HITAM/DEEP PLUM TEGAS) */}
                  <div className="bg-[#F8F5EF] border-2 border-[#2D1B46] rounded-2xl p-3.5 sm:p-4 mb-3 shadow-xs">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      
                      {/* Left Side: Large Voter Name & Badges */}
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#7C3AED] block">
                          NAMA LENGKAP PEMILIH TETAP
                        </span>
                        <h2 className="text-xl sm:text-2xl font-black text-[#2D1B46] uppercase tracking-tight truncate leading-tight">
                          {voter.name}
                        </h2>

                        <div className="flex items-center gap-2 pt-1">
                          <div className="bg-white border border-[#EEE7DA] px-2.5 py-0.5 rounded-lg text-[11px] font-black text-[#2D1B46] shadow-xs">
                            Kelas: <strong className="text-[#7C3AED]">{voter.class || '—'}</strong>
                          </div>
                          <div className="bg-white border border-[#EEE7DA] px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-bold text-[#5E4E73] shadow-xs">
                            NIS / ID: <strong>{voter.studentId || '—'}</strong>
                          </div>
                        </div>
                      </div>

                      {/* Right Side: Large Invitation Badge */}
                      <div className="text-center sm:text-right shrink-0 bg-white border-2 border-[#2D1B46] rounded-xl p-2.5 shadow-xs">
                        <span className="text-[8px] uppercase font-black tracking-widest text-[#5E4E73] block">
                          NO. UNDANGAN DPT
                        </span>
                        <span className="font-mono font-black text-sm sm:text-base text-[#2D1B46] tracking-wider block mt-0.5">
                          {voter.invitationNum}
                        </span>
                      </div>

                    </div>
                  </div>

                  {/* 3. TABEL JADWAL & LOKASI PEMUNGUTAN SUARA */}
                  <div className="bg-[#F8F5EF] border-2 border-[#EEE7DA] rounded-2xl p-3.5 mb-3 text-xs shadow-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <Calendar className="w-3.5 h-3.5 text-[#7C3AED] shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[#5E4E73] font-bold block text-[10px]">Hari / Tanggal Pelaksanaan</span>
                            <span className="font-black text-[#2D1B46] text-xs">{customDate}</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Clock className="w-3.5 h-3.5 text-[#7C3AED] shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[#5E4E73] font-bold block text-[10px]">Waktu Pemungutan Suara</span>
                            <span className="font-black text-[#2D1B46] text-xs">{customTime}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-3.5 h-3.5 text-[#7C3AED] shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[#5E4E73] font-bold block text-[10px]">Tempat / Lokasi TPS</span>
                            <span className="font-black text-[#2D1B46] text-xs">Bilik Suara E-Voting Kiosk ({orgName})</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#7C3AED] shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[#5E4E73] font-bold block text-[10px]">Status Hak Pilih</span>
                            <span className="font-black text-emerald-600 text-xs">Terverifikasi & Aktif (1 Hak Suara Sah)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4. KOTAK KREDENSIAL AKSES BILIK SUARA (OUTLINE HITAM/DEEP PLUM TEGAS) */}
                  <div className="border-2 border-[#2D1B46] rounded-2xl p-4 mb-3 bg-white shadow-xs">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      {/* Left: Segmented PIN */}
                      <div className="space-y-2 flex-1 text-center sm:text-left">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-[#7C3AED] block">
                            KREDENSIAL AKSES BILIK SUARA (DIGITAL PASS)
                          </span>
                          <h4 className="font-black text-sm text-[#2D1B46]">
                            KODE PIN RAHASIA PEMILIH (6-DIGIT):
                          </h4>
                        </div>

                        {/* Segmented PIN Boxes */}
                        <div className="flex items-center justify-center sm:justify-start gap-1.5 pt-0.5">
                          {pinDigits.map((digit, dIdx) => (
                            <span 
                              key={dIdx}
                              className="w-8 h-10 sm:w-9 sm:h-11 rounded-lg bg-[#F8F5EF] border-2 border-[#2D1B46] text-[#2D1B46] font-mono font-black text-lg flex items-center justify-center shadow-2xs"
                            >
                              {digit}
                            </span>
                          ))}
                        </div>

                        <p className="text-[10px] text-[#5E4E73] italic pt-0.5 leading-tight">
                          * Jaga kerahasiaan PIN ini. Jangan berikan kepada siapa pun demi keaslian suara Anda.
                        </p>
                      </div>

                      {/* Right: Crisp QR Code */}
                      <div className="flex flex-col items-center justify-center shrink-0 border-l-0 sm:border-l-2 border-[#EEE7DA] pl-0 sm:pl-4">
                        {qrUrls[voter.qrToken] ? (
                          <div className="p-1.5 bg-white border-2 border-[#2D1B46] rounded-xl shadow-2xs">
                            <img 
                              src={qrUrls[voter.qrToken]} 
                              alt="QR Token" 
                              className="w-24 h-24 sm:w-26 sm:h-26 object-contain rounded-md" 
                            />
                          </div>
                        ) : (
                          <div className="w-24 h-24 bg-[#F8F5EF] rounded-xl border-2 border-dashed border-[#EEE7DA] flex items-center justify-center">
                            <QrCode className="w-8 h-8 text-[#5E4E73]" />
                          </div>
                        )}
                        <span className="text-[8px] font-mono font-black uppercase tracking-widest text-[#2D1B46] mt-1 block">
                          SCAN TOKEN DI BILIK
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 5. PETUNJUK COBLOS DI BILIK SUARA */}
                  <div className="text-[11px] text-[#2D1B46] bg-[#F8F5EF] border border-[#EEE7DA] rounded-xl p-3 mb-2 space-y-1">
                    <strong className="text-[#2D1B46] block font-bold text-[11px]">PETUNJUK PENGGUNAAN DI BILIK SUARA:</strong>
                    <ol className="list-decimal pl-4 space-y-0.5 leading-snug text-[10px] text-[#5E4E73]">
                      <li>Bawa lembar ini ke lokasi <strong>Bilik Suara Kiosk (TPS)</strong> yang telah disediakan panitia.</li>
                      <li>Arahkan <strong>QR Code</strong> di atas ke kamera pemindai bilik, atau ketik <strong>PIN 6-Digit</strong> Anda pada layar sentuh.</li>
                      <li>Cermati foto dan visi-misi calon, lalu klik tombol <strong>Coblos</strong> pada Pasangan Calon pilihan Anda.</li>
                      <li>Tekan tombol <strong>Konfirmasi Suara</strong> untuk menyelesaikan proses pencoblosan secara sah dan terenkripsi.</li>
                    </ol>
                  </div>
                </div>

                {/* 6. SECURITY FOOTER */}
                <div className="pt-2 border-t-2 border-[#EEE7DA] flex items-center justify-between text-[10px] text-[#5E4E73] font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Dokumen Resmi Panitia Pemilihan • Sah & Terenkripsi</span>
                  </div>
                  <span className="font-mono font-bold text-[#2D1B46]">
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
