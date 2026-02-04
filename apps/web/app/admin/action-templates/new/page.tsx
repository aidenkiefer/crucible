'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import JsonEditor from '../../components/JsonEditor'

const CATEGORY_OPTIONS = ['WEAPON_ATTACK', 'CAST', 'MOBILITY', 'UTILITY']

export default function NewActionTemplatePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    key: '',
    name: '',
    description: '',
    category: 'WEAPON_ATTACK',
    cooldownMs: 0,
    castTimeMs: 0,
    staminaCost: 0,
    manaCost: 0,
    hitboxConfig: {},
    projectileConfig: {},
    damageConfig: {},
    effectConfig: {},
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const res = await fetch('/api/admin/action-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create template')
      }

      const { template } = await res.json()
      router.push(`/admin/action-templates/${template.id}`)
    } catch (err: any) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="font-display text-4xl uppercase tracking-wide text-coliseum-bronze mb-8">
        Create Action Template
      </h1>

      {error && (
        <div className="mb-6 p-4 bg-coliseum-red/20 border-2 border-coliseum-red text-coliseum-sand">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identity */}
        <div className="panel p-6 space-y-4 inner-shadow">
          <h2 className="font-display text-2xl uppercase tracking-wide text-coliseum-sand">Identity</h2>

          <div>
            <label className="block text-sm font-bold uppercase text-coliseum-sand/70 mb-2">
              Key *
            </label>
            <input
              type="text"
              value={formData.key}
              onChange={(e) => setFormData({ ...formData, key: e.target.value })}
              placeholder="atk_sword_slash_light"
              className="input font-mono"
              required
            />
            <p className="mt-1 text-xs text-coliseum-sand/50">Lowercase snake_case, unique, stable</p>
          </div>

          <div>
            <label className="block text-sm font-bold uppercase text-coliseum-sand/70 mb-2">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Light Sword Slash"
              className="input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase text-coliseum-sand/70 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="A quick horizontal slash"
              className="input h-24"
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase text-coliseum-sand/70 mb-2">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="input"
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Timing & Costs */}
        <div className="panel p-6 space-y-4 inner-shadow">
          <h2 className="font-display text-2xl uppercase tracking-wide text-coliseum-sand">Timing & Costs</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold uppercase text-coliseum-sand/70 mb-2">
                Cooldown (ms)
              </label>
              <input
                type="number"
                value={formData.cooldownMs}
                onChange={(e) => setFormData({ ...formData, cooldownMs: Number(e.target.value) })}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-bold uppercase text-coliseum-sand/70 mb-2">
                Cast Time (ms)
              </label>
              <input
                type="number"
                value={formData.castTimeMs}
                onChange={(e) => setFormData({ ...formData, castTimeMs: Number(e.target.value) })}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-bold uppercase text-coliseum-sand/70 mb-2">
                Stamina Cost
              </label>
              <input
                type="number"
                value={formData.staminaCost}
                onChange={(e) => setFormData({ ...formData, staminaCost: Number(e.target.value) })}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-bold uppercase text-coliseum-sand/70 mb-2">
                Mana Cost
              </label>
              <input
                type="number"
                value={formData.manaCost}
                onChange={(e) => setFormData({ ...formData, manaCost: Number(e.target.value) })}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* JSON Configs */}
        <div className="panel p-6 space-y-4 inner-shadow">
          <h2 className="font-display text-2xl uppercase tracking-wide text-coliseum-sand">Behavior Configs (JSON)</h2>

          <JsonEditor
            label="Hitbox Config"
            value={formData.hitboxConfig}
            onChange={(val) => setFormData({ ...formData, hitboxConfig: val })}
            insertSkeleton={() => ({
              shape: 'ARC',
              radius: 80,
              angleDeg: 90,
              offsetX: 0,
              offsetY: 0,
            })}
            helperText="Defines melee attack hitbox shape (ARC, CIRCLE, RECTANGLE)"
          />

          <JsonEditor
            label="Projectile Config"
            value={formData.projectileConfig}
            onChange={(val) => setFormData({ ...formData, projectileConfig: val })}
            insertSkeleton={() => ({
              speed: 400,
              radius: 10,
              ttlMs: 2000,
              pierces: false,
            })}
            helperText="Defines projectile behavior for ranged attacks"
          />

          <JsonEditor
            label="Damage Config"
            value={formData.damageConfig}
            onChange={(val) => setFormData({ ...formData, damageConfig: val })}
            insertSkeleton={() => ({
              base: 15,
              type: 'PHYSICAL',
              scaling: { str: 0.7, dex: 0.3 },
            })}
            helperText="Base damage and stat scaling"
          />

          <JsonEditor
            label="Effect Config"
            value={formData.effectConfig}
            onChange={(val) => setFormData({ ...formData, effectConfig: val })}
            insertSkeleton={() => ({
              effects: [],
            })}
            helperText="Buffs, debuffs, on-hit effects, etc."
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Creating...' : 'Create Template'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
