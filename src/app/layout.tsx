import type { Metadata } from "next";
import localFont from "next/font/local";
import { DM_Serif_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import { AuthSync } from "@/components/AuthSync";
import { Analytics } from "@vercel/analytics/react";

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
      </body>
    </html>
  );
}
