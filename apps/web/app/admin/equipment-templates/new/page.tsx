'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import JsonEditor from '../../components/JsonEditor'

const TYPE_OPTIONS = ['WEAPON', 'ARMOR', 'CATALYST', 'TRINKET', 'AUGMENT']
const SLOT_OPTIONS = ['MAIN_HAND', 'OFF_HAND', 'HELMET', 'CHEST', 'GAUNTLETS', 'GREAVES']
const RARITY_OPTIONS = [
  { value: 'COMMON', label: 'Common' },
  { value: 'UNCOMMON', label: 'Uncommon' },
  { value: 'RARE', label: 'Rare' },
  { value: 'EPIC', label: 'Epic' },
  { value: 'LEGENDARY', label: 'Legendary' },
] as const

export default function NewEquipmentTemplatePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [actionTemplates, setActionTemplates] = useState<any[]>([])

  const [formData, setFormData] = useState<{
    key: string
    name: string
    description: string
    type: string
    slot: string
    subtype: string
    rarity: string
    tags: string[]
    allowedClass: string | null
    weaponCoeff: number
    baseStatMods: Record<string, unknown>
    scaling: Record<string, unknown>
    rarityRules: Record<string, unknown>
    ui: Record<string, unknown>
    actionTemplateIds: string[]
  }>({
    key: '',
    name: '',
    description: '',
    type: 'WEAPON',
    slot: 'MAIN_HAND',
    subtype: '',
    rarity: 'COMMON',
    tags: [],
    allowedClass: null,
    weaponCoeff: 1.0,
    baseStatMods: {},
    scaling: {},
    rarityRules: {},
    ui: {},
    actionTemplateIds: [],
  })

  useEffect(() => {
    fetchActionTemplates()
  }, [])

  async function fetchActionTemplates() {
    const res = await fetch('/api/admin/action-templates')
    const data = await res.json()
    setActionTemplates(data.templates || [])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const res = await fetch('/api/admin/equipment-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create template')
      }

      const { template } = await res.json()
      router.push(`/admin/equipment-templates/${template.id}`)
    } catch (err: any) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="font-display text-4xl uppercase tracking-wide text-coliseum-bronze mb-8">
        Create Equipment Template
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
            <label className="block text-sm font-bold uppercase text-coliseum-sand/70 mb-2">Key *</label>
            <input
              type="text"
              value={formData.key}
              onChange={(e) => setFormData({ ...formData, key: e.target.value })}
              placeholder="iron_longsword"
              className="input font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase text-coliseum-sand/70 mb-2">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Iron Longsword"
              className="input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase text-coliseum-sand/70 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="A reliable sword for beginners"
              className="input h-24"
            />
          </div>
        </div>

        {/* Classification */}
        <div className="panel p-6 space-y-4 inner-shadow">
          <h2 className="font-display text-2xl uppercase tracking-wide text-coliseum-sand">Classification</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-bold uppercase text-coliseum-sand/70 mb-2">Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="input"
              >
                {TYPE_OPTIONS.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold uppercase text-coliseum-sand/70 mb-2">Slot *</label>
              <select
                value={formData.slot}
                onChange={(e) => setFormData({ ...formData, slot: e.target.value })}
                className="input"
              >
                {SLOT_OPTIONS.map((slot) => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold uppercase text-coliseum-sand/70 mb-2">Subtype *</label>
              <input
                type="text"
                value={formData.subtype}
                onChange={(e) => setFormData({ ...formData, subtype: e.target.value })}
                placeholder="SWORD"
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold uppercase text-coliseum-sand/70 mb-2">Rarity</label>
              <select
                value={formData.rarity}
                onChange={(e) => setFormData({ ...formData, rarity: e.target.value })}
                className="input"
              >
                {RARITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <p className="text-xs text-coliseum-sand/50 mt-1">Determines asset folder under /assets/items/</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold uppercase text-coliseum-sand/70 mb-2">Tags (comma-separated)</label>
            <input
              type="text"
              value={formData.tags.join(', ')}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map(s => s.trim()) })}
              placeholder="starter, melee, slash"
              className="input"
            />
          </div>

          {/* Class Restriction */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold uppercase text-coliseum-sand/70 mb-2">
                Allowed Class
              </label>
              <select
                value={formData.allowedClass || ''}
                onChange={(e) => {
                  const newClass = e.target.value || null
                  const updates: any = { allowedClass: newClass }

                  // Auto-adjust weaponCoeff based on class selection (for WEAPON type only)
                  if (formData.type === 'WEAPON') {
                    if (newClass === 'universal') {
                      updates.weaponCoeff = 0.8
                    } else if (newClass !== null && newClass !== 'universal') {
                      // Only set to 1.0 for class-specific weapons
                      updates.weaponCoeff = 1.0
                    }
                    // If newClass is null (backward compat), weaponCoeff remains unchanged
                  }

                  setFormData({ ...formData, ...updates })
                }}
                className="input"
              >
                {(formData.type === 'ARMOR'
                  ? [
                      { value: '', label: '(None - Backward Compat)' },
                      { value: 'Tank', label: 'Tank' },
                      { value: 'Legionnaire', label: 'Legionnaire' },
                      { value: 'Duelist', label: 'Duelist' },
                      { value: 'Mage', label: 'Mage' },
                      { value: 'Monk', label: 'Monk' },
                    ]
                  : [
                      { value: '', label: '(None - Backward Compat)' },
                      { value: 'universal', label: 'Universal' },
                      { value: 'Tank', label: 'Tank' },
                      { value: 'Legionnaire', label: 'Legionnaire' },
                      { value: 'Duelist', label: 'Duelist' },
                      { value: 'Mage', label: 'Mage' },
                      { value: 'Monk', label: 'Monk' },
                    ]
                ).map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <p className="text-xs text-coliseum-sand/50 mt-1">
                {formData.type === 'ARMOR'
                  ? 'ARMOR should be class-specific'
                  : formData.type === 'WEAPON'
                  ? 'WEAPON can be class-specific (1.0 coeff) or universal (0.8 coeff)'
                  : 'Class restriction (optional)'}
              </p>
            </div>

            {formData.type === 'WEAPON' && (
              <div>
                <label className="block text-sm font-bold uppercase text-coliseum-sand/70 mb-2">
                  Weapon Coefficient
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="1.5"
                  value={formData.weaponCoeff}
                  onChange={(e) => setFormData({ ...formData, weaponCoeff: parseFloat(e.target.value) || 1.0 })}
                  className="input"
                />
                <p className="text-xs text-coliseum-sand/50 mt-1">
                  1.0 for class weapon, 0.8 for universal (auto-set by class selection)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Granted Actions */}
        <div className="panel p-6 space-y-4 inner-shadow">
          <h2 className="font-display text-2xl uppercase tracking-wide text-coliseum-sand">Granted Actions</h2>
          <p className="text-sm text-coliseum-sand/60">Select actions this equipment grants to the wielder</p>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {actionTemplates.map((action) => (
              <label key={action.id} className="flex items-center space-x-3 p-3 bg-coliseum-black/40 hover:bg-coliseum-black/60 cursor-pointer border border-coliseum-bronze/20">
                <input
                  type="checkbox"
                  checked={(formData.actionTemplateIds as string[]).includes(action.id)}
                  onChange={(e) => {
                    const ids = formData.actionTemplateIds as string[]
                    if (e.target.checked) {
                      setFormData({ ...formData, actionTemplateIds: [...ids, action.id] })
                    } else {
                      setFormData({ ...formData, actionTemplateIds: ids.filter(id => id !== action.id) })
                    }
                  }}
                  className="w-5 h-5"
                />
                <div className="flex-1">
                  <div className="text-coliseum-sand font-bold">{action.name}</div>
                  <div className="text-xs text-coliseum-sand/50 font-mono">{action.key}</div>
                </div>
                <div className="text-xs text-coliseum-sand/50">{action.category}</div>
              </label>
            ))}
          </div>
        </div>

        {/* UI Metadata */}
        <div className="panel p-6 space-y-4 inner-shadow">
          <h2 className="font-display text-2xl uppercase tracking-wide text-coliseum-sand">UI Metadata</h2>
          <p className="text-sm text-coliseum-sand/60">Display name and icon for inventory rendering</p>

          <div>
            <label className="block text-sm font-bold uppercase text-coliseum-sand/70 mb-2">
              Display Name *
            </label>
            <input
              type="text"
              value={(formData.ui as any)?.displayName || ''}
              onChange={(e) => setFormData({
                ...formData,
                ui: { ...(formData.ui as any), displayName: e.target.value }
              })}
              placeholder={formData.name || 'Iron Longsword'}
              className="input"
            />
            <p className="text-xs text-coliseum-sand/50 mt-1">
              Name shown in inventory (falls back to template name)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold uppercase text-coliseum-sand/70 mb-2">
                Icon Source *
              </label>
              <select
                value={(formData.ui as any)?.icon?.source || 'LOCAL_PUBLIC'}
                onChange={(e) => setFormData({
                  ...formData,
                  ui: {
                    ...(formData.ui as any),
                    icon: { ...(formData.ui as any)?.icon, source: e.target.value }
                  }
                })}
                className="input"
              >
                <option value="LOCAL_PUBLIC">Local Public Assets</option>
                <option value="SUPABASE_STORAGE">Supabase Storage</option>
              </select>
              <p className="text-xs text-coliseum-sand/50 mt-1">Where icon is stored</p>
            </div>

            <div>
              <label className="block text-sm font-bold uppercase text-coliseum-sand/70 mb-2">
                Icon Path *
              </label>
              <input
                type="text"
                value={(formData.ui as any)?.icon?.path || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  ui: {
                    ...(formData.ui as any),
                    icon: { ...(formData.ui as any)?.icon, path: e.target.value }
                  }
                })}
                placeholder={`/assets/items/${formData.rarity?.toLowerCase() || 'commons'}/${formData.key}/icon.png`}
                className="input font-mono text-sm"
              />
              <p className="text-xs text-coliseum-sand/50 mt-1">
                {(formData.ui as any)?.icon?.source === 'LOCAL_PUBLIC'
                  ? 'Must start with /assets/'
                  : 'Storage key (e.g. items/commons/sword/icon.png)'}
              </p>
            </div>
          </div>

          {/* Health warning */}
          {(!(formData.ui as any)?.displayName || !(formData.ui as any)?.icon?.path) && (
            <div className="p-3 bg-yellow-900/20 border border-yellow-600/40 text-yellow-200 text-sm">
              <strong>⚠ Incomplete UI metadata:</strong>
              {!(formData.ui as any)?.displayName && ' Missing display name.'}
              {!(formData.ui as any)?.icon?.path && ' Missing icon path.'}
            </div>
          )}
        </div>

        {/* JSON Configs */}
        <div className="panel p-6 space-y-4 inner-shadow">
          <h2 className="font-display text-2xl uppercase tracking-wide text-coliseum-sand">Stats & Modifiers (JSON)</h2>

          <JsonEditor
            label="Base Stat Mods"
            value={formData.baseStatMods}
            onChange={(val) => setFormData({ ...formData, baseStatMods: val })}
            insertSkeleton={() => ({
              str: 5,
              dex: 2,
              def: 0,
            })}
            helperText="Flat stat bonuses (e.g. {str: 5, def: 3})"
          />

          <JsonEditor
            label="Scaling"
            value={formData.scaling}
            onChange={(val) => setFormData({ ...formData, scaling: val })}
            insertSkeleton={() => ({
              str: 0.7,
              dex: 0.3,
            })}
            helperText="Stat scaling ratios for damage/effects"
          />

          <JsonEditor
            label="Rarity Rules"
            value={formData.rarityRules}
            onChange={(val) => setFormData({ ...formData, rarityRules: val })}
            insertSkeleton={() => ({
              allowedRarities: ['COMMON', 'RARE'],
            })}
            helperText="(Optional) Loot/crafting rarity config"
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
