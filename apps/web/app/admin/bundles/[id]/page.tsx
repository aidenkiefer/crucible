'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface Bundle {
  id: string
  label: string
  status: string
  isActive: boolean
  exportTarget: string | null
  createdAt: string
  updatedAt: string
  _count: {
    equipmentTemplates: number
    actionTemplates: number
  }
}

interface ValidationError {
  entityType: string
  key: string
  field?: string
  message: string
  severity: string
}

export default function BundleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [bundle, setBundle] = useState<Bundle | null>(null)
  const [loading, setLoading] = useState(true)
  const [validating, setValidating] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [activating, setActivating] = useState(false)
  const [validationResult, setValidationResult] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchBundle()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run on id change only
  }, [params.id])

  async function fetchBundle() {
    setLoading(true)
    const res = await fetch(`/api/admin/bundles`)
    const data = await res.json()
    const found = data.bundles.find((b: Bundle) => b.id === params.id)
    setBundle(found || null)
    setLoading(false)
  }

  async function handleValidate() {
    setValidating(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/bundles/${params.id}/validate`, {
        method: 'POST',
      })
      const data = await res.json()
      setValidationResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setValidating(false)
    }
  }

  async function handlePublish() {
    if (!confirm('Publish this bundle? This will validate, mark as PUBLISHED, and export to storage.')) return

    setPublishing(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/bundles/${params.id}/publish`, {
        method: 'POST',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to publish')
      }

      await fetchBundle()
      setValidationResult(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setPublishing(false)
    }
  }

  async function handleActivate() {
    if (!confirm('Activate this bundle? This will deactivate all other bundles and make this the active one.')) return

    setActivating(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/bundles/${params.id}/activate`, {
        method: 'POST',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to activate')
      }

      await fetchBundle()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActivating(false)
    }
  }

  if (loading) {
    return <div className="max-w-7xl mx-auto p-8 text-coliseum-sand/50">Loading...</div>
  }

  if (!bundle) {
    return <div className="max-w-7xl mx-auto p-8 text-coliseum-sand/50">Bundle not found</div>
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="mb-8">
        <Link href="/admin/bundles" className="text-coliseum-bronze hover:text-coliseum-sand text-sm font-bold uppercase transition-colors">
          ← Back to Bundles
        </Link>
        <h1 className="font-display text-4xl uppercase tracking-wide text-coliseum-bronze mt-4">
          {bundle.label}
        </h1>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-coliseum-red/20 border-2 border-coliseum-red text-coliseum-sand">
          {error}
        </div>
      )}

      {/* Bundle Info */}
      <div className="mb-8 panel p-6 inner-shadow">
        <h2 className="font-display text-3xl uppercase tracking-wide text-coliseum-sand mb-4">Bundle Info</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-coliseum-sand/50 uppercase text-[10px] font-bold tracking-wider mb-1">Status</div>
            <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${
              bundle.status === 'PUBLISHED' ? 'bg-green-900 text-green-300' :
              bundle.status === 'DRAFT' ? 'bg-blue-900 text-blue-300' :
              'bg-purple-900 text-purple-300'
            }`}>
              {bundle.status}
            </span>
          </div>
          <div>
            <div className="text-coliseum-sand/50 uppercase text-[10px] font-bold tracking-wider mb-1">Active</div>
            <div className="text-coliseum-sand">{bundle.isActive ? '✓ Yes' : 'No'}</div>
          </div>
          <div>
            <div className="text-coliseum-sand/50 uppercase text-[10px] font-bold tracking-wider mb-1">Equipment Templates</div>
            <div className="text-coliseum-sand">{bundle._count.equipmentTemplates}</div>
          </div>
          <div>
            <div className="text-coliseum-sand/50 uppercase text-[10px] font-bold tracking-wider mb-1">Action Templates</div>
            <div className="text-coliseum-sand">{bundle._count.actionTemplates}</div>
          </div>
          <div>
            <div className="text-coliseum-sand/50 uppercase text-[10px] font-bold tracking-wider mb-1">Export Target</div>
            <div className="text-coliseum-sand/80 font-mono text-xs">{bundle.exportTarget || 'Not exported'}</div>
          </div>
          <div>
            <div className="text-coliseum-sand/50 uppercase text-[10px] font-bold tracking-wider mb-1">Updated</div>
            <div className="text-coliseum-sand">{new Date(bundle.updatedAt).toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mb-8 flex gap-4">
        <button
          onClick={handleValidate}
          disabled={validating}
          className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {validating ? 'Validating...' : 'Validate'}
        </button>

        <button
          onClick={handlePublish}
          disabled={publishing || bundle.status === 'PUBLISHED'}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {publishing ? 'Publishing...' : 'Publish'}
        </button>

        <button
          onClick={handleActivate}
          disabled={activating || bundle.status !== 'PUBLISHED' || bundle.isActive}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {activating ? 'Activating...' : 'Activate'}
        </button>
      </div>

      {/* Validation Results */}
      {validationResult && (
        <div className={`p-6 border-2 rounded ${
          validationResult.valid ? 'bg-green-950 border-green-700' : 'bg-red-950 border-red-700'
        }`}>
          <h2 className="text-2xl font-bold uppercase mb-4">
            {validationResult.valid ? '✓ Validation Passed' : '✗ Validation Failed'}
          </h2>

          {validationResult.errors && validationResult.errors.length > 0 && (
            <div className="space-y-2">
              {validationResult.errors.map((err: ValidationError, idx: number) => (
                <div key={idx} className={`p-3 rounded ${
                  err.severity === 'error' ? 'bg-red-900 border-2 border-red-600' : 'bg-yellow-900 border-2 border-yellow-600'
                }`}>
                  <div className="text-xs font-bold uppercase mb-1">
                    {err.severity === 'error' ? '⚠ ERROR' : '⚠ WARNING'} - {err.entityType}
                  </div>
                  <div className="font-mono text-sm text-stone-200">{err.key}</div>
                  {err.field && <div className="text-xs text-stone-400">Field: {err.field}</div>}
                  <div className="text-sm mt-1">{err.message}</div>
                </div>
              ))}
            </div>
          )}

          {validationResult.valid && (
            <div className="text-stone-300">
              Bundle contains {bundle._count.equipmentTemplates} equipment templates and {bundle._count.actionTemplates} action templates. Ready to publish.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
