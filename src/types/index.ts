export interface MofslClient {
  id: number
  user_id: number
  name: string
  client_id: string
  api_key?: string
  is_live: boolean
  is_active: boolean
  copy_enabled: boolean
  qty_multiplier: number
  capital: number
  session_active?: boolean
  token_expiry?: string | null
}

export interface ClientGroup {
  id: number | string
  name: string
  multiplier: number
  members: MofslClient[]
}

export interface Order {
  order_id?: string
  name?: string
  symbol?: string
  transaction_type?: string
  quantity?: number | string
  price?: number | string
  status?: string
  client_id?: string
  broker?: string
}

export interface Position {
  name?: string
  symbol?: string
  quantity?: number | string
  buy_avg?: number | string
  sell_avg?: number | string
  net_profit?: number | string
  ltp?: number | string
  day_pnl?: number | string
}

export interface Holding {
  name?: string
  symbol?: string
  quantity?: number | string
  buy_avg?: number | string
  ltp?: number | string
  current_value?: number | string
  pnl?: number | string
  pnl_pct?: number | string
}

export interface SummaryRow {
  name: string
  capital?: number | string
  invested?: number | string
  pnl?: number | string
  current_value?: number | string
  available_margin?: number | string
  net_gain?: number | string
}

export interface CopySetup {
  id?: string
  name: string
  master: string
  children: string[]
  multipliers: Record<string, number>
  enabled?: boolean
}

export interface SymbolResult {
  value: string
  label: string
}

export interface User {
  id: number
  email: string
  name: string
}
