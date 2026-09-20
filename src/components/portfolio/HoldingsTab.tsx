'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import type { Holding } from '@/types'
import clsx from 'clsx'

export default function HoldingsTab() {
  const [rows, setRows] = useState<Holding[]>([])
  const [loading, setLoading] = useState(false)

  const fetchHoldings = async () => {
    setLoading(true)
    try {
      const res = await api.get('/portfolio/holdings')
      setRows(res.data?.holdings || res.data || [])
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchHoldings().catch(() => {}) }, [])

  return (
    <div className="bg-navy-800 border border-navy-700 rounded-xl p-4">
      <div className="mb-4">
        <button
          onClick={fetchHoldings}
          disabled={loading}
          className="bg-brand-500 hover:bg-brand-700 text-white text-sm px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2"
        >
          {loading && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          Refresh Holdings
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-slate-300">
          <thead>
            <tr className="border-b border-navy-700 text-slate-400">
              <th className="py-2 px-2 text-left">Name</th>
              <th className="py-2 px-2 text-left">Symbol</th>
              <th className="py-2 px-2 text-right">Qty</th>
              <th className="py-2 px-2 text-right">Avg Price</th>
              <th className="py-2 px-2 text-right">LTP</th>
              <th className="py-2 px-2 text-right">Curr. Value</th>
              <th className="py-2 px-2 text-right">P&amp;L</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-slate-500">No holdings available</td></tr>
            ) : rows.map((r, idx) => {
              const pnl = parseFloat(String(r.pnl ?? 0))
              return (
                <tr key={idx} className="border-b border-navy-700/50 hover:bg-navy-700/30">
                  <td className="py-1.5 px-2">{r.name ?? 'N/A'}</td>
                  <td className="py-1.5 px-2 font-medium text-white">{r.symbol ?? 'N/A'}</td>
                  <td className="py-1.5 px-2 text-right">{r.quantity ?? 'N/A'}</td>
                  <td className="py-1.5 px-2 text-right">{r.buy_avg ?? 'N/A'}</td>
                  <td className="py-1.5 px-2 text-right">{r.ltp ?? 'N/A'}</td>
                  <td className="py-1.5 px-2 text-right">{r.current_value ?? 'N/A'}</td>
                  <td className={clsx('py-1.5 px-2 text-right font-bold', pnl < 0 ? 'text-red-400' : 'text-green-400')}>
                    {pnl.toFixed(2)}
                    {r.pnl_pct !== undefined && (
                      <span className="ml-1 text-slate-500">({Number(r.pnl_pct).toFixed(2)}%)</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
