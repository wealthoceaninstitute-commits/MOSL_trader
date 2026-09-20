'use client'
import Navbar from '@/components/layout/Navbar'
import OrderForm from '@/components/trading/OrderForm'
import PortfolioTabs from '@/components/portfolio/PortfolioTabs'
import ClientsPanel from '@/components/common/ClientsPanel'
import { useStore } from '@/store/useStore'
import { masterStatus } from '@/lib/api'
import { useEffect } from 'react'

export default function Home() {
  const { setMasterLoggedIn } = useStore()

  // Restore session state on page load
  useEffect(() => {
    masterStatus()
      .then(({ data }) => {
        if (data.logged_in) setMasterLoggedIn(true, data.client_id)
      })
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto max-w-7xl px-4 py-4 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        {/* Left column */}
        <aside className="space-y-4">
          <OrderForm />
          <ClientsPanel />
        </aside>

        {/* Right column — portfolio tabs */}
        <section className="space-y-4">
          <PortfolioTabs />
        </section>
      </main>
    </div>
  )
}
