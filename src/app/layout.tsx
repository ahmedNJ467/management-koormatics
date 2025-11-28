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
      { url: "/favicon.png", type: "image/png" },
    ],
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "Koormatics Management System",
    description: "Fleet and operations management system for Koormatics",
    images: ["/logo.svg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent CSS files from being executed as scripts */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Intercept script loading to prevent CSS files from being executed
                const originalCreateElement = document.createElement;
                document.createElement = function(tagName) {
                  const element = originalCreateElement.call(document, tagName);
                  if (tagName.toLowerCase() === 'script') {
                    const originalSetAttribute = element.setAttribute;
                    element.setAttribute = function(name, value) {
                      if (name === 'src' && typeof value === 'string' && value.includes('.css')) {
                        console.warn('Blocked attempt to load CSS file as script:', value);
                        return; // Prevent setting src for CSS files
                      }
                      return originalSetAttribute.call(this, name, value);
                    };
                  }
                  return element;
                };
                
                // Aggressively clear service workers and caches on page load
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    registrations.forEach(function(registration) {
                      registration.unregister().catch(function() {});
                    });
                  });
                }
                if ('caches' in window) {
                  caches.keys().then(function(cacheNames) {
                    cacheNames.forEach(function(cacheName) {
                      caches.delete(cacheName).catch(function() {});
                    });
                  });
                }
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
