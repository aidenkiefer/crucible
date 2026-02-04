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
    return <div className="max-w-7xl mx-auto p-8 text-stone-400">Loading...</div>
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      <h1 className="text-4xl font-bold uppercase tracking-wide text-amber-500 mb-8">
        Game Data Bundles
      </h1>

      {/* Create Bundle Form */}
      <div className="mb-8 p-6 bg-stone-800 border-2 border-stone-700 rounded">
        <h2 className="text-xl font-bold uppercase text-stone-200 mb-4">Create New Bundle</h2>
        <form onSubmit={handleCreateBundle} className="flex gap-4">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="e.g. demo-v0.2"
            className="flex-1 px-4 py-2 bg-stone-900 border-2 border-stone-600 text-stone-100 focus:border-amber-600 focus:outline-none"
            required
          />
          <button
            type="submit"
            disabled={creating}
            className="px-6 py-2 bg-amber-700 text-black font-bold uppercase tracking-wide hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {creating ? 'Creating...' : 'Create (Clone from Active)'}
          </button>
        </form>
        {error && <div className="mt-4 text-red-400 text-sm">{error}</div>}
        <p className="mt-4 text-sm text-stone-400">
          Creates a new draft bundle by cloning all templates from the current active bundle.
        </p>
      </div>

      {/* Bundles List */}
      <div className="bg-stone-800 border-2 border-stone-700 rounded overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-stone-950 border-b-2 border-stone-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase text-stone-400">Label</th>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase text-stone-400">Status</th>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase text-stone-400">Active</th>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase text-stone-400">Equipment</th>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase text-stone-400">Actions</th>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase text-stone-400">Updated</th>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase text-stone-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-700">
            {bundles.map((bundle) => (
              <tr key={bundle.id} className="hover:bg-stone-750">
                <td className="px-6 py-4 font-bold text-stone-100">{bundle.label}</td>
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
                    <span className="text-xs font-bold uppercase px-2 py-1 rounded bg-amber-900 text-amber-300">
                      ✓ Active
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-stone-300">{bundle._count.equipmentTemplates}</td>
                <td className="px-6 py-4 text-stone-300">{bundle._count.actionTemplates}</td>
                <td className="px-6 py-4 text-sm text-stone-400">
                  {new Date(bundle.updatedAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <Link
                    href={`/admin/bundles/${bundle.id}`}
                    className="text-amber-500 hover:text-amber-400 font-bold text-sm"
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
