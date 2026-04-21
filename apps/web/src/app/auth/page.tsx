import { Suspense } from 'react'
import { AuthPageClient } from './AuthPageClient'

// useSearchParams() inside AuthPageClient requires a Suspense boundary.
// This server component provides it so Next.js can statically prerender /auth.
export default function AuthPage() {
  return (
    <Suspense>
      <AuthPageClient />
    </Suspense>
  )
}
