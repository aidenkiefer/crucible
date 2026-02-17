'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Image from 'next/image'
import {
  canUnlockSkill,
  calculateSkillPointsSpent,
  type SkillNode,
  type SkillTreeName,
} from '@gladiator/shared/src/skills/skill-trees'
import { useSkillTrees } from '@/contexts/SkillTreeContext'

interface Props {
  gladiatorId: string
  gladiatorClass: string
  unlockedSkills: string[]
  skillPointsAvailable: number
  onSkillUnlocked?: () => void
}

interface SkillTreeData {
  name: SkillTreeName
  skills: SkillNode[]
}

const TREE_THEMES: Record<
  SkillTreeName,
  { icon: string; accent: string; border: string; bg: string; tabBg: string }
> = {
  Valor: {
    icon: '/assets/ui/icons/valor_clean.png',
    accent: 'text-amber-600',
    border: 'border-amber-500/60',
    bg: 'from-amber-900/20 to-transparent',
    tabBg: 'bg-amber-950/40 border-amber-500/50',
  },
  Instinct: {
    icon: '/assets/ui/icons/instinct_clean.png',
    accent: 'text-emerald-500',
    border: 'border-emerald-400/60',
    bg: 'from-emerald-900/20 to-transparent',
    tabBg: 'bg-emerald-950/40 border-emerald-400/50',
  },
  Discipline: {
    icon: '/assets/ui/icons/discipline_clean.png',
    accent: 'text-sky-500',
    border: 'border-sky-400/60',
    bg: 'from-sky-900/20 to-transparent',
    tabBg: 'bg-sky-950/40 border-sky-400/50',
  },
  Intellect: {
    icon: '/assets/ui/icons/intellect_clean.png',
    accent: 'text-violet-500',
    border: 'border-violet-400/60',
    bg: 'from-violet-900/20 to-transparent',
    tabBg: 'bg-violet-950/40 border-violet-400/50',
  },
  Zeal: {
    icon: '/assets/ui/icons/zeal_clean.png',
    accent: 'text-yellow-400',
    border: 'border-yellow-400/60',
    bg: 'from-yellow-900/20 to-transparent',
    tabBg: 'bg-yellow-950/40 border-yellow-400/50',
  },
  Ferocity: {
    icon: '/assets/ui/icons/ferocity_clean.png',
    accent: 'text-red-500',
    border: 'border-red-400/60',
    bg: 'from-red-900/20 to-transparent',
    tabBg: 'bg-red-950/40 border-red-400/50',
  },
}

/** Major stats (primary focus) and minor stats (secondary) per tree — for UI display. */
const TREE_MAJOR_MINOR_STATS: Record<
  SkillTreeName,
  { major: string[]; minor: string[] }
> = {
  Valor: { major: ['CON', 'DEF'], minor: ['STR', 'MR'] },
  Instinct: { major: ['DEX', 'SPD'], minor: ['CON', 'STR'] },
  Discipline: { major: ['DEX', 'DEF'], minor: ['STR', 'CON'] },
  Intellect: { major: ['ARC', 'MR'], minor: ['DEX', 'FTH'] },
  Zeal: { major: ['FTH', 'CON'], minor: ['STR', 'MR'] },
  Ferocity: { major: ['STR', 'SPD'], minor: ['DEX', 'DEF'] },
}

const TREE_DESCRIPTIONS: Record<SkillTreeName, string> = {
  Valor: `Valor - The Unbroken Will

Before blades were forged, before spells were whispered, there were those who simply refused to fall.

Valor is not armor, nor shield, nor flesh - it is endurance made manifest. It is the discipline of standing when bone fractures, when breath burns, when the arena itself demands surrender. Those who walk the path of Valor do not outpace death - they outlast it.

In the Crucible, victory does not always belong to the strongest or the fastest. Sometimes it belongs to the one who remains… when the dust settles and all others have fallen.

Valor is the art of surviving what should have killed you.`,

  Instinct: `Instinct - The Edge Between Heartbeats

There is a moment - smaller than thought - where survival is decided.

Instinct lives in that moment.

It is the twitch before the strike lands, the shift of weight before steel cuts air, the awareness that moves the body before the mind understands danger. Those who master Instinct do not react - they exist ahead of reaction itself.

In the arena, hesitation is death. Calculation is slow. Strategy is fragile.

Instinct is certainty without thinking. Motion without doubt. Survival without mercy.

To walk this path is to trust the body more than the world.`,

  Discipline: `Discipline - The Perfected Strike

Power is common. Control is rare.

Discipline is the relentless pursuit of mastery - not strength, but precision. Not fury, but intention. Every movement honed, every strike measured, every breath serving purpose. Those who embrace Discipline do not fight wildly… they fight correctly.

A single flawless strike ends what a thousand reckless blows cannot.

In the Crucible, chaos consumes the untrained. Only those who refine themselves beyond instinct, beyond emotion, beyond hesitation… wield true dominance.

Discipline is not learning to fight.

It is learning to never fight imperfectly again.`,

  Intellect: `Intellect - The Shaping of Reality

Steel cuts flesh. Magic rewrites existence.

Intellect is the understanding that the arena is not fixed - that force, energy, and will can be bent, redirected, consumed, and reshaped. Those who walk this path do not merely wield power… they comprehend it.

Every motion carries cost. Every spell carries consequence. Every force obeys structure. Intellect is the mastery of those structures - the ability to make reality itself a weapon.

In the Crucible, brute strength wins battles.

Understanding wins inevitability.`,

  Zeal: `Zeal - The Fire That Refuses Extinction

Some wounds do not close. Some spirits do not break.

Zeal is the defiance that burns after strength fades - the will to rise, again and again, long after the body demands stillness. It is faith without gods, conviction without proof, endurance born from something deeper than flesh.

Those who embrace Zeal do not merely survive suffering… they transform it. Pain becomes fuel. Loss becomes resolve. Weakness becomes renewal.

In the Crucible, many fight to win.

The faithful fight because they cannot be extinguished.`,

  Ferocity: `Ferocity - The Hunger of the Kill

There is a moment when restraint dies - and something primal takes its place.

Ferocity is the surge that overwhelms caution, the pressure that crushes hesitation, the instinct to pursue weakness until nothing remains. It is momentum without mercy. Aggression without pause. The certainty that the wounded must fall.

Those who walk this path do not wait for victory - they force it into existence.

In the Crucible, battles are not always decided by skill or endurance… but by who refuses to stop when the enemy begins to falter.

Ferocity is not rage.

It is inevitability sharpened into violence.`,
}

function SkillTooltip({
  skill,
  isUnlocked,
  isAvailable,
  needsPrereqTier,
  canAfford,
  cost,
  treeTheme,
  anchorRef,
}: {
  skill: SkillNode
  isUnlocked: boolean
  isAvailable: boolean
  needsPrereqTier: boolean
  canAfford: boolean
  cost: number
  treeTheme: (typeof TREE_THEMES)[SkillTreeName]
  anchorRef: React.RefObject<HTMLDivElement | null>
}) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = anchorRef.current
    if (!el) return
    const anchorRect = el.getBoundingClientRect()
    const padding = 8
    const centerX = anchorRect.left + anchorRect.width / 2
    const bottom = anchorRect.top + anchorRect.height
    let top = bottom + padding
    let left = centerX
    const tooltip = tooltipRef.current
    if (tooltip) {
      const tw = tooltip.offsetWidth
      const th = tooltip.offsetHeight
      left = Math.max(12, Math.min(centerX - tw / 2, window.innerWidth - tw - 12))
      if (bottom + th + padding > window.innerHeight - 12) {
        top = anchorRect.top - th - padding
      }
    } else {
      left = Math.max(12, centerX - 160)
    }
    setPos({ top, left })
  }, [anchorRef])

  if (pos === null) return null

  return (
    <div
      ref={tooltipRef}
      className="pointer-events-none fixed z-50 w-80 max-w-[calc(100vw-24px)] rounded-lg border-2 border-coliseum-sand/30 bg-coliseum-black/95 p-4 shadow-xl"
      style={{ top: pos.top, left: pos.left }}
    >
      <div className={`border-b border-coliseum-bronze/30 pb-2 ${treeTheme.accent}`}>
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-display text-lg uppercase leading-tight">{skill.name}</h4>
          {skill.isActive && (
            <span className="shrink-0 text-xs px-2 py-0.5 bg-blue-900/50 border border-blue-500 rounded text-blue-400">
              Active
            </span>
          )}
        </div>
        <div className="mt-1 text-sm text-coliseum-sand/90 font-medium">
          Tier {skill.tier} {skill.tier === 6 ? '— Capstone' : ''} · {cost} SP
        </div>
      </div>
      <p className="mt-2 text-sm text-coliseum-sand/80 leading-snug">{skill.description}</p>
      {Object.keys(skill.statBoosts).length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {Object.entries(skill.statBoosts).map(([stat, boost]) => (
            <span
              key={stat}
              className="text-xs px-2 py-0.5 bg-gray-800 border border-coliseum-sand/20 rounded"
            >
              +{boost} {stat}
            </span>
          ))}
        </div>
      )}
      {(skill.cooldown ?? skill.duration) && (
        <div className="mt-2 flex gap-3 text-xs text-coliseum-sand/60">
          {skill.duration != null && <span>Duration: {skill.duration}s</span>}
          {skill.cooldown != null && <span>Cooldown: {skill.cooldown}s</span>}
        </div>
      )}
      {needsPrereqTier && (
        <p className="mt-2 text-xs text-red-400">Requires any Tier {skill.prerequisiteTier} skill</p>
      )}
      {!canAfford && !isUnlocked && (
        <p className="mt-2 text-xs text-amber-400">Insufficient skill points</p>
      )}
      {isUnlocked && (
        <p className="mt-2 text-xs text-green-400 font-medium">✓ Unlocked</p>
      )}
      {isAvailable && !isUnlocked && (
        <p className="mt-2 text-xs text-coliseum-bronze">Click to unlock</p>
      )}
    </div>
  )
}

export function SkillTree({
  gladiatorId,
  gladiatorClass,
  unlockedSkills: initialUnlockedSkills,
  skillPointsAvailable: initialSkillPoints,
  onSkillUnlocked,
}: Props) {
  const { trees: treesMap, loading } = useSkillTrees()
  const [unlockedSkills, setUnlockedSkills] = useState(initialUnlockedSkills)
  const [skillPoints, setSkillPoints] = useState(initialSkillPoints)
  const [unlocking, setUnlocking] = useState<string | null>(null)
  const [selectedTree, setSelectedTree] = useState<SkillTreeName>('Valor')
  const [hoveredSkillId, setHoveredSkillId] = useState<string | null>(null)
  const hoveredWrapperRef = useRef<HTMLDivElement>(null)

  const trees = useMemo(() => {
    if (!treesMap) return []
    return Object.entries(treesMap).map(([name, skills]) => ({
      name: name as SkillTreeName,
      skills: skills as SkillNode[],
    }))
  }, [treesMap])

  useEffect(() => {
    setUnlockedSkills(initialUnlockedSkills)
    setSkillPoints(initialSkillPoints)
  }, [initialUnlockedSkills, initialSkillPoints])

  const currentTree = trees.find((t) => t.name === selectedTree)
  const pointsRemaining = skillPoints
  const treeTheme = currentTree ? TREE_THEMES[selectedTree] : TREE_THEMES.Valor

  const skillsByTier = currentTree?.skills.reduce(
    (acc, skill) => {
      if (!acc[skill.tier]) acc[skill.tier] = []
      acc[skill.tier].push(skill)
      return acc
    },
    {} as Record<number, SkillNode[]>
  ) ?? {}

  const unlockSkill = async (skillId: string, cost: number) => {
    try {
      setUnlocking(skillId)
      const res = await fetch(`/api/gladiators/${gladiatorId}/skills/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillId }),
      })
      if (!res.ok) {
        const errorText = await res.text()
        console.error('Failed to unlock skill:', errorText)
        return
      }
      const data = await res.json()
      if (data.success) {
        setUnlockedSkills([...unlockedSkills, skillId])
        onSkillUnlocked?.()
      } else {
        console.error('Failed to unlock skill:', data.error || 'Unknown error')
      }
    } catch (error) {
      console.error('Failed to unlock skill:', error)
    } finally {
      setUnlocking(null)
    }
  }

  if (loading) {
    return (
      <div className="panel p-8 text-center">
        <p className="text-coliseum-sand/70">Loading skill trees...</p>
      </div>
    )
  }

  const hoveredSkill =
    hoveredSkillId && currentTree
      ? currentTree.skills.find((s) => s.id === hoveredSkillId)
      : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="panel p-4 flex justify-between items-center">
        <h2 className="font-display text-2xl text-coliseum-bronze uppercase">
          Cross-Class Skill Trees
        </h2>
        <div className="text-right">
          <div className="text-3xl font-bold text-coliseum-bronze">{pointsRemaining}</div>
          <div className="text-xs text-coliseum-sand/70 uppercase">Skill Points Available</div>
        </div>
      </div>

      {/* Tree Selector — with icons and color splashes per tree */}
      <div className={`panel p-3 bg-gradient-to-r ${treeTheme.bg} border-2 ${treeTheme.border} rounded-lg`}>
        <p className="text-xs text-coliseum-sand/60 uppercase mb-2">Choose tree</p>
        <div className="flex flex-wrap gap-2">
          {trees.map((tree) => {
            const theme = TREE_THEMES[tree.name]
            const isSelected = selectedTree === tree.name
            return (
              <button
                key={tree.name}
                onClick={() => setSelectedTree(tree.name)}
                className={`flex items-center gap-2 pl-2 pr-4 py-2.5 rounded-lg font-display uppercase text-sm transition-all border-2 ${
                  isSelected
                    ? `${theme.tabBg} ${theme.accent} shadow-lg border-current`
                    : `bg-gray-800/80 border-gray-600 text-coliseum-sand hover:bg-gray-700 hover:border-gray-500`
                }`}
              >
                <span className="relative h-8 w-8 shrink-0 overflow-hidden">
                  <Image
                    src={theme.icon}
                    alt=""
                    width={32}
                    height={32}
                    className="h-full w-full object-contain"
                  />
                </span>
                {tree.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tier-based circular nodes */}
      {currentTree && (
        <div
          className={`space-y-8 rounded-xl border p-6 bg-gradient-to-b ${treeTheme.bg} ${treeTheme.border}`}
          onMouseLeave={() => setHoveredSkillId(null)}
        >
          {/* Tree title + description (left); icon + major/minor stats (right) */}
          <div className="flex flex-col gap-4 pb-6 border-b border-coliseum-sand/20 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <h3 className={`font-display text-xl uppercase ${treeTheme.accent}`}>
                {selectedTree}
              </h3>
              <p className="mx-auto mt-6 max-w-2xl text-center text-sm italic leading-snug text-coliseum-sand/80 whitespace-pre-line">
                {TREE_DESCRIPTIONS[selectedTree]}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2 text-right">
              <div className="relative h-16 w-16 overflow-hidden">
                <Image
                  src={treeTheme.icon}
                  alt=""
                  width={64}
                  height={64}
                  className="h-full w-full object-contain"
                />
              </div>
              {(() => {
                const { major, minor } = TREE_MAJOR_MINOR_STATS[selectedTree]
                return (
                  <div className={`text-xs ${treeTheme.accent}`}>
                    <div className="uppercase tracking-wider">
                      <span className="text-coliseum-sand/60">Major: </span>
                      {major.join(', ')}
                    </div>
                    <div className="mt-0.5 uppercase tracking-wider">
                      <span className="text-coliseum-sand/60">Minor: </span>
                      {minor.join(', ')}
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>

          {[1, 2, 3, 4, 5, 6].map((tier) => {
            const tierSkills = skillsByTier[tier] || []
            if (tierSkills.length === 0) return null
            return (
              <div key={tier}>
                <h3 className={`font-display text-lg uppercase mb-4 ${treeTheme.accent} border-b border-current/30 pb-2 w-fit`}>
                  Tier {tier} {tier === 6 && '— Capstones'}
                </h3>
                <div className="flex flex-wrap gap-8 justify-center">
                  {tierSkills.map((skill) => {
                    const isUnlocked = unlockedSkills.includes(skill.id)
                    const canUnlock = canUnlockSkill(skill.id, unlockedSkills)
                    const canAfford = pointsRemaining >= skill.cost
                    const needsPrereqTier =
                      skill.prerequisiteTier &&
                      !currentTree.skills
                        .filter((s) => s.tier === skill.prerequisiteTier)
                        .some((s) => unlockedSkills.includes(s.id))
                    const isAvailable =
                      canUnlock && canAfford && !isUnlocked && !needsPrereqTier
                    const isHovered = hoveredSkillId === skill.id

                    return (
                      <div
                        key={skill.id}
                        ref={isHovered ? hoveredWrapperRef : undefined}
                        className="relative flex flex-col items-center gap-2 min-w-[7rem]"
                        onMouseEnter={() => setHoveredSkillId(skill.id)}
                        onMouseLeave={() => setHoveredSkillId(null)}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            if (isAvailable && !unlocking) unlockSkill(skill.id, skill.cost)
                          }}
                          disabled={!isAvailable || !!unlocking}
                          className={`relative h-16 w-16 shrink-0 rounded-full border-2 transition-[transform,box-shadow] duration-100 ease-out ${
                            isUnlocked
                              ? `${treeTheme.border} bg-gray-900/80 shadow-lg ring-2 ring-green-500/50`
                              : isAvailable
                              ? `${treeTheme.border} bg-gray-900/80 hover:scale-105 hover:ring-2 hover:ring-coliseum-bronze/60 cursor-pointer`
                              : 'border-gray-600 bg-gray-900/60 opacity-70 cursor-not-allowed'
                          }`}
                        >
                          <span
                            className={`absolute inset-1.5 rounded-full overflow-hidden bg-gray-900 ${
                              isUnlocked ? '' : 'grayscale'
                            }`}
                          >
                            <Image
                              src={treeTheme.icon}
                              alt={skill.name}
                              width={56}
                              height={56}
                              className="h-full w-full object-contain"
                            />
                          </span>
                          {isUnlocked && (
                            <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-xs text-white">
                              ✓
                            </span>
                          )}
                          {unlocking === skill.id && (
                            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-coliseum-black/70 text-coliseum-bronze text-xs">
                              ...
                            </span>
                          )}
                        </button>
                        <span className="text-xs text-coliseum-sand/80 w-full text-center leading-tight px-0.5">
                          {skill.name}
                        </span>
                        {isHovered && (
                          <SkillTooltip
                            skill={skill}
                            isUnlocked={isUnlocked}
                            isAvailable={isAvailable}
                            needsPrereqTier={!!needsPrereqTier}
                            canAfford={canAfford}
                            cost={skill.cost}
                            treeTheme={treeTheme}
                            anchorRef={hoveredWrapperRef}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
