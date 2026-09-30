import type { Metadata } from 'next';
import { Playfair_Display, Inter, Outfit } from 'next/font/google';
import './styles/globals.css';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import { Providers } from './providers';
import VisitorTracker from './components/VisitorTracker';
import { siteConfig } from '@/site.config';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-playfair',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-inter',
});

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-outfit',
});

export const metadata: Metadata = {
  title: `${siteConfig.name} | ${siteConfig.tagline}`,
  description: siteConfig.description,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable} ${outfit.variable}`}>
      <body>
        <Navigation />
        <Providers>
          {children}
        </Providers>
        <Footer />
        <VisitorTracker />
      </body>
    </html>
  );
}

