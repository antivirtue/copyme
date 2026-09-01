import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jakarta',
});

export const metadata: Metadata = {
  title: 'copyme — AI Video Transcript & Translation',
  description: 'Transcribe and translate video links from YouTube, TikTok, Instagram Reels, Threads, and X into clean structured text.',
  viewport: 'width=device-width, initial-scale=1.0',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className="font-sans antialiased bg-[#FAFAFA] text-[#111827] selection:bg-[#0071E3]/10 selection:text-[#0071E3] min-h-screen">
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
          <div className="absolute -top-[40%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-blue-50/50 via-slate-50/20 to-transparent blur-3xl opacity-70" />
        </div>
        {children}
      </body>
    </html>
  );
}
