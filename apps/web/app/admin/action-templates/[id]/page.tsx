'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import JsonEditor from '../../components/JsonEditor'

const CATEGORY_OPTIONS = ['WEAPON_ATTACK', 'CAST', 'MOBILITY', 'UTILITY']
const STATUS_OPTIONS = ['DRAFT', 'PUBLISHED', 'DEPRECATED']

export default function EditActionTemplatePage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    key: '',
    name: '',
    description: '',
    category: 'WEAPON_ATTACK',
    status: 'DRAFT',
    cooldownMs: 0,
    castTimeMs: 0,
    staminaCost: 0,
    manaCost: 0,
    hitboxConfig: {},
    projectileConfig: {},
    damageConfig: {},
    effectConfig: {},
  })

  useEffect(() => {
    fetchTemplate()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run on id change only
  }, [params.id])

  async function fetchTemplate() {
    setLoading(true)
    const res = await fetch(`/api/admin/action-templates/${params.id}`)
    const data = await res.json()
    if (data.template) {
      setFormData(data.template)
    }
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const res = await fetch(`/api/admin/action-templates/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update template')
      }

      router.push('/admin/action-templates')
    } catch (err: any) {
      setError(err.message)
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this action template? This cannot be undone.')) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/action-templates/${params.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Failed to delete template')
      }

      router.push('/admin/action-templates')
    } catch (err: any) {
      setError(err.message)
      setDeleting(false)
    }
  }

  if (loading) {
    return <div className="max-w-4xl mx-auto p-8 text-stone-400">Loading...</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold uppercase tracking-wide text-amber-500">
          Edit Action Template
        </h1>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="px-4 py-2 bg-red-800 text-red-200 font-bold uppercase text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {deleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900 border-2 border-red-600 text-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identity */}
        <div className="p-6 bg-stone-800 border-2 border-stone-700 rounded space-y-4">
          <h2 className="text-xl font-bold uppercase text-stone-200">Identity</h2>

          <div>
            <label className="block text-sm font-bold uppercase text-stone-300 mb-2">
              Key (Read-only)
            </label>
            <input
              type="text"
              value={formData.key}
              disabled
              className="w-full px-4 py-2 bg-stone-900 border-2 border-stone-600 text-stone-500 font-mono cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase text-stone-300 mb-2">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-stone-900 border-2 border-stone-600 text-stone-100 focus:border-amber-600 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase text-stone-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full h-24 px-4 py-2 bg-stone-900 border-2 border-stone-600 text-stone-100 focus:border-amber-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold uppercase text-stone-300 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 bg-stone-900 border-2 border-stone-600 text-stone-100 focus:border-amber-600 focus:outline-none"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold uppercase text-stone-300 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 bg-stone-900 border-2 border-stone-600 text-stone-100 focus:border-amber-600 focus:outline-none"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Timing & Costs */}
        <div className="p-6 bg-stone-800 border-2 border-stone-700 rounded space-y-4">
          <h2 className="text-xl font-bold uppercase text-stone-200">Timing & Costs</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold uppercase text-stone-300 mb-2">
                Cooldown (ms)
              </label>
              <input
                type="number"
                value={formData.cooldownMs}
                onChange={(e) => setFormData({ ...formData, cooldownMs: Number(e.target.value) })}
                className="w-full px-4 py-2 bg-stone-900 border-2 border-stone-600 text-stone-100 focus:border-amber-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold uppercase text-stone-300 mb-2">
                Cast Time (ms)
              </label>
              <input
                type="number"
                value={formData.castTimeMs}
                onChange={(e) => setFormData({ ...formData, castTimeMs: Number(e.target.value) })}
                className="w-full px-4 py-2 bg-stone-900 border-2 border-stone-600 text-stone-100 focus:border-amber-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold uppercase text-stone-300 mb-2">
                Stamina Cost
              </label>
              <input
                type="number"
                value={formData.staminaCost}
                onChange={(e) => setFormData({ ...formData, staminaCost: Number(e.target.value) })}
                className="w-full px-4 py-2 bg-stone-900 border-2 border-stone-600 text-stone-100 focus:border-amber-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold uppercase text-stone-300 mb-2">
                Mana Cost
              </label>
              <input
                type="number"
                value={formData.manaCost}
                onChange={(e) => setFormData({ ...formData, manaCost: Number(e.target.value) })}
                className="w-full px-4 py-2 bg-stone-900 border-2 border-stone-600 text-stone-100 focus:border-amber-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* JSON Configs */}
        <div className="p-6 bg-stone-800 border-2 border-stone-700 rounded space-y-4">
          <h2 className="text-xl font-bold uppercase text-stone-200">Behavior Configs (JSON)</h2>

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
          />

          <JsonEditor
            label="Effect Config"
            value={formData.effectConfig}
            onChange={(val) => setFormData({ ...formData, effectConfig: val })}
            insertSkeleton={() => ({
              effects: [],
            })}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 bg-green-700 text-black font-bold uppercase tracking-wide hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-8 py-3 bg-stone-700 text-stone-200 font-bold uppercase tracking-wide hover:bg-stone-600 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
