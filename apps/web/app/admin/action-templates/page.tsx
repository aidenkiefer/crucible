'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface ActionTemplate {
  id: string
  key: string
  name: string
  category: string
  status: string
  cooldownMs: number
  staminaCost: number
  manaCost: number
}

export default function ActionTemplatesPage() {
  const [templates, setTemplates] = useState<ActionTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchTemplates()
  }, [])

  async function fetchTemplates() {
    setLoading(true)
    const res = await fetch('/api/admin/action-templates')
    const data = await res.json()
    setTemplates(data.templates)
    setLoading(false)
  }

  const filteredTemplates = templates.filter(
    (t) =>
      t.key.toLowerCase().includes(search.toLowerCase()) ||
      t.name.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return <div className="max-w-7xl mx-auto p-8 text-stone-400">Loading...</div>
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold uppercase tracking-wide text-amber-500">
          Action Templates
        </h1>
        <Link
          href="/admin/action-templates/new"
          className="px-6 py-3 bg-green-700 text-black font-bold uppercase tracking-wide hover:bg-green-600 transition"
        >
          + Create Action
        </Link>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by key or name..."
          className="w-full px-4 py-2 bg-stone-900 border-2 border-stone-600 text-stone-100 focus:border-amber-600 focus:outline-none"
        />
      </div>

      {/* Templates List */}
      <div className="bg-stone-800 border-2 border-stone-700 rounded overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-stone-950 border-b-2 border-stone-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase text-stone-400">Key</th>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase text-stone-400">Name</th>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase text-stone-400">Category</th>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase text-stone-400">Status</th>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase text-stone-400">Cooldown</th>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase text-stone-400">Costs</th>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase text-stone-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-700">
            {filteredTemplates.map((template) => (
              <tr key={template.id} className="hover:bg-stone-750">
                <td className="px-6 py-4 font-mono text-sm text-cyan-400">{template.key}</td>
                <td className="px-6 py-4 font-bold text-stone-100">{template.name}</td>
                <td className="px-6 py-4 text-stone-300">{template.category}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${
                    template.status === 'PUBLISHED' ? 'bg-green-900 text-green-300' :
                    template.status === 'DRAFT' ? 'bg-blue-900 text-blue-300' :
                    'bg-purple-900 text-purple-300'
                  }`}>
                    {template.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-stone-300">{template.cooldownMs}ms</td>
                <td className="px-6 py-4 text-sm text-stone-400">
                  {template.staminaCost > 0 && `Stam: ${template.staminaCost}`}
                  {template.manaCost > 0 && ` Mana: ${template.manaCost}`}
                </td>
                <td className="px-6 py-4">
                  <Link
                    href={`/admin/action-templates/${template.id}`}
                    className="text-amber-500 hover:text-amber-400 font-bold text-sm"
                  >
                    Edit →
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
