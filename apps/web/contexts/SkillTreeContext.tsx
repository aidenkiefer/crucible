'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { SkillNode, SkillTreeName } from '@gladiator/shared/src/skills/skill-trees'

interface SkillTreeContextValue {
  trees: Record<SkillTreeName, SkillNode[]> | null
  loading: boolean
  error: string | null
}

const SkillTreeContext = createContext<SkillTreeContextValue | undefined>(undefined)

export function SkillTreeProvider({ children }: { children: ReactNode }) {
  const [trees, setTrees] = useState<Record<SkillTreeName, SkillNode[]> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/skill-trees')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch skill trees')
        return res.json()
      })
      .then((data) => {
        setTrees(data.trees)
        setError(null)
      })
      .catch((err) => {
        console.error('Error fetching skill trees:', err)
        setError(err.message)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  return (
    <SkillTreeContext.Provider value={{ trees, loading, error }}>
      {children}
    </SkillTreeContext.Provider>
  )
}

export function useSkillTrees() {
  const context = useContext(SkillTreeContext)
  if (context === undefined) {
    throw new Error('useSkillTrees must be used within SkillTreeProvider')
  }
  return context
}
