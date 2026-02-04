'use client'

import { useState } from 'react'

interface JsonEditorProps {
  label: string
  value: any
  onChange: (value: any) => void
  placeholder?: string
  helperText?: string
  insertSkeleton?: () => any
}

export default function JsonEditor({
  label,
  value,
  onChange,
  placeholder,
  helperText,
  insertSkeleton,
}: JsonEditorProps) {
  const [textValue, setTextValue] = useState(JSON.stringify(value, null, 2))
  const [error, setError] = useState('')

  function handleChange(newText: string) {
    setTextValue(newText)
    try {
      const parsed = JSON.parse(newText)
      setError('')
      onChange(parsed)
    } catch (err: any) {
      setError(err.message)
    }
  }

  function handleInsertSkeleton() {
    if (insertSkeleton) {
      const skeleton = insertSkeleton()
      const formatted = JSON.stringify(skeleton, null, 2)
      setTextValue(formatted)
      onChange(skeleton)
      setError('')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-bold uppercase text-stone-300">{label}</label>
        {insertSkeleton && (
          <button
            type="button"
            onClick={handleInsertSkeleton}
            className="text-xs px-3 py-1 bg-stone-700 text-stone-200 hover:bg-stone-600 transition"
          >
            Insert Skeleton
          </button>
        )}
      </div>
      <textarea
        value={textValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-48 px-4 py-2 bg-stone-900 border-2 border-stone-600 text-stone-100 font-mono text-sm focus:border-amber-600 focus:outline-none"
      />
      {error && <div className="mt-2 text-red-400 text-xs font-mono">{error}</div>}
      {helperText && <div className="mt-2 text-stone-400 text-xs">{helperText}</div>}
    </div>
  )
}
