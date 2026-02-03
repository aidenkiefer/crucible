'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { useMintGladiator } from '@/hooks/useMintGladiator'
import { GladiatorClass } from '@/lib/contracts'

const CLASS_INFO = {
  [GladiatorClass.Duelist]: {
    name: 'Duelist',
    description: 'Balanced fighter with high technique and agility',
    strengths: 'Technique, Agility',
  },
  [GladiatorClass.Brute]: {
    name: 'Brute',
    description: 'Raw power and endurance',
    strengths: 'Strength, Endurance',
  },
  [GladiatorClass.Assassin]: {
    name: 'Assassin',
    description: 'Swift and deadly',
    strengths: 'Agility, Technique',
  },
}

export function MintGladiator() {
  const { isConnected } = useAccount()
  const { mint, isPending, isConfirming, isSuccess, hash } = useMintGladiator()
  const [selectedClass, setSelectedClass] = useState<GladiatorClass>(GladiatorClass.Duelist)

  if (!isConnected) {
    return (
      <div className="text-center p-8">
        <p>Please connect your wallet to mint a Gladiator</p>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold text-green-600 mb-4">
          Gladiator Minted Successfully! ⚔️
        </h2>
        <p className="text-sm text-gray-600">
          Transaction: {hash}
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Mint Your Gladiator</h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {Object.entries(CLASS_INFO).map(([classId, info]) => (
          <button
            key={classId}
            onClick={() => setSelectedClass(Number(classId))}
            className={`p-4 border-2 rounded-lg transition-all ${
              selectedClass === Number(classId)
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <h3 className="font-bold text-lg mb-2">{info.name}</h3>
            <p className="text-sm text-gray-600 mb-2">{info.description}</p>
            <p className="text-xs text-gray-500">
              <strong>Strengths:</strong> {info.strengths}
            </p>
          </button>
        ))}
      </div>

      <button
        onClick={() => mint(selectedClass)}
        disabled={isPending || isConfirming}
        className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
      >
        {isPending || isConfirming ? 'Minting...' : 'Mint Gladiator'}
      </button>
    </div>
  )
}
