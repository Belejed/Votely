import React from 'react';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';

export default async function OrgBaseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Validate tenant boundary exists
  const org = await db.organization.findUnique({
    where: { slug },
  });

  if (!org) {
    redirect('/login');
  }

  const sanitizeColor = (color: string | null, defaultColor: string) => {
    return color && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color) ? color : defaultColor;
  };

  const primaryColor = sanitizeColor(org.primaryColor, '#7C3AED');
  const secondaryColor = sanitizeColor(org.secondaryColor, '#A78BFA');

  return (
    <div 
      className="min-h-screen bg-background text-text-main relative" 
      data-org-theme
      style={{
        '--brand-primary': primaryColor,
        '--brand-secondary': secondaryColor,
        '--brand-accent': `${secondaryColor}40`,
      } as React.CSSProperties}
      suppressHydrationWarning
    >
      {/* Dynamic Brand Color Theme Injector */}
      <style dangerouslySetInnerHTML={{
        __html: `
          :root, html, body, [data-org-theme] {
            --brand-primary: ${primaryColor} !important;
            --brand-secondary: ${secondaryColor} !important;
            --brand-accent: ${secondaryColor}40 !important;
          }
        `
      }} />

      {/* Render child pages directly (public pages, print views, voting booth).
          Admin pages nested under (dashboard) will inherit the dashboard layout sidebar. */}
      {children}
    </div>
  );
}
