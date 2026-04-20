import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'ExamSeat Monitor — TEF / TCF Canada Seat Tracker',
    template: '%s | ExamSeat Monitor',
  },
  description:
    'Near-real-time monitoring of TEF and TCF Canada exam seats across Alliance Française and university centers in Canada. Get instant alerts and autofill your registration form.',
  keywords: [
    'TCF Canada',
    'TEF Canada',
    'exam seats',
    'Alliance Française',
    'immigration exam',
    '考位监控',
    'French exam Canada',
  ],
  authors: [{ name: 'ExamSeat Monitor' }],
  creator: 'ExamSeat Monitor',
  openGraph: {
    type: 'website',
    locale: 'en_CA',
    title: 'ExamSeat Monitor — TEF / TCF Canada Seat Tracker',
    description:
      'Monitor exam seats at Alliance Française and other centers. Get instant alerts when seats open.',
    siteName: 'ExamSeat Monitor',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
