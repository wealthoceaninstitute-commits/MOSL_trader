'use client'
import { useEffect, useState } from 'react'
import { getHoldings } from '@/lib/api'

export default function HoldingsTab() {
  const [holdings, setHoldings] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    getHoldings()
      .then(({ data }) => setHoldings(data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-10 text-sm text-gray-400">Loading holdings…</div>

  return (
    <div className="p-4 overflow-x-auto">
      {holdings.length === 0 ? (
        <div className="text-center text-gray-400 text-sm py-10">No DP holdings</div>
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-surface-border">
              {['Scrip','ISIN','DP Qty','Blocked','Avg Buy','POA Qty','Collateral'].map((h) => (
                <th key={h} className="text-left py-2 pr-4 text-gray-400 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {holdings.map((h, i) => (
              <tr key={i} className="border-b border-surface-border/40 hover:bg-surface-muted/40">
                <td className="py-2 pr-4 font-medium">{h.scripname}</td>
                <td className="py-2 pr-4 text-gray-400 font-mono text-[10px]">{h.scripisinno}</td>
                <td className="py-2 pr-4">{h.dpquantity}</td>
                <td className="py-2 pr-4 text-orange-500">{h.blockedquantity}</td>
                <td className="py-2 pr-4 font-mono">₹{h.buyavgprice}</td>
                <td className="py-2 pr-4">{h.poaquantity}</td>
                <td className="py-2">{h.collateralquantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
