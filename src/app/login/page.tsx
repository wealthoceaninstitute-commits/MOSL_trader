'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { login, register } from '@/lib/api'
import clsx from 'clsx'

type Tab = 'signin' | 'register'

export default function LoginPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('signin')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Sign in form
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Register form
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirm, setRegConfirm] = useState('')

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(email, password)
      localStorage.setItem('woi_token', data.access_token)
      router.replace('/dashboard')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string; message?: string } }; message?: string }
      setError(e?.response?.data?.detail || e?.response?.data?.message || e?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (regPassword !== regConfirm) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      await register(regName, regEmail, regPassword)
      const data = await login(regEmail, regPassword)
      localStorage.setItem('woi_token', data.access_token)
      router.replace('/dashboard')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string; message?: string } }; message?: string }
      setError(e?.response?.data?.detail || e?.response?.data?.message || e?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-navy-900 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo + Branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-brand-500 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-brand-500/30">
            <span className="text-white font-bold text-2xl tracking-tight">WO</span>
          </div>
          <h1 className="text-white text-2xl font-bold tracking-tight">WealthOcean</h1>
          <p className="text-blue-400/70 text-sm mt-1 tracking-wide">Algo Trading Platform</p>
        </div>

        {/* Card */}
        <div className="bg-navy-800 border border-navy-700 rounded-2xl overflow-hidden shadow-2xl">
          {/* Tabs */}
          <div className="flex border-b border-navy-700">
            <button
              onClick={() => { setTab('signin'); setError('') }}
              className={clsx(
                'flex-1 py-3.5 text-sm font-medium transition-colors',
                tab === 'signin'
                  ? 'text-white border-b-2 border-brand-500 bg-navy-700/50'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              Sign in
            </button>
            <button
              onClick={() => { setTab('register'); setError('') }}
              className={clsx(
                'flex-1 py-3.5 text-sm font-medium transition-colors',
                tab === 'register'
                  ? 'text-white border-b-2 border-brand-500 bg-navy-700/50'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              Create account
            </button>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 px-3 py-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {tab === 'signin' ? (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium uppercase tracking-wider">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-navy-900 border border-navy-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium uppercase tracking-wider">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-navy-900 border border-navy-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-500 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors mt-2 flex items-center justify-center gap-2"
                >
                  {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  Sign in
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium uppercase tracking-wider">Name</label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    placeholder="Your name"
                    className="w-full bg-navy-900 border border-navy-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium uppercase tracking-wider">Email</label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-navy-900 border border-navy-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium uppercase tracking-wider">Password</label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-navy-900 border border-navy-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium uppercase tracking-wider">Confirm Password</label>
                  <input
                    type="password"
                    required
                    value={regConfirm}
                    onChange={e => setRegConfirm(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-navy-900 border border-navy-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-500 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors mt-2 flex items-center justify-center gap-2"
                >
                  {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  Create account
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-600 text-xs mt-6">
          Wealth Ocean Institute · MOFSL AutoTrader
        </p>
      </div>
    </div>
  )
}
