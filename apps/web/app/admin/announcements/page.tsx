'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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

export default function AnnouncementsPage() {
  const router = useRouter()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'draft' | 'published'>('all')

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const query = filter === 'all' ? '' : `?published=${filter === 'published'}`
        const res = await fetch(`/api/admin/announcements${query}`)
        if (res.ok) {
          const data = await res.json()
          setAnnouncements(data.announcements)
        }
      } catch (error) {
        console.error('Failed to fetch announcements:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnnouncements()
  }, [filter])

  const handlePublish = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/announcements/${id}/publish`, {
        method: 'POST',
      })
      if (res.ok) {
        // Update the announcement locally to avoid full refresh
        setAnnouncements((prev) =>
          prev.map((a) =>
            a.id === id
              ? { ...a, isPublished: true, publishedAt: new Date().toISOString() }
              : a
          )
        )
      } else {
        console.error('Failed to publish announcement')
      }
    } catch (error) {
      console.error('Failed to publish announcement:', error)
    }
  }

  const filtered = announcements.filter((a) => {
    if (filter === 'draft') return !a.isPublished
    if (filter === 'published') return a.isPublished
    return true
  })

  return (
    <div className="min-h-screen bg-coliseum-black">
      <div className="h-1 bg-gradient-to-r from-transparent via-coliseum-bronze to-transparent" />

      <div className="p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl text-coliseum-sand uppercase tracking-wide mb-2">Announcements</h1>
            <p className="text-coliseum-sand/50">Create and publish announcements for all players</p>
          </div>
          <Link
            href="/admin/announcements/new"
            className="px-6 py-3 text-sm uppercase tracking-wider bg-coliseum-bronze text-coliseum-black font-bold hover:brightness-110 transition-all"
          >
            + New Announcement
          </Link>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-8 border-b border-coliseum-bronze/20">
          {(['all', 'draft', 'published'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`
                px-4 py-3 text-sm uppercase tracking-wider border-b-2 transition-colors
                ${
                  filter === f
                    ? 'border-coliseum-bronze text-coliseum-sand'
                    : 'border-transparent text-coliseum-sand/50 hover:text-coliseum-sand'
                }
              `}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Loading state */}
        {loading && <div className="text-center text-coliseum-sand/50 py-8">Loading...</div>}

        {/* Announcements list */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-coliseum-sand/50 mb-4">No announcements found</p>
            <Link
              href="/admin/announcements/new"
              className="text-coliseum-bronze hover:text-coliseum-sand text-sm uppercase tracking-wider"
            >
              Create one →
            </Link>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((announcement) => (
              <div
                key={announcement.id}
                className="p-4 bg-coliseum-stone border-2 border-coliseum-bronze/20 hover:border-coliseum-bronze/40 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-coliseum-sand font-bold text-lg">{announcement.title}</h3>
                      <span
                        className={`
                          px-2 py-1 text-[10px] uppercase tracking-wider border
                          ${
                            announcement.isPublished
                              ? 'bg-green-900/50 text-green-400 border-green-700'
                              : 'bg-yellow-900/50 text-yellow-400 border-yellow-700'
                          }
                        `}
                      >
                        {announcement.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <p className="text-coliseum-sand/70 mb-2 line-clamp-2">{announcement.message}</p>
                    <div className="text-xs text-coliseum-sand/50 space-y-1">
                      <p>By {announcement.createdBy.email}</p>
                      <p>
                        Created: {new Date(announcement.createdAt).toLocaleString()}
                        {announcement.publishedAt && (
                          <>
                            {' • Published: '}
                            {new Date(announcement.publishedAt).toLocaleString()}
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Link
                      href={`/admin/announcements/${announcement.id}/edit`}
                      className="px-3 py-2 text-xs uppercase tracking-wider bg-coliseum-bronze/20 text-coliseum-bronze border border-coliseum-bronze/50 hover:bg-coliseum-bronze/30 transition-colors"
                    >
                      Edit
                    </Link>
                    {!announcement.isPublished && (
                      <button
                        onClick={() => handlePublish(announcement.id)}
                        className="px-3 py-2 text-xs uppercase tracking-wider bg-green-900/30 text-green-400 border border-green-700 hover:bg-green-900/50 transition-colors"
                      >
                        Publish
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
