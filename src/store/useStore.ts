import { create } from 'zustand'
import type { MofslClient, ClientGroup, User } from '@/types'

interface AppState {
  user: User | null
  token: string | null
  clients: MofslClient[]
  groups: ClientGroup[]
  activeTab: string
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  setClients: (clients: MofslClient[]) => void
  setGroups: (groups: ClientGroup[]) => void
  setActiveTab: (tab: string) => void
  logout: () => void
}

export const useStore = create<AppState>((set) => ({
  user: null,
  token: null,
  clients: [],
  groups: [],
  activeTab: 'trade',

  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  setClients: (clients) => set({ clients }),
  setGroups: (groups) => set({ groups }),
  setActiveTab: (activeTab) => set({ activeTab }),

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('woi_token')
    }
    set({ user: null, token: null, clients: [], groups: [], activeTab: 'trade' })
  },
}))
