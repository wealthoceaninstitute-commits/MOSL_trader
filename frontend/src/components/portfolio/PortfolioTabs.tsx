'use client'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, TrendingUp, ShoppingCart, Target,
  IndianRupee, Briefcase, BarChart2, Bell
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import clsx from 'clsx'
import SummaryTab from './SummaryTab'
import PositionsTab from './PositionsTab'
import OrderBookTab from './OrderBookTab'
import HoldingsTab from './HoldingsTab'
import MarginsTab from './MarginsTab'
import TradeBookTab from './TradeBookTab'

const TABS = [
  { id: 'summary',    label: 'Summary',     icon: LayoutDashboard },
  { id: 'positions',  label: 'Positions',   icon: TrendingUp },
  { id: 'orders',     label: 'Orders',      icon: ShoppingCart },
  { id: 'gtt',        label: 'GTT',         icon: Target },
  { id: 'margins',    label: 'Margins',     icon: IndianRupee },
  { id: 'holdings',   label: 'Holdings',    icon: Briefcase },
  { id: 'market',     label: 'MarketWatch', icon: BarChart2 },
  { id: 'trades',     label: 'Trade Book',  icon: TrendingUp },
  { id: 'notif',      label: 'Notifications', icon: Bell },
]

export default function PortfolioTabs() {
  const { activeTab, setActiveTab } = useStore()

  const renderTab = () => {
    switch (activeTab) {
      case 'summary':   return <SummaryTab />
      case 'positions': return <PositionsTab />
      case 'orders':    return <OrderBookTab />
      case 'holdings':  return <HoldingsTab />
      case 'margins':   return <MarginsTab />
      case 'trades':    return <TradeBookTab />
      default:          return <div className="py-8 text-center text-gray-400 text-sm">Coming soon</div>
    }
  }

  return (
    <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-surface-border overflow-x-auto scrollbar-hide">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={clsx('tab-btn', activeTab === id && 'active')}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>
      {/* Content */}
      <div className="min-h-[300px]">{renderTab()}</div>
    </div>
  )
}
