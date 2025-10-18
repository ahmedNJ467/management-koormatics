#!/bin/bash

# Fleet Portal Deployment Script
echo "🚗 Deploying Fleet-Koormatics Portal..."

# Create fleet portal directory
FLEET_DIR="fleet-portal"
if [ -d "$FLEET_DIR" ]; then
    echo "📁 Removing existing fleet portal directory..."
    rm -rf "$FLEET_DIR"
fi

echo "📁 Creating fleet portal directory..."
mkdir "$FLEET_DIR"
cd "$FLEET_DIR"

# Copy necessary files
echo "📋 Copying project files..."
cp -r ../src .
cp -r ../public .
cp ../package.json .
cp ../fleet-portal-package.json ./package.json
cp ../fleet-portal.config.js ./next.config.js
cp ../tailwind.config.ts .
cp ../postcss.config.js .
cp ../tsconfig.json .
cp ../tsconfig.app.json .
cp ../tsconfig.tsbuildinfo .
cp ../components.json .
cp ../eslint.config.js .

# Create fleet-specific auth page
echo "🔐 Setting up fleet authentication..."
mkdir -p src/pages
cp ../src/pages/FleetAuth.tsx src/pages/Auth.tsx

# Create fleet-specific layout
echo "🎨 Setting up fleet layout..."
cat > src/app/layout.tsx << 'EOF'
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import ClientProviders from "@/components/ClientProviders";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Fleet Portal - Koormatics",
  description: "Fleet management system for Koormatics",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ),
  icons: {
    icon: "/images/Koormatics-logo.png",
    shortcut: "/images/Koormatics-logo.png",
    apple: "/images/Koormatics-logo.png",
  },
  openGraph: {
    title: "Fleet Portal - Koormatics",
    description: "Fleet management system for Koormatics",
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
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
EOF

# Create fleet-specific page routing
echo "🛣️ Setting up fleet routing..."
cat > src/app/page.tsx << 'EOF'
import { redirect } from 'next/navigation';

export default function FleetHomePage() {
  redirect('/auth');
}
EOF

# Create fleet-specific auth page
cat > src/app/auth/page.tsx << 'EOF'
import FleetAuth from '@/pages/FleetAuth';

export default function AuthPage() {
  return <FleetAuth />;
}
EOF

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Build the fleet portal
echo "🔨 Building fleet portal..."
npm run build

echo "✅ Fleet portal built successfully!"
echo "🚀 Ready for deployment to Vercel"
echo ""
echo "To deploy:"
echo "1. cd fleet-portal"
echo "2. vercel --prod"
echo "3. Set domain to fleet-koormatics.vercel.app"
