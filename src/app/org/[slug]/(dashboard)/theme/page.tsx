import React from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import ThemeClientPage from './theme-client';

export default async function ThemePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // 1. Fetch organization details
  const org = await db.organization.findUnique({
    where: { slug },
  });

  if (!org) {
    notFound();
  }

  const serializedOrg = {
    id: org.id,
    name: org.name,
    slug: org.slug,
    plan: org.plan,
    primaryColor: org.primaryColor,
    secondaryColor: org.secondaryColor,
    posterUrl: org.posterUrl || null,
    posterEnabled: org.posterEnabled || false,
    posterTitle: org.posterTitle || 'Panduan & Tata Cara Pemilihan',
    posterCaption: org.posterCaption || 'Silakan cermati tata cara dan informasi pemilihan sebelum melanjutkan ke pengisian surat suara.',
  };

  return (
    <ThemeClientPage 
      organization={serializedOrg} 
      slug={slug} 
    />
  );
}
