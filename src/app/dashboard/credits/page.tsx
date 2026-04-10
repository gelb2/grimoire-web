"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/features/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { useLoadingAction } from '@/hooks/useThrottle'
import { PlatformNav } from '@/components/PlatformNav'

interface Product {
  id: string
  credits: number
  price: number
  pricePerCredit: number
}

interface CreditLog {
  id: string
  type: string
  amount: number
  description: string
  createdAt: string
}

export default function CreditsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
  const [logs, setLogs] = useState<CreditLog[]>([])
  const purchaseAction = useLoadingAction()  // 결제 버튼 더블클릭 방지

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  useEffect(() => {
    api.getProducts().then(setProducts).catch(() => {
      // 서버 미연결 시 기본값
      setProducts([
        { id: 'credit-5', credits: 5, price: 1000, pricePerCredit: 200 },
        { id: 'credit-20', credits: 20, price: 3000, pricePerCredit: 150 },
        { id: 'credit-50', credits: 50, price: 5000, pricePerCredit: 100 },
      ])
    })
    api.getCreditLogs().then(setLogs).catch(() => {})
  }, [])

  if (loading || !user) return null

  return (
    <div className="min-h-screen bg-white">
      <PlatformNav />

      <main className="max-w-3xl mx-auto px-6 py-8">
        <Link href="/dashboard" className="text-sm text-neutral-400 hover:text-neutral-800 transition mb-6 inline-block">&larr; 대시보드</Link>
        <div className="text-center mb-8">
          <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-400 mb-2">현재 잔액</p>
          <p className="text-5xl font-bold text-[#e53e3e]">{user.credits}</p>
          <p className="text-neutral-400 text-sm mt-1">크레딧</p>
        </div>

        <h2 className="text-[11px] uppercase tracking-[0.3em] text-neutral-400 mb-4">크레딧 패키지</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {products.map(product => (
            <button
              key={product.id}
              onClick={() => setSelectedProduct(product.id)}
              className={`p-6 rounded-xl border text-left transition ${
                selectedProduct === product.id
                  ? 'border-black bg-neutral-50'
                  : 'border-neutral-200 bg-[#f5f5f5] hover:border-neutral-300'
              }`}
            >
              <p className="text-2xl font-bold text-black">{product.credits} 크레딧</p>
              <p className="text-[#e53e3e] text-lg mt-1">₩{product.price.toLocaleString()}</p>
              <p className="text-neutral-400 text-sm mt-2">개당 ₩{product.pricePerCredit}</p>
              {product.id === 'credit-50' && (
                <span className="inline-block mt-2 px-2 py-0.5 bg-black text-white text-xs rounded">베스트</span>
              )}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            if (!selectedProduct) return
            purchaseAction.execute(async () => {
              try {
                // Polar 호스티드 Checkout URL 요청 → 리다이렉트
                const result = await api.initiatePayment(
                  selectedProduct,
                  window.location.href,
                )
                window.location.href = result.paymentUrl
              } catch (err) {
                console.error('결제 시작 실패:', err)
                alert('결제를 시작할 수 없습니다. 잠시 후 다시 시도해주세요.')
              }
            })
          }}
          disabled={!selectedProduct || purchaseAction.pending}
          className="w-full py-3 bg-black hover:bg-neutral-800 disabled:bg-neutral-300 disabled:text-neutral-500 text-white font-medium rounded-lg transition"
        >
          {purchaseAction.pending ? '처리 중...' : selectedProduct ? '결제하기' : '패키지를 선택하세요'}
        </button>

        <div className="mt-8 bg-[#f5f5f5] border border-neutral-200 rounded-xl p-6">
          <h3 className="text-[11px] uppercase tracking-[0.3em] text-neutral-400 mb-3">크레딧 사용 안내</h3>
          <div className="space-y-2 text-sm text-neutral-500">
            <p>· 테마 AI 생성: <span className="text-[#e53e3e]">1 크레딧</span></p>
            <p>· 수동 테마 수정 (Color Picker): <span className="text-green-500">무료</span></p>
            <p>· 에피소드 퍼블리시: <span className="text-green-500">무료</span></p>
            <p>· 공간 유지: <span className="text-green-500">무료</span></p>
          </div>
        </div>

        {/* 크레딧 사용 내역 */}
        {logs.length > 0 && (
          <div className="mt-8">
            <h3 className="text-[11px] uppercase tracking-[0.3em] text-neutral-400 mb-3">사용 내역</h3>
            <div className="border border-neutral-200 rounded-xl overflow-hidden">
              {logs.map(log => (
                <div key={log.id} className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 last:border-0">
                  <div>
                    <p className="text-sm text-black">{log.description}</p>
                    <p className="text-xs text-neutral-400">{new Date(log.createdAt).toLocaleDateString('ko-KR')}</p>
                  </div>
                  <span className={`text-sm font-bold ${log.amount > 0 ? 'text-green-600' : 'text-[#e53e3e]'}`}>
                    {log.amount > 0 ? '+' : ''}{log.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
