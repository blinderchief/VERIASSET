import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "VeriAssets - AI-Verified Real-World Asset Marketplace",
  description:
    "Tokenize, verify, and trade real-world assets on Qubic with AI-powered verification and community governance.",
  keywords: [
    "RWA",
    "real world assets",
    "tokenization",
    "Qubic",
    "blockchain",
    "AI verification",
    "carbon credits",
    "treasury",
    "real estate",
  ],
  authors: [{ name: "VeriAssets Team" }],
  openGraph: {
    title: "VeriAssets - AI-Verified Real-World Asset Marketplace",
    description:
      "Tokenize, verify, and trade real-world assets on Qubic with AI-powered verification.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "VeriAssets - AI-Verified RWA Marketplace",
    description: "Trade tokenized real-world assets on Qubic",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
          suppressHydrationWarning
        >
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
