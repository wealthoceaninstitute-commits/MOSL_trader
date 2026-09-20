'use client'

import { useRouter } from 'next/navigation'
import { useStore } from '@/store/useStore'

export default function Navbar() {
  const router = useRouter()
  const { user, logout } = useStore()

  const handleLogout = () => {
    logout()
    router.replace('/login')
  }

  return (
    <nav className="bg-navy-800 border-b border-navy-700 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center shadow-md shadow-brand-500/30">
          <span className="text-white font-bold text-sm tracking-tight">WO</span>
        </div>
        <span className="text-white font-semibold text-base">AutoTrader</span>
        <span className="text-slate-600 text-xs hidden sm:block">MOFSL</span>
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <span className="text-slate-400 text-sm hidden sm:block truncate max-w-[200px]">{user.email}</span>
        )}
        <button
          onClick={handleLogout}
          className="bg-navy-700 hover:bg-navy-600 border border-navy-600 text-slate-300 hover:text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
        >
          Logout
        </button>
      </div>
    </nav>
  )
}
