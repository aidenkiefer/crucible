'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to console (could be sent to error tracking service like Sentry)
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-coliseum-black flex items-center justify-center p-4">
      <div className="panel max-w-2xl w-full p-8 inner-shadow">
        <div className="text-center">
          {/* Error Icon */}
          <div className="text-6xl mb-6">⚠️</div>

          {/* Title */}
          <h2 className="font-display text-3xl text-coliseum-sand uppercase tracking-wide mb-4">
            Something Went Wrong
          </h2>

          {/* Message */}
          <p className="text-coliseum-sand/70 mb-6 max-w-md mx-auto">
            An unexpected error occurred. The error has been logged and our team will investigate.
          </p>

          {/* Error Details (only in development) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-6 p-4 bg-coliseum-black/50 rounded border border-coliseum-red/30 text-left overflow-auto max-h-48">
              <p className="text-xs font-mono text-coliseum-red">
                {error.message}
              </p>
              {error.stack && (
                <pre className="text-xs font-mono text-coliseum-sand/50 mt-2 whitespace-pre-wrap">
                  {error.stack}
                </pre>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={reset}
              className="btn-primary"
            >
              Try Again
            </button>
            <button
              onClick={() => (window.location.href = '/')}
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
