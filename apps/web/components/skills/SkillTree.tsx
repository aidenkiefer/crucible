'use client'

import { useState, useEffect } from 'react'
import {
  canUnlockSkill,
  calculateSkillPointsSpent,
  type SkillNode,
  type SkillTreeName,
} from '@gladiator/shared/src/skills/skill-trees'

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

export function SkillTree({
  gladiatorId,
  gladiatorClass,
  unlockedSkills: initialUnlockedSkills,
  skillPointsAvailable: initialSkillPoints,
  onSkillUnlocked,
}: Props) {
  const [unlockedSkills, setUnlockedSkills] = useState(initialUnlockedSkills)
  const [skillPoints, setSkillPoints] = useState(initialSkillPoints)
  const [unlocking, setUnlocking] = useState<string | null>(null)
  const [trees, setTrees] = useState<SkillTreeData[]>([])
  const [selectedTree, setSelectedTree] = useState<SkillTreeName>('Valor')
  const [loading, setLoading] = useState(true)

  // Bug fix #4: Sync local state when props change (parent re-render after fetch)
  useEffect(() => {
    setUnlockedSkills(initialUnlockedSkills)
    setSkillPoints(initialSkillPoints)
  }, [initialUnlockedSkills, initialSkillPoints])

  // Fetch all 6 skill trees
  useEffect(() => {
    async function fetchTrees() {
      try {
        const res = await fetch('/api/skill-trees')
        const data = await res.json()
        if (data.trees) {
          // Convert { Valor: [...], Instinct: [...] } to [{ name: 'Valor', skills: [...] }, ...]
          const treeArray = Object.entries(data.trees).map(([name, skills]) => ({
            name: name as SkillTreeName,
            skills: skills as SkillNode[],
          }))
          setTrees(treeArray)
        }
      } catch (error) {
        console.error('Failed to fetch skill trees:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchTrees()
  }, [])

  const currentTree = trees.find((t) => t.name === selectedTree)
  const pointsSpent = calculateSkillPointsSpent(unlockedSkills)
  const pointsRemaining = skillPoints - pointsSpent

  // Group skills by tier (1-6)
  const skillsByTier = currentTree?.skills.reduce((acc, skill) => {
    if (!acc[skill.tier]) {
      acc[skill.tier] = []
    }
    acc[skill.tier].push(skill)
    return acc
  }, {} as Record<number, SkillNode[]>) || {}

  const unlockSkill = async (skillId: string, cost: number) => {
    try {
      setUnlocking(skillId)
      const res = await fetch(`/api/gladiators/${gladiatorId}/skills/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillId }),
      })

      // Bug fix #2: Check HTTP status before parsing JSON
      if (!res.ok) {
        const errorText = await res.text()
        console.error('Failed to unlock skill:', errorText)
        return
      }

      const data = await res.json()

      if (data.success) {
        setUnlockedSkills([...unlockedSkills, skillId])
        setSkillPoints((prev) => prev - cost)
        onSkillUnlocked?.()
      } else {
        // Bug fix #3: Replace alert() with console.error
        console.error('Failed to unlock skill:', data.error || 'Unknown error')
      }
    } catch (error) {
      console.error('Failed to unlock skill:', error)
      // Bug fix #3: Replaced alert with console.error
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="panel p-4 flex justify-between items-center">
        <h2 className="font-display text-2xl text-coliseum-bronze uppercase">
          Cross-Class Skill Trees
        </h2>
        <div className="text-right">
          <div className="text-3xl font-bold text-coliseum-bronze">
            {pointsRemaining}
          </div>
          <div className="text-xs text-coliseum-sand/70 uppercase">
            Skill Points Available
          </div>
        </div>
      </div>

      {/* Tree Selector */}
      <div className="panel p-4">
        <div className="flex flex-wrap gap-2">
          {trees.map((tree) => (
            <button
              key={tree.name}
              onClick={() => setSelectedTree(tree.name)}
              className={`px-4 py-2 rounded font-display uppercase text-sm transition-colors ${
                selectedTree === tree.name
                  ? 'bg-coliseum-bronze text-coliseum-black'
                  : 'bg-gray-800 text-coliseum-sand hover:bg-gray-700'
              }`}
            >
              {tree.name}
            </button>
          ))}
        </div>
      </div>

      {/* Tier-based layout */}
      {currentTree && (
        <div className="space-y-6">
          {[1, 2, 3, 4, 5, 6].map((tier) => {
            const tierSkills = skillsByTier[tier] || []
            if (tierSkills.length === 0) return null

            return (
              <div key={tier} className="panel p-6">
                <h3 className="font-display text-xl text-coliseum-bronze uppercase mb-4 border-b border-coliseum-bronze/20 pb-2">
                  Tier {tier} {tier === 6 && '— Capstones'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {tierSkills.map((skill) => {
                    const isUnlocked = unlockedSkills.includes(skill.id)
                    const canUnlock = canUnlockSkill(skill.id, unlockedSkills)
                    const canAfford = pointsRemaining >= skill.cost

                    // Check tier prerequisite
                    const needsPrereqTier = skill.prerequisiteTier && !currentTree.skills
                      .filter((s) => s.tier === skill.prerequisiteTier)
                      .some((s) => unlockedSkills.includes(s.id))

                    // Bug fix #1: Include tier prerequisite check in isAvailable
                    const isAvailable = canUnlock && canAfford && !isUnlocked && !needsPrereqTier

                    return (
                      <div
                        key={skill.id}
                        className={`p-4 border rounded transition-colors ${
                          isUnlocked
                            ? 'bg-green-900/20 border-green-500'
                            : isAvailable
                            ? 'bg-coliseum-bronze/10 border-coliseum-bronze hover:bg-coliseum-bronze/20 cursor-pointer'
                            : 'bg-gray-900 border-gray-700 opacity-50'
                        }`}
                        onClick={() => {
                          if (isAvailable && !unlocking) {
                            unlockSkill(skill.id, skill.cost)
                          }
                        }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-display text-base text-coliseum-sand uppercase">
                                {skill.name}
                              </h4>
                              {skill.isActive && (
                                <span className="text-xs px-2 py-0.5 bg-blue-900/50 border border-blue-500 rounded text-blue-400">
                                  Active
                                </span>
                              )}
                            </div>
                          </div>
                          {isUnlocked ? (
                            <span className="text-green-400 text-xl ml-2">✓</span>
                          ) : (
                            <span
                              className={`text-sm px-2 py-1 rounded ml-2 ${
                                isAvailable
                                  ? 'bg-coliseum-bronze text-coliseum-black'
                                  : 'bg-gray-700 text-gray-400'
                              }`}
                            >
                              {skill.cost} SP
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-coliseum-sand/80 mb-3">
                          {skill.description}
                        </p>

                        {/* Stat Boosts */}
                        {Object.keys(skill.statBoosts).length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {Object.entries(skill.statBoosts).map(([stat, boost]) => (
                              <span
                                key={stat}
                                className="text-xs px-2 py-1 bg-gray-800 border border-coliseum-sand/20 rounded"
                              >
                                +{boost} {stat}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Cooldown/Duration */}
                        {(skill.cooldown || skill.duration) && (
                          <div className="flex gap-3 text-xs text-coliseum-sand/60 mb-2">
                            {skill.duration && <span>Duration: {skill.duration}s</span>}
                            {skill.cooldown && <span>Cooldown: {skill.cooldown}s</span>}
                          </div>
                        )}

                        {/* Prerequisites */}
                        {needsPrereqTier && (
                          <p className="text-xs text-red-400 mt-2">
                            Requires any Tier {skill.prerequisiteTier} skill
                          </p>
                        )}

                        {!canAfford && !isUnlocked && (
                          <p className="text-xs text-yellow-400 mt-2">
                            Insufficient skill points
                          </p>
                        )}

                        {/* Unlocking */}
                        {unlocking === skill.id && (
                          <p className="text-xs text-coliseum-bronze mt-2">
                            Unlocking...
                          </p>
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
