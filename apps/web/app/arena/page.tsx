import Link from 'next/link'

export default function ArenaPage() {
  return (
    <main className="min-h-screen bg-coliseum-black">
      <div className="h-1 bg-gradient-to-r from-transparent via-coliseum-bronze to-transparent" />

      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <div className="panel p-8 space-y-6">
          <h1 className="font-display text-2xl sm:text-3xl text-coliseum-sand uppercase tracking-wide">
            The arena is currently under construction
          </h1>
          <p className="text-coliseum-sand/80 uppercase tracking-wider text-sm">
            Come back another time.
          </p>
          <div className="pt-4">
            <Link href="/" className="btn-primary inline-block">
              Return to camp
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
