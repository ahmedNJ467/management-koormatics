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
        {/* Prevent HTML caching to avoid stale CSS references */}
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        
        {/* Prevent CSS files from being executed as scripts - MUST run first */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                'use strict';
                
                // Run immediately before any other scripts
                // Intercept ALL script tag creation to prevent CSS files from being loaded as scripts
                const originalCreateElement = document.createElement;
                const originalAppendChild = Node.prototype.appendChild;
                const originalInsertBefore = Node.prototype.insertBefore;
                
                // Override createElement to intercept script tags
                document.createElement = function(tagName, options) {
                  const element = originalCreateElement.call(this, tagName, options);
                  
                  if (tagName.toLowerCase() === 'script') {
                    // Intercept setAttribute for script src
                    const originalSetAttribute = element.setAttribute;
                    element.setAttribute = function(name, value) {
                      if (name === 'src' && typeof value === 'string' && value.includes('.css')) {
                        console.error('BLOCKED: Attempt to load CSS file as script:', value);
                        // Don't set the src - this prevents the browser from trying to execute CSS
                        return;
                      }
                      return originalSetAttribute.call(this, name, value);
                    };
                    
                    // Also intercept direct property assignment
                    Object.defineProperty(element, 'src', {
                      set: function(value) {
                        if (typeof value === 'string' && value.includes('.css')) {
                          console.error('BLOCKED: Attempt to set CSS file as script src:', value);
                          return; // Don't set src for CSS files
                        }
                        originalSetAttribute.call(this, 'src', value);
                      },
                      get: function() {
                        return this.getAttribute('src');
                      }
                    });
                  }
                  
                  return element;
                };
                
                // Intercept appendChild to check for script tags with CSS src
                Node.prototype.appendChild = function(child) {
                  if (child && child.tagName === 'SCRIPT' && child.src && child.src.includes('.css')) {
                    console.error('BLOCKED: Attempt to append script with CSS src:', child.src);
                    return child; // Return without appending
                  }
                  return originalAppendChild.call(this, child);
                };
                
                // Intercept insertBefore to check for script tags with CSS src
                Node.prototype.insertBefore = function(newNode, referenceNode) {
                  if (newNode && newNode.tagName === 'SCRIPT' && newNode.src && newNode.src.includes('.css')) {
                    console.error('BLOCKED: Attempt to insert script with CSS src:', newNode.src);
                    return newNode; // Return without inserting
                  }
                  return originalInsertBefore.call(this, newNode, referenceNode);
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
                
                // Remove any existing script tags that reference CSS files
                document.addEventListener('DOMContentLoaded', function() {
                  const scripts = document.querySelectorAll('script[src*=".css"]');
                  scripts.forEach(function(script) {
                    console.error('REMOVED: Script tag with CSS src found:', script.src);
                    script.remove();
                  });
                });
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
