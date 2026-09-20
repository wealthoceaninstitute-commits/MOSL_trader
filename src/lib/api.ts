import axios from 'axios'

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: `${BASE}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('woi_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// Handle 401 → redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('woi_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

// ===== Auth =====
export const register = async (name: string, email: string, password: string) => {
  const res = await api.post('/auth/register', { name, email, password })
  return res.data
}

export const login = async (email: string, password: string): Promise<{ access_token: string }> => {
  const res = await api.post('/auth/login', { email, password })
  return res.data
}

export const getMe = async () => {
  const res = await api.get('/auth/me')
  return res.data
}

// ===== Clients =====
export const getClients = async () => {
  const res = await api.get('/clients')
  return res.data
}

export const addClient = async (data: Record<string, unknown>) => {
  const res = await api.post('/clients', data)
  return res.data
}

export const updateClient = async (id: number, data: Record<string, unknown>) => {
  const res = await api.put(`/clients/${id}`, data)
  return res.data
}

export const deleteClient = async (id: number) => {
  const res = await api.delete(`/clients/${id}`)
  return res.data
}

export const loginClient = async (id: number) => {
  const res = await api.post(`/clients/${id}/login`)
  return res.data
}

export const logoutClient = async (id: number) => {
  const res = await api.post(`/clients/${id}/logout`)
  return res.data
}

export const loginAllClients = async () => {
  const res = await api.post('/clients/login-all')
  return res.data
}

export const getClientStatus = async (id: number) => {
  const res = await api.get(`/clients/${id}/status`)
  return res.data
}

// ===== Groups =====
export const getGroups = async () => {
  const res = await api.get('/groups')
  return res.data
}

export const createGroup = async (data: { name: string; multiplier: number; member_ids: number[] }) => {
  const res = await api.post('/groups', data)
  return res.data
}

export const updateGroup = async (id: number | string, data: Record<string, unknown>) => {
  const res = await api.put(`/groups/${id}`, data)
  return res.data
}

export const deleteGroup = async (id: number | string) => {
  const res = await api.delete(`/groups/${id}`)
  return res.data
}

// ===== Orders =====
export const placeOrder = async (data: Record<string, unknown>) => {
  const res = await api.post('/orders/place', data)
  return res.data
}

export const modifyOrder = async (data: Record<string, unknown>) => {
  const res = await api.post('/orders/modify', data)
  return res.data
}

export const cancelOrder = async (data: Record<string, unknown>) => {
  const res = await api.post('/orders/cancel', data)
  return res.data
}

export const getOrderBook = async (client_id: number) => {
  const res = await api.get('/orders', { params: { client_id } })
  return res.data
}

export const getTradeBook = async (client_id: number) => {
  const res = await api.get('/orders/trades', { params: { client_id } })
  return res.data
}

// ===== Portfolio =====
export const getPositions = async (client_id?: number) => {
  const res = await api.get('/portfolio/positions', { params: client_id ? { client_id } : {} })
  return res.data
}

export const getHoldings = async (client_id?: number) => {
  const res = await api.get('/portfolio/holdings', { params: client_id ? { client_id } : {} })
  return res.data
}

export const getSummary = async () => {
  const res = await api.get('/portfolio/summary')
  return res.data
}

export const getMargins = async (client_id: number) => {
  const res = await api.get('/portfolio/margins', { params: { client_id } })
  return res.data
}

// ===== Market =====
export const getLtp = async (client_id: number, exchange: string, scripcode: string) => {
  const res = await api.get('/market/ltp', { params: { client_id, exchange, scripcode } })
  return res.data
}

export const searchSymbols = async (q: string) => {
  const res = await api.get('/market/symbols/search', { params: { q } })
  return res.data
}

// ===== Copy Trading =====
export const listCopySetups = async () => {
  const res = await api.get('/copy-trading')
  return res.data
}

export const saveCopySetup = async (data: Record<string, unknown>) => {
  const res = await api.post('/copy-trading', data)
  return res.data
}

export const deleteCopySetup = async (id: string) => {
  const res = await api.delete(`/copy-trading/${id}`)
  return res.data
}

export const enableCopySetup = async (id: string, enabled: boolean) => {
  const res = await api.patch(`/copy-trading/${id}`, { enabled })
  return res.data
}
