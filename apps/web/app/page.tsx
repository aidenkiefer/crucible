import { getServerSession } from 'next-auth'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { SignInForm } from '@/components/auth/SignInForm'
import { SignInButton } from '@/components/auth/SignInButton'

const linkBase =
  'px-6 py-3 font-medium rounded-sm border-2 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-coliseum-black'

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return <SignInForm callbackUrl="/" />
  }

  const isAdmin = (session.user as { isAdmin?: boolean })?.isAdmin === true

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-coliseum-black p-8">
      <div className="text-center space-y-8 max-w-lg">
        <h1 className="font-display text-4xl sm:text-5xl tracking-wide text-coliseum-sand uppercase">
          Gladiator Coliseum
        </h1>
        <p className="text-coliseum-sand/90 uppercase tracking-widest text-sm">
          Welcome, {session.user?.name ?? session.user?.email ?? 'Gladiator'}.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/mint"
            className={`${linkBase} bg-coliseum-bronze text-coliseum-black border-coliseum-bronze hover:brightness-110 focus:ring-coliseum-bronze`}
          >
            Mint Gladiator
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className={`${linkBase} bg-coliseum-stone text-coliseum-sand border-coliseum-bronze/50 hover:border-coliseum-bronze focus:ring-coliseum-bronze`}
            >
              Admin
            </Link>
          )}
          <SignInButton />
        </div>
      </div>
    </main>
  )
}
