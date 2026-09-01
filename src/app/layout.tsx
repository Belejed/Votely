import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Votely — Premium Online Voting Platform',
  description: 'A multi-tenant, secure, and beautiful online election system for schools, companies, and organizations.',
  keywords: ['voting', 'election', 'saas', 'electronic voting booth', 'qr-code authentication', 'secure', 'real-time results'],
  authors: [{ name: 'Votely Inc.' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col antialiased" suppressHydrationWarning>
        <div className="bg-mesh" suppressHydrationWarning />
        {children}
      </body>
    </html>
  );
}
