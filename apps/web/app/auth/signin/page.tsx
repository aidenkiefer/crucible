'use client'

import { useSearchParams } from 'next/navigation'
import { SignInForm } from '@/components/auth/SignInForm'

export default function SignIn() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  return <SignInForm callbackUrl={callbackUrl} />
}
