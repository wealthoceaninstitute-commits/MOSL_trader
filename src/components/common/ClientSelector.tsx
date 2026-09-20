'use client'

import type { MofslClient } from '@/types'

interface Props {
  value: number | ''
  onChange: (id: number | '') => void
  clients: MofslClient[]
  placeholder?: string
  className?: string
}

export default function ClientSelector({ value, onChange, clients, placeholder = 'Select client', className = '' }: Props) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value === '' ? '' : Number(e.target.value))}
      className={`bg-navy-900 border border-navy-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-brand-500 transition ${className}`}
    >
      <option value="">{placeholder}</option>
      {clients.map(c => (
        <option key={c.id} value={c.id}>
          {c.name} ({c.client_id})
        </option>
      ))}
    </select>
  )
}
