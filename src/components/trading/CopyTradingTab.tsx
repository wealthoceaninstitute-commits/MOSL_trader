'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import type { MofslClient, CopySetup } from '@/types'
import clsx from 'clsx'

const inputCls = 'w-full bg-navy-900 border border-navy-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-brand-500 transition'

interface RowState { selected: boolean; mult: string }

export default function CopyTradingTab() {
  const [clients, setClients] = useState<MofslClient[]>([])
  const [setups, setSetups] = useState<CopySetup[]>([])
  const [selectedSetupId, setSelectedSetupId] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [formName, setFormName] = useState('')
  const [formMaster, setFormMaster] = useState('')
  const [formRows, setFormRows] = useState<Record<string, RowState>>({})

  const keyOf = (c: MofslClient) => `mofsl::${c.client_id}`

  const loadData = async () => {
    try {
      const [cr, cl] = await Promise.all([
        api.get('/copy-trading'),
        api.get('/clients'),
      ])
      setSetups(cr.data?.setups || cr.data || [])
      setClients(cl.data?.clients || cl.data || [])
    } catch { /* ignore */ }
  }

  useEffect(() => { loadData() }, [])

  const buildRows = (cl: MofslClient[]) => {
    const r: Record<string, RowState> = {}
    cl.forEach(c => { r[keyOf(c)] = { selected: false, mult: '1' } })
    return r
  }

  const openCreate = () => {
    setFormName('')
    setFormMaster('')
    setFormRows(buildRows(clients))
    setEditingId(null)
    setShowModal(true)
  }

  const openEdit = () => {
    if (!selectedSetupId) return
    const s = setups.find(x => (x.id || x.name) === selectedSetupId)
    if (!s) return
    const rows = buildRows(clients)
    const mm = s.multipliers || {}
    clients.forEach(c => {
      const uid = c.client_id
      if (s.children.includes(uid)) {
        const k = keyOf(c)
        rows[k] = { selected: true, mult: String(mm[uid] ?? 1) }
      }
    })
    setFormName(s.name)
    setFormMaster(s.master)
    setFormRows(rows)
    setEditingId(s.id || s.name)
    setShowModal(true)
  }

  const handleDelete = async () => {
    if (!selectedSetupId || !confirm('Delete this setup?')) return
    try {
      await api.delete(`/copy-trading/${selectedSetupId}`)
      setSelectedSetupId('')
      await loadData()
    } catch (e) {
      const err = e as { message?: string }
      alert('Delete failed: ' + err.message)
    }
  }

  const handleEnable = async (enabled: boolean) => {
    if (!selectedSetupId) return
    try {
      await api.patch(`/copy-trading/${selectedSetupId}`, { enabled })
      await loadData()
    } catch { /* ignore */ }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = formName.trim()
    const master = formMaster.trim()
    if (!name || !master) { alert('Enter Setup Name and select a Master.'); return }

    const children: string[] = []
    const multipliers: Record<string, number> = {}
    Object.entries(formRows).forEach(([k, v]) => {
      if (!v.selected) return
      const id = k.split('::')[1]
      if (!id || id === master) return
      children.push(id)
      const m = parseFloat(v.mult)
      multipliers[id] = !isFinite(m) || m <= 0 ? 1 : m
    })
    if (!children.length) { alert('Pick at least one child account.'); return }

    setBusy(true)
    try {
      const body = {
        id: editingId || undefined,
        name,
        master,
        children,
        multipliers,
        enabled: editingId ? undefined : false,
      }
      await api.post('/copy-trading', body)
      setShowModal(false)
      setEditingId(null)
      await loadData()
    } catch (e) {
      const err = e as { response?: { data?: unknown }; message?: string }
      alert('Error saving setup: ' + (err.response?.data || err.message))
    } finally {
      setBusy(false)
    }
  }

  const updateRow = (k: string, patch: Partial<RowState>) => {
    setFormRows(prev => ({ ...prev, [k]: { ...prev[k], ...patch } }))
  }

  return (
    <div className="bg-navy-800 border border-navy-700 rounded-xl p-4">
      <h2 className="text-white font-semibold mb-4">Copy Trading Management</h2>

      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <button onClick={openCreate} className="bg-green-700 hover:bg-green-800 text-white text-sm px-3 py-1.5 rounded-lg transition-colors">Create Setup</button>
        <button onClick={openEdit} disabled={!selectedSetupId} className="bg-navy-700 hover:bg-navy-600 disabled:opacity-40 text-white text-sm px-3 py-1.5 rounded-lg transition-colors">Edit Setup</button>
        <button onClick={handleDelete} disabled={!selectedSetupId} className="bg-red-700 hover:bg-red-800 disabled:opacity-40 text-white text-sm px-3 py-1.5 rounded-lg transition-colors">Delete</button>
        <button onClick={() => handleEnable(true)} disabled={!selectedSetupId} className="bg-brand-500 hover:bg-brand-700 disabled:opacity-40 text-white text-sm px-3 py-1.5 rounded-lg transition-colors">Enable Copy</button>
        <button onClick={() => handleEnable(false)} disabled={!selectedSetupId} className="bg-yellow-700 hover:bg-yellow-800 disabled:opacity-40 text-white text-sm px-3 py-1.5 rounded-lg transition-colors">Disable Copy</button>
        <button onClick={loadData} className="bg-navy-700 hover:bg-navy-600 text-slate-300 text-sm px-3 py-1.5 rounded-lg transition-colors ml-auto">Refresh</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-slate-300">
          <thead>
            <tr className="border-b border-navy-700 text-slate-400">
              <th className="py-2 px-2 w-8"></th>
              <th className="py-2 px-2 text-left">Setup Name</th>
              <th className="py-2 px-2 text-left">Master</th>
              <th className="py-2 px-2 text-right">Children</th>
              <th className="py-2 px-2 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {setups.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-slate-500">No setups yet.</td></tr>
            ) : setups.map(s => {
              const id = s.id || s.name
              return (
                <tr key={id} className="border-b border-navy-700/50 hover:bg-navy-700/30">
                  <td className="py-2 px-2">
                    <input type="radio" name="setupPick" className="accent-brand-500" checked={selectedSetupId === id} onChange={() => setSelectedSetupId(id)} />
                  </td>
                  <td className="py-2 px-2 font-medium text-white">{s.name}</td>
                  <td className="py-2 px-2">{s.master}</td>
                  <td className="py-2 px-2 text-right">{s.children?.length ?? 0}</td>
                  <td className="py-2 px-2 text-center">
                    <span className={clsx('text-xs px-2 py-0.5 rounded-full border', s.enabled ? 'border-green-700 text-green-400 bg-green-900/30' : 'border-navy-600 text-slate-500')}>
                      {s.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-navy-800 border border-navy-700 rounded-xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-navy-700 sticky top-0 bg-navy-800">
              <h3 className="text-white font-semibold">{editingId ? 'Edit Copy Trading Setup' : 'Create Copy Trading Setup'}</h3>
              <button onClick={() => { setShowModal(false); setEditingId(null) }} className="text-slate-400 hover:text-white text-xl">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">Setup Name <span className="text-red-400">*</span></label>
                <input type="text" required value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. Nifty Copy Setup" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">Master Account <span className="text-red-400">*</span></label>
                <select
                  required
                  value={formMaster}
                  onChange={e => {
                    const master = e.target.value
                    setFormMaster(master)
                    setFormRows(prev => {
                      const rows = { ...prev }
                      Object.keys(rows).forEach(k => {
                        if (k.split('::')[1] === master) rows[k].selected = false
                      })
                      return rows
                    })
                  }}
                  className={inputCls}
                >
                  <option value="">-- Select Master --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.client_id}>
                      {c.name} : {c.client_id}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-2 font-medium">Child Accounts &amp; Multipliers</label>
                <div className="overflow-x-auto border border-navy-700 rounded-lg">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-navy-700 text-slate-400">
                        <th className="py-2 px-2 w-8">Add</th>
                        <th className="py-2 px-2 text-left">Client</th>
                        <th className="py-2 px-2 text-right w-32">Multiplier</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clients.length === 0 ? (
                        <tr><td colSpan={3} className="text-center py-4 text-slate-500">No clients.</td></tr>
                      ) : clients.map(c => {
                        const k = keyOf(c)
                        const isMaster = formMaster && c.client_id === formMaster
                        const row = formRows[k] || { selected: false, mult: '1' }
                        return (
                          <tr key={k} className="border-b border-navy-700/50 hover:bg-navy-700/30">
                            <td className="py-1.5 px-2">
                              <input
                                type="checkbox"
                                className="accent-brand-500"
                                disabled={!!isMaster}
                                checked={!isMaster && !!row.selected}
                                onChange={e => updateRow(k, { selected: e.target.checked })}
                              />
                            </td>
                            <td className="py-1.5 px-2 text-slate-200">
                              {c.name} <span className="text-slate-500">: {c.client_id}</span>
                              {isMaster && <span className="ml-2 text-xs text-yellow-500">(master)</span>}
                            </td>
                            <td className="py-1.5 px-2">
                              <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                disabled={!!isMaster || !row.selected}
                                value={row.mult}
                                onChange={e => updateRow(k, { mult: e.target.value })}
                                className="w-full bg-navy-900 border border-navy-700 text-white text-xs rounded px-2 py-1 focus:outline-none focus:border-brand-500 disabled:opacity-40"
                              />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-slate-500 mt-1">Master cannot be a child. Each child can have its own multiplier.</p>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setEditingId(null) }} className="flex-1 py-2 text-sm text-slate-300 bg-navy-700 hover:bg-navy-600 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={busy} className="flex-1 py-2 text-sm text-white bg-green-700 hover:bg-green-800 rounded-lg transition-colors flex items-center justify-center gap-2">
                  {busy && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {editingId ? 'Save Changes' : 'Save Setup'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
