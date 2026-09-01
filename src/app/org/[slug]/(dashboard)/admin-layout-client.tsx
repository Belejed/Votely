'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  Menu, 
  X, 
  Vote, 
  Building, 
  UserCheck, 
  LogOut,
  TrendingUp,
  LayoutDashboard, 
  CalendarDays, 
  UsersRound,
  UserCog, 
  Palette, 
  History, 
  Megaphone,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { adminLogoutAction } from './actions';

interface AdminLayoutClientProps {
  children: React.ReactNode;
  org: {
    name: string;
    slug: string;
  };
  session: {
    name: string;
    role: string;
  };
}

export default function AdminLayoutClient({ children, org, session }: AdminLayoutClientProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [navigatingHref, setNavigatingHref] = useState<string | null>(null);

  // Sync collapsed state with localStorage on mount
  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem('votely_admin_sidebar_collapsed');
    if (saved === 'true') {
      setIsCollapsed(true);
    }
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('votely_admin_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Reset navigation indicator on route transition complete
  useEffect(() => {
    setNavigatingHref(null);
    setMobileOpen(false);
  }, [pathname]);

  // Define nav links filtered by user role
  const allNavLinks = [
    { label: 'Dashboard', href: `/org/${org.slug}/dashboard`, icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'ADMIN', 'STAFF'] },
    { label: 'Pemilihan Aktif', href: `/org/${org.slug}/active-election`, icon: Vote, roles: ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'OBSERVER'] },
    { label: 'Voters Importer', href: `/org/${org.slug}/voters`, icon: UsersRound, roles: ['SUPER_ADMIN', 'ADMIN', 'STAFF'] },
    { label: 'Live Result Count', href: `/org/${org.slug}/livecount`, icon: TrendingUp, roles: ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'OBSERVER'] },
    { label: 'Events Wizard', href: `/org/${org.slug}/events`, icon: CalendarDays, roles: ['SUPER_ADMIN', 'ADMIN'] },
    { label: 'Panitia & Staff', href: `/org/${org.slug}/users`, icon: UserCog, roles: ['SUPER_ADMIN', 'ADMIN'] },
    { label: 'Theme Builder', href: `/org/${org.slug}/theme`, icon: Palette, roles: ['SUPER_ADMIN', 'ADMIN'] },
    { label: 'Audit Logs', href: `/org/${org.slug}/audit`, icon: History, roles: ['SUPER_ADMIN', 'ADMIN', 'OBSERVER'] },
  ];

  const userRole = session.role || 'STAFF';
  const navLinks = allNavLinks.filter(link => link.roles.includes(userRole));

  const handleLinkClick = (href: string) => {
    if (href !== pathname) {
      setNavigatingHref(href);
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-text-main relative overflow-hidden select-none" suppressHydrationWarning>
      
      {/* Top Animated Navigation Progress Bar */}
      <AnimatePresence>
        {navigatingHref && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-0 left-0 right-0 h-1 z-50 overflow-hidden bg-brand-primary/15 pointer-events-none"
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ repeat: Infinity, duration: 0.75, ease: 'easeInOut' }}
              className="w-1/2 h-full bg-linear-to-r from-brand-primary via-brand-secondary to-brand-primary shadow-sm shadow-brand-primary"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Drawer Overlay Backdrop */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/45 backdrop-blur-xs z-30 lg:hidden transition-opacity duration-300"
        />
      )}

      {/* Sidebar aside panel */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 bg-card border-r border-border-main flex flex-col justify-between shrink-0 z-40 lg:z-20
          transition-all duration-300 ease-in-out
          ${isCollapsed ? 'w-20' : 'w-68'}
          ${mobileOpen ? 'left-0' : 'left-[-272px] lg:left-0'}
        `}
      >
        {/* Toggle Collapse Trigger Button (Desktop Only) */}
        {isMounted && (
          <button 
            onClick={toggleSidebar}
            className="absolute top-9 -right-3 w-6.5 h-6.5 rounded-full bg-card border border-border-main hidden lg:flex items-center justify-center text-text-muted hover:text-brand-primary shadow-xs z-30 transition-all duration-200 cursor-pointer"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <ChevronLeft className={`w-3.5 h-3.5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
          </button>
        )}

        <div className="flex flex-col h-full overflow-y-auto no-scrollbar">
          {/* Logo Header */}
          <div className={`p-6 border-b border-border-main flex items-center justify-between ${isCollapsed ? 'justify-center px-4' : ''}`}>
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-brand-primary to-brand-secondary flex items-center justify-center text-white font-bold shadow-md shadow-brand-primary/20 shrink-0">
                <Vote className="w-5 h-5" />
              </div>
              {!isCollapsed && (
                <div>
                  <span className="font-display font-extrabold text-lg tracking-tight block leading-none text-text-main">
                    Votely
                  </span>
                  <span className="text-[10px] text-text-muted uppercase tracking-wider font-bold mt-1 block">
                    Workspace
                  </span>
                </div>
              )}
            </Link>
            {/* Mobile Close Button */}
            <button 
              onClick={() => setMobileOpen(false)}
              className="lg:hidden text-text-muted hover:text-text-main p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 flex-1">
            {navLinks.map((link, idx) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              const isPendingThis = navigatingHref === link.href;

              return (
                <div key={idx} className="relative group">
                  <Link
                    href={link.href}
                    onClick={() => handleLinkClick(link.href)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200
                      ${isCollapsed ? 'justify-center px-3' : ''}
                      ${isActive 
                        ? 'text-brand-primary bg-brand-primary/10' 
                        : 'text-text-muted hover:text-brand-primary hover:bg-brand-primary/5'
                      }
                      ${isPendingThis ? 'ring-2 ring-brand-primary/40 animate-pulse' : ''}
                    `}
                    title={isCollapsed ? link.label : undefined}
                  >
                    {isPendingThis ? (
                      <Loader2 className="w-5 h-5 shrink-0 text-brand-primary animate-spin" />
                    ) : (
                      <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-brand-primary' : 'text-text-muted/65 group-hover:text-brand-primary'}`} />
                    )}
                    {!isCollapsed && (
                      <span className="flex-1 flex items-center justify-between">
                        <span>{link.label}</span>
                        {isPendingThis && (
                          <span className="text-[10px] text-brand-primary font-bold animate-pulse">
                            Loading...
                          </span>
                        )}
                      </span>
                    )}
                  </Link>

                  {/* Collapsed Tooltip on Hover */}
                  {isCollapsed && (
                    <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-popover border border-border-main text-popover-foreground text-xs font-bold px-2.5 py-1.5 rounded-lg opacity-0 invisible pointer-events-none group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 whitespace-nowrap shadow-md">
                      {link.label}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Sidebar Footer Organization Info */}
          <div className={`p-4 border-t border-border-main bg-background/30 ${isCollapsed ? 'p-3 flex justify-center' : ''}`}>
            <div className={`flex items-center gap-3 bg-card border border-border-main rounded-2xl p-3 shadow-xs ${isCollapsed ? 'p-2 justify-center' : ''}`}>
              <div className="w-9 h-9 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0">
                <Building className="w-4.5 h-4.5" />
              </div>
              {!isCollapsed && (
                <div className="overflow-hidden">
                  <span className="font-bold text-xs text-text-main block truncate leading-tight">
                    {org.name}
                  </span>
                  <span className="text-[10px] text-text-muted truncate block">
                    {org.slug}.votely.app
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <div 
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out
          ${isCollapsed ? 'lg:pl-20' : 'lg:pl-68'}
        `}
      >
        {/* Header Navbar */}
        <header className="h-16 sm:h-18 bg-card/90 backdrop-blur-md border-b border-border-main flex items-center justify-between px-4 sm:px-6 md:px-8 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            {/* Mobile Hamburger Trigger */}
            <button 
              onClick={() => setMobileOpen(true)}
              className="lg:hidden text-text-muted hover:text-text-main p-1.5 border border-border-main rounded-xl bg-card shadow-xs cursor-pointer"
              title="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <h2 className="font-display font-extrabold text-sm md:text-lg text-text-main truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                {org.name} Control Panel
              </h2>
              {navigatingHref && (
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-brand-primary font-bold bg-brand-primary/10 px-2.5 py-1 rounded-full animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Switching view...</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Logged in admin account indicator */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-brand-primary/15 flex items-center justify-center text-brand-primary text-xs font-extrabold border border-brand-primary/10">
                <UserCheck className="w-4.5 h-4.5" />
              </div>
              <div className="hidden sm:block text-right">
                <span className="font-bold text-xs text-text-main block leading-none">
                  {session.name}
                </span>
                <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider mt-0.5 block leading-none">
                  {session.role}
                </span>
              </div>
            </div>

            <div className="h-5 w-[1px] bg-border-main mx-1" />

            {/* Logout Action */}
            <form action={adminLogoutAction}>
              <Button type="submit" variant="ghost" size="sm" className="text-text-muted hover:text-danger hover:bg-danger/5 gap-2 px-3 cursor-pointer">
                <LogOut className="w-4.5 h-4.5" />
                <span className="hidden md:inline">Log out</span>
              </Button>
            </form>
          </div>
        </header>

        {/* Dashboard Workspace Contents with smooth transition wrapper */}
        <main className={`flex-1 p-3.5 sm:p-5 md:p-8 flex flex-col justify-between overflow-y-auto relative transition-opacity duration-200 ${navigatingHref ? 'opacity-60' : 'opacity-100'}`}>
          <div className="flex-1">
            {children}
          </div>

          {/* Explicit Workspace Footer Credit */}
          <footer className="mt-12 pt-6 border-t border-border-main flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-muted select-none">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-lg bg-linear-to-tr from-brand-primary to-brand-secondary flex items-center justify-center text-white text-[10px] font-black">
                V
              </div>
              <span>
                © 2026 <strong className="text-text-main font-black">Votely by Belejed</strong> • Sistem E-Voting Mandiri
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-semibold text-text-muted">
              <span>{org.name}</span>
              <span>•</span>
              <span className="bg-brand-primary/10 text-brand-primary px-2.5 py-0.5 rounded-full font-bold">
                Workspace Aktif
              </span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
