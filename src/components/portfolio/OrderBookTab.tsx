'use client'
import { useEffect, useState } from 'react'
import { getOrderBook, cancelOrder } from '@/lib/api'
import { RefreshCw, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const STATUS_COLOR: Record<string, string> = {
  Traded:   'text-green-600 bg-green-50',
  Confirm:  'text-blue-600 bg-blue-50',
  Cancel:   'text-gray-400 bg-gray-50',
  Error:    'text-red-600 bg-red-50',
  Rejected: 'text-red-500 bg-red-50',
  Sent:     'text-orange-500 bg-orange-50',
}

export default function OrderBookTab() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const load = () => {
    setLoading(true)
    getOrderBook()
      .then(({ data }) => setOrders(data?.data || []))
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleCancel = async (id: string) => {
    try {
      await cancelOrder(id)
      toast.success('Cancelled')
      load()
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Cancel failed')
    }
  }

  return (
    <div className="p-4">
      <div className="flex justify-end mb-3">
        <button onClick={load} className="btn-ghost flex items-center gap-1.5 text-xs">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>
      {orders.length === 0 ? (
        <div className="text-center text-gray-400 text-sm py-10">No orders today</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-surface-border">
                {['Symbol','Exchange','Type','Product','Qty','Price','Status','Action'].map((h) => (
                  <th key={h} className="text-left py-2 pr-4 text-gray-400 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.uniqueorderid} className="border-b border-surface-border/40 hover:bg-surface-muted/40">
                  <td className="py-2 pr-4 font-medium">{o.symbol}</td>
                  <td className="py-2 pr-4 text-gray-500">{o.exchange}</td>
                  <td className={clsx('py-2 pr-4 font-semibold', o.buyorsell === 'Buy' ? 'text-green-600' : 'text-red-500')}>
                    {o.buyorsell?.toUpperCase()}
                  </td>
                  <td className="py-2 pr-4 text-gray-500">{o.producttype}</td>
                  <td className="py-2 pr-4">{o.orderqty}</td>
                  <td className="py-2 pr-4 font-mono">{o.price}</td>
                  <td className="py-2 pr-4">
                    <span className={clsx('px-2 py-0.5 rounded-full text-[10px] font-medium',
                      STATUS_COLOR[o.orderstatus] || 'text-gray-600 bg-gray-50')}>
                      {o.orderstatus}
                    </span>
                  </td>
                  <td className="py-2">
                    {['Confirm', 'Sent'].includes(o.orderstatus) && (
                      <button
                        onClick={() => handleCancel(o.uniqueorderid)}
                        className="text-red-400 hover:text-red-600"
                        title="Cancel order"
                      >
                        <XCircle size={14} />
                      </button>
                    )}
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
