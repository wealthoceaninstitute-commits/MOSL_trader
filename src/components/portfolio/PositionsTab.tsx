'use client'

import { useEffect, useRef, useState } from 'react'
import api from '@/lib/api'
import type { Position } from '@/types'
import clsx from 'clsx'

const AUTO_REFRESH_MS = 3000

type PosBuckets = { open: Position[]; closed: Position[] }

export default function PositionsTab() {
  const [positions, setPositions] = useState<PosBuckets>({ open: [], closed: [] })
  const [activeTab, setActiveTab] = useState<'open' | 'closed'>('open')
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const busyRef = useRef(false)
  const snapRef = useRef('')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const fetchAll = async () => {
    if (busyRef.current) return
    if (typeof document !== 'undefined' && document.hidden) return
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller
    try {
      const res = await api.get('/portfolio/positions', { signal: controller.signal })
      const next = { open: res.data?.open || [], closed: res.data?.closed || [] }
      const snap = JSON.stringify(next)
      if (snap !== snapRef.current) {
        snapRef.current = snap
        setPositions(next)
        setLastUpdated(new Date())
      }
    } catch (e) {
      const err = e as { name?: string; code?: string }
      if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
        console.warn('positions refresh failed')
      }
    } finally {
      abortRef.current = null
    }
  }

  useEffect(() => {
    fetchAll().catch(() => {})
    timerRef.current = setInterval(() => { fetchAll().catch(() => {}) }, AUTO_REFRESH_MS)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (abortRef.current) abortRef.current.abort()
    }
  }, [])

  const rowKey = (row: Position, idx: number) => `${row.name}-${row.symbol}-${row.net_profit ?? idx}`
  const toggle = (id: string) => setSelected(prev => ({ ...prev, [id]: !prev[id] }))

  const closeSelected = async () => {
    const toClose: { name: string; symbol: string; quantity: number; transaction_type: string }[] = []
    positions.open.forEach((row, idx) => {
      const id = rowKey(row, idx)
      if (selected[id]) {
        const qty = parseInt(String(row.quantity), 10)
        toClose.push({
          name: String(row.name ?? ''),
          symbol: String(row.symbol ?? ''),
          quantity: Math.abs(qty || 0),
          transaction_type: (qty || 0) > 0 ? 'SELL' : 'BUY',
        })
      }
    })
    if (toClose.length === 0) { alert('No positions selected.'); return }
    try {
      busyRef.current = true
      const res = await api.post('/portfolio/close-position', { positions: toClose })
      alert(Array.isArray(res.data?.message) ? res.data.message.join('\n') : 'Close request sent')
      setSelected({})
      await fetchAll()
    } catch (e) {
      const err = e as { response?: { data?: unknown }; message?: string }
      alert('Close failed: ' + (err.response?.data || err.message))
    } finally {
      busyRef.current = false
    }
  }

  const rows = positions[activeTab]

  return (
    <div className="bg-navy-800 border border-navy-700 rounded-xl p-4">
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <button onClick={() => fetchAll()} className="bg-brand-500 hover:bg-brand-700 text-white text-sm px-3 py-1.5 rounded-lg transition-colors">Refresh</button>
        <button onClick={closeSelected} className="bg-red-700 hover:bg-red-800 text-white text-sm px-3 py-1.5 rounded-lg transition-colors">Close Position</button>
        {lastUpdated && <span className="text-xs text-slate-500 ml-auto">Auto-refresh 3s · {lastUpdated.toLocaleTimeString()}</span>}
      </div>

      <div className="flex gap-1 mb-4">
        {(['open', 'closed'] as const).map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={clsx('px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors',
              activeTab === t ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-navy-700'
            )}
          >
            {t} ({positions[t].length})
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-slate-300">
          <thead>
            <tr className="border-b border-navy-700 text-slate-400">
              <th className="py-2 px-2 text-left w-8"></th>
              <th className="py-2 px-2 text-left">Name</th>
              <th className="py-2 px-2 text-left">Symbol</th>
              <th className="py-2 px-2 text-right">Qty</th>
              <th className="py-2 px-2 text-right">Buy Avg</th>
              <th className="py-2 px-2 text-right">Sell Avg</th>
              <th className="py-2 px-2 text-right">Net P&amp;L</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-slate-500">No data</td></tr>
            ) : rows.map((row, idx) => {
              const id = rowKey(row, idx)
              const pnl = parseFloat(String(row.net_profit ?? 0))
              return (
                <tr key={id} className="border-b border-navy-700/50 hover:bg-navy-700/30">
                  <td className="py-1.5 px-2">
                    <input type="checkbox" className="accent-brand-500" checked={!!selected[id]} onChange={() => toggle(id)} />
                  </td>
                  <td className="py-1.5 px-2">{row.name ?? 'N/A'}</td>
                  <td className="py-1.5 px-2 font-medium text-white">{row.symbol ?? 'N/A'}</td>
                  <td className="py-1.5 px-2 text-right">{row.quantity ?? 'N/A'}</td>
                  <td className="py-1.5 px-2 text-right">{row.buy_avg ?? 'N/A'}</td>
                  <td className="py-1.5 px-2 text-right">{row.sell_avg ?? 'N/A'}</td>
                  <td className={clsx('py-1.5 px-2 text-right font-bold', pnl < 0 ? 'text-red-400' : 'text-green-400')}>
                    {row.net_profit ?? 'N/A'}
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
