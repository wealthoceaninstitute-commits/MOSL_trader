'use client'
import { useEffect, useState } from 'react'
import { getPositions } from '@/lib/api'
import { RefreshCw } from 'lucide-react'
import clsx from 'clsx'

export default function PositionsTab() {
  const [positions, setPositions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const load = () => {
    setLoading(true)
    getPositions()
      .then(({ data }) => setPositions(data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const totalMTM = positions.reduce((sum, p) => sum + (p.marktomarket || 0), 0)
  const totalBPL = positions.reduce((sum, p) => sum + (p.bookedprofitloss || 0), 0)

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-4 text-sm">
          <span>MTM: <span className={clsx('font-mono font-semibold', totalMTM >= 0 ? 'text-green-600' : 'text-red-500')}>
            ₹{totalMTM.toLocaleString('en-IN')}
          </span></span>
          <span>BPL: <span className={clsx('font-mono font-semibold', totalBPL >= 0 ? 'text-green-600' : 'text-red-500')}>
            ₹{totalBPL.toLocaleString('en-IN')}
          </span></span>
        </div>
        <button onClick={load} className="btn-ghost text-xs flex items-center gap-1.5">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {positions.length === 0 ? (
        <div className="text-center text-gray-400 text-sm py-10">No open positions</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-surface-border">
                {['Symbol','Exchange','Product','Buy Qty','Sell Qty','LTP','MTM','BPL'].map((h) => (
                  <th key={h} className="text-left py-2 pr-3 text-gray-400 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {positions.map((p, i) => (
                <tr key={i} className="border-b border-surface-border/40 hover:bg-surface-muted/40">
                  <td className="py-2 pr-3 font-medium">{p.symbol}</td>
                  <td className="py-2 pr-3 text-gray-500">{p.exchange}</td>
                  <td className="py-2 pr-3 text-gray-500">{p.productname}</td>
                  <td className="py-2 pr-3 text-green-600">{p.buyquantity}</td>
                  <td className="py-2 pr-3 text-red-500">{p.sellquantity}</td>
                  <td className="py-2 pr-3 font-mono">{(p.LTP / 100).toFixed(2)}</td>
                  <td className={clsx('py-2 pr-3 font-mono', p.marktomarket >= 0 ? 'text-green-600' : 'text-red-500')}>
                    {p.marktomarket?.toLocaleString('en-IN')}
                  </td>
                  <td className={clsx('py-2 font-mono', p.bookedprofitloss >= 0 ? 'text-green-600' : 'text-red-500')}>
                    {p.bookedprofitloss?.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
