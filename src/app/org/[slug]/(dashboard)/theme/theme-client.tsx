'use client';

import React, { useState, useTransition } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Palette, 
  Sparkles, 
  Check, 
  Crown, 
  ArrowRight,
  Info,
  Vote
} from 'lucide-react';
import { saveThemeAction } from './actions';

interface OrgProps {
  id: string;
  name: string;
  slug: string;
  plan: string;
  primaryColor: string;
  secondaryColor: string;
}

interface ThemeClientProps {
  organization: OrgProps;
  slug: string;
}

export default function ThemeClientPage({ organization, slug }: ThemeClientProps) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(organization.name);
  const [primaryColor, setPrimaryColor] = useState(organization.primaryColor || '#7C3AED');
  const [secondaryColor, setSecondaryColor] = useState(organization.secondaryColor || '#A78BFA');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  const presets = [
    { name: 'Votely Purple', primary: '#7C3AED', secondary: '#A78BFA' },
    { name: 'Oceanic Blue', primary: '#2563EB', secondary: '#60A5FA' },
    { name: 'Emerald Forest', primary: '#059669', secondary: '#34D399' },
    { name: 'Crimson Rose', primary: '#DC2626', secondary: '#F87171' },
    { name: 'Nordic Slate', primary: '#4B5563', secondary: '#9CA3AF' }
  ];

  const handleSave = () => {
    setStatusMsg(null);
    startTransition(async () => {
      const res = await saveThemeAction(slug, primaryColor, secondaryColor, name);
      if (res?.error) {
        setStatusMsg({ type: 'danger', text: res.error });
      } else if (res?.success) {
        setStatusMsg({ type: 'success', text: 'Branding options updated successfully!' });
      }
    });
  };

  const applyPreset = (prim: string, sec: string) => {
    setPrimaryColor(prim);
    setSecondaryColor(sec);
  };

  const isPro = true;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title Header */}
      <div>
        <h3 className="text-3xl font-display font-extrabold text-text-main">Branding & Theme Builder</h3>
        <p className="text-sm text-text-muted mt-1">Configure workspace identity, names, and customized color themes. (Pro Plan Feature)</p>
      </div>

      {!isPro && (
        <Card className="p-5 border-2 border-dashed border-warning/30 bg-warning/5 flex items-center justify-between gap-6">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center text-warning shrink-0">
              <Crown className="w-5 h-5 fill-warning" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-text-main">Custom Themes are Locked</h4>
              <p className="text-xs text-text-muted mt-1 max-w-xl leading-relaxed">
                Your workspace is currently on the <strong>Free Plan</strong>. Upgrade to <strong>Pro</strong> to build custom themes, override Votely branding, set custom logos, and map dedicated domains.
              </p>
            </div>
          </div>
          <Button variant="outline" className="border-warning/30 hover:bg-warning/5 text-warning shrink-0 gap-1.5 font-bold">
            Upgrade Workspace
          </Button>
        </Card>
      )}

      {statusMsg && (
        <div className={`p-3.5 border rounded-xl text-xs font-semibold ${
          statusMsg.type === 'success' ? 'bg-success/10 border-success/20 text-success' : 'bg-danger/10 border-danger/20 text-danger'
        }`}>
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Main customizer grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: Theme Customizer Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-6">
            <h4 className="text-base font-extrabold text-text-main border-b border-border-main pb-3 mb-6 flex items-center gap-2">
              <Palette className="w-5 h-5 text-brand-primary" /> Workspace Details
            </h4>

            <div className="space-y-4">
              <Input
                label="Workspace Display Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!isPro || isPending}
              />

              <div className="grid sm:grid-cols-2 gap-4">
                {/* Primary Color Picker */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Primary Brand Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      disabled={!isPro || isPending}
                      className="w-10 h-10 rounded-lg border border-border-main p-0 cursor-pointer overflow-hidden bg-transparent shrink-0"
                    />
                    <Input
                      placeholder="#7C3AED"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      disabled={!isPro || isPending}
                      className="flex-1 font-mono uppercase"
                    />
                  </div>
                </div>

                {/* Secondary Color Picker */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Secondary Accent Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      disabled={!isPro || isPending}
                      className="w-10 h-10 rounded-lg border border-border-main p-0 cursor-pointer overflow-hidden bg-transparent shrink-0"
                    />
                    <Input
                      placeholder="#A78BFA"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      disabled={!isPro || isPending}
                      className="flex-1 font-mono uppercase"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Presets Row */}
            {isPro && (
              <div className="mt-8 border-t border-border-main pt-6 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-text-muted block">Theme Color Presets</span>
                <div className="flex flex-wrap gap-2.5">
                  {presets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => applyPreset(preset.primary, preset.secondary)}
                      disabled={isPending}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border-main hover:border-brand-primary bg-background/50 hover:bg-brand-primary/5 text-xs font-semibold transition-all cursor-pointer"
                    >
                      <span className="w-3.5 h-3.5 rounded-full flex shrink-0 border border-slate-300" style={{
                        background: `linear-gradient(135deg, ${preset.primary} 0%, ${preset.secondary} 100%)`
                      }} />
                      <span>{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isPro && (
              <div className="pt-6 border-t border-border-main mt-6 text-right">
                <Button onClick={handleSave} disabled={isPending} className="button-gradient h-11 px-6 shadow-md shadow-brand-primary/10">
                  {isPending ? 'Saving...' : 'Save Theme Preferences'}
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Right Preview: Real-time UI Mockup Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-text-muted block pl-1">Live Theme Preview</span>
          
          <Card className="p-6 space-y-6 relative overflow-hidden border-2 border-dashed border-border-main/80 bg-background/50">
            {/* Visual style injector specifically for this preview box */}
            <style dangerouslySetInnerHTML={{
              __html: `
                .theme-preview-card {
                  --preview-primary: ${primaryColor};
                  --preview-secondary: ${secondaryColor};
                }
              `
            }} />

            <div className="theme-preview-card space-y-6">
              {/* Mock Badge */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <Vote className="w-5 h-5" style={{ color: 'var(--preview-primary)' }} />
                  <span className="font-display font-extrabold text-sm text-text-main">{name || 'Workspace'}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border" style={{
                  backgroundColor: `${primaryColor}10`,
                  borderColor: `${primaryColor}30`,
                  color: primaryColor
                }}>
                  ACTIVE BALLOT
                </span>
              </div>

              {/* Mock Card */}
              <div className="bg-card border border-border-main rounded-2xl p-4 shadow-sm space-y-3">
                <div className="text-center py-2">
                  <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider block">Real-time Turnout</span>
                  <h4 className="text-3xl font-display font-black mt-0.5" style={{ color: primaryColor }}>84.5%</h4>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-text-main">
                    <span>Jane Doe</span>
                    <span>58%</span>
                  </div>
                  <div className="w-full h-2.5 bg-background border border-border-main rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{
                      background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                      width: '58%'
                    }} />
                  </div>
                </div>
              </div>

              {/* Mock Button */}
              <button className="w-full h-10 rounded-xl text-white text-xs font-bold transition-all shadow-md active:scale-[0.98] cursor-pointer" style={{
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                boxShadow: `0 4px 15px -3px ${primaryColor}40`
              }}>
                Vote Candidate #1
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
