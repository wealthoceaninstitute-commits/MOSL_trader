'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import api from '@/lib/api'
import type { Order } from '@/types'
import clsx from 'clsx'

const AUTO_REFRESH_MS = 3000

const DISPLAY_TO_CANON: Record<string, string> = {
  NO_CHANGE: 'NO_CHANGE',
  LIMIT: 'LIMIT',
  MARKET: 'MARKET',
  STOPLOSS: 'STOPLOSS',
  SL_MARKET: 'STOPLOSS_MARKET',
}

const MONTH_MAP: Record<string, string> = {
  JAN:'JAN',FEB:'FEB',MAR:'MAR',APR:'APR',MAY:'MAY',JUN:'JUN',
  JUL:'JUL',AUG:'AUG',SEP:'SEP',SEPT:'SEP',OCT:'OCT',NOV:'NOV',DEC:'DEC'
}

const sanitize = (s: string) => String(s || '')
  .toUpperCase()
  .replace(/[   -​  　]/g, ' ')
  .replace(/[–—−]/g, '-')
  .replace(/\s+/g, ' ')
  .trim()

const isMonthHead = (t: string) => /^(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|SEPT|OCT|NOV|DEC)/.test(t)
const isYear = (t: string) => /^\d{4}$/.test(t)
const isDay = (t: string) => /^\d{1,2}$/.test(t)
const isTailFlag = (t: string) => /^(FUT|OPT|CE|PE)$/.test(t)

function parseSymbol(raw: string) {
  const u = sanitize(raw)
  const tokens = u.split(/[\s\-_/]+/).filter(Boolean)
  const undParts: string[] = []
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]
    if (isTailFlag(t) || isYear(t) || isMonthHead(t)) {
      if (undParts.length && isDay(undParts[undParts.length - 1])) undParts.pop()
      break
    }
    undParts.push(t)
  }
  const und = undParts.join('').replace(/[^A-Z0-9]/g, '')
  let mon = null, year = null
  let m = u.match(/\b(\d{1,2})[-\s]*(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|SEPT|OCT|NOV|DEC)[A-Z]*[-\s]*((?:19|20)\d{2})\b/)
  if (m) { mon = MONTH_MAP[m[2]]; year = m[3] }
  if (!mon) {
    m = u.match(/\b(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|SEPT|OCT|NOV|DEC)[A-Z]*[-\s]*((?:19|20)\d{2})\b/)
    if (m) { mon = MONTH_MAP[m[1]]; year = m[2] }
  }
  return { und, mon, year }
}

function canonicalKey(raw: string) {
  const { und, mon, year } = parseSymbol(raw)
  return (und && mon && year) ? `${und}-${mon}${year}` : sanitize(raw).replace(/[^A-Z0-9]/g, '')
}

type OrderBuckets = { pending: Order[]; traded: Order[]; rejected: Order[]; cancelled: Order[]; others: Order[] }
type TabKey = keyof OrderBuckets
const TABS: { key: TabKey; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'traded', label: 'Traded' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'others', label: 'Others' },
]

const inputCls = 'bg-navy-900 border border-navy-700 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-brand-500'

export default function OrdersTab() {
  const [orders, setOrders] = useState<OrderBuckets>({ pending: [], traded: [], rejected: [], cancelled: [], others: [] })
  const [activeTab, setActiveTab] = useState<TabKey>('pending')
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({})
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [query, setQuery] = useState('')

  // Modify modal
  const [showModify, setShowModify] = useState(false)
  const [modifyTarget, setModifyTarget] = useState<{ symbol: string; key: string; orders: Order[] } | null>(null)
  const [modQty, setModQty] = useState('')
  const [modPrice, setModPrice] = useState('')
  const [modTrig, setModTrig] = useState('')
  const [modType, setModType] = useState('NO_CHANGE')
  const [modLTP, setModLTP] = useState('—')
  const [modSaving, setModSaving] = useState(false)

  const busyRef = useRef(false)
  const snapRef = useRef('')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const qTokens = useMemo(() => query.trim().split(/\s+/).filter(Boolean), [query])

  const fetchAll = async () => {
    if (busyRef.current) return
    if (typeof document !== 'undefined' && document.hidden) return
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller
    try {
      const res = await api.get('/orders', { signal: controller.signal })
      const next: OrderBuckets = {
        pending: res.data?.pending || [],
        traded: res.data?.traded || [],
        rejected: res.data?.rejected || [],
        cancelled: res.data?.cancelled || [],
        others: res.data?.others || [],
      }
      const snap = JSON.stringify(next)
      if (snap !== snapRef.current) {
        snapRef.current = snap
        setOrders(next)
        setLastUpdated(new Date())
      }
    } catch (e) {
      const err = e as { name?: string; code?: string }
      if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
        console.warn('orders refresh failed', err)
      }
    } finally {
      abortRef.current = null
    }
  }

  useEffect(() => {
    fetchAll().catch(() => {})
    if (autoRefresh) {
      timerRef.current = setInterval(() => { fetchAll().catch(() => {}) }, AUTO_REFRESH_MS)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (abortRef.current) abortRef.current.abort()
    }
  }, [autoRefresh])

  const rowKey = (row: Order) => String(row.order_id ?? `${row.name ?? ''}|${row.symbol ?? ''}|${row.status ?? ''}`)
  const toggle = (rowId: string) => setSelectedIds(prev => ({ ...prev, [rowId]: !prev[rowId] }))

  const getSelectedPending = () => orders.pending.filter(row => selectedIds[rowKey(row)])

  const cancelSelected = async () => {
    const selectedOrders = getSelectedPending().map(o => ({
      name: o.name ?? '',
      symbol: o.symbol ?? '',
      order_id: o.order_id ?? '',
      ...(o.client_id ? { client_id: o.client_id } : {}),
      ...(o.broker ? { broker: o.broker } : {}),
    }))
    if (selectedOrders.length === 0) { alert('No orders selected.'); return }
    try {
      busyRef.current = true
      const res = await api.post('/orders/cancel', { orders: selectedOrders })
      alert(Array.isArray(res.data?.message) ? res.data.message.join('\n') : 'Cancel request sent')
      setSelectedIds({})
      await fetchAll()
    } catch (e) {
      const err = e as { response?: { data?: unknown }; message?: string }
      alert('Cancel failed: ' + (err.response?.data || err.message))
    } finally {
      busyRef.current = false
    }
  }

  const requires = (displayType: string) => {
    const canon = DISPLAY_TO_CANON[displayType] || displayType
    return { price: ['LIMIT', 'STOPLOSS'].includes(canon), trig: ['STOPLOSS', 'STOPLOSS_MARKET'].includes(canon), canon }
  }

  const tryFetchLTP = async (symbol: string) => {
    try {
      const r = await api.get('/market/ltp', { params: { symbol } })
      const v = Number(r?.data?.ltp)
      if (!Number.isNaN(v)) setModLTP(v.toFixed(2))
    } catch { /* ignore */ }
  }

  const openModify = () => {
    const chosen = getSelectedPending()
    if (chosen.length === 0) { alert('Select at least one order in Pending to modify.'); return }
    const key0 = canonicalKey(chosen[0].symbol ?? '')
    const allSame = chosen.every(c => canonicalKey(c.symbol ?? '') === key0)
    if (!allSame) {
      alert('Please select orders with the SAME Symbol to batch modify.')
      return
    }
    const single = chosen.length === 1
    setModifyTarget({ symbol: chosen[0].symbol ?? '', key: key0, orders: chosen })
    setModPrice(single ? (Number.isFinite(parseFloat(String(chosen[0].price))) ? String(parseFloat(String(chosen[0].price))) : '') : '')
    setModTrig('')
    setModQty('')
    setModType('NO_CHANGE')
    setModLTP('—')
    setShowModify(true)
    if (chosen[0].symbol) tryFetchLTP(chosen[0].symbol)
  }

  const submitModify = async () => {
    if (!modifyTarget) return
    const need = requires(modType)
    let qtyNum: number | undefined, priceNum: number | undefined, trigNum: number | undefined

    if (modQty !== '') {
      qtyNum = parseInt(modQty, 10)
      if (Number.isNaN(qtyNum) || qtyNum <= 0) { alert('Quantity must be a positive integer.'); return }
    }
    if (modPrice !== '') {
      priceNum = parseFloat(modPrice)
      if (Number.isNaN(priceNum) || priceNum <= 0) { alert('Price must be a positive number.'); return }
    }
    if (modTrig !== '') {
      trigNum = parseFloat(modTrig)
      if (Number.isNaN(trigNum) || trigNum <= 0) { alert('Trigger price must be a positive number.'); return }
    }
    if (modType !== 'NO_CHANGE') {
      if (need.price && !(modPrice !== '' && priceNum && priceNum > 0)) { alert('Selected Order Type requires Price.'); return }
      if (need.trig && !(modTrig !== '' && trigNum && trigNum > 0)) { alert('Selected Order Type requires Trigger Price.'); return }
    }
    if (modType === 'NO_CHANGE' && modQty === '' && modPrice === '' && modTrig === '') {
      alert('Nothing to update.'); return
    }

    setModSaving(true)
    busyRef.current = true
    try {
      const requests = modifyTarget.orders.map(o => {
        const payload: Record<string, unknown> = {
          name: o.name,
          symbol: o.symbol,
          order_id: o.order_id,
          ...(o.client_id ? { client_id: o.client_id } : {}),
          ...(o.broker ? { broker: o.broker } : {}),
        }
        if (modType !== 'NO_CHANGE') payload.ordertype = need.canon
        if (modQty !== '') payload.quantity = qtyNum
        if (modPrice !== '') payload.price = priceNum
        if (modTrig !== '') payload.triggerprice = trigNum
        return api.post('/orders/modify', { order: payload })
      })
      const results = await Promise.allSettled(requests)
      const ok = results.filter(r => r.status === 'fulfilled').length
      const fail = results.length - ok
      let msg = `Modified ${ok} of ${results.length} order(s)`
      if (fail > 0) msg += `\nFailed: ${fail}`
      alert(msg)
      setShowModify(false)
      setSelectedIds({})
      await fetchAll()
    } catch (e) {
      const err = e as { response?: { data?: unknown }; message?: string }
      alert('Modify failed: ' + (err.response?.data || err.message))
    } finally {
      setModSaving(false)
      busyRef.current = false
    }
  }

  const filterBySymbol = (rows: Order[]) => {
    if (qTokens.length === 0) return rows
    return rows.filter(r => {
      const sym = String(r.symbol || '').toUpperCase()
      return qTokens.every(t => sym.includes(t.toUpperCase()))
    })
  }

  const filtered = useMemo(() => ({
    pending: filterBySymbol(orders.pending),
    traded: filterBySymbol(orders.traded),
    rejected: filterBySymbol(orders.rejected),
    cancelled: filterBySymbol(orders.cancelled),
    others: filterBySymbol(orders.others),
  }), [orders, qTokens])

  const counts = {
    pending: orders.pending.length,
    traded: orders.traded.length,
    rejected: orders.rejected.length,
    cancelled: orders.cancelled.length,
    others: orders.others.length,
  }

  const selectedCount = Object.values(selectedIds).filter(Boolean).length

  const renderTable = (rows: Order[]) => (
    <div className="overflow-x-auto">
      <table className="w-full text-xs text-slate-300">
        <thead>
          <tr className="border-b border-navy-700 text-slate-400">
            <th className="py-2 px-2 text-left w-8"></th>
            <th className="py-2 px-2 text-left">Name</th>
            <th className="py-2 px-2 text-left">Symbol</th>
            <th className="py-2 px-2 text-left">Type</th>
            <th className="py-2 px-2 text-right">Qty</th>
            <th className="py-2 px-2 text-right">Price</th>
            <th className="py-2 px-2 text-left">Status</th>
            <th className="py-2 px-2 text-left">Order ID</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={8} className="text-center py-8 text-slate-500">No data</td></tr>
          ) : rows.map(row => {
            const idKey = rowKey(row)
            return (
              <tr key={idKey} className="border-b border-navy-700/50 hover:bg-navy-700/30 transition-colors">
                <td className="py-1.5 px-2">
                  <input type="checkbox" className="accent-brand-500" checked={!!selectedIds[idKey]} onChange={() => toggle(idKey)} />
                </td>
                <td className="py-1.5 px-2">{row.name ?? 'N/A'}</td>
                <td className="py-1.5 px-2 font-medium text-white">{row.symbol ?? 'N/A'}</td>
                <td className="py-1.5 px-2">
                  <span className={clsx('px-1.5 py-0.5 rounded text-xs font-medium',
                    row.transaction_type === 'BUY' ? 'bg-green-900/60 text-green-400' : 'bg-red-900/60 text-red-400'
                  )}>{row.transaction_type ?? 'N/A'}</span>
                </td>
                <td className="py-1.5 px-2 text-right">{row.quantity ?? 'N/A'}</td>
                <td className="py-1.5 px-2 text-right">{row.price ?? 'N/A'}</td>
                <td className="py-1.5 px-2 text-slate-400">{row.status ?? 'N/A'}</td>
                <td className="py-1.5 px-2 text-slate-500 font-mono text-xs">{row.order_id ?? 'N/A'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="bg-navy-800 border border-navy-700 rounded-xl p-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <button onClick={() => fetchAll()} className="bg-brand-500 hover:bg-brand-700 text-white text-sm px-3 py-1.5 rounded-lg transition-colors">Refresh</button>
        <button onClick={openModify} className="bg-yellow-600 hover:bg-yellow-700 text-white text-sm px-3 py-1.5 rounded-lg transition-colors">Modify</button>
        <button onClick={cancelSelected} className="bg-red-700 hover:bg-red-800 text-white text-sm px-3 py-1.5 rounded-lg transition-colors">Cancel</button>
        <span className="text-xs text-slate-400 bg-navy-700 px-2 py-1 rounded-lg">{selectedCount} selected</span>

        <button
          onClick={() => setAutoRefresh(p => !p)}
          className={clsx('text-xs px-2 py-1 rounded-lg border transition-colors', autoRefresh ? 'border-green-700 text-green-400 bg-green-900/30' : 'border-navy-600 text-slate-400')}
        >
          Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
        </button>

        <div className="ml-auto flex items-center gap-2">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Escape') setQuery('') }}
            placeholder="Search symbol..."
            className={inputCls + ' w-48'}
          />
          {lastUpdated && <span className="text-xs text-slate-500">Updated {lastUpdated.toLocaleTimeString()}</span>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5',
              activeTab === t.key
                ? 'bg-brand-500 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-navy-700'
            )}
          >
            {t.label}
            {counts[t.key] > 0 && (
              <span className={clsx('text-xs rounded-full px-1.5 py-0.5', activeTab === t.key ? 'bg-white/20' : 'bg-navy-600')}>
                {counts[t.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {renderTable(filtered[activeTab])}

      {/* Modify Modal */}
      {showModify && modifyTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-navy-800 border border-navy-700 rounded-xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-navy-700">
              <h3 className="text-white font-semibold">
                {modifyTarget.orders.length > 1 ? `Modify ${modifyTarget.orders.length} Orders` : 'Modify Order'}
              </h3>
              <button onClick={() => setShowModify(false)} className="text-slate-400 hover:text-white text-xl">×</button>
            </div>
            <div className="p-4 space-y-3">
              <div className="text-sm text-slate-400">
                Symbol: <span className="text-white font-medium">{modifyTarget.symbol}</span>
                {modifyTarget.orders.length === 1 && <> · Order ID: <span className="font-mono text-xs">{modifyTarget.orders[0].order_id}</span></>}
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase">LTP</div>
                <div className="text-xl font-bold text-white">{modLTP}</div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Qty</label>
                  <input type="number" min="1" value={modQty} onChange={e => setModQty(e.target.value)} placeholder="keep" className={inputCls + ' w-full'} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">
                    Price {requires(modType).price && <span className="text-red-400">*</span>}
                  </label>
                  <input type="number" min="0" step="0.05" value={modPrice} onChange={e => setModPrice(e.target.value)} placeholder="keep" className={inputCls + ' w-full'} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">
                    Trig {requires(modType).trig && <span className="text-red-400">*</span>}
                  </label>
                  <input type="number" min="0" step="0.05" value={modTrig} onChange={e => setModTrig(e.target.value)} placeholder="keep" className={inputCls + ' w-full'} />
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1">Order Type</div>
                <div className="flex flex-wrap gap-2">
                  {['NO_CHANGE', 'LIMIT', 'MARKET', 'STOPLOSS', 'SL_MARKET'].map(ot => (
                    <label key={ot} className="flex items-center gap-1 cursor-pointer">
                      <input type="radio" name="modType" className="accent-brand-500" checked={modType === ot} onChange={() => setModType(ot)} />
                      <span className="text-xs text-slate-300">{ot}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end p-4 border-t border-navy-700">
              <button onClick={() => setShowModify(false)} disabled={modSaving} className="px-4 py-2 text-sm text-slate-300 bg-navy-700 hover:bg-navy-600 rounded-lg transition-colors">Cancel</button>
              <button onClick={submitModify} disabled={modSaving} className="px-4 py-2 text-sm text-white bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors flex items-center gap-2">
                {modSaving && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Modify
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
