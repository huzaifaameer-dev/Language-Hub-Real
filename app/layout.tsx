import type { Metadata, Viewport } from "next";
import { Inter, Manrope, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["italic", "normal"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Language Hub | Hub of Language Excellence",
  description:
    "Language Hub helps learners develop English fluency, confidence, communication skills and creative expression through practical and interactive learning.",
  applicationName: "Language Hub",
  keywords: [
    "Language Hub",
    "Spoken English",
    "IELTS preparation",
    "PTE preparation",
    "Duolingo English",
    "English fluency",
    "English communication",
    "Javeria Malik",
  ],
  openGraph: {
    title: "Language Hub | Hub of Language Excellence",
    description:
      "Language Hub helps learners develop English fluency, confidence, communication skills and creative expression through practical and interactive learning.",
    type: "website",
    locale: "en_US",
    siteName: "Language Hub",
  },
  twitter: {
    card: "summary_large_image",
    title: "Language Hub | Hub of Language Excellence",
    description:
      "Language Hub helps learners develop English fluency, confidence, communication skills and creative expression through practical and interactive learning.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#faf8f4",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${manrope.variable} ${playfair.variable}`}
    >
      <body className="min-h-screen bg-ivory font-sans text-ink antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
