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
        {/* Aggressive cache/SW cleanup to avoid stale assets and data */}
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
                  
                  // Always clear caches on page load for fresh data
                  var shouldClearCaches = true;
                  
                  if (!stored || stored !== CURRENT_TAG) {
                    shouldClearCaches = true;
                    localStorage.setItem(TAG_KEY, CURRENT_TAG);
                  }
                  
                  if (shouldClearCaches) {
                    // Clear service workers
                    if ('serviceWorker' in navigator) {
                      navigator.serviceWorker.getRegistrations().then(function(regs){
                        regs.forEach(function(r){r.unregister();});
                      });
                    }
                    
                    // Clear browser caches
                    if ('caches' in window) {
                      caches.keys().then(function(names){ 
                        names.forEach(function(n){ caches.delete(n); }); 
                      });
                    }
                    
                    // Clear session storage but preserve auth tokens
                    try { 
                      var authToken = sessionStorage.getItem('supabase.auth.token');
                      sessionStorage.clear();
                      if (authToken) {
                        sessionStorage.setItem('supabase.auth.token', authToken);
                      }
                    } catch (e) {}
                    
                    // Clear localStorage items that might cause stale data
                    try {
                      localStorage.removeItem('react-query');
                      localStorage.removeItem('tanstack-query');
                    } catch (e) {}
                  }
                  
                  // Force fresh data on every page load
                  window.addEventListener('load', function() {
                    // Clear any remaining cached data
                    if ('caches' in window) {
                      caches.keys().then(function(names){ 
                        names.forEach(function(n){ caches.delete(n); }); 
                      });
                    }
                  });
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
