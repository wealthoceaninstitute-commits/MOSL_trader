'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import type { MofslClient, ClientGroup } from '@/types'
import clsx from 'clsx'

const inputCls = 'w-full bg-navy-900 border border-navy-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-brand-500 transition'
const labelCls = 'block text-xs text-slate-400 mb-1 font-medium'

export default function GroupsTab() {
  const [groups, setGroups] = useState<ClientGroup[]>([])
  const [clients, setClients] = useState<MofslClient[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set())
  const [showModal, setShowModal] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editingId, setEditingId] = useState<string | number | null>(null)
  const [name, setName] = useState('')
  const [multiplier, setMultiplier] = useState('1')
  const [memberIds, setMemberIds] = useState<Set<number>>(new Set())
  const [busy, setBusy] = useState(false)

  const loadData = async () => {
    try {
      const [gr, cl] = await Promise.all([
        api.get('/groups'),
        api.get('/clients'),
      ])
      setGroups(gr.data?.groups || gr.data || [])
      setClients(cl.data?.clients || cl.data || [])
    } catch { /* ignore */ }
  }

  useEffect(() => { loadData() }, [])

  const gkey = (g: ClientGroup) => String(g.id || g.name)
  const allSelected = groups.length > 0 && selectedIds.size === groups.length

  const toggleAll = (checked: boolean) => setSelectedIds(checked ? new Set(groups.map(g => gkey(g))) : new Set())
  const toggleOne = (k: string, checked: boolean) => {
    setSelectedIds(prev => { const s = new Set(prev); checked ? s.add(k) : s.delete(k); return s })
  }

  const openCreate = () => {
    setEditMode(false)
    setEditingId(null)
    setName('')
    setMultiplier('1')
    setMemberIds(new Set())
    setShowModal(true)
  }

  const openEdit = () => {
    if (selectedIds.size !== 1) return
    const k = Array.from(selectedIds)[0]
    const g = groups.find(x => gkey(x) === k)
    if (!g) return
    setEditMode(true)
    setEditingId(g.id)
    setName(g.name)
    setMultiplier(String(g.multiplier ?? 1))
    setMemberIds(new Set(g.members.map(m => m.id)))
    setShowModal(true)
  }

  const handleDelete = async () => {
    if (!selectedIds.size) return
    if (!confirm(`Delete ${selectedIds.size} group(s)?`)) return
    try {
      await Promise.all(Array.from(selectedIds).map(id => api.delete(`/groups/${id}`)))
      await loadData()
      setSelectedIds(new Set())
    } catch (e) {
      const err = e as { message?: string }
      alert('Delete failed: ' + err.message)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || memberIds.size === 0) {
      alert('Please enter a name and select at least one member.')
      return
    }
    setBusy(true)
    try {
      const payload = {
        name: name.trim(),
        multiplier: Number(multiplier) || 1,
        member_ids: Array.from(memberIds),
      }
      if (editMode && editingId !== null) {
        await api.put(`/groups/${editingId}`, payload)
      } else {
        await api.post('/groups', payload)
      }
      setShowModal(false)
      await loadData()
    } catch (e) {
      const err = e as { response?: { data?: { detail?: string } }; message?: string }
      alert('Error: ' + (err.response?.data?.detail || err.message))
    } finally {
      setBusy(false)
    }
  }

  const toggleMember = (id: number, checked: boolean) => {
    setMemberIds(prev => { const s = new Set(prev); checked ? s.add(id) : s.delete(id); return s })
  }

  return (
    <div className="bg-navy-800 border border-navy-700 rounded-xl p-4">
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <button onClick={openCreate} className="bg-green-700 hover:bg-green-800 text-white text-sm px-3 py-1.5 rounded-lg transition-colors">Create Group</button>
        <button onClick={openEdit} disabled={selectedIds.size !== 1} className="bg-navy-700 hover:bg-navy-600 disabled:opacity-40 text-white text-sm px-3 py-1.5 rounded-lg transition-colors">Edit</button>
        <button onClick={handleDelete} disabled={selectedIds.size === 0} className="bg-red-700 hover:bg-red-800 disabled:opacity-40 text-white text-sm px-3 py-1.5 rounded-lg transition-colors">Delete</button>
        <button onClick={loadData} className="bg-navy-700 hover:bg-navy-600 text-slate-300 text-sm px-3 py-1.5 rounded-lg transition-colors ml-auto">Refresh</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-slate-300">
          <thead>
            <tr className="border-b border-navy-700 text-slate-400">
              <th className="py-2 px-2 w-8">
                <input type="checkbox" className="accent-brand-500" checked={allSelected} onChange={e => toggleAll(e.target.checked)} />
              </th>
              <th className="py-2 px-2 text-left">Group Name</th>
              <th className="py-2 px-2 text-right">Multiplier</th>
              <th className="py-2 px-2 text-right">Members</th>
              <th className="py-2 px-2 text-left">Preview</th>
            </tr>
          </thead>
          <tbody>
            {groups.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-slate-500">No groups yet. Create one to get started.</td></tr>
            ) : groups.map(g => {
              const k = gkey(g)
              const mems = g.members || []
              const preview = mems.slice(0, 3).map(m => m.name || m.client_id).join(', ')
                + (mems.length > 3 ? ` +${mems.length - 3}` : '')
              return (
                <tr key={k} className="border-b border-navy-700/50 hover:bg-navy-700/30">
                  <td className="py-2 px-2">
                    <input type="checkbox" className="accent-brand-500" checked={selectedIds.has(k)} onChange={e => toggleOne(k, e.target.checked)} />
                  </td>
                  <td className="py-2 px-2 font-medium text-white">{g.name}</td>
                  <td className="py-2 px-2 text-right">×{g.multiplier}</td>
                  <td className="py-2 px-2 text-right">{mems.length}</td>
                  <td className="py-2 px-2 text-slate-400">{preview || '-'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-navy-800 border border-navy-700 rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-navy-700 sticky top-0 bg-navy-800">
              <h3 className="text-white font-semibold">{editMode ? 'Edit Group' : 'Create Group'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-xl">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className={labelCls}>Group Name <span className="text-red-400">*</span></label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} className={inputCls} placeholder="e.g. Momentum Group" />
              </div>
              <div>
                <label className={labelCls}>Multiplier <span className="text-red-400">*</span></label>
                <input type="number" min="0.01" step="0.01" required value={multiplier} onChange={e => setMultiplier(e.target.value)} className={inputCls} />
                <p className="text-xs text-slate-500 mt-1">Quantities will be scaled by this multiplier for all group members.</p>
              </div>

              <div>
                <label className={labelCls}>Select Members <span className="text-red-400">*</span></label>
                <div className="border border-navy-700 rounded-lg max-h-48 overflow-y-auto">
                  {clients.length === 0 ? (
                    <div className="p-3 text-sm text-slate-500">No clients available.</div>
                  ) : clients.map(c => (
                    <label key={c.id} className="flex items-center gap-2 px-3 py-2 hover:bg-navy-700/50 cursor-pointer">
                      <input
                        type="checkbox"
                        className="accent-brand-500"
                        checked={memberIds.has(c.id)}
                        onChange={e => toggleMember(c.id, e.target.checked)}
                      />
                      <span className="text-sm text-slate-200">{c.name || '-'}</span>
                      <span className="text-xs text-slate-500 ml-auto">{c.client_id}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-1">{memberIds.size} member(s) selected</p>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 text-sm text-slate-300 bg-navy-700 hover:bg-navy-600 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={busy} className="flex-1 py-2 text-sm text-white bg-brand-500 hover:bg-brand-700 rounded-lg transition-colors flex items-center justify-center gap-2">
                  {busy && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {editMode ? 'Save Group' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
