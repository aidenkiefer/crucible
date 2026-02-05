'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface Gladiator {
  id: string
  tokenId: number
  class: string
  level: number
  experience: number
  constitution: number
  strength: number
  dexterity: number
  speed: number
  defense: number
  magicResist: number
  arcana: number
  faith: number
}

interface ActiveGladiatorContextType {
  activeGladiator: Gladiator | null
  setActiveGladiator: (gladiator: Gladiator | null) => void
  isLoading: boolean
}

const ActiveGladiatorContext = createContext<ActiveGladiatorContextType | undefined>(undefined)

export function ActiveGladiatorProvider({ children }: { children: ReactNode }) {
  const [activeGladiator, setActiveGladiatorState] = useState<Gladiator | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load active gladiator from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('activeGladiatorId')
    if (stored) {
      // TODO: Fetch full gladiator data from API
      // For now, just mark as not loading
      setIsLoading(false)
    } else {
      setIsLoading(false)
    }
  }, [])

  const setActiveGladiator = (gladiator: Gladiator | null) => {
    setActiveGladiatorState(gladiator)
    if (gladiator) {
      localStorage.setItem('activeGladiatorId', gladiator.id)
    } else {
      localStorage.removeItem('activeGladiatorId')
    }
  }

  return (
    <ActiveGladiatorContext.Provider value={{ activeGladiator, setActiveGladiator, isLoading }}>
      {children}
    </ActiveGladiatorContext.Provider>
  )
}

export function useActiveGladiator() {
  const context = useContext(ActiveGladiatorContext)
  if (context === undefined) {
    throw new Error('useActiveGladiator must be used within an ActiveGladiatorProvider')
  }
  return context
}
