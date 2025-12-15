import type { Metadata } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import './styles/globals.css';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import { Providers } from './providers';
import VisitorTracker from './components/VisitorTracker';

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

export const metadata: Metadata = {
  title: 'The Crucible House | Where Art and Connections are Forged',
  description: 'The Crucible House - Where Art and Connections are Forged',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
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

