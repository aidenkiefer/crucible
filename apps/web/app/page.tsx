import { getServerSession } from 'next-auth'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { SignInForm } from '@/components/auth/SignInForm'
import { SignInButton } from '@/components/auth/SignInButton'
import { AnimatedTorch } from '@/components/ui/AnimatedTorch'

function ActionCard({
  href,
  icon,
  title,
  description,
  primary = false,
}: {
  href: string
  icon: string
  title: string
  description: string
  primary?: boolean
}) {
  return (
    <Link
      href={href}
      className={`
        group relative block p-6 border-2 transition-all duration-150
        ${primary
          ? 'bg-coliseum-bronze/10 border-coliseum-bronze hover:bg-coliseum-bronze/20 hover:shadow-lg hover:shadow-coliseum-bronze/20'
          : 'bg-coliseum-stone border-coliseum-bronze/30 hover:border-coliseum-bronze/60'
        }
      `}
    >
      <div className={`
        w-12 h-12 mb-4 border-2 flex items-center justify-center text-xl
        ${primary
          ? 'border-coliseum-bronze bg-coliseum-black/50'
          : 'border-coliseum-bronze/30 bg-coliseum-black/30 group-hover:border-coliseum-bronze/50'
        }
      `}>
        {icon}
      </div>
      <h3 className={`
        font-display text-xl uppercase tracking-wide mb-2
        ${primary ? 'text-coliseum-bronze' : 'text-coliseum-sand'}
      `}>
        {title}
      </h3>
      <p className="text-coliseum-sand/60 text-sm leading-relaxed">
        {description}
      </p>
      <div className={`
        absolute bottom-0 left-0 right-0 h-0.5 transition-all duration-150
        ${primary
          ? 'bg-coliseum-bronze'
          : 'bg-coliseum-bronze/0 group-hover:bg-coliseum-bronze/50'
        }
      `} />
    </Link>
  )
}

function LandingPage() {
  return (
    <main className="min-h-screen bg-coliseum-black">
      <div className="h-1 bg-gradient-to-r from-transparent via-coliseum-bronze to-transparent" />

      <div className="max-w-3xl mx-auto px-6 py-12 sm:py-16">
        {/* Hero with torches */}
        <div className="flex items-start justify-center gap-4 sm:gap-8 mb-14">
          <div className="hidden sm:block pt-2">
            <AnimatedTorch size="md" />
          </div>
          <div className="text-center space-y-3">
            <div className="inline-block px-6 py-1 border-x-2 border-coliseum-bronze/30">
              <h1 className="font-display text-4xl sm:text-5xl text-coliseum-sand uppercase tracking-wide">
                Crucible
              </h1>
            </div>
            <p className="text-coliseum-bronze uppercase tracking-[0.35em] text-xs">
              Gladiator Coliseum
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <div className="w-12 h-px bg-gradient-to-r from-transparent to-coliseum-bronze/50" />
              <span className="text-coliseum-bronze text-base">⚔</span>
              <div className="w-12 h-px bg-gradient-to-l from-transparent to-coliseum-bronze/50" />
            </div>
          </div>
          <div className="hidden sm:block pt-2">
            <AnimatedTorch size="md" mirror />
          </div>
        </div>

        {/* What is Crucible */}
        <section className="mb-12">
          <div className="section-divider mb-6">
            <span>What is Crucible?</span>
          </div>
          <div className="panel p-6 space-y-4">
            <p className="text-coliseum-sand/90 leading-relaxed">
              Crucible is a <strong className="text-coliseum-sand">competitive 1v1 arena combat game</strong> where you own Gladiators and equipment as on-chain assets and use them in skill-influenced battles.
            </p>
            <p className="text-coliseum-sand/70 text-sm leading-relaxed">
              Mint unique Gladiators, equip them with weapons and armor, and enter the arena. Matches are deterministic and server-authoritative — your choices and your warrior&apos;s build decide the outcome.
            </p>
          </div>
        </section>

        {/* Pillars */}
        <section className="mb-12">
          <div className="section-divider mb-6">
            <span>Core pillars</span>
          </div>
          <ul className="space-y-3">
            {[
              'Game-first design — fun before financialization.',
              'Player-owned assets — your Gladiators and gear are yours.',
              'Entry-based competition — skill and strategy, not gambling.',
              'Web-first, low-friction — play in the browser.',
            ].map((line, i) => (
              <li key={i} className="flex items-start gap-3 panel p-4">
                <span className="text-coliseum-bronze shrink-0">◆</span>
                <span className="text-coliseum-sand/90 text-sm">{line}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Beta CTA */}
        <section className="mb-14">
          <div className="panel border-coliseum-bronze/50 p-6 text-center space-y-3">
            <p className="text-coliseum-bronze font-display text-lg uppercase tracking-wider">
              Beta testing coming March 2026
            </p>
            <p className="text-coliseum-sand/70 text-sm">
              Sign in below to get ready — mint a Gladiator and enter the arena when the gates open.
            </p>
          </div>
        </section>

        {/* Login section */}
        <section>
          <div className="section-divider mb-6">
            <span>Enter the arena</span>
          </div>
          <div className="flex items-start justify-center gap-4 sm:gap-8">
            <div className="hidden sm:block pt-4">
              <AnimatedTorch size="sm" />
            </div>
            <SignInForm callbackUrl="/" embedded />
            <div className="hidden sm:block pt-4">
              <AnimatedTorch size="sm" mirror />
            </div>
          </div>
          <div className="flex justify-center gap-8 mt-6">
            <AnimatedTorch size="sm" />
            <AnimatedTorch size="sm" mirror />
          </div>
        </section>

        <div className="mt-14 flex items-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-coliseum-bronze/20" />
          <span className="text-coliseum-bronze/30 text-xs uppercase tracking-widest">
            Blood & Glory
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-coliseum-bronze/20" />
        </div>
      </div>
    </main>
  )
}

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return <LandingPage />
  }

  const isAdmin = (session.user as { isAdmin?: boolean })?.isAdmin === true
  const userName = session.user?.name ?? session.user?.email?.split('@')[0] ?? 'Gladiator'

  return (
    <main className="min-h-screen bg-coliseum-black">
      {/* Top decorative bar */}
      <div className="h-1 bg-gradient-to-r from-transparent via-coliseum-bronze to-transparent" />

      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header with torches */}
        <div className="flex items-start justify-center gap-6 sm:gap-10 mb-16">
          <div className="hidden sm:block pt-4">
            <AnimatedTorch />
          </div>

          <div className="text-center space-y-4">
            {/* Title plaque */}
            <div className="inline-block px-8 py-1 border-x-2 border-coliseum-bronze/30">
              <h1 className="font-display text-5xl sm:text-6xl text-coliseum-sand uppercase tracking-wide">
                Crucible
              </h1>
            </div>
            <p className="text-coliseum-bronze uppercase tracking-[0.4em] text-xs">
              Gladiator Coliseum
            </p>

            {/* Decorative divider */}
            <div className="flex items-center justify-center gap-3 pt-4">
              <div className="w-16 h-px bg-gradient-to-r from-transparent to-coliseum-bronze/50" />
              <span className="text-coliseum-bronze text-lg">⚔</span>
              <div className="w-16 h-px bg-gradient-to-l from-transparent to-coliseum-bronze/50" />
            </div>

            {/* Welcome message */}
            <div className="pt-4">
              <p className="text-coliseum-sand/80 uppercase tracking-widest text-sm">
                Welcome back,{' '}
                <span className="text-coliseum-sand font-bold">{userName}</span>
              </p>
            </div>
          </div>

          <div className="hidden sm:block pt-4">
            <AnimatedTorch mirror />
          </div>
        </div>

        {/* Action cards */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px flex-1 bg-coliseum-bronze/30" />
            <h2 className="text-coliseum-bronze/80 uppercase tracking-widest text-xs">
              Choose Your Path
            </h2>
            <div className="h-px flex-1 bg-coliseum-bronze/30" />
          </div>

          <div className={`grid gap-4 ${isAdmin ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
            <ActionCard
              href="/mint"
              icon="🔥"
              title="The Forge"
              description="Mint a new Gladiator to fight in your name. Each warrior is unique."
              primary
            />
            <ActionCard
              href="/arena"
              icon="⚔️"
              title="Enter Arena"
              description="Test your Gladiator against CPU opponents in brutal combat."
            />
            {isAdmin && (
              <ActionCard
                href="/admin"
                icon="📜"
                title="War Council"
                description="Manage game data, bundles, and templates."
              />
            )}
          </div>
        </div>

        {/* Stats or info section placeholder */}
        <div className="p-6 bg-coliseum-stone border-2 border-coliseum-bronze/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-coliseum-sand/60 uppercase tracking-wider text-xs mb-1">
                Arena Status
              </p>
              <p className="text-coliseum-sand font-display text-lg uppercase">
                Gates Open
              </p>
            </div>
            <div className="text-right">
              <p className="text-coliseum-sand/60 uppercase tracking-wider text-xs mb-1">
                Your Standing
              </p>
              <p className="text-coliseum-bronze font-display text-lg uppercase">
                Challenger
              </p>
            </div>
          </div>
        </div>

        {/* Sign out */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          {isAdmin && (
            <Link href="/admin" className="btn-secondary">
              Admin
            </Link>
          )}
          <SignInButton />
        </div>

        {/* Footer decoration */}
        <div className="mt-16 flex items-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-coliseum-bronze/20" />
          <span className="text-coliseum-bronze/30 text-xs uppercase tracking-widest">
            Blood & Glory
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-coliseum-bronze/20" />
        </div>
      </div>
    </main>
  )
}
