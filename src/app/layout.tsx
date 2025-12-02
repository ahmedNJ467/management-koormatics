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
                
                // CRITICAL: Remove script tags with CSS src IMMEDIATELY - run synchronously
                // This must execute before ANY other scripts can run
                (function removeCSSScriptsImmediate() {
                  // Use a synchronous approach - check document immediately
                  var scripts = [];
                  
                  // Get all script elements that exist right now
                  if (document.head) {
                    var headScripts = document.head.getElementsByTagName('script');
                    for (var i = 0; i < headScripts.length; i++) {
                      scripts.push(headScripts[i]);
                    }
                  }
                  
                  if (document.body) {
                    var bodyScripts = document.body.getElementsByTagName('script');
                    for (var i = 0; i < bodyScripts.length; i++) {
                      scripts.push(bodyScripts[i]);
                    }
                  }
                  
                  // Remove any script with CSS in src - do this synchronously
                  for (var i = 0; i < scripts.length; i++) {
                    var script = scripts[i];
                    var src = script.getAttribute('src') || script.src || '';
                    if (src && src.indexOf('.css') !== -1) {
                      // Remove immediately before browser can execute
                      script.parentNode && script.parentNode.removeChild(script);
                    }
                  }
                })();
                
                // Also intercept at the DOM level before scripts are added
                var originalAppendChild = Node.prototype.appendChild;
                var originalInsertBefore = Node.prototype.insertBefore;
                
                Node.prototype.appendChild = function(child) {
                  if (child && child.tagName === 'SCRIPT') {
                    var src = child.getAttribute('src') || child.src || '';
                    if (src && src.indexOf('.css') !== -1) {
                      return child; // Don't append
                    }
                  }
                  return originalAppendChild.call(this, child);
                };
                
                Node.prototype.insertBefore = function(newNode, refNode) {
                  if (newNode && newNode.tagName === 'SCRIPT') {
                    var src = newNode.getAttribute('src') || newNode.src || '';
                    if (src && src.indexOf('.css') !== -1) {
                      return newNode; // Don't insert
                    }
                  }
                  return originalInsertBefore.call(this, newNode, refNode);
                };
                
                // Function to remove CSS scripts (for later use)
                function removeCSSScripts() {
                  var scripts = document.querySelectorAll('script[src*=".css"]');
                  for (var i = 0; i < scripts.length; i++) {
                    scripts[i].parentNode && scripts[i].parentNode.removeChild(scripts[i]);
                  }
                }
                
                // Remove immediately and repeatedly
                removeCSSScripts();
                setTimeout(removeCSSScripts, 0);
                setTimeout(removeCSSScripts, 10);
                setTimeout(removeCSSScripts, 50);
                setTimeout(removeCSSScripts, 100);
                
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
