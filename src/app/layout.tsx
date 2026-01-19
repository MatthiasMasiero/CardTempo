import type { Metadata } from "next";
import localFont from "next/font/local";
import { DM_Serif_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import { AuthSync } from "@/components/AuthSync";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

// Editorial typography
const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'https://cardtempo.com'
  ),
  title: "CardTempo | Boost Your Credit Score with Smart Payment Timing",
  description: "Optimize your credit card payments to improve your credit score. Learn when to pay to reduce your reported credit utilization and boost your score by 15-50 points.",
  keywords: ["credit score", "credit utilization", "credit card payments", "cardtempo", "improve credit score"],
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
  },
  openGraph: {
    title: 'CardTempo | Boost Your Credit Score with Smart Payment Timing',
    description: 'Optimize your credit card payments to improve your credit score by 15-100 points. Free calculator, no card numbers needed.',
    siteName: 'CardTempo',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CardTempo - Your credit score is being held back',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CardTempo | Boost Your Credit Score',
    description: 'Optimize your credit card payments to improve your credit score by 15-100 points. Free calculator, no card numbers needed.',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${dmSerifDisplay.variable} ${dmSans.variable} antialiased min-h-screen bg-background`}
      >
        <AuthSync />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
