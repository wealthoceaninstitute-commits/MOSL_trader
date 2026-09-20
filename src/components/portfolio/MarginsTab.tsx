'use client'
import { useEffect, useState } from 'react'
import { getMarginDetail } from '@/lib/api'

export default function MarginsTab() {
  const [rows, setRows] = useState<any[]>([])

  useEffect(() => {
    getMarginDetail()
      .then(({ data }) => setRows(data?.data || []))
      .catch(() => {})
  }, [])

  return (
    <div className="p-4 overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-surface-border">
            <th className="text-left py-2 text-gray-400 font-medium">Particulars</th>
            <th className="text-right py-2 text-gray-400 font-medium">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.srno} className="border-b border-surface-border/40">
              <td className="py-1.5 text-gray-600">{r.particulars}</td>
              <td className={`py-1.5 text-right font-mono ${r.amount < 0 ? 'text-red-500' : ''}`}>
                {r.amount?.toLocaleString('en-IN')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
