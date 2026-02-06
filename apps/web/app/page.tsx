import { getServerSession } from 'next-auth'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { getArenaStatus } from '@/lib/arena'
import { SignInForm } from '@/components/auth/SignInForm'
import { SignInButton } from '@/components/auth/SignInButton'
import { AnimatedTorch } from '@/components/ui/AnimatedTorch'

function MenuButton({
  href,
  icon,
  title,
  description,
  primary = false,
}: {
  href: string
  icon: string | React.ReactNode
  title: string
  description: string
  primary?: boolean
}) {
  return (
    <Link
      href={href}
      className={`
        group relative block transition-all duration-150
        ${primary
          ? 'btn-raised border-coliseum-bronze hover:brightness-110'
          : 'btn-raised hover:brightness-110'
        }
      `}
    >
      <div
        className={`
          aspect-square min-w-[7rem] sm:min-w-[8rem]
          flex flex-col items-center justify-center gap-2
        `}
      >
        <div
          className={`
            w-12 h-12 panel-inset flex items-center justify-center text-2xl
            ${primary ? 'border-coliseum-bronze/60' : ''}
          `}
        >
          {typeof icon === 'string' ? icon : icon}
        </div>
        <h3
          className={`
          font-display text-sm uppercase tracking-wide text-center
          ${primary ? 'text-coliseum-bronze text-glow-bronze' : 'text-coliseum-sand'}
        `}
        >
          {title}
        </h3>
        <p className="text-coliseum-sand/70 text-[11px] leading-snug text-center px-2">
          {description}
        </p>
      </div>
    </Link>
  )
}

function LandingPage() {
  return (
    <main
      className="min-h-screen bg-coliseum-black relative"
      style={{
        backgroundImage: 'url(/assets/backgrounds/menu/main-menu-background.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-coliseum-black/40" />

      {/* Content wrapper */}
      <div className="relative z-10">
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
  const arenaStatus = getArenaStatus()

  return (
    <main
      className="min-h-screen bg-coliseum-black pt-[90px] relative"
      style={{
        backgroundImage: 'url(/assets/backgrounds/menu/main-menu-background.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-coliseum-black/40" />

      {/* Content wrapper */}
      <div className="relative z-10 max-w-2xl mx-auto px-6 py-12">
        {/* Game Title */}
        <div className="text-center mb-12">
          <div className="inline-block panel-embossed px-12 py-6 mb-4">
            <h1 className="font-display text-5xl text-coliseum-bronze uppercase tracking-wider text-glow-bronze">
              Crucible
            </h1>
            <p className="text-coliseum-sand/60 uppercase tracking-[0.4em] text-xs mt-2">
              Gladiator Coliseum
            </p>
          </div>
          <p className="text-coliseum-sand/70 text-sm">
            Welcome back, <span className="text-coliseum-sand font-bold">{userName}</span>
          </p>
        </div>

        {/* Main Menu */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8 justify-items-center">
          <MenuButton
            href="/camp"
            icon="⛺"
            title="Camp"
            description="Manage your Gladiators, inventory, and crafting."
            primary
          />
          <MenuButton
            href="/arena"
            icon="⚔️"
            title="Arena"
            description="Test your Gladiator against CPU opponents in combat."
          />
          <MenuButton
            href="/quick-match"
            icon="🎯"
            title="Quick Match"
            description="Find a random opponent and battle for glory."
          />
          <MenuButton
            href="/friends"
            icon="👥"
            title="Friends"
            description="Challenge friends and view pending matches."
          />
          <MenuButton
            href="/shop"
            icon={<img src="/assets/ui/icons/gold.png" alt="Shop" className="w-12 h-12" />}
            title="The Armory"
            description="Purchase treasure chests with your gold."
          />
          <MenuButton
            href="/mint"
            icon="🔥"
            title="The Forge"
            description="Mint a new Gladiator to fight in your name."
          />
        </div>

        {/* Status Panel */}
        <div className="panel-embossed p-6 mb-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-coliseum-sand/60 uppercase tracking-wider text-xs mb-2">
                Arena Status
              </p>
              <p className="text-coliseum-sand font-display text-lg uppercase">
                {arenaStatus}
              </p>
            </div>
            <div className="text-right">
              <p className="text-coliseum-sand/60 uppercase tracking-wider text-xs mb-2">
                Your Standing
              </p>
              <p className="text-coliseum-bronze font-display text-lg uppercase">
                Challenger
              </p>
            </div>
          </div>
        </div>

        {/* Admin & Sign Out */}
        <div className="flex flex-col items-center gap-3">
          {isAdmin && (
            <Link href="/admin" className="btn-raised px-6 py-2 text-sm">
              War Council (Admin)
            </Link>
          )}
          <SignInButton />
        </div>
      </div>
    </main>
  )
}
