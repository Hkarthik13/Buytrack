import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { PurchaseProvider } from '@/context/PurchaseContext';
import AppLayout from '@/components/layout/AppLayout';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'BuyTrack — Buy it once. Never lose track of it.',
  description: 'Personal purchase intelligence platform. Scan receipts, track warranties, calculate EMIs, and query your purchases with AI.',
  keywords: ['BuyTrack', 'Receipt Scanner', 'EMI Calculator', 'Warranty Tracker', 'Purchase Intelligence'],
  authors: [{ name: 'BuyTrack Team' }],
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={`${inter.variable} font-sans antialiased min-h-screen bg-background text-foreground`}>
        <ThemeProvider>
          <AuthProvider>
            <PurchaseProvider>
              <AppLayout>{children}</AppLayout>
            </PurchaseProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
