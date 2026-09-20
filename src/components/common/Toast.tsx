'use client'

import { useEffect, useState } from 'react'
import clsx from 'clsx'

export interface ToastMessage {
  id: string
  variant: 'success' | 'error' | 'warning' | 'info'
  text: string
}

let _addToast: ((msg: Omit<ToastMessage, 'id'>) => void) | null = null

export function showToast(msg: Omit<ToastMessage, 'id'>) {
  if (_addToast) _addToast(msg)
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  useEffect(() => {
    _addToast = (msg) => {
      const id = Math.random().toString(36).slice(2)
      setToasts(prev => [...prev, { ...msg, id }])
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, 4000)
    }
    return () => { _addToast = null }
  }, [])

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map(t => (
        <div
          key={t.id}
          className={clsx(
            'px-4 py-3 rounded-lg shadow-lg text-sm font-medium border flex items-start gap-2 animate-in slide-in-from-right',
            t.variant === 'success' && 'bg-green-900/90 border-green-700 text-green-100',
            t.variant === 'error' && 'bg-red-900/90 border-red-700 text-red-100',
            t.variant === 'warning' && 'bg-yellow-900/90 border-yellow-700 text-yellow-100',
            t.variant === 'info' && 'bg-blue-900/90 border-blue-700 text-blue-100',
          )}
        >
          <span className="flex-1">{t.text}</span>
          <button
            onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
            className="opacity-60 hover:opacity-100 ml-1 text-lg leading-none"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
