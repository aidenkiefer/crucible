'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAccount } from 'wagmi'
import { useMintGladiator } from '@/hooks/useMintGladiator'
import { GladiatorClass } from '@/lib/contracts'
import { AnimatedTorch } from '@/components/ui/AnimatedTorch'

const CLASS_INFO = {
  [GladiatorClass.Duelist]: {
    name: 'Duelist',
    description: 'Balanced fighter with high technique and agility. Masters of the blade who read their opponents like an open scroll.',
    strengths: ['Technique', 'Agility'],
    icon: '⚔️',
    statBias: { dex: 'high', spd: 'high', str: 'med' },
  },
  [GladiatorClass.Brute]: {
    name: 'Brute',
    description: 'Raw power and unwavering endurance. They shatter shields and break bones with every swing.',
    strengths: ['Strength', 'Endurance'],
    icon: '🪓',
    // Include DEX/SPD so the UI stat bars have stable keys across classes
    statBias: { str: 'high', dex: 'low', spd: 'low', con: 'high', def: 'med' },
  },
  [GladiatorClass.Assassin]: {
    name: 'Assassin',
    description: 'Swift and deadly. They strike from shadows and vanish before their prey hits the sand.',
    strengths: ['Agility', 'Precision'],
    icon: '🗡️',
    statBias: { spd: 'high', dex: 'high', str: 'low' },
  },
}

function StatBar({ label, level }: { label: string; level: 'high' | 'med' | 'low' }) {
  const fills = { high: 3, med: 2, low: 1 }
  const colors = { high: 'bg-coliseum-bronze', med: 'bg-coliseum-sand/70', low: 'bg-coliseum-sand/40' }

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] uppercase tracking-wider text-coliseum-sand/60 w-8">{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-3 h-1.5 ${i <= fills[level] ? colors[level] : 'bg-coliseum-stone'}`}
          />
        ))}
      </div>
    </div>
  )
}

export function MintGladiator() {
  const { isConnected } = useAccount()
  const { mint, isPending, isConfirming, isSuccess, hash } = useMintGladiator()
  const [selectedClass, setSelectedClass] = useState<GladiatorClass>(GladiatorClass.Duelist)

  if (!isConnected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-coliseum-black p-6">
        <div className="flex items-center gap-6">
          <AnimatedTorch />
          <div className="text-center space-y-6 max-w-md p-8 bg-coliseum-stone border-2 border-coliseum-bronze/30 shadow-xl shadow-black/50">
            <div className="w-16 h-16 mx-auto border-2 border-coliseum-bronze/50 bg-coliseum-black/50 flex items-center justify-center">
              <span className="text-3xl">🔗</span>
            </div>
            <h2 className="font-display text-2xl text-coliseum-sand uppercase tracking-wide">
              Wallet Required
            </h2>
            <p className="text-coliseum-sand/70 text-sm leading-relaxed">
              Connect your wallet to forge a new Gladiator and enter the arena.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-coliseum-bronze text-coliseum-black font-bold uppercase tracking-wider text-sm border-2 border-coliseum-bronze hover:brightness-110 transition-all"
            >
              Return to Gate
            </Link>
          </div>
          <AnimatedTorch mirror />
        </div>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-coliseum-black p-6">
        <div className="flex items-center gap-8">
          <AnimatedTorch />
          <AnimatedTorch />
          <div className="text-center space-y-6 max-w-lg p-10 bg-coliseum-stone border-2 border-coliseum-bronze shadow-xl shadow-black/50">
            <div className="w-20 h-20 mx-auto border-2 border-coliseum-bronze bg-coliseum-black/50 flex items-center justify-center animate-pulse">
              <span className="text-4xl">⚔️</span>
            </div>
            <h2 className="font-display text-3xl text-coliseum-bronze uppercase tracking-wide">
              Victory
            </h2>
            <p className="text-coliseum-sand text-lg uppercase tracking-widest">
              Your Gladiator Has Been Forged
            </p>
            <div className="pt-4 border-t border-coliseum-bronze/30">
              <p className="text-coliseum-sand/60 text-xs uppercase tracking-wider mb-2">
                Transaction Hash
              </p>
              <p className="text-coliseum-sand/80 text-xs font-mono break-all bg-coliseum-black/50 p-3 border border-coliseum-bronze/20">
                {hash}
              </p>
            </div>
            <Link
              href="/"
              className="inline-block px-8 py-3 bg-coliseum-bronze text-coliseum-black font-bold uppercase tracking-wider text-sm border-2 border-coliseum-bronze hover:brightness-110 transition-all"
            >
              Enter the Arena
            </Link>
          </div>
          <AnimatedTorch mirror />
          <AnimatedTorch mirror />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-coliseum-black">
      {/* Decorative header bar */}
      <div className="h-1 bg-gradient-to-r from-transparent via-coliseum-bronze to-transparent" />

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header with torches */}
        <div className="flex items-center justify-center gap-6 mb-12">
          <AnimatedTorch size="sm" />
          <div className="text-center">
            <h1 className="font-display text-4xl sm:text-5xl text-coliseum-sand uppercase tracking-wide">
              The Forge
            </h1>
            <p className="text-coliseum-sand/60 uppercase tracking-[0.3em] text-xs mt-2">
              Mint Your Gladiator
            </p>
          </div>
          <AnimatedTorch size="sm" mirror />
        </div>

        {/* Class Selection */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px flex-1 bg-coliseum-bronze/30" />
            <h2 className="text-coliseum-bronze uppercase tracking-widest text-sm font-bold">
              Choose Your Class
            </h2>
            <div className="h-px flex-1 bg-coliseum-bronze/30" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(CLASS_INFO).map(([classId, info]) => {
              const isSelected = selectedClass === Number(classId)
              return (
                <button
                  key={classId}
                  onClick={() => setSelectedClass(Number(classId))}
                  className={`
                    group relative p-6 text-left transition-all duration-150
                    border-2 bg-coliseum-stone
                    ${isSelected
                      ? 'border-coliseum-bronze shadow-lg shadow-coliseum-bronze/20'
                      : 'border-coliseum-bronze/30 hover:border-coliseum-bronze/60'
                    }
                  `}
                >
                  {/* Selected indicator */}
                  {isSelected && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-coliseum-bronze" />
                  )}

                  {/* Icon */}
                  <div className={`
                    w-14 h-14 mb-4 border-2 flex items-center justify-center text-2xl
                    transition-colors duration-150
                    ${isSelected
                      ? 'border-coliseum-bronze bg-coliseum-black/50'
                      : 'border-coliseum-bronze/30 bg-coliseum-black/30 group-hover:border-coliseum-bronze/50'
                    }
                  `}>
                    {info.icon}
                  </div>

                  {/* Name */}
                  <h3 className={`
                    font-display text-2xl uppercase tracking-wide mb-2
                    ${isSelected ? 'text-coliseum-bronze' : 'text-coliseum-sand'}
                  `}>
                    {info.name}
                  </h3>

                  {/* Description */}
                  <p className="text-coliseum-sand/70 text-sm leading-relaxed mb-4">
                    {info.description}
                  </p>

                  {/* Stat bars */}
                  <div className="space-y-1.5 pt-4 border-t border-coliseum-bronze/20">
                    <StatBar label="STR" level={info.statBias.str as 'high' | 'med' | 'low'} />
                    <StatBar label="DEX" level={info.statBias.dex as 'high' | 'med' | 'low'} />
                    <StatBar label="SPD" level={(info.statBias.spd ?? 'med') as 'high' | 'med' | 'low'} />
                  </div>

                  {/* Strengths tags */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {info.strengths.map((s) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 text-[10px] uppercase tracking-wider bg-coliseum-black/50 text-coliseum-sand/80 border border-coliseum-bronze/20"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Mint Button */}
        <div className="flex justify-center">
          <div className="flex items-center gap-6">
            <AnimatedTorch size="sm" />
            <button
              onClick={() => mint(selectedClass)}
              disabled={isPending || isConfirming}
              className={`
                relative px-12 py-4 font-display text-xl uppercase tracking-wider
                border-2 transition-all duration-150
                ${isPending || isConfirming
                  ? 'bg-coliseum-stone text-coliseum-sand/50 border-coliseum-bronze/30 cursor-wait'
                  : 'bg-coliseum-bronze text-coliseum-black border-coliseum-bronze hover:brightness-110 hover:shadow-lg hover:shadow-coliseum-bronze/30 active:translate-y-0.5'
                }
              `}
            >
              {isPending || isConfirming ? (
                <span className="flex items-center gap-3">
                  <span className="w-4 h-4 border-2 border-coliseum-sand/30 border-t-coliseum-sand rounded-full animate-spin" />
                  Forging...
                </span>
              ) : (
                'Forge Gladiator'
              )}
            </button>
            <AnimatedTorch size="sm" mirror />
          </div>
        </div>

        {/* Footer decoration */}
        <div className="mt-16 flex items-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-coliseum-bronze/30" />
          <span className="text-coliseum-bronze/40 text-xs uppercase tracking-widest">
            Blood & Glory Await
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-coliseum-bronze/30" />
        </div>
      </div>
    </div>
  )
}
