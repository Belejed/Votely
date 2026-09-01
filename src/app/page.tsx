'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Vote, 
  UserCog, 
  ArrowRight, 
  Sparkles, 
  PlusCircle
} from 'lucide-react';
import Link from 'next/link';

export default function ElectionGatewayPage() {
  return (
    <div className="min-h-screen bg-background text-text-main flex flex-col justify-between relative overflow-hidden select-none" suppressHydrationWarning>
      {/* Background Mesh Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-brand-secondary/10 blur-[120px] pointer-events-none" />

      {/* Header Navbar */}
      <header className="h-20 bg-transparent flex items-center justify-between px-6 sm:px-12 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-brand-primary to-brand-secondary flex items-center justify-center text-white font-bold shadow-md shadow-brand-primary/20">
            <Vote className="w-5.5 h-5.5" />
          </div>
          <div>
            <span className="font-display font-black text-xl tracking-tight block leading-none text-text-main">
              Votely
            </span>
            <span className="text-[10px] text-text-muted font-bold uppercase mt-1 tracking-wider block">
              Portal Pemilihan Digital Terpadu
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="font-bold text-xs gap-1.5">
              <UserCog className="w-4 h-4" />
              <span>Login Panitia</span>
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="sm" className="button-gradient font-bold text-xs gap-1.5 shadow-md shadow-brand-primary/15">
              <PlusCircle className="w-4 h-4" />
              <span>Daftar Organisasi</span>
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 z-10 max-w-4xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4 max-w-2xl mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-brand-primary/10 border border-brand-primary/20 rounded-full text-brand-primary text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Platform E-Voting Modern & Real-Time</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-black tracking-tight text-text-main leading-tight">
            Pemilihan Cepat, Aman, & Transparan
          </h1>
          <p className="text-sm sm:text-base text-text-muted leading-relaxed max-w-lg mx-auto">
            Sistem e-voting mandiri untuk OSIS, BEM, organisasi, dan instansi. Kelola pemilihan, bilik suara kiosk scanner, dan hitung cepat live count real-time.
          </p>
        </motion.div>

        {/* 2 Primary Action Cards */}
        <div className="grid sm:grid-cols-2 gap-6 w-full max-w-2xl">
          {/* Card 1: Login Panitia & Staff */}
          <Link href="/login" className="flex">
            <Card hoverLift className="w-full p-8 bg-card border border-border-main hover:border-brand-primary/40 rounded-3xl flex flex-col justify-between transition-all group shadow-sm">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UserCog className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xl text-text-main group-hover:text-brand-primary transition-colors">
                    Login Panitia & Staff
                  </h3>
                  <p className="text-xs text-text-muted mt-2 leading-relaxed">
                    Masuk ke Control Panel pemilihan untuk mengelola paslon, DPT pemilih, dan membuka bilik suara.
                  </p>
                </div>
              </div>
              <div className="pt-6 mt-6 border-t border-border-main flex items-center justify-between text-xs font-bold text-brand-primary">
                <span>Masuk Control Panel</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </Link>

          {/* Card 2: Buat Workspace Baru */}
          <Link href="/signup" className="flex">
            <Card hoverLift className="w-full p-8 bg-linear-to-br from-brand-primary to-brand-secondary text-white rounded-3xl flex flex-col justify-between shadow-xl shadow-brand-primary/20 transition-all group">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-white/15 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                  <PlusCircle className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xl text-white">
                    Buat Workspace Organisasi
                  </h3>
                  <p className="text-xs text-white/80 mt-2 leading-relaxed">
                    Daftarkan sekolah atau instansi Anda untuk membuat sistem pemilihan online baru.
                  </p>
                </div>
              </div>
              <div className="pt-6 mt-6 border-t border-white/20 flex items-center justify-between text-xs font-bold text-white">
                <span>Daftar Sekarang</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-16 border-t border-border-main/50 flex items-center justify-between px-6 sm:px-12 text-xs text-text-muted font-medium z-10">
        <span>© 2026 Votely by arya • Sistem E-Voting Mandiri</span>
        <div className="flex items-center gap-4">
          <Link href="/login" className="hover:text-brand-primary transition-colors">Login Panitia</Link>
          <Link href="/signup" className="hover:text-brand-primary transition-colors">Daftar</Link>
        </div>
      </footer>
    </div>
  );
}
