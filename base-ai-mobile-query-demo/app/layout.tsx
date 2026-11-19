import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "base-ai-mobile-query-demo.pearceworkmantac.chatgpt.site";
  const protocol = headerList.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return {
    title: "Base AI Mobile Demo",
    description: "An interactive prototype for Base AI on mobile.",
    openGraph: {
      title: "Base AI Mobile Demo",
      description: "Explore Base switching, history, mentions, and AI data analysis on mobile.",
      images: [{ url: `${origin}/og.png`, width: 1200, height: 630, alt: "Base AI Mobile Demo" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Base AI Mobile Demo",
      description: "Explore Base switching, history, mentions, and AI data analysis on mobile.",
      images: [`${origin}/og.png`],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
