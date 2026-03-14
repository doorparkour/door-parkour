import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import ScrollToTop from "@/components/layout/ScrollToTop";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Door Parkour",
    template: "%s | Door Parkour",
  },
  description:
    "Door County's only ADAPT-certified parkour coaching — outdoor classes in Sturgeon Bay, WI.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://doorparkour.com"
  ),
  openGraph: {
    siteName: "Door Parkour",
    locale: "en_US",
    type: "website",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ScrollToTop />
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
