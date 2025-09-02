import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ClientProviders from '@/components/ClientProviders'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Koormatics Management System',
  description: 'Fleet and operations management system for Koormatics',
  icons: {
    icon: '/images/Koormatics-logo.png',
    shortcut: '/images/Koormatics-logo.png',
    apple: '/images/Koormatics-logo.png',
  },
  openGraph: {
    title: 'Koormatics Management System',
    description: 'Fleet and operations management system for Koormatics',
    images: ['/images/Koormatics-logo.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  )
}
