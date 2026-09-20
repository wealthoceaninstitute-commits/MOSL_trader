'use client'

import { useEffect, useState, lazy, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Navbar from '@/components/layout/Navbar'
import { ToastContainer } from '@/components/common/Toast'
import { useStore } from '@/store/useStore'
import { getMe, getClients, getGroups } from '@/lib/api'
import clsx from 'clsx'

// Lazy-load all tabs
const TradeForm = dynamic(() => import('@/components/trading/TradeForm'), { ssr: false })
const OrdersTab = dynamic(() => import('@/components/portfolio/OrdersTab'), { ssr: false })
const PositionsTab = dynamic(() => import('@/components/portfolio/PositionsTab'), { ssr: false })
const HoldingsTab = dynamic(() => import('@/components/portfolio/HoldingsTab'), { ssr: false })
const SummaryTab = dynamic(() => import('@/components/portfolio/SummaryTab'), { ssr: false })
const ClientsTab = dynamic(() => import('@/components/clients/ClientsTab'), { ssr: false })
const GroupsTab = dynamic(() => import('@/components/clients/GroupsTab'), { ssr: false })
const CopyTradingTab = dynamic(() => import('@/components/trading/CopyTradingTab'), { ssr: false })

const TABS = [
  { id: 'trade', label: 'Trade' },
  { id: 'orders', label: 'Orders' },
  { id: 'positions', label: 'Positions' },
  { id: 'holdings', label: 'Holdings' },
  { id: 'summary', label: 'Summary' },
  { id: 'clients', label: 'Clients' },
  { id: 'groups', label: 'Groups' },
  { id: 'copy-trading', label: 'Copy Trading' },
]

function TabLoader() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const { setUser, setClients, setGroups } = useStore()
  const [activeTab, setActiveTab] = useState('trade')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('woi_token') : null
    if (!token) {
      router.replace('/login')
      return
    }

    const init = async () => {
      try {
        const [me, cl, gr] = await Promise.allSettled([getMe(), getClients(), getGroups()])
        if (me.status === 'fulfilled') setUser(me.value)
        if (cl.status === 'fulfilled') setClients(cl.value?.clients || cl.value || [])
        if (gr.status === 'fulfilled') setGroups(gr.value?.groups || gr.value || [])
      } catch { /* ignore individual errors */ } finally {
        setLoading(false)
      }
    }
    init()
  }, [router, setUser, setClients, setGroups])

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'trade': return <TradeForm />
      case 'orders': return <OrdersTab />
      case 'positions': return <PositionsTab />
      case 'holdings': return <HoldingsTab />
      case 'summary': return <SummaryTab />
      case 'clients': return <ClientsTab />
      case 'groups': return <GroupsTab />
      case 'copy-trading': return <CopyTradingTab />
      default: return null
    }
  }

  return (
    <div className="min-h-screen bg-navy-900 flex flex-col">
      <Navbar />
      <ToastContainer />

      {/* Tab bar */}
      <div className="bg-navy-800 border-b border-navy-700 px-4 overflow-x-auto">
        <div className="flex gap-0.5 min-w-max">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={clsx(
                'px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2',
                activeTab === t.id
                  ? 'text-white border-brand-500'
                  : 'text-slate-400 border-transparent hover:text-slate-200 hover:border-navy-600'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 p-4 max-w-7xl mx-auto w-full">
        <Suspense fallback={<TabLoader />}>
          {renderTab()}
        </Suspense>
      </main>
    </div>
  )
}
