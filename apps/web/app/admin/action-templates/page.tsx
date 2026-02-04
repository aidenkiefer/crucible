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
    return <div className="max-w-7xl mx-auto p-8 text-coliseum-sand/50">Loading...</div>
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-4xl uppercase tracking-wide text-coliseum-bronze">
          Action Templates
        </h1>
        <Link
          href="/admin/action-templates/new"
          className="btn-primary"
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
          className="input"
        />
      </div>

      {/* Templates List */}
      <div className="panel overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-coliseum-black/50 border-b border-coliseum-bronze/20">
            <tr>
              <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-coliseum-sand/50">Key</th>
              <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-coliseum-sand/50">Name</th>
              <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-coliseum-sand/50">Category</th>
              <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-coliseum-sand/50">Status</th>
              <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-coliseum-sand/50">Cooldown</th>
              <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-coliseum-sand/50">Costs</th>
              <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-coliseum-sand/50">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-coliseum-bronze/10">
            {filteredTemplates.map((template) => (
              <tr key={template.id} className="hover:bg-coliseum-black/30 transition-colors">
                <td className="px-6 py-4 font-mono text-sm text-coliseum-bronze">{template.key}</td>
                <td className="px-6 py-4 font-bold text-coliseum-sand">{template.name}</td>
                <td className="px-6 py-4 text-coliseum-sand/70">{template.category}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${
                    template.status === 'PUBLISHED' ? 'bg-green-900 text-green-300' :
                    template.status === 'DRAFT' ? 'bg-blue-900 text-blue-300' :
                    'bg-purple-900 text-purple-300'
                  }`}>
                    {template.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-coliseum-sand/70">{template.cooldownMs}ms</td>
                <td className="px-6 py-4 text-sm text-coliseum-sand/60">
                  {template.staminaCost > 0 && `Stam: ${template.staminaCost}`}
                  {template.manaCost > 0 && ` Mana: ${template.manaCost}`}
                </td>
                <td className="px-6 py-4">
                  <Link
                    href={`/admin/action-templates/${template.id}`}
                    className="text-coliseum-bronze hover:text-coliseum-sand font-bold text-sm transition-colors"
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
