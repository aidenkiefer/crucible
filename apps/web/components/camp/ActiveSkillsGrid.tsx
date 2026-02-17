'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import Image from 'next/image'
import type { SkillNode, SkillTreeName } from '@gladiator/shared/src/skills/skill-trees'
import { useSkillTrees } from '@/contexts/SkillTreeContext'

const TREE_THEMES: Record<
  SkillTreeName,
  { icon: string; accent: string }
> = {
  Valor: { icon: '/assets/ui/icons/valor_clean.png', accent: 'text-amber-600' },
  Instinct: { icon: '/assets/ui/icons/instinct_clean.png', accent: 'text-emerald-500' },
  Discipline: { icon: '/assets/ui/icons/discipline_clean.png', accent: 'text-sky-500' },
  Intellect: { icon: '/assets/ui/icons/intellect_clean.png', accent: 'text-violet-500' },
  Zeal: { icon: '/assets/ui/icons/zeal_clean.png', accent: 'text-yellow-400' },
  Ferocity: { icon: '/assets/ui/icons/ferocity_clean.png', accent: 'text-red-500' },
}

interface ActiveSkillsGridProps {
  unlockedSkills: string[]
}

interface SkillSlotProps {
  skill: SkillNode
  isHovered: boolean
  onMouseEnter: () => void
  onMouseLeave: () => void
  theme: (typeof TREE_THEMES)[SkillTreeName]
  anchorRef: React.RefObject<HTMLDivElement | null>
}

const SkillSlot = React.memo(({
  skill,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  theme,
  anchorRef,
}: SkillSlotProps) => {
  return (
    <div
      ref={isHovered ? anchorRef : undefined}
      className="relative"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div
        className={`
          w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-lg border-2 flex items-center justify-center overflow-hidden
          bg-coliseum-black/60 transition-colors duration-100
          ${isHovered ? 'border-coliseum-bronze shadow-lg' : 'border-coliseum-sand/30'}
        `}
      >
        <Image
          src={theme.icon}
          alt={skill.name}
          width={56}
          height={56}
          className="w-full h-full object-contain"
        />
      </div>
      {isHovered && (
        <SkillSlotTooltip
          skill={skill}
          treeTheme={theme}
          anchorRef={anchorRef}
        />
      )}
    </div>
  )
})

SkillSlot.displayName = 'SkillSlot'

export function ActiveSkillsGrid({ unlockedSkills }: ActiveSkillsGridProps) {
  const { trees, loading } = useSkillTrees()
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const hoveredRef = useRef<HTMLDivElement | null>(null)

  const skillsById = useMemo(() => {
    const map: Record<string, SkillNode> = {}
    if (trees) {
      for (const list of Object.values(trees)) {
        for (const s of list) {
          map[s.id] = s
        }
      }
    }
    return map
  }, [trees])

  const resolved = useMemo(
    () =>
      unlockedSkills
        .map((id) => skillsById[id])
        .filter((s): s is SkillNode => s != null),
    [unlockedSkills, skillsById]
  )

  const sorted = useMemo(
    () =>
      [...resolved].sort(
        (a, b) => (a.tree.localeCompare(b.tree) || a.tier - b.tier)
      ),
    [resolved]
  )

  if (loading) {
    return (
      <div className="py-4 text-center text-coliseum-sand/60 text-sm">
        Loading skills…
      </div>
    )
  }

  if (sorted.length === 0) {
    return (
      <p className="text-coliseum-sand/60 text-sm py-2">
        No skills unlocked yet. Unlock skills in the Skills tab.
      </p>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {sorted.map((skill) => {
        const theme = TREE_THEMES[skill.tree as SkillTreeName] ?? TREE_THEMES.Valor
        const isHovered = hoveredId === skill.id
        return (
          <SkillSlot
            key={skill.id}
            skill={skill}
            isHovered={isHovered}
            onMouseEnter={() => setHoveredId(skill.id)}
            onMouseLeave={() => setHoveredId(null)}
            theme={theme}
            anchorRef={hoveredRef}
          />
        )
      })}
    </div>
  )
}

function SkillSlotTooltip({
  skill,
  treeTheme,
  anchorRef,
}: {
  skill: SkillNode
  treeTheme: (typeof TREE_THEMES)[SkillTreeName]
  anchorRef: React.RefObject<HTMLDivElement | null>
}) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = anchorRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const padding = 8
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const viewportMidY = window.innerHeight / 2
    const tooltip = tooltipRef.current
    const tw = tooltip ? tooltip.offsetWidth : 288
    const th = tooltip ? tooltip.offsetHeight : 200
    const left = Math.max(12, Math.min(centerX - tw / 2, window.innerWidth - tw - 12))

    // Top half of viewport → tooltip below; bottom half → tooltip above
    const placeAbove = centerY >= viewportMidY
    let top: number
    if (placeAbove) {
      top = rect.top - th - padding
      if (top < 12) top = rect.bottom + padding
    } else {
      top = rect.bottom + padding
      if (top + th > window.innerHeight - 12) top = rect.top - th - padding
    }

    setPos({ top, left })
  }, [anchorRef])

  if (pos === null) return null

  return (
    <div
      ref={tooltipRef}
      className="pointer-events-none fixed z-50 w-72 max-w-[calc(100vw-24px)] rounded-lg border-2 border-coliseum-sand/30 bg-coliseum-black/95 p-3 shadow-xl"
      style={{ top: pos.top, left: pos.left }}
    >
      <div className={`border-b border-coliseum-bronze/30 pb-1.5 ${treeTheme.accent}`}>
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-display text-base uppercase leading-tight">{skill.name}</h4>
          {skill.isActive && (
            <span className="shrink-0 text-xs px-2 py-0.5 bg-blue-900/50 border border-blue-500 rounded text-blue-400">
              Active
            </span>
          )}
        </div>
        <div className="mt-0.5 text-xs text-coliseum-sand/90 font-medium">
          Tier {skill.tier} {skill.tier === 6 ? '— Capstone' : ''} · {skill.tree}
        </div>
      </div>
      <p className="mt-1.5 text-sm text-coliseum-sand/80 leading-snug">{skill.description}</p>
      {Object.keys(skill.statBoosts).length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
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
        <div className="mt-1.5 flex gap-3 text-xs text-coliseum-sand/60">
          {skill.duration != null && <span>Duration: {skill.duration}s</span>}
          {skill.cooldown != null && <span>Cooldown: {skill.cooldown}s</span>}
        </div>
      )}
      <p className="mt-1.5 text-xs text-green-400 font-medium">✓ Unlocked</p>
    </div>
  )
}
