import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { VisualEditsMessenger } from "orchids-visual-edits";
import { Navbar } from "@/components/navbar";
import { TokenCleaner } from "@/components/token-cleaner";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "P.A.L. — Personal Assistant for Life on Campus",
  description:
    "AI-powered onboarding agent for engineering college students. Smart document verification, RAG-powered chat, and social matching.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}
      >
        <ThemeProvider>
          <TokenCleaner />
          <Navbar />
          <main className="min-h-screen">{children}</main>
        </ThemeProvider>
        <VisualEditsMessenger />
      </body>
    </html>
  );
}
