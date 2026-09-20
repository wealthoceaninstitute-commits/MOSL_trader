'use client'
import { useState } from 'react'
import { TrendingUp, Bell, Settings, HelpCircle, ChevronDown, Sun } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { masterLogin, masterLogout } from '@/lib/api'
import toast from 'react-hot-toast'

const NAV_MENUS = [
  { label: 'Trading', href: '#' },
  { label: 'Accounts', href: '#' },
  { label: 'Settings', href: '/settings' },
  { label: 'Help', href: '#' },
]

export default function Navbar() {
  const { masterLoggedIn, masterClientId, setMasterLoggedIn } = useStore()
  const [loading, setLoading] = useState(false)

  const handleMasterToggle = async () => {
    setLoading(true)
    try {
      if (masterLoggedIn) {
        await masterLogout()
        setMasterLoggedIn(false)
        toast.success('Master logged out')
      } else {
        const { data } = await masterLogin()
        setMasterLoggedIn(true, data.client_id)
        toast.success(`Logged in as ${data.client_id}`)
      }
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <header className="bg-brand-700 text-white h-12 flex items-center px-4 gap-4 sticky top-0 z-50">
      {/* Logo */}
      <div className="flex items-center gap-2 font-bold text-sm mr-4">
        <TrendingUp size={18} className="text-blue-300" />
        <span>AutoTrader</span>
        <span className="bg-blue-400/30 text-blue-200 text-[10px] px-1.5 py-0.5 rounded font-medium">
          MOFSL
        </span>
      </div>

      {/* Nav links */}
      {NAV_MENUS.map((m) => (
        <button
          key={m.label}
          className="flex items-center gap-1 text-sm text-blue-200 hover:text-white transition-colors"
        >
          {m.label}
          <ChevronDown size={14} />
        </button>
      ))}

      <div className="flex-1" />

      {/* Actions */}
      <Sun size={16} className="text-blue-300 cursor-pointer hover:text-white" />
      <Bell size={16} className="text-blue-300 cursor-pointer hover:text-white" />

      {/* Master account badge */}
      <button
        onClick={handleMasterToggle}
        disabled={loading}
        className="flex items-center gap-2 bg-blue-600/40 hover:bg-blue-500/50
                   px-3 py-1.5 rounded-lg text-sm transition-colors"
      >
        <span className={`w-2 h-2 rounded-full ${masterLoggedIn ? 'bg-green-400' : 'bg-gray-400'}`} />
        <span>{masterLoggedIn ? masterClientId || 'Master' : 'Login Master'}</span>
        <ChevronDown size={13} />
      </button>
    </header>
  )
}
