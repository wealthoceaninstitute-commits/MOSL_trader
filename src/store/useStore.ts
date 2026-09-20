import { create } from 'zustand'

export type OrderType = 'LIMIT' | 'MARKET' | 'STOPLOSS'
export type ProductType = 'NORMAL' | 'DELIVERY' | 'VALUEPLUS' | 'SELLFROMDP' | 'BTST' | 'MTF'
export type Exchange = 'NSE' | 'BSE' | 'NSEFO' | 'NSECD' | 'MCX'

export interface OrderForm {
  exchange: Exchange
  symboltoken: number
  symbol: string
  buyorsell: 'BUY' | 'SELL'
  ordertype: OrderType
  producttype: ProductType
  orderduration: 'DAY' | 'GTC' | 'GTD' | 'IOC'
  price: number
  triggerprice: number
  quantityinlot: number
  amoorder: 'Y' | 'N'
  copy_to_clients: boolean
}

export interface ClientAccount {
  id: number
  client_id: string
  name?: string
  label?: string
  is_active: boolean
  is_live: boolean
  copy_enabled: boolean
  quantity_multiplier: number
  exchanges?: string
  products?: string
}

interface AppState {
  masterLoggedIn: boolean
  masterClientId: string
  clients: ClientAccount[]
  activeTab: string
  orderForm: Partial<OrderForm>
  recentSymbols: string[]

  setMasterLoggedIn: (v: boolean, clientId?: string) => void
  setClients: (c: ClientAccount[]) => void
  setActiveTab: (t: string) => void
  setOrderForm: (f: Partial<OrderForm>) => void
  addRecentSymbol: (s: string) => void
  updateClient: (clientId: string, patch: Partial<ClientAccount>) => void
}

export const useStore = create<AppState>((set) => ({
  masterLoggedIn: false,
  masterClientId: '',
  clients: [],
  activeTab: 'summary',
  orderForm: {
    exchange: 'NSE',
    buyorsell: 'BUY',
    ordertype: 'LIMIT',
    producttype: 'NORMAL',
    orderduration: 'DAY',
    price: 0,
    triggerprice: 0,
    quantityinlot: 1,
    amoorder: 'N',
    copy_to_clients: true,
  },
  recentSymbols: [],

  setMasterLoggedIn: (v, clientId = '') =>
    set({ masterLoggedIn: v, masterClientId: clientId }),

  setClients: (clients) => set({ clients }),

  setActiveTab: (activeTab) => set({ activeTab }),

  setOrderForm: (f) =>
    set((s) => ({ orderForm: { ...s.orderForm, ...f } })),

  addRecentSymbol: (s) =>
    set((state) => ({
      recentSymbols: [s, ...state.recentSymbols.filter((x) => x !== s)].slice(0, 10),
    })),

  updateClient: (clientId, patch) =>
    set((state) => ({
      clients: state.clients.map((c) =>
        c.client_id === clientId ? { ...c, ...patch } : c
      ),
    })),
}))
