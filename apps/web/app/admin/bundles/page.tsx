'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Bundle {
  id: string
  label: string
  status: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count: {
    equipmentTemplates: number
    actionTemplates: number
  }
}

export default function BundlesPage() {
  const [bundles, setBundles] = useState<Bundle[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchBundles()
  }, [])

  async function fetchBundles() {
    setLoading(true)
    const res = await fetch('/api/admin/bundles')
    const data = await res.json()
    setBundles(data.bundles)
    setLoading(false)
  }

  async function handleCreateBundle(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setCreating(true)

    try {
      const res = await fetch('/api/admin/bundles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: newLabel }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create bundle')
      }

      setNewLabel('')
      await fetchBundles()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return <div className="max-w-7xl mx-auto p-8 text-coliseum-sand/50">Loading...</div>
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      <h1 className="font-display text-4xl uppercase tracking-wide text-coliseum-bronze mb-8">
        Game Data Bundles
      </h1>

      {/* Create Bundle Form */}
      <div className="mb-8 panel p-6 inner-shadow">
        <h2 className="font-display text-2xl uppercase tracking-wide text-coliseum-sand mb-4">
          Create New Bundle
        </h2>
        <form onSubmit={handleCreateBundle} className="flex gap-4">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="e.g. demo-v0.2"
            className="input flex-1"
            required
          />
          <button
            type="submit"
            disabled={creating}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? 'Creating...' : 'Create (Clone from Active)'}
          </button>
        </form>
        {error && <div className="mt-4 text-coliseum-red text-sm">{error}</div>}
        <p className="mt-4 text-sm text-coliseum-sand/60">
          Creates a new draft bundle by cloning all templates from the current active bundle.
        </p>
      </div>

      {/* Bundles List */}
      <div className="panel overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-coliseum-black/50 border-b border-coliseum-bronze/20">
            <tr>
              <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-coliseum-sand/50">Label</th>
              <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-coliseum-sand/50">Status</th>
              <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-coliseum-sand/50">Active</th>
              <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-coliseum-sand/50">Equipment</th>
              <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-coliseum-sand/50">Actions</th>
              <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-coliseum-sand/50">Updated</th>
              <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-coliseum-sand/50">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-coliseum-bronze/10">
            {bundles.map((bundle) => (
              <tr key={bundle.id} className="hover:bg-coliseum-black/30 transition-colors">
                <td className="px-6 py-4 font-bold text-coliseum-sand">{bundle.label}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${
                    bundle.status === 'PUBLISHED' ? 'bg-green-900 text-green-300' :
                    bundle.status === 'DRAFT' ? 'bg-blue-900 text-blue-300' :
                    'bg-purple-900 text-purple-300'
                  }`}>
                    {bundle.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {bundle.isActive && (
                    <span className="tag">
                      ✓ Active
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-coliseum-sand/70">{bundle._count.equipmentTemplates}</td>
                <td className="px-6 py-4 text-coliseum-sand/70">{bundle._count.actionTemplates}</td>
                <td className="px-6 py-4 text-sm text-coliseum-sand/50">
                  {new Date(bundle.updatedAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <Link
                    href={`/admin/bundles/${bundle.id}`}
                    className="text-coliseum-bronze hover:text-coliseum-sand font-bold text-sm transition-colors"
                  >
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
