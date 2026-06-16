import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ITAM - Asset Management',
  description: 'IT Asset Management System - Enterprise IT Asset Tracking',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: '#f8f9fa', margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  )
}