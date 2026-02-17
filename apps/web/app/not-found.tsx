import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-coliseum-black flex items-center justify-center p-4">
      <div className="panel max-w-2xl w-full p-8 inner-shadow">
        <div className="text-center">
          {/* Icon */}
          <div className="text-6xl mb-6">🏛️</div>

          {/* Title */}
          <h2 className="font-display text-4xl text-coliseum-sand uppercase tracking-wide mb-4">
            404
          </h2>

          <h3 className="font-display text-2xl text-coliseum-bronze uppercase tracking-wide mb-6">
            Lost in the Arena
          </h3>

          {/* Message */}
          <p className="text-coliseum-sand/70 mb-8 max-w-md mx-auto">
            The path you seek does not exist in this realm. Perhaps it was destroyed in battle, or never existed at all.
          </p>

          {/* Actions */}
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/" className="btn-primary">
              Return Home
            </Link>
            <Link href="/arena" className="btn-secondary">
              Enter the Arena
            </Link>
            <Link href="/camp" className="btn-secondary">
              Visit Camp
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
