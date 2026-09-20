'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    try {
      const token = localStorage.getItem('woi_token')
      if (token) {
        router.replace('/dashboard')
      } else {
        router.replace('/login')
      }
    } catch {
      router.replace('/login')
    }
  }, [router])

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
