'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import type { SummaryRow } from '@/types'
import clsx from 'clsx'

export default function SummaryTab() {
  const [rows, setRows] = useState<SummaryRow[]>([])
  const [loading, setLoading] = useState(false)

  const fetchSummary = async () => {
    setLoading(true)
    try {
      const res = await api.get('/portfolio/summary')
      setRows(res.data?.summary || res.data || [])
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSummary().catch(() => {}) }, [])

  const totalNetGain = rows.reduce((sum, r) => sum + (Number(r.net_gain) || 0), 0)

  return (
    <div className="bg-navy-800 border border-navy-700 rounded-xl p-4">
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={fetchSummary}
          disabled={loading}
          className="bg-brand-500 hover:bg-brand-700 text-white text-sm px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2"
        >
          {loading && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          Refresh Summary
        </button>
        {rows.length > 0 && (
          <div className="ml-auto text-sm">
            <span className="text-slate-400">Total Net Gain: </span>
            <span className={clsx('font-bold', totalNetGain < 0 ? 'text-red-400' : 'text-green-400')}>
              {totalNetGain.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-slate-300">
          <thead>
            <tr className="border-b border-navy-700 text-slate-400">
              <th className="py-2 px-2 text-left">Name</th>
              <th className="py-2 px-2 text-right">Capital</th>
              <th className="py-2 px-2 text-right">Invested</th>
              <th className="py-2 px-2 text-right">P&amp;L</th>
              <th className="py-2 px-2 text-right">Curr. Value</th>
              <th className="py-2 px-2 text-right">Avail. Margin</th>
              <th className="py-2 px-2 text-right">Net Gain</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-slate-500">No summary data available</td></tr>
            ) : rows.map((r, idx) => {
              const netGain = Number(r.net_gain) || 0
              return (
                <tr key={idx} className="border-b border-navy-700/50 hover:bg-navy-700/30">
                  <td className="py-2 px-2 font-medium text-white">{r.name}</td>
                  <td className="py-2 px-2 text-right">{Number(r.capital || 0).toFixed(2)}</td>
                  <td className="py-2 px-2 text-right">{Number(r.invested || 0).toFixed(2)}</td>
                  <td className="py-2 px-2 text-right">{Number(r.pnl || 0).toFixed(2)}</td>
                  <td className="py-2 px-2 text-right">{Number(r.current_value || 0).toFixed(2)}</td>
                  <td className="py-2 px-2 text-right">{Number(r.available_margin || 0).toFixed(2)}</td>
                  <td className={clsx('py-2 px-2 text-right font-bold', netGain < 0 ? 'text-red-400' : 'text-green-400')}>
                    {netGain.toFixed(2)}
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
