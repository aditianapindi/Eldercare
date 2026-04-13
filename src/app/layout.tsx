import type { Metadata } from "next";
import { Fraunces, DM_Sans } from "next/font/google";
import "./globals.css";
import PageTracker from "@/lib/page-tracker";
import { FeedbackWidget } from "@/lib/feedback-widget";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Inaya — How prepared is your family?",
  description:
    "A 2-minute assessment that reveals blind spots in your aging parents' care. Get your family's Care Preparedness Score.",
  icons: {
    icon: "/logo-icon.png",
    apple: "/logo-icon.png",
  },
  openGraph: {
    title: "Inaya — How prepared is your family?",
    description:
      "Most Indian families can't answer 5 basic questions about their parents' care. Take the free assessment.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Inaya — How prepared is your family?",
    description:
      "Most Indian families can't answer 5 basic questions about their parents' care. Take the free assessment.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${dmSans.variable}`}>
      <body className="antialiased">
        <PageTracker />
        {children}
        <FeedbackWidget />
      </body>
    </html>
  );
}
