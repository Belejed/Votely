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

  return (
    <div className="min-h-screen bg-background text-text-main relative" suppressHydrationWarning>
      {/* Dynamic Brand Color Theme Injector */}
      <style dangerouslySetInnerHTML={{
        __html: `
          :root {
            --brand-primary: ${org.primaryColor || '#7C3AED'};
            --brand-secondary: ${org.secondaryColor || '#A78BFA'};
            --brand-accent: ${org.secondaryColor}40;
          }
        `
      }} />

      {/* Render child pages directly (public pages, print views, voting booth).
          Admin pages nested under (dashboard) will inherit the dashboard layout sidebar. */}
      {children}
    </div>
  );
}
