"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/features/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useLoadingAction } from '@/hooks/useThrottle'
import { PlatformNav } from '@/components/PlatformNav'
import {
  CreditBalanceCard,
  ChatChargeGuide,
  creditsToPoints,
  formatPoints,
  ANALYSIS_POINT_COST,
  THEME_POINT_COST,
  type PointBalanceView,
} from '@/features/credits'

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

/**
 * 포인트 충전·잔액 화면 (크레딧 개편 I Phase — 디노미네이션 1크레딧=1,000pt).
 *
 * - 잔액: server `/credits/balance` → PointBalanceView 정규화 (4 출처 + deficit).
 * - 충전 패키지: server `/payments/products` (server 가 패키지 정본 — Polar 흐름 재사용).
 *   server 응답 credits 는 디노미 후 pt 로 환산해 표시.
 * - 채팅 4구간 차감 안내 + 분석/테마 정액 차감 안내.
 *
 * 정본: shared-contracts §30 / S Phase Draft §14 (web).
 */
export default function CreditsPage() {
  const { user, loading, refreshUser } = useAuth()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
  const [logs, setLogs] = useState<CreditLog[]>([])
  const [balance, setBalance] = useState<PointBalanceView | null>(null)
  const purchaseAction = useLoadingAction()  // 결제 버튼 더블클릭 방지

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  // Polar 결제 완료 후 리턴 감지 — URL에 checkout_id가 있으면 성공
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const checkoutId = params.get('checkout_id')
    if (checkoutId) {
      toast.success('결제가 완료되었습니다. 포인트가 곧 반영됩니다.')
      // 포인트 반영 대기 후 갱신 (webhook 처리 시간 고려)
      const timer = setTimeout(() => {
        refreshUser()
        api.getPointBalance().then(setBalance).catch(() => {})
        api.getCreditLogs().then(setLogs).catch(() => {})
      }, 2000)
      // URL에서 checkout_id 제거 (새로고침 시 중복 토스트 방지)
      window.history.replaceState({}, '', '/dashboard/credits')
      return () => clearTimeout(timer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    api.getProducts().then(setProducts).catch(() => {
      // 서버 미연결 시 기본값 (server CREDIT_PRODUCTS 정본 — 미연결 폴백)
      setProducts([
        { id: 'credit-5', credits: 5, price: 2000, pricePerCredit: 400 },
        { id: 'credit-20', credits: 20, price: 3000, pricePerCredit: 150 },
        { id: 'credit-50', credits: 50, price: 5000, pricePerCredit: 100 },
      ])
    })
    api.getPointBalance().then(setBalance).catch(() => {})
    api.getCreditLogs().then(setLogs).catch(() => {})
  }, [])

  if (loading || !user) return null

  // 잔액: server 응답 우선, 미수신 시 user.credits(정수) 디노미 환산 폴백 (추정 아님 — 동일 출처)
  const balanceView: PointBalanceView =
    balance ?? { available: creditsToPoints(user.credits) }

  return (
    <div className="min-h-screen bg-white">
      <PlatformNav />

      <main className="max-w-3xl mx-auto px-6 py-8">
        <Link href="/dashboard" className="text-sm text-neutral-400 hover:text-neutral-800 transition mb-6 inline-block">&larr; 대시보드</Link>

        {/* 잔액 표시 — 4 출처 + deficit (server 가 출처 회계 응답 시 분해) */}
        <CreditBalanceCard balance={balanceView} />

        {/* 멤버십 안내 링크 */}
        <Link
          href="/dashboard/membership"
          className="block mb-8 rounded-xl border border-neutral-200 bg-[#f5f5f5] px-5 py-4 hover:border-neutral-300 transition"
        >
          <p className="text-sm text-black font-medium">멤버십 구독으로 매월 포인트 받기 &rarr;</p>
          <p className="text-xs text-neutral-400 mt-0.5">프로·프리미엄 플랜은 매월 포인트 풀이 충전됩니다.</p>
        </Link>

        <h2 className="text-[11px] uppercase tracking-[0.3em] text-neutral-400 mb-4">포인트 충전 패키지</h2>
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
              <p className="text-2xl font-bold text-black tabular-nums">
                {formatPoints(creditsToPoints(product.credits))} pt
              </p>
              <p className="text-[#e53e3e] text-lg mt-1">₩{product.price.toLocaleString()}</p>
              <p className="text-neutral-400 text-sm mt-2">
                1,000pt당 ₩{(product.pricePerCredit).toLocaleString()}
              </p>
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
                toast.error('결제를 시작할 수 없습니다. 잠시 후 다시 시도해주세요.')
              }
            })
          }}
          disabled={!selectedProduct || purchaseAction.pending}
          className="w-full py-3 bg-black hover:bg-neutral-800 disabled:bg-neutral-300 disabled:text-neutral-500 text-white font-medium rounded-lg transition"
        >
          {purchaseAction.pending ? '처리 중...' : selectedProduct ? '결제하기' : '패키지를 선택하세요'}
        </button>

        {/* 채팅 4구간 차감 안내 */}
        <div className="mt-8">
          <ChatChargeGuide />
        </div>

        <div className="mt-8 bg-[#f5f5f5] border border-neutral-200 rounded-xl p-6">
          <h3 className="text-[11px] uppercase tracking-[0.3em] text-neutral-400 mb-3">포인트 사용 안내</h3>
          <div className="space-y-2 text-sm text-neutral-500">
            <p>· 테마 AI 생성: <span className="text-[#e53e3e] tabular-nums">{formatPoints(THEME_POINT_COST)} pt</span></p>
            <p>· AI 작품 분석 (설정/톤/캐릭터): <span className="text-[#e53e3e] tabular-nums">{formatPoints(ANALYSIS_POINT_COST)} pt</span></p>
            <p>· AI 채팅: <span className="text-[#e53e3e]">대화 길이에 따라 4구간 차감</span> (위 안내 참고)</p>
            <p>· 수동 테마 수정 (Color Picker): <span className="text-green-500">무료</span></p>
            <p>· 에피소드 퍼블리시: <span className="text-green-500">무료</span></p>
            <p>· 공간 유지: <span className="text-green-500">무료</span></p>
          </div>
        </div>

        {/* 포인트 사용 내역 */}
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
                  <span className={`text-sm font-bold tabular-nums ${log.amount > 0 ? 'text-green-600' : 'text-[#e53e3e]'}`}>
                    {log.amount > 0 ? '+' : ''}{formatPoints(creditsToPoints(log.amount))} pt
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
