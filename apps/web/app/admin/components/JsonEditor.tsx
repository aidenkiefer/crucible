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
        <label className="text-sm font-bold uppercase text-coliseum-sand/70">{label}</label>
        {insertSkeleton && (
          <button
            type="button"
            onClick={handleInsertSkeleton}
            className="btn-secondary px-3 py-1 text-xs"
          >
            Insert Skeleton
          </button>
        )}
      </div>
      <textarea
        value={textValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="input h-48 font-mono text-sm"
      />
      {error && <div className="mt-2 text-coliseum-red text-xs font-mono">{error}</div>}
      {helperText && <div className="mt-2 text-coliseum-sand/50 text-xs">{helperText}</div>}
    </div>
  )
}
