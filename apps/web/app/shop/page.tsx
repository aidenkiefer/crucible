'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface ChestItem {
  id: string
  name: string
  tier: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC'
  price: number
  image: string
  description: string
}

const CHEST_ITEMS: ChestItem[] = [
  {
    id: 'wooden',
    name: 'Wooden Chest',
    tier: 'COMMON',
    price: 100,
    image: '/assets/chests/wooden-chest.png',
    description: 'A weathered chest. Contains basic equipment.',
  },
  {
    id: 'stone',
    name: 'Stone Chest',
    tier: 'UNCOMMON',
    price: 250,
    image: '/assets/chests/stone-chest.png',
    description: 'An ancient stone coffer. Better rewards await.',
  },
  {
    id: 'bronze',
    name: 'Bronze Chest',
    tier: 'RARE',
    price: 500,
    image: '/assets/chests/bronze-chest.png',
    description: 'A robust military chest. Quality gear inside.',
  },
  {
    id: 'platinum',
    name: 'Platinum Chest',
    tier: 'EPIC',
    price: 1000,
    image: '/assets/chests/platinum-chest.png',
    description: 'A legendary treasure. Only the finest equipment.',
  },
]

export default function ShopPage() {
  const { data: session } = useSession()
  const [goldBalance, setGoldBalance] = useState<number>(0)
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (session?.user?.id) {
      fetchGoldBalance()
    }
  }, [session?.user?.id])

  const fetchGoldBalance = async () => {
    try {
      const res = await fetch('/api/gold/balance')
      const data = await res.json()
      setGoldBalance(data.balance || 0)
    } catch (error) {
      console.error('Failed to fetch gold balance:', error)
    }
  }

  const handlePurchase = async (chest: ChestItem) => {
    if (!session?.user?.id) {
      setMessage({ type: 'error', text: 'You must be signed in to purchase.' })
      return
    }

    if (goldBalance < chest.price) {
      setMessage({ type: 'error', text: 'Insufficient gold!' })
      setTimeout(() => setMessage(null), 3000)
      return
    }

    setPurchasing(chest.id)
    setMessage(null)

    try {
      // TODO: Implement purchase API endpoint
      // For now, simulate purchase
      await new Promise((resolve) => setTimeout(resolve, 500))

      setMessage({
        type: 'success',
        text: `Purchased ${chest.name}! Check your inventory.`,
      })
      setGoldBalance((prev) => prev - chest.price)
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage({ type: 'error', text: 'Purchase failed. Try again.' })
      setTimeout(() => setMessage(null), 3000)
    } finally {
      setPurchasing(null)
    }
  }

  if (!session) {
    return (
      <main
        className="min-h-screen bg-coliseum-black pt-[90px] relative"
        style={{
          backgroundImage: 'url(/assets/backgrounds/menu/coliseum-main.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="absolute inset-0 bg-coliseum-black/40" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-16 text-center">
          <div className="panel-embossed p-8">
            <h1 className="font-display text-2xl text-coliseum-sand uppercase mb-4">
              The Armory
            </h1>
            <p className="text-coliseum-sand/70 mb-6">
              Sign in to browse and purchase treasure chests.
            </p>
            <Link href="/" className="btn-raised inline-block">
              Return to Gate
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main
      className="min-h-screen bg-coliseum-black pt-[90px] relative"
      style={{
        backgroundImage: 'url(/assets/backgrounds/menu/coliseum-main.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-coliseum-black/40" />

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl text-coliseum-bronze uppercase tracking-wider text-glow-bronze mb-4">
            The Armory
          </h1>
          <p className="text-coliseum-sand/70 mb-6">
            Purchase treasure chests with your hard-earned gold
          </p>

          {/* Gold Balance */}
          <div className="inline-flex items-center gap-3 panel-embossed px-6 py-3">
            <img
              src="/assets/ui/icons/gold.png"
              alt="Gold"
              className="w-8 h-8"
            />
            <span className="text-coliseum-sand font-bold text-2xl">
              {goldBalance.toLocaleString()}
            </span>
            <span className="text-coliseum-sand/70 uppercase text-sm tracking-wider">
              Gold
            </span>
          </div>
        </div>

        {/* Message Banner */}
        {message && (
          <div
            className={`mb-6 panel-inset p-4 border-2 text-center ${
              message.type === 'success'
                ? 'border-green-500/50 bg-green-900/20'
                : 'border-red-500/50 bg-red-900/20'
            }`}
          >
            <p
              className={`font-bold ${
                message.type === 'success' ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {message.text}
            </p>
          </div>
        )}

        {/* Chest Grid - 2x2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {CHEST_ITEMS.map((chest) => {
            const canAfford = goldBalance >= chest.price
            const isPurchasing = purchasing === chest.id

            return (
              <div
                key={chest.id}
                className="relative"
                style={{
                  backgroundImage: 'url(/assets/ui/menu-box.png)',
                  backgroundSize: '100% 100%',
                  backgroundRepeat: 'no-repeat',
                  minHeight: '280px',
                  padding: '24px',
                }}
              >
                {/* Header Area - Chest Name */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 w-[80%] text-center">
                  <h2 className="font-display text-xl text-coliseum-bronze uppercase tracking-wider text-glow-bronze">
                    {chest.name}
                  </h2>
                </div>

                {/* Content Area */}
                <div className="flex flex-col items-center justify-center h-full pt-8">
                  {/* Chest Image */}
                  <img
                    src={chest.image}
                    alt={chest.name}
                    className="w-32 h-32 object-contain mb-3"
                  />

                  {/* Description */}
                  <p className="text-coliseum-sand/70 text-sm text-center mb-4 px-4">
                    {chest.description}
                  </p>

                  {/* Price & Purchase Button */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex items-center gap-2">
                      <img
                        src="/assets/ui/icons/gold.png"
                        alt="Gold"
                        className="w-6 h-6"
                      />
                      <span className="text-coliseum-sand font-bold text-xl">
                        {chest.price}
                      </span>
                    </div>

                    <button
                      onClick={() => handlePurchase(chest)}
                      disabled={!canAfford || isPurchasing}
                      className={`btn-raised px-8 py-2 text-sm transition-all ${
                        !canAfford || isPurchasing
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:brightness-110'
                      }`}
                    >
                      {isPurchasing
                        ? 'Purchasing...'
                        : canAfford
                          ? 'Purchase'
                          : 'Insufficient Gold'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Back to Menu */}
        <div className="text-center">
          <Link href="/" className="btn-raised px-8 py-3">
            Return to Main Menu
          </Link>
        </div>
      </div>
    </main>
  )
}
