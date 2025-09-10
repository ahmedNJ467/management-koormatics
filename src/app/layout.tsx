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
    icon: "/images/Koormatics-logo.png",
    shortcut: "/images/Koormatics-logo.png",
    apple: "/images/Koormatics-logo.png",
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
        {/* Early cache/SW cleanup to avoid stale assets after deploy */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var TAG_KEY = 'koormatics-build-tag';
                  var CURRENT_TAG = '${
                    process.env.NEXT_PUBLIC_BUILD_TAG ?? "dev"
                  }';
                  var stored = localStorage.getItem(TAG_KEY);
                  if (!stored || stored !== CURRENT_TAG) {
                    if ('serviceWorker' in navigator) {
                      navigator.serviceWorker.getRegistrations().then(function(regs){
                        regs.forEach(function(r){r.unregister();});
                      });
                    }
                    if ('caches' in window) {
                      caches.keys().then(function(names){ names.forEach(function(n){ caches.delete(n); }); });
                    }
                    try { sessionStorage.clear(); } catch (e) {}
                    localStorage.setItem(TAG_KEY, CURRENT_TAG);
                  }
                } catch (e) { /* ignore */ }
              })();
            `,
          }}
        />
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
