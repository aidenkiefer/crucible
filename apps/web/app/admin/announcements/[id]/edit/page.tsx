'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Announcement {
  id: string
  title: string
  message: string
  isPublished: boolean
  createdAt: string
  publishedAt: string | null
  createdBy: {
    id: string
    name: string
    email: string
  }
}

export default function EditAnnouncementPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const res = await fetch(`/api/admin/announcements/${params.id}`)
        if (res.ok) {
          const data = await res.json()
          setAnnouncement(data.announcement)
          setTitle(data.announcement.title)
          setMessage(data.announcement.message)
        } else {
          setError('Announcement not found')
        }
      } catch (err) {
        setError('Failed to load announcement')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchAnnouncement()
  }, [params.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const res = await fetch(`/api/admin/announcements/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message }),
      })

      if (res.ok) {
        router.push('/admin/announcements')
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to update announcement')
      }
    } catch (err) {
      setError('Failed to update announcement')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-coliseum-black flex items-center justify-center">
        <div className="text-coliseum-sand/50">Loading...</div>
      </div>
    )
  }

  if (!announcement) {
    return (
      <div className="min-h-screen bg-coliseum-black p-8">
        <div className="text-center">
          <p className="text-coliseum-sand/50 mb-4">{error}</p>
          <Link href="/admin/announcements" className="text-coliseum-bronze hover:text-coliseum-sand text-sm uppercase tracking-wider">
            ← Back to Announcements
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-coliseum-black">
      <div className="h-1 bg-gradient-to-r from-transparent via-coliseum-bronze to-transparent" />

      <div className="p-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/admin/announcements" className="text-coliseum-bronze hover:text-coliseum-sand text-sm uppercase tracking-wider mb-4 inline-block">
            ← Back to Announcements
          </Link>
          <h1 className="font-display text-3xl text-coliseum-sand uppercase tracking-wide mb-2">Edit Announcement</h1>
          {announcement.isPublished && <p className="text-yellow-400 text-sm">This announcement has already been published</p>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-coliseum-stone border-2 border-coliseum-bronze/20 p-8">
          {error && (
            <div className="p-4 bg-red-900/20 border border-red-700 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-coliseum-sand font-bold text-sm uppercase tracking-wider mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-coliseum-black border-2 border-coliseum-bronze/30 text-coliseum-sand placeholder-coliseum-sand/30 focus:border-coliseum-bronze outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-coliseum-sand font-bold text-sm uppercase tracking-wider mb-2">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              className="w-full px-4 py-3 bg-coliseum-black border-2 border-coliseum-bronze/30 text-coliseum-sand placeholder-coliseum-sand/30 focus:border-coliseum-bronze outline-none resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-coliseum-sand font-bold text-sm uppercase tracking-wider mb-2">Preview</label>
            <div className="p-6 bg-coliseum-black border-2 border-coliseum-bronze/30">
              <h3 className="text-coliseum-sand font-bold text-lg mb-2">{title}</h3>
              <p className="text-coliseum-sand/80 whitespace-pre-wrap">{message}</p>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving || !title || !message}
              className="px-6 py-3 text-sm uppercase tracking-wider bg-coliseum-bronze text-coliseum-black font-bold hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <Link
              href="/admin/announcements"
              className="px-6 py-3 text-sm uppercase tracking-wider bg-coliseum-stone border-2 border-coliseum-bronze/30 text-coliseum-sand hover:border-coliseum-bronze/50 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
