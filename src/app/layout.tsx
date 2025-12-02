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
        
        {/* Prevent CSS files from being executed as scripts - MUST run first and synchronously */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                'use strict';
                
                // CRITICAL: Remove script tags with CSS src IMMEDIATELY before browser tries to execute them
                // This must run synchronously, before any other scripts
                function removeCSSScripts() {
                  // Check head first (where Next.js usually puts scripts)
                  if (document.head) {
                    const headScripts = document.head.querySelectorAll('script[src]');
                    headScripts.forEach(function(script) {
                      const src = script.getAttribute('src') || script.src;
                      if (src && src.includes('.css')) {
                        console.warn('REMOVED: Script tag with CSS src found in head:', src);
                        script.remove();
                      }
                    });
                  }
                  
                  // Check body
                  if (document.body) {
                    const bodyScripts = document.body.querySelectorAll('script[src]');
                    bodyScripts.forEach(function(script) {
                      const src = script.getAttribute('src') || script.src;
                      if (src && src.includes('.css')) {
                        console.warn('REMOVED: Script tag with CSS src found in body:', src);
                        script.remove();
                      }
                    });
                  }
                  
                  // Check document (all scripts)
                  const allScripts = document.querySelectorAll('script[src]');
                  allScripts.forEach(function(script) {
                    const src = script.getAttribute('src') || script.src;
                    if (src && src.includes('.css')) {
                      console.warn('REMOVED: Script tag with CSS src found:', src);
                      script.remove();
                    }
                  });
                }
                
                // Remove immediately - don't wait for anything
                // Use requestAnimationFrame to ensure we run before browser executes scripts
                if (typeof requestAnimationFrame !== 'undefined') {
                  requestAnimationFrame(function() {
                    removeCSSScripts();
                  });
                }
                removeCSSScripts();
                
                // Use MutationObserver to catch scripts as they're added
                if (typeof MutationObserver !== 'undefined') {
                  const observer = new MutationObserver(function(mutations) {
                    mutations.forEach(function(mutation) {
                      mutation.addedNodes.forEach(function(node) {
                        if (node.nodeName === 'SCRIPT' && node.src) {
                          if (node.src.includes('.css')) {
                            console.warn('BLOCKED: Script with CSS src detected via MutationObserver:', node.src);
                            node.remove();
                          }
                        }
                        // Also check children
                        if (node.querySelectorAll) {
                          const scripts = node.querySelectorAll('script[src*=".css"]');
                          scripts.forEach(function(script) {
                            console.warn('BLOCKED: Script with CSS src found in added node:', script.src);
                            script.remove();
                          });
                        }
                      });
                    });
                  });
                  
                  // Observe head and body for script additions
                  if (document.head) {
                    observer.observe(document.head, { childList: true, subtree: true });
                  }
                  if (document.body) {
                    observer.observe(document.body, { childList: true, subtree: true });
                  } else {
                    // If body doesn't exist yet, observe document
                    observer.observe(document.documentElement, { childList: true, subtree: true });
                  }
                }
                
                // Also remove when DOM is ready (in case scripts are added later)
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', removeCSSScripts);
                } else {
                  removeCSSScripts();
                }
                
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
                        console.warn('BLOCKED: Attempt to load CSS file as script:', value);
                        // Don't set the src - this prevents the browser from trying to execute CSS
                        return;
                      }
                      return originalSetAttribute.call(this, name, value);
                    };
                    
                    // Also intercept direct property assignment
                    Object.defineProperty(element, 'src', {
                      set: function(value) {
                        if (typeof value === 'string' && value.includes('.css')) {
                          console.warn('BLOCKED: Attempt to set CSS file as script src:', value);
                          return; // Don't set src for CSS files
                        }
                        originalSetAttribute.call(this, 'src', value);
                      },
                      get: function() {
                        return this.getAttribute('src');
                      },
                      configurable: true
                    });
                  }
                  
                  return element;
                };
                
                // Intercept appendChild to check for script tags with CSS src
                Node.prototype.appendChild = function(child) {
                  if (child && child.tagName === 'SCRIPT') {
                    const src = child.getAttribute('src') || child.src;
                    if (src && src.includes('.css')) {
                      console.warn('BLOCKED: Attempt to append script with CSS src:', src);
                      return child; // Return without appending
                    }
                  }
                  return originalAppendChild.call(this, child);
                };
                
                // Intercept insertBefore to check for script tags with CSS src
                Node.prototype.insertBefore = function(newNode, referenceNode) {
                  if (newNode && newNode.tagName === 'SCRIPT') {
                    const src = newNode.getAttribute('src') || newNode.src;
                    if (src && src.includes('.css')) {
                      console.warn('BLOCKED: Attempt to insert script with CSS src:', src);
                      return newNode; // Return without inserting
                    }
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
