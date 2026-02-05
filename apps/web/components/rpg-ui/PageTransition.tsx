'use client'

import { useEffect, useState, ReactNode } from 'react'
import { usePathname } from 'next/navigation'

interface PageTransitionProps {
  children: ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()
  const [displayChildren, setDisplayChildren] = useState(children)
  const [transitionStage, setTransitionStage] = useState<'entering' | 'entered'>('entered')

  useEffect(() => {
    // When pathname changes, trigger exit -> enter transition
    setTransitionStage('entering')

    const timer = setTimeout(() => {
      setDisplayChildren(children)
      setTransitionStage('entered')
    }, 150) // Match CSS transition duration

    return () => clearTimeout(timer)
  }, [pathname, children])

  return (
    <div
      className={`
        transition-all duration-150
        ${transitionStage === 'entering' ? 'opacity-0 translate-x-5' : 'opacity-100 translate-x-0'}
      `}
    >
      {displayChildren}
    </div>
  )
}
