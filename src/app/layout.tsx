import type { Metadata } from 'next';
import { Inter, IBM_Plex_Mono, Playfair_Display } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const mono = IBM_Plex_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
});

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  weight: ['600'],
  style: ['normal', 'italic'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Alibi — Every lie leaves a path',
  description: 'A detective game where reasoning runs on FalkorDB graphs.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${mono.variable} ${playfair.variable} h-full dark`}
    >
      <body className="min-h-full bg-background text-text-primary font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
