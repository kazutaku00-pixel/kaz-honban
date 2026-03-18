import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const notoJP = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-japanese",
  display: "swap",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "NihonGo — Learn Japanese with Real Teachers",
  description:
    "1-on-1 Japanese lessons with native speakers. From $10/25min. Personalized to your level, schedule, and goals.",
  openGraph: {
    title: "NihonGo — Learn Japanese with Real Teachers",
    description:
      "1-on-1 Japanese lessons with native speakers. From $10/25min.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${jakarta.variable} ${notoJP.variable}`}>
      <head>
        {/* Clash Display from Fontshare — not available in next/font */}
        <link
          href="https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`noise ${jakarta.className}`}>{children}</body>
    </html>
  );
}
