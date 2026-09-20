'use client'
import { useEffect, useState } from 'react'
import { Users, Plus, LogIn, LogOut, Trash2, Copy } from 'lucide-react'
import {
  getClients, loginClient, logoutClient, deleteClient, loginAllClients, addClient
} from '@/lib/api'
import { useStore, ClientAccount } from '@/store/useStore'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function ClientsPanel() {
  const { clients, setClients, updateClient } = useStore()
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({
    client_id: '', api_key: '', api_secret: '',
    password_hash: '', two_fa: '', totp_secret: '',
    quantity_multiplier: 1, label: '',
  })

  const load = () => {
    getClients()
      .then(({ data }) => setClients(data))
      .catch(() => {})
  }

  useEffect(() => { load() }, [])

  const handleLogin = async (clientId: string) => {
    try {
      await loginClient(clientId)
      updateClient(clientId, { is_live: true })
      toast.success(`${clientId} logged in`)
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Login failed')
    }
  }

  const handleLogout = async (clientId: string) => {
    try {
      await logoutClient(clientId)
      updateClient(clientId, { is_live: false })
      toast.success(`${clientId} logged out`)
    } catch (e: any) {
      toast.error('Logout failed')
    }
  }

  const handleDelete = async (clientId: string) => {
    if (!confirm(`Remove ${clientId}?`)) return
    try {
      await deleteClient(clientId)
      load()
      toast.success('Client removed')
    } catch (e: any) {
      toast.error('Delete failed')
    }
  }

  const handleLoginAll = async () => {
    try {
      const { data } = await loginAllClients()
      const ok = data.results.filter((r: any) => r.status === 'SUCCESS').length
      toast.success(`${ok}/${data.results.length} clients logged in`)
      load()
    } catch (e: any) {
      toast.error('Login all failed')
    }
  }

  const handleAdd = async () => {
    try {
      await addClient(form)
      setShowAdd(false)
      setForm({ client_id:'',api_key:'',api_secret:'',password_hash:'',two_fa:'',totp_secret:'',quantity_multiplier:1,label:'' })
      load()
      toast.success('Client added')
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Add failed')
    }
  }

  const liveCount = clients.filter((c) => c.is_live).length

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-brand-500" />
          <h3 className="font-semibold text-sm">Client Accounts</h3>
          <span className="text-xs text-gray-400">({liveCount}/{clients.length} live)</span>
        </div>
        <div className="flex gap-1.5">
          <button onClick={handleLoginAll} className="btn-ghost text-xs flex items-center gap-1">
            <LogIn size={12} /> All
          </button>
          <button onClick={() => setShowAdd(!showAdd)} className="btn-primary text-xs flex items-center gap-1">
            <Plus size={12} /> Add
          </button>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="mb-4 p-3 bg-surface-muted rounded-lg border border-surface-border space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input className="input text-xs" placeholder="Client ID" value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})} />
            <input className="input text-xs" placeholder="Label (optional)" value={form.label} onChange={e => setForm({...form, label: e.target.value})} />
            <input className="input text-xs" placeholder="API Key" value={form.api_key} onChange={e => setForm({...form, api_key: e.target.value})} />
            <input className="input text-xs" placeholder="API Secret" value={form.api_secret} onChange={e => setForm({...form, api_secret: e.target.value})} />
            <input className="input text-xs" placeholder="Password Hash (SHA256)" value={form.password_hash} onChange={e => setForm({...form, password_hash: e.target.value})} />
            <input className="input text-xs" placeholder="2FA (DOB DD/MM/YYYY)" value={form.two_fa} onChange={e => setForm({...form, two_fa: e.target.value})} />
            <input className="input text-xs" placeholder="TOTP Secret (optional)" value={form.totp_secret} onChange={e => setForm({...form, totp_secret: e.target.value})} />
            <input className="input text-xs" placeholder="Qty Multiplier (default 1)" type="number" step="0.1" value={form.quantity_multiplier} onChange={e => setForm({...form, quantity_multiplier: parseFloat(e.target.value)})} />
          </div>
          <p className="text-[10px] text-gray-400">Password Hash = SHA256(raw_password + api_key)</p>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="btn-primary text-xs">Save</button>
            <button onClick={() => setShowAdd(false)} className="btn-ghost text-xs">Cancel</button>
          </div>
        </div>
      )}

      {/* Client list */}
      <div className="space-y-2">
        {clients.length === 0 ? (
          <div className="text-center text-gray-400 text-xs py-6">No clients added yet</div>
        ) : (
          clients.map((c) => (
            <div key={c.client_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-muted group">
              <div className={clsx('w-2 h-2 rounded-full flex-shrink-0', c.is_live ? 'bg-green-400' : 'bg-gray-300')} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{c.client_id}</div>
                <div className="text-[10px] text-gray-400">
                  {c.label || c.name || '—'} · ×{c.quantity_multiplier}
                  {c.copy_enabled && <span className="ml-1 text-brand-500">COPY</span>}
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {c.is_live ? (
                  <button onClick={() => handleLogout(c.client_id)} title="Logout" className="text-gray-400 hover:text-red-500">
                    <LogOut size={13} />
                  </button>
                ) : (
                  <button onClick={() => handleLogin(c.client_id)} title="Login" className="text-gray-400 hover:text-green-500">
                    <LogIn size={13} />
                  </button>
                )}
                <button onClick={() => handleDelete(c.client_id)} title="Remove" className="text-gray-400 hover:text-red-500">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
