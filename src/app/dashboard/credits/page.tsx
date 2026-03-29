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

export default function CreditsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
  const purchaseAction = useLoadingAction()  // 결제 버튼 더블클릭 방지

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  useEffect(() => {
    api.getProducts().then(setProducts).catch(() => {
      // 서버 미연결 시 기본값
      setProducts([
        { id: 'credit-10', credits: 10, price: 1000, pricePerCredit: 100 },
        { id: 'credit-30', credits: 30, price: 2500, pricePerCredit: 83 },
        { id: 'credit-100', credits: 100, price: 7000, pricePerCredit: 70 },
      ])
    })
  }, [])

  if (loading || !user) return null

  return (
    <div className="min-h-screen bg-platform-bg">
      <PlatformNav />

      <main className="max-w-3xl mx-auto px-6 py-8">
        <Link href="/dashboard" className="text-sm text-neutral-500 hover:text-amber-500 transition mb-6 inline-block">&larr; 대시보드</Link>
        <div className="text-center mb-8">
          <p className="text-neutral-400 mb-2">현재 잔액</p>
          <p className="text-5xl font-bold text-amber-500">{user.credits}</p>
          <p className="text-neutral-500 text-sm mt-1">크레딧</p>
        </div>

        <h2 className="text-lg font-bold text-white mb-4">크레딧 패키지</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {products.map(product => (
            <button
              key={product.id}
              onClick={() => setSelectedProduct(product.id)}
              className={`p-6 rounded-xl border text-left transition ${
                selectedProduct === product.id
                  ? 'border-amber-500 bg-amber-900/20'
                  : 'border-neutral-800 bg-neutral-900 hover:border-neutral-700'
              }`}
            >
              <p className="text-2xl font-bold text-white">{product.credits} 크레딧</p>
              <p className="text-amber-500 text-lg mt-1">₩{product.price.toLocaleString()}</p>
              <p className="text-neutral-500 text-sm mt-2">개당 ₩{product.pricePerCredit}</p>
              {product.id === 'credit-100' && (
                <span className="inline-block mt-2 px-2 py-0.5 bg-amber-600 text-white text-xs rounded">베스트</span>
              )}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            if (!selectedProduct) return
            purchaseAction.execute(async () => {
              // TODO: PAYAPP 결제 연동 후 활성화
              // await api.initiatePayment(selectedProduct, window.location.href)
            })
          }}
          disabled={!selectedProduct || purchaseAction.pending}
          className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-neutral-700 disabled:text-neutral-500 text-white font-medium rounded-lg transition"
        >
          {purchaseAction.pending ? '처리 중...' : selectedProduct ? '결제하기 (PAYAPP 연동 예정)' : '패키지를 선택하세요'}
        </button>

        <div className="mt-8 bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <h3 className="text-sm font-medium text-neutral-300 mb-3">크레딧 사용 안내</h3>
          <div className="space-y-2 text-sm text-neutral-500">
            <p>· 테마 AI 생성: <span className="text-amber-500">1 크레딧</span></p>
            <p>· 수동 테마 수정 (Color Picker): <span className="text-green-500">무료</span></p>
            <p>· 에피소드 퍼블리시: <span className="text-green-500">무료</span></p>
            <p>· 공간 유지: <span className="text-green-500">무료</span></p>
          </div>
        </div>
      </main>
    </div>
  )
}
