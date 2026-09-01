'use client';

import React, { useState, useTransition } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Palette, 
  Sparkles, 
  Vote, 
  Check, 
  Crown, 
  Image as ImageIcon, 
  UploadCloud, 
  Eye, 
  ArrowRight, 
  Layers, 
  FileText,
  Lock,
  HelpCircle,
  Maximize2
} from 'lucide-react';
import { saveThemeAction } from './actions';

interface OrganizationProps {
  id: string;
  name: string;
  slug: string;
  plan: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string | null;
  posterUrl?: string | null;
  posterEnabled?: boolean;
  posterTitle?: string;
  posterCaption?: string;
}

interface ThemeClientProps {
  organization: OrganizationProps;
  slug: string;
}

export default function ThemeClientPage({ organization, slug }: ThemeClientProps) {
  const [isPending, startTransition] = useTransition();

  // Color & workspace states
  const [name, setName] = useState(organization.name);
  const [primaryColor, setPrimaryColor] = useState(organization.primaryColor || '#7C3AED');
  const [secondaryColor, setSecondaryColor] = useState(organization.secondaryColor || '#A78BFA');
  const [logoUrl, setLogoUrl] = useState<string | null>(organization.logoUrl || null);

  // Poster Splash Screen states
  const [posterEnabled, setPosterEnabled] = useState(organization.posterEnabled ?? false);
  const [posterUrl, setPosterUrl] = useState(organization.posterUrl || '');
  const [posterTitle, setPosterTitle] = useState(organization.posterTitle || 'Panduan & Tata Cara Pemilihan');
  const [posterCaption, setPosterCaption] = useState(
    organization.posterCaption || 'Silakan cermati informasi dan tata cara pemilihan sebelum melanjutkan pengisian surat suara.'
  );

  // Preview switcher: 'THEME' | 'POSTER'
  const [previewTab, setPreviewTab] = useState<'THEME' | 'POSTER'>('POSTER');

  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  const presets = [
    { name: 'Royal Purple', primary: '#7C3AED', secondary: '#A78BFA' },
    { name: 'Electric Emerald', primary: '#059669', secondary: '#34D399' },
    { name: 'Crimson Power', primary: '#DC2626', secondary: '#F87171' },
    { name: 'Cyber Indigo', primary: '#4F46E5', secondary: '#818CF8' },
    { name: 'Ocean Cyan', primary: '#0891B2', secondary: '#38BDF8' },
    { name: 'Sunset Amber', primary: '#D97706', secondary: '#FBBF24' },
  ];

  const applyPreset = (primary: string, secondary: string) => {
    setPrimaryColor(primary);
    setSecondaryColor(secondary);
  };


  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const rawDataUrl = evt.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 360;
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
          const compressedB64 = canvas.toDataURL('image/png');
          setLogoUrl(compressedB64);
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handlePosterUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const rawDataUrl = evt.target?.result as string;
      const img = new Image();
      img.onload = () => {
        // High quality canvas compression (max 960px) for crisp poster display
        const canvas = document.createElement('canvas');
        const maxDim = 960;
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
          setPosterUrl(compressedB64);
          setPosterEnabled(true);
          setPreviewTab('POSTER');
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    setStatusMsg(null);
    startTransition(async () => {
      const res = await saveThemeAction(
        slug, 
        primaryColor, 
        secondaryColor, 
        name,
        posterUrl,
        posterEnabled,
        posterTitle,
        posterCaption,
        logoUrl
      );
      if (res?.error) {
        setStatusMsg({ type: 'danger', text: res.error });
      } else {
        setStatusMsg({ type: 'success', text: 'Tema dan pengaturan Poster Splash Screen berhasil disimpan!' });
      }
    });
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-main pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-2xl sm:text-3xl font-display font-black text-text-main tracking-tight">Theme & Poster Builder</h3>
            <Badge variant="info" className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-brand-primary" /> CUSTOM BRANDING
            </Badge>
          </div>
          <p className="text-xs text-text-muted mt-1">
            Kustomisasi warna instansi, logo, dan aktifkan <strong>Poster Sambutan / Tata Cara Pemilihan</strong> sebelum pemilih masuk ke surat suara.
          </p>
        </div>

        <Button onClick={handleSave} disabled={isPending} className="button-gradient h-10 px-5 font-bold text-xs shadow-md shadow-brand-primary/20">
          {isPending ? 'Menyimpan...' : 'Simpan Semua Perubahan'}
        </Button>
      </div>

      {/* Alert Notification */}
      {statusMsg && (
        <div className={`p-4 rounded-2xl text-xs font-bold border flex items-center gap-3 ${
          statusMsg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-danger/10 border-danger/20 text-danger'
        }`}>
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Main Grid: Settings Left (7 cols), Live Preview Right (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: CONTROLS & FORMS (7 cols) */}
        <div className="lg:col-span-7 space-y-6">

                    {/* CARD 0: LOGO INSTANSI / SEKOLAH */}
          <Card className="p-6 bg-card border-border-main rounded-3xl space-y-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-border-main pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold">
                  <Vote className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-text-main">Logo Instansi / Sekolah</h4>
                  <p className="text-xs text-text-muted">Logo akan ditampilkan pada navbar, bilik suara, surat suara, dan kartu undangan.</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-5 bg-background/50 border border-dashed border-border-main p-4 rounded-2xl">
              {logoUrl ? (
                <div className="w-20 h-20 rounded-2xl bg-white border-2 border-brand-primary/40 p-1.5 flex items-center justify-center shadow-md shrink-0">
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-brand-primary/10 text-brand-primary border-2 border-dashed border-brand-primary/30 flex flex-col items-center justify-center text-center p-2 shrink-0">
                  <Vote className="w-8 h-8 opacity-60" />
                  <span className="text-[8px] font-bold mt-1">Default Logo</span>
                </div>
              )}

              <div className="space-y-2.5 flex-1 w-full">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-2 bg-brand-primary hover:bg-purple-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-brand-primary/20">
                    <UploadCloud className="w-4 h-4" />
                    <span>{logoUrl ? 'Ganti File Logo' : 'Upload File Logo (PNG/JPG)'}</span>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>

                  {logoUrl && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setLogoUrl(null)}
                      className="text-danger hover:bg-danger/10 text-xs font-bold h-10 px-3 rounded-xl"
                    >
                      Hapus Logo
                    </Button>
                  )}
                </div>

                <Input
                  placeholder="Atau Paste URL Logo Online (https://...)"
                  value={logoUrl || ''}
                  onChange={(e) => setLogoUrl(e.target.value || null)}
                />
              </div>
            </div>
          </Card>

          {/* CARD 1: POSTER SPLASH SCREEN SETTINGS */}
          <Card className="p-6 bg-card border-2 border-brand-primary/30 rounded-3xl space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-border-main pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-text-main">Poster Splash Screen Sebelum Ballot</h4>
                  <p className="text-xs text-text-muted">Tampilkan poster tata cara / profil pemilihan sebelum siswa mencoblos suara.</p>
                </div>
              </div>
            </div>

            {/* Toggle Enable/Disable */}
            <div className="bg-background/60 p-4 rounded-2xl border border-border-main flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-black text-text-main block">Aktifkan Poster Sambutan</span>
                <span className="text-[11px] text-text-muted block">
                  {posterEnabled 
                    ? '🟢 Aktif: Pemilih akan melihat poster ini sebelum membuka kartu suara.' 
                    : '⚪ Nonaktif: Pemilih langsung masuk ke kartu suara tanpa poster.'}
                </span>
              </div>
              <Switch
                checked={posterEnabled}
                onChange={(e) => {
                  setPosterEnabled(e.target.checked);
                  if (e.target.checked) setPreviewTab('POSTER');
                }}
              />
            </div>

            {/* Poster Upload & URL Input */}
            <div className="space-y-4 pt-1">
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted block">Upload Gambar Poster Pemilihan</span>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-background/50 border border-dashed border-border-main p-4 rounded-2xl">
                {posterUrl ? (
                  <div className="relative w-24 h-32 rounded-xl overflow-hidden border-2 border-brand-primary/50 shadow-md shrink-0">
                    <img src={posterUrl} alt="Poster Preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-24 h-32 rounded-xl bg-card border border-dashed border-border-main flex flex-col items-center justify-center text-text-muted text-center p-2 shrink-0">
                    <UploadCloud className="w-6 h-6 text-brand-primary mb-1 opacity-70" />
                    <span className="text-[9px] font-bold">Belum Ada Poster</span>
                  </div>
                )}

                <div className="space-y-2.5 flex-1 w-full">
                  <label className="cursor-pointer inline-flex items-center gap-2 bg-brand-primary hover:bg-purple-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-brand-primary/20">
                    <UploadCloud className="w-4 h-4" />
                    <span>{posterUrl ? 'Ganti File Poster' : 'Pilih File Poster (JPG/PNG)'}</span>
                    <input type="file" accept="image/*" onChange={handlePosterUpload} className="hidden" />
                  </label>

                  <Input
                    placeholder="Atau Paste URL Gambar Poster (https://...)"
                    value={posterUrl}
                    onChange={(e) => {
                      setPosterUrl(e.target.value);
                      if (e.target.value) {
                        setPosterEnabled(true);
                        setPreviewTab('POSTER');
                      }
                    }}
                  />
                </div>
              </div>

              {/* Title & Caption */}
              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Judul Poster / Sambutan"
                  placeholder="e.g. Panduan & Tata Cara Pemilihan"
                  value={posterTitle}
                  onChange={(e) => setPosterTitle(e.target.value)}
                />
                <Input
                  label="Keterangan / Panduan Singkat"
                  placeholder="e.g. Cermati visi-misi calon sebelum mencoblos."
                  value={posterCaption}
                  onChange={(e) => setPosterCaption(e.target.value)}
                />
              </div>
            </div>
          </Card>

          {/* CARD 2: WORKSPACE COLOR BRANDING */}
          <Card className="p-6 bg-card border-border-main rounded-3xl space-y-6">
            <h4 className="text-base font-black text-text-main border-b border-border-main pb-3 flex items-center gap-2">
              <Palette className="w-5 h-5 text-brand-primary" /> Warna Brand & Identitas Instansi
            </h4>

            <div className="space-y-4">
              <Input
                label="Nama Tampilan Instansi"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isPending}
              />

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Warna Utama (Primary)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      disabled={isPending}
                      className="w-10 h-10 rounded-xl border border-border-main p-0 cursor-pointer overflow-hidden bg-transparent shrink-0"
                    />
                    <Input
                      placeholder="#7C3AED"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      disabled={isPending}
                      className="flex-1 font-mono uppercase font-bold"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Warna Aksen (Secondary)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      disabled={isPending}
                      className="w-10 h-10 rounded-xl border border-border-main p-0 cursor-pointer overflow-hidden bg-transparent shrink-0"
                    />
                    <Input
                      placeholder="#A78BFA"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      disabled={isPending}
                      className="flex-1 font-mono uppercase font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Presets */}
              <div className="border-t border-border-main pt-4 space-y-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted block">Preset Warna Siap Pakai</span>
                <div className="flex flex-wrap gap-2">
                  {presets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => applyPreset(preset.primary, preset.secondary)}
                      disabled={isPending}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border-main hover:border-brand-primary bg-background/50 hover:bg-brand-primary/5 text-xs font-bold transition-all cursor-pointer"
                    >
                      <span className="w-3.5 h-3.5 rounded-full flex shrink-0 border border-white/40 shadow-2xs" style={{
                        background: `linear-gradient(135deg, ${preset.primary} 0%, ${preset.secondary} 100%)`
                      }} />
                      <span>{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: LIVE INTERACTIVE PREVIEW (5 cols) */}
        <div className="lg:col-span-5 space-y-4 sticky top-6">
          <div className="flex items-center justify-between pl-1">
            <span className="text-xs font-black uppercase tracking-wider text-text-muted flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-brand-primary" /> Live Simulator Preview
            </span>

            {/* Preview switcher tabs */}
            <div className="flex items-center gap-1 bg-background p-1 rounded-xl border border-border-main">
              <button
                type="button"
                onClick={() => setPreviewTab('POSTER')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  previewTab === 'POSTER' ? 'bg-brand-primary text-white shadow-xs' : 'text-text-muted hover:text-text-main'
                }`}
              >
                Poster Sambutan
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab('THEME')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  previewTab === 'THEME' ? 'bg-brand-primary text-white shadow-xs' : 'text-text-muted hover:text-text-main'
                }`}
              >
                Surat Suara
              </button>
            </div>
          </div>

          {/* SIMULATOR CONTAINER */}
          <Card className="p-6 relative overflow-hidden border-2 border-border-main bg-background/60 shadow-xl rounded-3xl min-h-[440px] flex flex-col justify-center">
            
            {/* POSTER PREVIEW */}
            {previewTab === 'POSTER' && (
              <div className="space-y-4 animate-fade-in text-center">
                <div className="flex items-center justify-between pb-2 border-b border-border-main text-left">
                  <div>
                    <Badge variant={posterEnabled ? 'success' : 'default'} className="text-[9px] uppercase font-black">
                      {posterEnabled ? 'STATUS: POSTER AKTIF' : 'STATUS: NONAKTIF'}
                    </Badge>
                    <span className="text-[10px] text-text-muted block mt-0.5">Layar sambutan sebelum masuk ke bilik suara</span>
                  </div>
                </div>

                {posterUrl ? (
                  <div className="w-full aspect-[4/3] max-h-60 rounded-2xl overflow-hidden border-2 border-brand-primary/40 shadow-lg bg-black relative">
                    <img src={posterUrl} alt="Poster" className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="w-full h-44 rounded-2xl bg-card border-2 border-dashed border-border-main flex flex-col items-center justify-center text-text-muted p-4 space-y-2">
                    <ImageIcon className="w-10 h-10 opacity-30 text-brand-primary" />
                    <span className="text-xs font-bold text-text-muted">Pilih atau upload gambar poster di sebelah kiri</span>
                  </div>
                )}

                <div className="space-y-1 text-center pt-1">
                  <h5 className="font-black text-base text-text-main leading-snug">{posterTitle}</h5>
                  <p className="text-xs text-text-muted leading-relaxed line-clamp-2">{posterCaption}</p>
                </div>

                <Button className="w-full button-gradient font-black text-xs h-11 rounded-xl shadow-md shadow-brand-primary/20 mt-2">
                  <span>Saya Mengerti, Lanjut ke Surat Suara ➔</span>
                </Button>
              </div>
            )}

            {/* THEME PREVIEW */}
            {previewTab === 'THEME' && (
              <div className="space-y-5 animate-fade-in">
                <div className="flex justify-between items-center pb-2 border-b border-border-main">
                  <div className="flex items-center gap-1.5">
                    <Vote className="w-4.5 h-4.5" style={{ color: primaryColor }} />
                    <span className="font-black text-xs text-text-main">{name || 'Workspace'}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border" style={{
                    backgroundColor: `${primaryColor}15`,
                    borderColor: `${primaryColor}40`,
                    color: primaryColor
                  }}>
                    BILIK SUARA AKTIF
                  </span>
                </div>

                <div className="bg-card border-2 border-border-main rounded-2xl p-4 shadow-sm space-y-3">
                  <div className="w-full h-24 rounded-xl bg-background border border-border-main flex items-center justify-center font-black text-sm text-brand-primary">
                    Pas Foto 3:4 Resmi
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider block">Kandidat Paslon #1</span>
                    <h5 className="font-black text-sm text-text-main">Calon Ketua OSIS</h5>
                  </div>
                </div>

                <button className="w-full h-11 rounded-xl text-white text-xs font-black transition-all shadow-md active:scale-[0.98] cursor-pointer" style={{
                  background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                  boxShadow: `0 4px 15px -3px ${primaryColor}40`
                }}>
                  Coblos Paslon #1
                </button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
