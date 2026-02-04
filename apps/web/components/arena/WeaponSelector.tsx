'use client'

import { WeaponType } from '@gladiator/shared/src/combat/types'
import { WEAPONS } from '@gladiator/shared/src/combat/weapons'

interface WeaponSelectorProps {
  currentWeapon: WeaponType
  onWeaponChange: (weapon: WeaponType) => void
}

export function WeaponSelector({ currentWeapon, onWeaponChange }: WeaponSelectorProps) {
  const weapons = Object.values(WeaponType)

  return (
    <div className="bg-gray-900/90 p-3 rounded-lg border border-gray-700">
      <div className="text-xs text-gray-400 mb-2">Weapon [1-4]</div>
      <div className="grid grid-cols-4 gap-2">
        {weapons.map((weapon, index) => {
          const def = WEAPONS[weapon]
          const isSelected = weapon === currentWeapon

          return (
            <button
              key={weapon}
              onClick={() => onWeaponChange(weapon)}
              className={`
                p-2 rounded text-xs transition-all
                ${
                  isSelected
                    ? 'bg-green-600 text-white border-2 border-green-400'
                    : 'bg-gray-800 text-gray-300 border-2 border-gray-700 hover:border-gray-500'
                }
              `}
            >
              <div className="font-bold">{weapon}</div>
              <div className="text-[10px] text-gray-400 mt-1">
                {index + 1}
              </div>
              <div className="text-[10px] mt-1">
                CD: {def.cooldown}ms
              </div>
              <div className="text-[10px] text-gray-400">
                {def.attackPattern === 'Projectile' ? 'Ranged' : 'Melee'}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
