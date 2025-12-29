import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthSync } from "@/components/AuthSync";

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

export const metadata: Metadata = {
  title: "Credit Optimizer | Boost Your Credit Score with Smart Payment Timing",
  description: "Optimize your credit card payments to improve your credit score. Learn when to pay to reduce your reported credit utilization and boost your score by 15-50 points.",
  keywords: ["credit score", "credit utilization", "credit card payments", "credit optimizer", "improve credit score"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background`}
      >
        <AuthSync />
        {children}
      </body>
    </html>
  );
}
