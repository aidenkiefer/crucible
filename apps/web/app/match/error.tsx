'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function MatchError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    console.error('Match error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-coliseum-black flex items-center justify-center p-4">
      <div className="panel max-w-2xl w-full p-8 inner-shadow">
        <div className="text-center">
          {/* Error Icon */}
          <div className="text-6xl mb-6">⚔️💥</div>

          {/* Title */}
          <h2 className="font-display text-3xl text-coliseum-sand uppercase tracking-wide mb-4">
            Match Error
          </h2>

          {/* Message */}
          <p className="text-coliseum-sand/70 mb-6 max-w-md mx-auto">
            The match encountered an error. This could be due to a connection issue or an unexpected game state.
          </p>

          {/* Error Details (development only) */}
          {process.env.NODE_ENV === 'development' && error.message && (
            <div className="mb-6 p-4 bg-coliseum-black/50 rounded border border-coliseum-red/30 text-left">
              <p className="text-xs font-mono text-coliseum-red">
                {error.message}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={reset}
              className="btn-primary"
            >
              Reconnect
            </button>
            <button
              onClick={() => router.push('/arena')}
              className="btn-secondary"
            >
              Return to Arena
            </button>
            <button
              onClick={() => router.push('/')}
              className="btn-secondary"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
