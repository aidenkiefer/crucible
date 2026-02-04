'use client'

import Image from 'next/image'
import { signIn } from 'next-auth/react'
import { AnimatedTorch } from '@/components/ui/AnimatedTorch'

type SignInFormProps = {
  callbackUrl?: string
  /** When true, renders only the card for embedding in a landing page (no full-screen layout or extra torches). */
  embedded?: boolean
}

const btnBase =
  'w-full flex items-center justify-center gap-3 px-5 py-3 font-medium transition-all duration-150 rounded-sm border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-coliseum-black'

function SignInCard({ callbackUrl = '/' }: { callbackUrl?: string }) {
  return (
    <div className="w-full max-w-md space-y-8 rounded-sm border-2 border-coliseum-bronze/30 bg-coliseum-stone p-8 shadow-xl shadow-black/50">
      <div className="text-center space-y-2">
        <h2 className="font-display text-3xl tracking-wide text-coliseum-sand uppercase">
          Enter the Arena
        </h2>
        <p className="text-coliseum-sand/90 text-sm uppercase tracking-widest">
          Sign in to mint gladiators and fight
        </p>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => signIn('google', { callbackUrl })}
          className={`${btnBase} bg-coliseum-bronze text-coliseum-black border-coliseum-bronze hover:brightness-110 focus:ring-coliseum-bronze`}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>

        <button
          onClick={() => signIn('twitter', { callbackUrl })}
          className={`${btnBase} bg-coliseum-stone text-coliseum-sand border-coliseum-bronze/50 hover:border-coliseum-bronze hover:brightness-110 focus:ring-coliseum-bronze`}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
            />
          </svg>
          Continue with Twitter
        </button>
      </div>
    </div>
  )
}

export function SignInForm({ callbackUrl = '/', embedded = false }: SignInFormProps) {
  if (embedded) {
    return <SignInCard callbackUrl={callbackUrl} />
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-coliseum-black p-6">
      <div className="flex items-center gap-6 sm:gap-8">
        <div className="hidden sm:block">
          <AnimatedTorch />
        </div>
        <SignInCard callbackUrl={callbackUrl} />
        <div className="hidden sm:block">
          <AnimatedTorch mirror />
        </div>
      </div>
      <div className="hidden sm:flex justify-between w-full max-w-4xl mt-6 px-2">
        <div>
          <AnimatedTorch />
        </div>
        <div>
          <AnimatedTorch mirror />
        </div>
      </div>
    </div>
  )
}
