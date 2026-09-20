'use client'

import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import api, { placeOrder } from '@/lib/api'
import { showToast } from '@/components/common/Toast'
import clsx from 'clsx'
import type { MofslClient, ClientGroup, SymbolResult } from '@/types'

const FORM_STORAGE_KEY = 'woi-trade-form-v1'

const onlyDigits = (v: string) => (v ?? '').replace(/[^\d]/g, '')
const toIntOr = (v: string | number, fallback = 1): number => {
  const n = parseInt(String(v), 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

const ORDER_TYPES = [
  { value: 'LIMIT', label: 'LIMIT' },
  { value: 'MARKET', label: 'MARKET' },
  { value: 'STOPLOSS', label: 'STOPLOSS' },
  { value: 'SL_MARKET', label: 'SL_MARKET' },
]

const PRODUCT_TYPES = [
  { value: 'VALUEPLUS', label: 'INTRADAY' },
  { value: 'DELIVERY', label: 'DELIVERY' },
  { value: 'NORMAL', label: 'NORMAL' },
  { value: 'SELLFROMDP', label: 'SELLFROMDP' },
  { value: 'BTST', label: 'BTST' },
  { value: 'MTF', label: 'MTF' },
]

const EXCHANGES = ['NSE', 'BSE', 'NSEFO', 'NSECD', 'NCDEX', 'MCX', 'BSEFO', 'BSECD']

const inputCls = 'w-full bg-navy-900 border border-navy-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-brand-500 transition disabled:opacity-50'
const labelCls = 'block text-xs text-slate-400 mb-1 font-medium'

export default function TradeForm() {
  const [action, setAction] = useState<'BUY' | 'SELL'>('BUY')
  const [productType, setProductType] = useState('VALUEPLUS')
  const [orderType, setOrderType] = useState('LIMIT')
  const [qtySelection, setQtySelection] = useState<'manual' | 'auto'>('manual')
  const [groupAcc, setGroupAcc] = useState(false)
  const [diffQty, setDiffQty] = useState(false)
  const [multiplier, setMultiplier] = useState(false)
  const [qty, setQty] = useState('1')
  const [exchange, setExchange] = useState('NSE')
  const [symbol, setSymbol] = useState<SymbolResult | null>(null)
  const [price, setPrice] = useState<number | string>(0)
  const [trigPrice, setTrigPrice] = useState<number | string>(0)
  const [disclosedQty, setDisclosedQty] = useState<number | string>(0)
  const [timeForce, setTimeForce] = useState<'DAY' | 'IOC'>('DAY')
  const [amo, setAmo] = useState(false)
  const [clients, setClients] = useState<MofslClient[]>([])
  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const [groups, setGroups] = useState<ClientGroup[]>([])
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [perClientQty, setPerClientQty] = useState<Record<string, string>>({})
  const [perGroupQty, setPerGroupQty] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  // Symbol search
  const [symQuery, setSymQuery] = useState('')
  const [symResults, setSymResults] = useState<SymbolResult[]>([])
  const [symOpen, setSymOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load persisted form
  useEffect(() => {
    try {
      const raw = localStorage.getItem(FORM_STORAGE_KEY)
      if (!raw) return
      const s = JSON.parse(raw)
      setAction(s.action ?? 'BUY')
      setProductType(s.productType ?? 'VALUEPLUS')
      setOrderType(s.orderType ?? 'LIMIT')
      setQtySelection(s.qtySelection ?? 'manual')
      setGroupAcc(!!s.groupAcc)
      setDiffQty(!!s.diffQty)
      setMultiplier(!!s.multiplier)
      setQty(String(s.qty ?? '1'))
      setExchange(s.exchange ?? 'NSE')
      setSymbol(s.symbol ?? null)
      if (s.symbol?.label) setSymQuery(s.symbol.label)
      setPrice(s.price ?? 0)
      setTrigPrice(s.trigPrice ?? 0)
      setDisclosedQty(s.disclosedQty ?? 0)
      setTimeForce(s.timeForce ?? 'DAY')
      setAmo(!!s.amo)
      setSelectedClients(s.selectedClients ?? [])
      setSelectedGroups(s.selectedGroups ?? [])
      setPerClientQty(s.perClientQty ?? {})
      setPerGroupQty(s.perGroupQty ?? {})
    } catch { /* ignore */ }
  }, [])

  // Persist form
  useEffect(() => {
    const snap = {
      action, productType, orderType, qtySelection,
      groupAcc, diffQty, multiplier,
      qty, exchange, symbol, price, trigPrice, disclosedQty,
      timeForce, amo,
      selectedClients, selectedGroups, perClientQty, perGroupQty,
    }
    try { localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(snap)) } catch { /* ignore */ }
  }, [action, productType, orderType, qtySelection, groupAcc, diffQty, multiplier,
    qty, exchange, symbol, price, trigPrice, disclosedQty, timeForce, amo,
    selectedClients, selectedGroups, perClientQty, perGroupQty])

  // Load clients + groups
  useEffect(() => {
    api.get('/clients').then(r => setClients(r.data?.clients || r.data || [])).catch(() => {})
    api.get('/groups').then(r => {
      const arr = r.data?.groups || r.data || []
      setGroups(arr)
    }).catch(() => {})
  }, [])

  // Symbol search with debounce
  const searchSymbols = useCallback((q: string) => {
    setSymQuery(q)
    if (!q.trim()) { setSymResults([]); setSymOpen(false); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get('/market/symbols/search', { params: { q, exchange } })
        const results = (res.data?.results || res.data || []).map((r: Record<string, unknown>) => ({
          value: String(r.id ?? r.token ?? r.symbol ?? r.text ?? ''),
          label: String(r.text ?? r.label ?? r.symbol ?? r.id ?? ''),
        }))
        setSymResults(results)
        setSymOpen(true)
      } catch { setSymResults([]) }
    }, 300)
  }, [exchange])

  const selectSymbol = (s: SymbolResult) => {
    setSymbol(s)
    setSymQuery(s.label)
    setSymOpen(false)
  }

  const isStopOrder = orderType === 'STOPLOSS' || orderType === 'SL_MARKET'
  const canUseSingleQty = useMemo(() => {
    if (groupAcc) return !diffQty
    return !(diffQty && selectedClients.length > 0)
  }, [groupAcc, diffQty, selectedClients.length])

  const toggleClient = (cid: string) => {
    setSelectedClients(prev =>
      prev.includes(cid) ? prev.filter(x => x !== cid) : [...prev, cid]
    )
  }

  const toggleGroup = (gname: string) => {
    setSelectedGroups(prev =>
      prev.includes(gname) ? prev.filter(x => x !== gname) : [...prev, gname]
    )
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!groupAcc && selectedClients.length === 0) {
      showToast({ variant: 'warning', text: 'Please select at least one client.' }); return
    }
    if (groupAcc && selectedGroups.length === 0) {
      showToast({ variant: 'warning', text: 'Please select at least one group.' }); return
    }
    if (!symbol?.value) {
      showToast({ variant: 'warning', text: 'Please select a symbol from the dropdown.' }); return
    }
    if (isStopOrder && Number(trigPrice) <= 0) {
      showToast({ variant: 'warning', text: 'Trigger price is required for STOPLOSS / SL_MARKET orders.' }); return
    }
    if (toIntOr(qty, 0) <= 0 && canUseSingleQty) {
      showToast({ variant: 'warning', text: 'Quantity must be a positive number.' }); return
    }

    const safeSingleQty = canUseSingleQty ? toIntOr(qty, 1) : 0
    const safePerClientQty = (!groupAcc && diffQty)
      ? Object.fromEntries(selectedClients.map(cid => [cid, toIntOr(perClientQty[cid] ?? '1', 1)]))
      : {}
    const safePerGroupQty = (groupAcc && diffQty)
      ? Object.fromEntries(selectedGroups.map(gn => [gn, toIntOr(perGroupQty[gn] ?? '1', 1)]))
      : {}

    setBusy(true)
    try {
      const payload = {
        groupacc: groupAcc,
        groups: selectedGroups,
        clients: selectedClients,
        action,
        ordertype: orderType,
        producttype: productType,
        orderduration: timeForce,
        exchange,
        symbol: symbol.value,
        price: orderType === 'MARKET' ? 0 : Number(price) || 0,
        triggerprice: Number(trigPrice) || 0,
        disclosedquantity: Number(disclosedQty) || 0,
        amoorder: amo ? 'Y' : 'N',
        qtySelection,
        quantityinlot: safeSingleQty,
        perClientQty: safePerClientQty,
        perGroupQty: safePerGroupQty,
        diffQty,
        multiplier,
      }
      const resp = await placeOrder(payload)
      showToast({ variant: 'success', text: 'Order placed! ' + JSON.stringify(resp).slice(0, 120) })
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } | string }; message?: string }
      const msg = (typeof e?.response?.data === 'object' ? e?.response?.data?.message : e?.response?.data as string) || e?.message || 'Request failed'
      showToast({ variant: 'error', text: 'Error: ' + msg })
    } finally {
      setBusy(false)
    }
  }

  const resetAll = () => {
    try { localStorage.removeItem(FORM_STORAGE_KEY) } catch { /* ignore */ }
    setAction('BUY'); setProductType('VALUEPLUS'); setOrderType('LIMIT'); setQtySelection('manual')
    setGroupAcc(false); setDiffQty(false); setMultiplier(false)
    setQty('1'); setExchange('NSE'); setSymbol(null); setSymQuery('')
    setPrice(0); setTrigPrice(0); setDisclosedQty(0); setTimeForce('DAY'); setAmo(false)
    setSelectedClients([]); setSelectedGroups([]); setPerClientQty({}); setPerGroupQty({})
  }

  const RadioGroup = ({ name, options, value, onChange }: {
    name: string
    options: { value: string; label: string }[]
    value: string
    onChange: (v: string) => void
  }) => (
    <div className="flex items-center flex-wrap gap-3">
      {options.map(o => (
        <label key={o.value} className="flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="radio"
            name={name}
            checked={value === o.value}
            onChange={() => onChange(o.value)}
            className="accent-brand-500"
          />
          <span className="text-sm text-slate-200">{o.label}</span>
        </label>
      ))}
    </div>
  )

  const CheckBox = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
    <label className="flex items-center gap-1.5 cursor-pointer select-none">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="accent-brand-500 w-4 h-4" />
      <span className="text-sm text-slate-200">{label}</span>
    </label>
  )

  const Section = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={`border-b border-navy-700 py-3 px-1 ${className}`}>{children}</div>
  )

  return (
    <div className="bg-navy-800 border border-navy-700 rounded-xl p-4">
      <form onSubmit={submit}>
        {/* Action */}
        <Section>
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider w-20">Action</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAction('BUY')}
                className={clsx('px-6 py-2 rounded-lg font-bold text-sm transition-colors border-2', action === 'BUY' ? 'bg-green-600 border-green-500 text-white' : 'bg-transparent border-green-800 text-green-600 hover:border-green-600')}
              >BUY</button>
              <button
                type="button"
                onClick={() => setAction('SELL')}
                className={clsx('px-6 py-2 rounded-lg font-bold text-sm transition-colors border-2', action === 'SELL' ? 'bg-red-600 border-red-500 text-white' : 'bg-transparent border-red-800 text-red-600 hover:border-red-600')}
              >SELL</button>
            </div>
          </div>
        </Section>

        {/* Product */}
        <Section>
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider w-20">Product</span>
            <RadioGroup name="productType" options={PRODUCT_TYPES} value={productType} onChange={setProductType} />
          </div>
        </Section>

        {/* Order Type */}
        <Section>
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider w-20">Order Type</span>
            <RadioGroup name="orderType" options={ORDER_TYPES} value={orderType} onChange={setOrderType} />
          </div>
        </Section>

        {/* Clients / Groups */}
        <Section>
          <div className="flex items-center gap-4 mb-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider w-20">Entity</span>
            <CheckBox checked={groupAcc} onChange={setGroupAcc} label="Group Acc" />
            <CheckBox checked={diffQty} onChange={setDiffQty} label="Diff. Qty" />
            <CheckBox checked={multiplier} onChange={setMultiplier} label="Multiplier" />
          </div>
          {!groupAcc ? (
            <div>
              <label className={labelCls}>Select Clients (ctrl+click multi-select)</label>
              <select
                multiple
                size={Math.min(8, Math.max(3, clients.length))}
                value={selectedClients}
                onChange={e => setSelectedClients(Array.from(e.target.selectedOptions).map(o => o.value))}
                className="w-full bg-navy-900 border border-navy-700 text-white text-sm rounded-lg px-2 py-1 focus:outline-none focus:border-brand-500"
              >
                {clients.map(c => (
                  <option key={c.client_id} value={c.client_id}>
                    {c.name} : {c.client_id}
                  </option>
                ))}
              </select>
              {diffQty && selectedClients.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="text-xs text-slate-400 mb-1">Per-client quantity:</div>
                  {selectedClients.map(cid => {
                    const c = clients.find(x => x.client_id === cid)
                    return (
                      <div key={cid} className="flex items-center gap-2">
                        <span className="text-xs text-slate-300 w-32 truncate">{c?.name || cid}</span>
                        <input
                          type="number"
                          min="1"
                          value={perClientQty[cid] ?? '1'}
                          onChange={e => setPerClientQty(prev => ({ ...prev, [cid]: e.target.value }))}
                          className="w-20 bg-navy-900 border border-navy-700 text-white text-sm rounded px-2 py-1 focus:outline-none focus:border-brand-500"
                        />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className={labelCls}>Select Groups</label>
              <div className="border border-navy-700 rounded-lg p-2 space-y-1 max-h-48 overflow-y-auto">
                {groups.length === 0 ? (
                  <div className="text-slate-500 text-sm">No groups found.</div>
                ) : groups.map(g => {
                  const gname = String(g.name || g.id)
                  return (
                    <label key={gname} className="flex items-center gap-2 cursor-pointer hover:bg-navy-700/50 px-2 py-1 rounded">
                      <input
                        type="checkbox"
                        className="accent-brand-500"
                        checked={selectedGroups.includes(gname)}
                        onChange={() => toggleGroup(gname)}
                      />
                      <span className="text-sm text-slate-200">{gname} ({g.members?.length ?? 0} clients, x{g.multiplier})</span>
                    </label>
                  )
                })}
              </div>
              {diffQty && selectedGroups.length > 0 && (
                <div className="mt-2 space-y-1">
                  {selectedGroups.map(gn => (
                    <div key={gn} className="flex items-center gap-2">
                      <span className="text-xs text-slate-300 w-32 truncate">{gn}</span>
                      <input
                        type="number"
                        min="1"
                        value={perGroupQty[gn] ?? '1'}
                        onChange={e => setPerGroupQty(prev => ({ ...prev, [gn]: e.target.value }))}
                        className="w-20 bg-navy-900 border border-navy-700 text-white text-sm rounded px-2 py-1 focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Section>

        {/* Qty + Details */}
        <Section>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div>
              <label className={labelCls}>Qty</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                disabled={qtySelection === 'auto'}
                value={qty}
                onChange={e => setQty(onlyDigits(e.target.value))}
                onBlur={() => setQty(String(Math.max(1, parseInt(qty || '1', 10) || 1)))}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Exchange</label>
              <select
                value={exchange}
                onChange={e => setExchange(e.target.value)}
                className={inputCls}
              >
                {EXCHANGES.map(x => <option key={x} value={x}>{x}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Price</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={orderType === 'MARKET' ? 0 : price}
                disabled={orderType === 'MARKET'}
                onChange={e => setPrice(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Trig. Price {isStopOrder && <span className="text-red-400">*</span>}</label>
              <input
                type="number"
                step="0.01"
                min="0"
                disabled={!isStopOrder}
                value={trigPrice}
                onChange={e => setTrigPrice(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          {/* Symbol search */}
          <div className="relative mb-3">
            <label className={labelCls}>Symbol</label>
            <input
              type="text"
              value={symQuery}
              onChange={e => searchSymbols(e.target.value)}
              onFocus={() => symResults.length > 0 && setSymOpen(true)}
              onBlur={() => setTimeout(() => setSymOpen(false), 150)}
              placeholder="Type to search symbol..."
              className={inputCls}
            />
            {symOpen && symResults.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-navy-800 border border-navy-600 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                {symResults.map(r => (
                  <button
                    key={r.value}
                    type="button"
                    onMouseDown={() => selectSymbol(r)}
                    className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-navy-700 transition-colors"
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <span className="text-xs text-slate-400 mr-2">Qty Mode:</span>
              <RadioGroup name="qtyMode" options={[{ value: 'manual', label: 'Manual' }, { value: 'auto', label: 'Auto Calc' }]} value={qtySelection} onChange={v => setQtySelection(v as 'manual' | 'auto')} />
            </div>
            <div>
              <span className="text-xs text-slate-400 mr-2">Duration:</span>
              <RadioGroup name="timeForce" options={[{ value: 'DAY', label: 'DAY' }, { value: 'IOC', label: 'IOC' }]} value={timeForce} onChange={v => setTimeForce(v as 'DAY' | 'IOC')} />
            </div>
            <CheckBox checked={amo} onChange={setAmo} label="AMO" />
            <div>
              <label className={labelCls + ' inline'}>Disclosed Qty</label>
              <input
                type="number"
                value={disclosedQty}
                onChange={e => setDisclosedQty(e.target.value)}
                className="w-20 bg-navy-900 border border-navy-700 text-white text-sm rounded px-2 py-1 focus:outline-none focus:border-brand-500 ml-2"
              />
            </div>
          </div>
        </Section>

        {/* Buttons */}
        <div className="mt-4 flex items-center gap-3">
          <button
            type="submit"
            disabled={busy}
            className={clsx(
              'px-8 py-2.5 rounded-lg font-bold text-white transition-colors flex items-center gap-2 disabled:opacity-60',
              action === 'BUY' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
            )}
          >
            {busy && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {action}
          </button>
          <button
            type="button"
            onClick={resetAll}
            className="px-5 py-2.5 rounded-lg font-medium text-slate-300 bg-navy-700 hover:bg-navy-600 transition-colors"
          >
            Reset
          </button>
          {!groupAcc && (
            <button
              type="button"
              onClick={() => setSelectedClients(clients.map(c => c.client_id))}
              className="px-4 py-2.5 rounded-lg font-medium text-xs text-slate-400 bg-navy-700 hover:bg-navy-600 transition-colors"
            >
              Select All
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
