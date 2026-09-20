'use client'
import { useState } from 'react'
import { Minus, Plus, RefreshCw } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { placeOrder } from '@/lib/api'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const EXCHANGES = ['NSE', 'BSE', 'NSEFO', 'NSECD', 'MCX']
const ORDER_TYPES = ['LIMIT', 'MARKET', 'STOPLOSS', 'SL_MARKET']
const PRODUCT_TYPES = ['NORMAL', 'DELIVERY', 'VALUEPLUS', 'BTST', 'MTF']
const DURATIONS = ['DAY', 'IOC', 'GTC']

export default function OrderForm() {
  const { orderForm, setOrderForm, recentSymbols, addRecentSymbol, clients } = useStore()
  const [loading, setLoading] = useState(false)
  const [symbolInput, setSymbolInput] = useState('')
  const [symbolError, setSymbolError] = useState(false)

  const isBuy = orderForm.buyorsell === 'BUY'

  const handleSubmit = async () => {
    if (!symbolInput.trim()) {
      setSymbolError(true)
      return
    }
    setLoading(true)
    try {
      const payload = {
        ...orderForm,
        symbol: symbolInput.toUpperCase(),
        symboltoken: orderForm.symboltoken || 0,
      }
      const { data } = await placeOrder(payload)
      addRecentSymbol(symbolInput.toUpperCase())
      const copyCount = data.copy_results?.filter((r: any) => r.status === 'SUCCESS').length || 0
      toast.success(
        `Order placed! ${copyCount} client${copyCount !== 1 ? 's' : ''} copied.`
      )
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Order failed')
    } finally {
      setLoading(false)
    }
  }

  const activeClients = clients.filter((c) => c.is_live && c.copy_enabled)

  return (
    <div className="bg-white border border-dashed border-brand-500/40 rounded-xl p-4 space-y-3">
      {/* Recent symbols */}
      {recentSymbols.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pb-1 border-b border-surface-border">
          <span className="text-xs text-gray-400 self-center">Recent:</span>
          {recentSymbols.map((s) => (
            <button
              key={s}
              onClick={() => { setSymbolInput(s); setSymbolError(false) }}
              className="text-xs border border-surface-border rounded px-2 py-0.5 hover:border-brand-500 hover:text-brand-700 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* BUY / SELL + Exchange */}
      <div className="flex items-center gap-3">
        <div className="flex rounded-md overflow-hidden border border-surface-border">
          {(['BUY', 'SELL'] as const).map((side) => (
            <button
              key={side}
              onClick={() => setOrderForm({ buyorsell: side })}
              className={clsx(
                'px-4 py-1.5 text-sm font-semibold transition-colors',
                orderForm.buyorsell === side
                  ? side === 'BUY' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                  : 'text-gray-500 hover:bg-surface-muted'
              )}
            >
              {side}
            </button>
          ))}
        </div>

        {/* Exchange selector */}
        <div className="flex gap-1">
          {EXCHANGES.map((ex) => (
            <button
              key={ex}
              onClick={() => setOrderForm({ exchange: ex as any })}
              className={clsx(
                'px-2 py-1 text-xs font-medium rounded border transition-colors',
                orderForm.exchange === ex
                  ? 'bg-brand-500 text-white border-brand-500'
                  : 'border-surface-border text-gray-500 hover:border-brand-500'
              )}
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* Symbol input */}
      <div>
        <input
          className={clsx('input', symbolError && 'border-red-500 bg-red-50')}
          placeholder="Symbol (e.g. RELIANCE, NIFTY 23000 CE)"
          value={symbolInput}
          onChange={(e) => { setSymbolInput(e.target.value.toUpperCase()); setSymbolError(false) }}
        />
        {symbolError && <p className="text-xs text-red-500 mt-1">Please enter symbol</p>}
      </div>

      {/* Order type tabs */}
      <div className="flex gap-1 flex-wrap">
        {['BROKER', 'REGULAR', 'BO', 'CO', 'GTT', 'AUTOTRADER'].map((t) => (
          <span key={t} className="text-xs border border-surface-border rounded px-2 py-1 text-gray-500">
            {t}
          </span>
        ))}
      </div>

      {/* Intraday / Delivery */}
      <div className="flex gap-2 flex-wrap">
        {PRODUCT_TYPES.map((pt) => (
          <button
            key={pt}
            onClick={() => setOrderForm({ producttype: pt as any })}
            className={clsx(
              'text-xs px-3 py-1.5 rounded border font-medium transition-colors',
              orderForm.producttype === pt
                ? 'bg-brand-500 text-white border-brand-500'
                : 'border-surface-border text-gray-500 hover:border-brand-500'
            )}
          >
            {pt === 'NORMAL' ? 'INTRADAY' : pt === 'DELIVERY' ? 'DELIVERY' : pt}
          </button>
        ))}

        {/* Order type */}
        {ORDER_TYPES.map((ot) => (
          <button
            key={ot}
            onClick={() => setOrderForm({ ordertype: ot as any })}
            className={clsx(
              'text-xs px-3 py-1.5 rounded border font-medium transition-colors',
              orderForm.ordertype === ot
                ? 'bg-brand-600 text-white border-brand-600'
                : 'border-surface-border text-gray-500 hover:border-brand-600'
            )}
          >
            {ot}
          </button>
        ))}
      </div>

      {/* Qty + Price + Trigger */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Qty</label>
          <div className="flex items-center border border-surface-border rounded-md overflow-hidden">
            <button
              onClick={() => setOrderForm({ quantityinlot: Math.max(1, (orderForm.quantityinlot || 1) - 1) })}
              className="px-2 py-2 hover:bg-surface-muted"
            >
              <Minus size={14} />
            </button>
            <input
              type="number"
              min={1}
              className="flex-1 text-center text-sm py-2 focus:outline-none"
              value={orderForm.quantityinlot || 1}
              onChange={(e) => setOrderForm({ quantityinlot: parseInt(e.target.value) || 1 })}
            />
            <button
              onClick={() => setOrderForm({ quantityinlot: (orderForm.quantityinlot || 1) + 1 })}
              className="px-2 py-2 hover:bg-surface-muted"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-400 mb-1 block">Price (₹)</label>
          <div className="flex items-center border border-surface-border rounded-md overflow-hidden">
            <span className="px-2 text-gray-400 text-sm">₹</span>
            <input
              type="number"
              step="0.05"
              className="flex-1 text-sm py-2 focus:outline-none"
              value={orderForm.price || 0}
              onChange={(e) => setOrderForm({ price: parseFloat(e.target.value) || 0 })}
            />
            <button className="px-2 text-brand-500"><RefreshCw size={13} /></button>
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-400 mb-1 block">Trig. Price</label>
          <div className="flex items-center border border-surface-border rounded-md overflow-hidden">
            <span className="px-2 text-gray-400 text-sm">₹</span>
            <input
              type="number"
              step="0.05"
              className="flex-1 text-sm py-2 focus:outline-none"
              disabled={orderForm.ordertype !== 'STOPLOSS'}
              value={orderForm.triggerprice || 0}
              onChange={(e) => setOrderForm({ triggerprice: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </div>
      </div>

      {/* Copy to clients toggle */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            id="copy_clients"
            checked={orderForm.copy_to_clients !== false}
            onChange={(e) => setOrderForm({ copy_to_clients: e.target.checked })}
            className="accent-brand-500"
          />
          <label htmlFor="copy_clients">
            Copy to {activeClients.length} client{activeClients.length !== 1 ? 's' : ''}
          </label>
        </div>
        <span className="text-xs text-gray-400">Units: {orderForm.quantityinlot || 1}</span>
      </div>

      {/* Submit */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className={clsx('flex-1 py-2.5 rounded-md text-sm font-bold transition-colors', isBuy
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : 'bg-red-600 hover:bg-red-700 text-white'
          )}
        >
          {loading ? 'Placing...' : `${isBuy ? 'BUY' : 'SELL'}`}
        </button>
        <button
          onClick={() => {
            setSymbolInput('')
            setOrderForm({
              price: 0, triggerprice: 0, quantityinlot: 1,
              ordertype: 'LIMIT', producttype: 'NORMAL',
            })
          }}
          className="btn-ghost"
        >
          Reset
        </button>
      </div>
    </div>
  )
}
