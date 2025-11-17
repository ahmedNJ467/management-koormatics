import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientProviders from "@/components/ClientProviders";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Koormatics Management System",
  description: "Fleet and operations management system for Koormatics",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ),
  icons: {
    icon: [
      { url: "/images/favicon-koormatics.png", sizes: "32x32", type: "image/png" },
      { url: "/images/favicon-koormatics.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/images/favicon-koormatics.png",
  },
  openGraph: {
    title: "Koormatics Management System",
    description: "Fleet and operations management system for Koormatics",
    images: ["/images/Koormatics-logo.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
