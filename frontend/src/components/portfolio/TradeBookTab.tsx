'use client'
import { useEffect, useState } from 'react'
import { getTradeBook } from '@/lib/api'
import clsx from 'clsx'

export default function TradeBookTab() {
  const [trades, setTrades] = useState<any[]>([])

  useEffect(() => {
    getTradeBook()
      .then(({ data }) => setTrades(data?.data || []))
      .catch(() => {})
  }, [])

  return (
    <div className="p-4 overflow-x-auto">
      {trades.length === 0 ? (
        <div className="text-center text-gray-400 text-sm py-10">No trades today</div>
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-surface-border">
              {['Symbol','Exchange','Product','Side','Qty','Price','Value','Time'].map((h) => (
                <th key={h} className="text-left py-2 pr-3 text-gray-400 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {trades.map((t, i) => (
              <tr key={i} className="border-b border-surface-border/40 hover:bg-surface-muted/40">
                <td className="py-2 pr-3 font-medium">{t.symbol}</td>
                <td className="py-2 pr-3 text-gray-500">{t.exchange}</td>
                <td className="py-2 pr-3 text-gray-500">{t.producttype}</td>
                <td className={clsx('py-2 pr-3 font-semibold', t.buyorsell === 'BUY' ? 'text-green-600' : 'text-red-500')}>
                  {t.buyorsell}
                </td>
                <td className="py-2 pr-3">{t.tradeqty}</td>
                <td className="py-2 pr-3 font-mono">{(t.tradeprice / 100).toFixed(2)}</td>
                <td className="py-2 pr-3 font-mono">{(t.tradevalue / 100).toLocaleString('en-IN')}</td>
                <td className="py-2 text-gray-400">{t.tradetime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
