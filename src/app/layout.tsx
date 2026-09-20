import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'WOI AutoTrader — MOFSL',
  description: 'Copy trading platform powered by Motilal Oswal OpenAPI | Wealth Ocean Institute',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-surface-muted text-gray-900 min-h-screen`}>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
