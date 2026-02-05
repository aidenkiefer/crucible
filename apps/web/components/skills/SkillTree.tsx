'use client'

import { useState, useEffect } from 'react'
import { getSkillTree, canUnlockSkill, type SkillNode } from '@gladiator/shared/src/skills/skill-trees'

interface Props {
  gladiatorId: string
  gladiatorClass: string
  unlockedSkills: string[]
  skillPointsAvailable: number
  onSkillUnlocked?: () => void
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

  const skillTree = getSkillTree(gladiatorClass)

  // Group skills by branch
  const branches = skillTree.reduce((acc, skill) => {
    if (!acc[skill.branch]) {
      acc[skill.branch] = []
    }
    acc[skill.branch].push(skill)
    return acc
  }, {} as Record<string, SkillNode[]>)

  // Sort skills within each branch by tier
  for (const branch of Object.values(branches)) {
    branch.sort((a, b) => a.tier - b.tier)
  }

  const unlockSkill = async (skillId: string) => {
    try {
      setUnlocking(skillId)
      const res = await fetch(`/api/gladiators/${gladiatorId}/skills/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillId }),
      })

      const data = await res.json()

      if (data.success) {
        setUnlockedSkills([...unlockedSkills, skillId])
        setSkillPoints((prev) => prev - data.unlockedSkill.cost)
        onSkillUnlocked?.()
      } else {
        alert(data.error || 'Failed to unlock skill')
      }
    } catch (error) {
      console.error('Failed to unlock skill:', error)
      alert('Failed to unlock skill')
    } finally {
      setUnlocking(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="panel p-4 flex justify-between items-center">
        <h2 className="font-display text-2xl text-coliseum-bronze uppercase">
          Skill Tree — {gladiatorClass}
        </h2>
        <div className="text-right">
          <div className="text-3xl font-bold text-coliseum-bronze">{skillPoints}</div>
          <div className="text-xs text-coliseum-sand/70 uppercase">Skill Points</div>
        </div>
      </div>

      {/* Branches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(branches).map(([branchName, skills]) => (
          <div key={branchName} className="panel p-6">
            <h3 className="font-display text-xl text-coliseum-sand uppercase mb-4 border-b border-coliseum-sand/20 pb-2">
              {branchName}
            </h3>
            <div className="space-y-3">
              {skills.map((skill) => {
                const isUnlocked = unlockedSkills.includes(skill.id)
                const canUnlock = canUnlockSkill(skill.id, unlockedSkills)
                const canAfford = skillPoints >= skill.cost
                const isAvailable = canUnlock && canAfford

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
                        unlockSkill(skill.id)
                      }
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-display text-lg text-coliseum-sand uppercase">
                          {skill.name}
                        </h4>
                        <p className="text-xs text-coliseum-sand/70">
                          Tier {skill.tier}
                        </p>
                      </div>
                      {isUnlocked ? (
                        <span className="text-green-400 text-xl">✓</span>
                      ) : (
                        <span
                          className={`text-sm px-2 py-1 rounded ${
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
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(skill.statBoosts).map(([stat, boost]) => (
                        <span
                          key={stat}
                          className="text-xs px-2 py-1 bg-gray-800 border border-coliseum-sand/20 rounded"
                        >
                          +{boost} {stat}
                        </span>
                      ))}
                    </div>

                    {/* Prerequisite */}
                    {skill.prerequisite && !unlockedSkills.includes(skill.prerequisite) && (
                      <p className="text-xs text-red-400 mt-2">
                        Requires previous tier
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
        ))}
      </div>
    </div>
  )
}
