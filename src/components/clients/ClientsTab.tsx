'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import api from '@/lib/api'
import type { MofslClient } from '@/types'
import clsx from 'clsx'

const inputCls = 'w-full bg-navy-900 border border-navy-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-brand-500 transition'
const labelCls = 'block text-xs text-slate-400 mb-1 font-medium'

interface ClientFormData {
  name: string
  client_id: string
  api_key: string
  api_secret: string
  totp_secret: string
  password_hash: string
  two_fa: string
  capital: string
  qty_multiplier: string
}

const DEFAULT_FORM: ClientFormData = {
  name: '', client_id: '', api_key: '', api_secret: '', totp_secret: '',
  password_hash: '', two_fa: '', capital: '', qty_multiplier: '1',
}

export default function ClientsTab() {
  const [clients, setClients] = useState<MofslClient[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [showModal, setShowModal] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<ClientFormData>(DEFAULT_FORM)
  const [loggingIn, setLoggingIn] = useState<Set<number>>(new Set())
  const [busy, setBusy] = useState(false)
  const pollingRef = useRef(false)

  const loadClients = async () => {
    try {
      const res = await api.get('/clients')
      setClients(res.data?.clients || res.data || [])
    } catch { setClients([]) }
  }

  useEffect(() => { loadClients() }, [])

  const allSelected = clients.length > 0 && selectedIds.size === clients.length
  const toggleAll = (checked: boolean) => setSelectedIds(checked ? new Set(clients.map(c => c.id)) : new Set())
  const toggleOne = (id: number, checked: boolean) => {
    setSelectedIds(prev => {
      const s = new Set(prev)
      checked ? s.add(id) : s.delete(id)
      return s
    })
  }

  const statusDot = (c: MofslClient) => {
    const isLogging = loggingIn.has(c.id)
    if (isLogging) return <span className="inline-flex items-center gap-1"><span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" /><span className="text-yellow-400 text-xs">logging in…</span></span>
    if (c.session_active) return <span className="inline-flex items-center gap-1"><span className="w-2 h-2 bg-green-400 rounded-full" /><span className="text-green-400 text-xs">Live</span></span>
    return <span className="inline-flex items-center gap-1"><span className="w-2 h-2 bg-slate-500 rounded-full" /><span className="text-slate-400 text-xs">Offline</span></span>
  }

  const openAdd = () => {
    setEditMode(false)
    setEditingId(null)
    setForm(DEFAULT_FORM)
    setShowModal(true)
  }

  const openEdit = () => {
    if (selectedIds.size !== 1) return
    const id = Array.from(selectedIds)[0]
    const c = clients.find(x => x.id === id)
    if (!c) return
    setEditMode(true)
    setEditingId(id)
    setForm({
      name: c.name || '',
      client_id: c.client_id || '',
      api_key: c.api_key || '',
      api_secret: '',
      totp_secret: '',
      password_hash: '',
      two_fa: '',
      capital: String(c.capital ?? ''),
      qty_multiplier: String(c.qty_multiplier ?? 1),
    })
    setShowModal(true)
  }

  const handleDelete = async () => {
    if (!selectedIds.size) return
    if (!confirm(`Delete ${selectedIds.size} selected client(s)?`)) return
    try {
      await Promise.all(Array.from(selectedIds).map(id => api.delete(`/clients/${id}`)))
      await loadClients()
      setSelectedIds(new Set())
    } catch (e) {
      const err = e as { message?: string }
      alert('Delete failed: ' + err.message)
    }
  }

  const pollUntilLoggedIn = async (id: number) => {
    setLoggingIn(prev => new Set(prev).add(id))
    pollingRef.current = false
    let tries = 0
    while (!pollingRef.current && tries < 15) {
      try {
        const res = await api.get('/clients')
        const list: MofslClient[] = res.data?.clients || res.data || []
        setClients(list)
        const hit = list.find(c => c.id === id)
        if (hit?.session_active) break
      } catch { /* ignore */ }
      tries++
      await new Promise(res => setTimeout(res, 1000))
    }
    setLoggingIn(prev => { const n = new Set(prev); n.delete(id); return n })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      const payload = {
        name: form.name,
        client_id: form.client_id,
        api_key: form.api_key,
        api_secret: form.api_secret || undefined,
        totp_secret: form.totp_secret || undefined,
        password_hash: form.password_hash || undefined,
        two_fa: form.two_fa || undefined,
        capital: form.capital ? Number(form.capital) : undefined,
        qty_multiplier: Number(form.qty_multiplier) || 1,
      }
      if (editMode && editingId) {
        await api.put(`/clients/${editingId}`, payload)
      } else {
        const res = await api.post('/clients', payload)
        const newId = res.data?.id
        if (newId) pollUntilLoggedIn(newId)
      }
      setShowModal(false)
      await loadClients()
    } catch (e) {
      const err = e as { response?: { data?: { detail?: string } }; message?: string }
      alert('Error: ' + (err.response?.data?.detail || err.message))
    } finally {
      setBusy(false)
    }
  }

  const handleLogin = async (id: number) => {
    try {
      await api.post(`/clients/${id}/login`)
      pollUntilLoggedIn(id)
    } catch (e) {
      const err = e as { message?: string }
      alert('Login failed: ' + err.message)
    }
  }

  const handleLogout = async (id: number) => {
    try {
      await api.post(`/clients/${id}/logout`)
      await loadClients()
    } catch (e) {
      const err = e as { message?: string }
      alert('Logout failed: ' + err.message)
    }
  }

  const handleLoginAll = async () => {
    try {
      await api.post('/clients/login-all')
      clients.forEach(c => pollUntilLoggedIn(c.id))
    } catch (e) {
      const err = e as { message?: string }
      alert('Login all failed: ' + err.message)
    }
  }

  const toggleCopyEnabled = async (c: MofslClient) => {
    try {
      await api.put(`/clients/${c.id}`, { copy_enabled: !c.copy_enabled })
      await loadClients()
    } catch { /* ignore */ }
  }

  const F = ({ label, field, type = 'text', placeholder = '', required = false }: {
    label: string; field: keyof ClientFormData; type?: string; placeholder?: string; required?: boolean
  }) => (
    <div>
      <label className={labelCls}>{label}{required && <span className="text-red-400 ml-1">*</span>}</label>
      <input
        type={type}
        required={required}
        placeholder={placeholder}
        value={form[field]}
        onChange={e => setForm(prev => ({ ...prev, [field]: e.target.value }))}
        className={inputCls}
      />
    </div>
  )

  return (
    <div className="bg-navy-800 border border-navy-700 rounded-xl p-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <button onClick={openAdd} className="bg-green-700 hover:bg-green-800 text-white text-sm px-3 py-1.5 rounded-lg transition-colors">Add Client</button>
        <button onClick={openEdit} disabled={selectedIds.size !== 1} className="bg-navy-700 hover:bg-navy-600 disabled:opacity-40 text-white text-sm px-3 py-1.5 rounded-lg transition-colors">Edit</button>
        <button onClick={handleDelete} disabled={selectedIds.size === 0} className="bg-red-700 hover:bg-red-800 disabled:opacity-40 text-white text-sm px-3 py-1.5 rounded-lg transition-colors">Delete</button>
        <button onClick={handleLoginAll} className="bg-brand-500 hover:bg-brand-700 text-white text-sm px-3 py-1.5 rounded-lg transition-colors">Login All</button>
        <button onClick={loadClients} className="bg-navy-700 hover:bg-navy-600 text-slate-300 text-sm px-3 py-1.5 rounded-lg transition-colors ml-auto">Refresh</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-slate-300">
          <thead>
            <tr className="border-b border-navy-700 text-slate-400">
              <th className="py-2 px-2 w-8">
                <input type="checkbox" className="accent-brand-500" checked={allSelected} onChange={e => toggleAll(e.target.checked)} />
              </th>
              <th className="py-2 px-2 text-left">Name</th>
              <th className="py-2 px-2 text-left">Client ID</th>
              <th className="py-2 px-2 text-right">Capital</th>
              <th className="py-2 px-2 text-right">Multiplier</th>
              <th className="py-2 px-2 text-center">Status</th>
              <th className="py-2 px-2 text-center">Copy</th>
              <th className="py-2 px-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-slate-500">No clients yet. Add one to get started.</td></tr>
            ) : clients.map(c => (
              <tr key={c.id} className="border-b border-navy-700/50 hover:bg-navy-700/30">
                <td className="py-2 px-2">
                  <input type="checkbox" className="accent-brand-500" checked={selectedIds.has(c.id)} onChange={e => toggleOne(c.id, e.target.checked)} />
                </td>
                <td className="py-2 px-2 font-medium text-white">{c.name || '-'}</td>
                <td className="py-2 px-2 font-mono">{c.client_id}</td>
                <td className="py-2 px-2 text-right">{c.capital?.toLocaleString() ?? '-'}</td>
                <td className="py-2 px-2 text-right">×{c.qty_multiplier ?? 1}</td>
                <td className="py-2 px-2 text-center">{statusDot(c)}</td>
                <td className="py-2 px-2 text-center">
                  <button
                    onClick={() => toggleCopyEnabled(c)}
                    className={clsx('text-xs px-2 py-0.5 rounded-full border transition-colors',
                      c.copy_enabled ? 'border-green-700 text-green-400 bg-green-900/30' : 'border-navy-600 text-slate-500'
                    )}
                  >
                    {c.copy_enabled ? 'ON' : 'OFF'}
                  </button>
                </td>
                <td className="py-2 px-2">
                  <div className="flex gap-1 justify-center">
                    <button
                      onClick={() => handleLogin(c.id)}
                      disabled={loggingIn.has(c.id)}
                      className="text-xs bg-blue-800 hover:bg-blue-700 disabled:opacity-40 text-white px-2 py-0.5 rounded transition-colors"
                    >Login</button>
                    <button
                      onClick={() => handleLogout(c.id)}
                      className="text-xs bg-navy-700 hover:bg-navy-600 text-slate-300 px-2 py-0.5 rounded transition-colors"
                    >Logout</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-navy-800 border border-navy-700 rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-navy-700 sticky top-0 bg-navy-800">
              <h3 className="text-white font-semibold">{editMode ? 'Edit Client' : 'Add MOFSL Client'}</h3>
              <button onClick={() => { setShowModal(false); pollingRef.current = true }} className="text-slate-400 hover:text-white text-xl">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <F label="Display Name" field="name" placeholder="e.g. Rahul MOFSL" />
              <F label="Client ID" field="client_id" placeholder="MOFSL client ID" required />
              <F label="API Key" field="api_key" type="password" placeholder="API key" />
              <F label="API Secret" field="api_secret" type="password" placeholder="API secret" />
              <F label="TOTP Secret" field="totp_secret" type="password" placeholder="TOTP secret key" />
              <F label="Password Hash (SHA256 of password+api_key)" field="password_hash" type="password" placeholder="SHA256 hash" />
              <F label="2FA / DOB (DD/MM/YYYY)" field="two_fa" placeholder="e.g. 01/01/1990" />
              <div className="grid grid-cols-2 gap-3">
                <F label="Capital" field="capital" type="number" placeholder="100000" />
                <F label="Qty Multiplier" field="qty_multiplier" type="number" placeholder="1" />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => { setShowModal(false); pollingRef.current = true }} className="flex-1 py-2 text-sm text-slate-300 bg-navy-700 hover:bg-navy-600 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={busy} className="flex-1 py-2 text-sm text-white bg-brand-500 hover:bg-brand-700 rounded-lg transition-colors flex items-center justify-center gap-2">
                  {busy && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {editMode ? 'Save Changes' : 'Save & Login'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
