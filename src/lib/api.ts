import axios from 'axios'

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: `${BASE}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
})

// ── Auth ──────────────────────────────────────────────────────────────────────
export const masterLogin  = () => api.post('/auth/master/login')
export const masterStatus = () => api.get('/auth/master/status')
export const masterLogout = () => api.post('/auth/master/logout')

// ── Clients ───────────────────────────────────────────────────────────────────
export const getClients    = () => api.get('/clients')
export const addClient     = (data: any) => api.post('/clients', data)
export const updateClient  = (id: string, data: any) => api.patch(`/clients/${id}`, data)
export const deleteClient  = (id: string) => api.delete(`/clients/${id}`)
export const loginClient   = (id: string) => api.post(`/clients/${id}/login`)
export const logoutClient  = (id: string) => api.post(`/clients/${id}/logout`)
export const loginAllClients = () => api.post('/clients/login-all')

// ── Orders ────────────────────────────────────────────────────────────────────
export const placeOrder  = (data: any) => api.post('/orders/place', data)
export const modifyOrder = (data: any) => api.post('/orders/modify', data)
export const cancelOrder = (uniqueorderid: string) =>
  api.post('/orders/cancel', { uniqueorderid })
export const getOrderBook  = () => api.get('/orders/book')
export const getTradeBook  = () => api.get('/orders/trades')
export const getOrderDetail = (id: string) => api.get(`/orders/${id}`)

// ── Portfolio ─────────────────────────────────────────────────────────────────
export const getHoldings     = (clientId?: string) =>
  api.get('/portfolio/holdings', { params: clientId ? { client_id: clientId } : {} })
export const getPositions    = (clientId?: string) =>
  api.get('/portfolio/positions', { params: clientId ? { client_id: clientId } : {} })
export const getMarginSummary = (clientId?: string) =>
  api.get('/portfolio/margins/summary', { params: clientId ? { client_id: clientId } : {} })
export const getMarginDetail  = (clientId?: string) =>
  api.get('/portfolio/margins/detail', { params: clientId ? { client_id: clientId } : {} })

// ── Market ────────────────────────────────────────────────────────────────────
export const getLtp    = (exchange: string, scripcode: number) =>
  api.get('/market/ltp', { params: { exchange, scripcode } })
export const getScrips = (exchangename: string) =>
  api.get('/market/scrips', { params: { exchangename } })
