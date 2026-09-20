'use client'
import { useEffect, useState } from 'react'
import { getMarginSummary } from '@/lib/api'
import { useStore } from '@/store/useStore'

interface MarginRow { srno: number; particulars: string; amount: number }

export default function SummaryTab() {
  const { masterLoggedIn } = useStore()
  const [rows, setRows] = useState<MarginRow[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!masterLoggedIn) return
    setLoading(true)
    getMarginSummary()
      .then(({ data }) => setRows(data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [masterLoggedIn])

  if (!masterLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center px-6">
        <div className="text-4xl">📊</div>
        <h3 className="text-lg font-semibold text-gray-700">Connect master account</h3>
        <p className="text-sm text-gray-400 max-w-sm">
          Login the master MOFSL account to see portfolio, orders, and copy trading stats.
        </p>
      </div>
    )
  }

  if (loading) return <div className="py-8 text-center text-sm text-gray-400">Loading margins…</div>

  // Pull key figures
  const get = (srno: number) => rows.find((r) => r.srno === srno)?.amount ?? 0
  const available = get(102)
  const usedFO    = get(321)
  const usedCash  = get(301)
  const mtm       = get(600)
  const bpl       = get(700)

  const fmt = (v: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v)

  const stats = [
    { label: 'Available (Cash)', value: fmt(available), color: 'text-green-600' },
    { label: 'FO Margin Used',   value: fmt(usedFO),    color: 'text-orange-500' },
    { label: 'Cash Used',        value: fmt(usedCash),  color: 'text-red-500' },
    { label: 'MTM P&L',         value: fmt(mtm),       color: mtm >= 0 ? 'text-green-600' : 'text-red-600' },
    { label: 'Booked P&L',       value: fmt(bpl),       color: bpl >= 0 ? 'text-green-600' : 'text-red-600' },
  ]

  return (
    <div className="p-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="card text-center">
            <div className={`text-lg font-bold font-mono ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border">
              <th className="text-left py-2 text-xs text-gray-400 font-medium">Particulars</th>
              <th className="text-right py-2 text-xs text-gray-400 font-medium">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.srno} className="border-b border-surface-border/50 hover:bg-surface-muted/50">
                <td className="py-1.5 text-gray-600">{r.particulars}</td>
                <td className={`py-1.5 text-right font-mono ${r.amount < 0 ? 'text-red-500' : 'text-gray-800'}`}>
                  {r.amount.toLocaleString('en-IN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
