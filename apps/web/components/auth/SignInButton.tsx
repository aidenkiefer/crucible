'use client'

import { signIn, signOut, useSession } from 'next-auth/react'

const btnBase =
  'px-4 py-2 font-medium rounded-sm border-2 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-coliseum-black'

export function SignInButton() {
  const { data: session } = useSession()

  if (session) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-coliseum-sand/80 uppercase tracking-wide">
          {session.user?.email}
        </span>
        <button
          onClick={() => signOut()}
          className={`${btnBase} bg-coliseum-red text-coliseum-sand border-coliseum-red hover:brightness-110 focus:ring-coliseum-red`}
        >
          Sign Out
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => signIn()}
      className={`${btnBase} bg-coliseum-bronze text-coliseum-black border-coliseum-bronze hover:brightness-110 focus:ring-coliseum-bronze`}
    >
      Sign In
    </button>
  )
}
