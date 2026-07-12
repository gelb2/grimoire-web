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
  formatPoints,
  ANALYSIS_POINT_COST,
  THEME_POINT_COST,
  type PointBalanceView,
} from '@/features/credits'
import type { Product, CreditLogEntry } from '@/types/api'

/** F-21: 사용 내역 오프셋 페이지네이션 1페이지 크기 */
const LOG_PAGE_SIZE = 20

/** F-21: 기간 필터 옵션 — 'all'(무필터, 기존 동작) + 개월수 */
type LogPeriod = 'all' | 1 | 3 | 6 | 12
const PERIOD_OPTIONS: { key: LogPeriod; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 1, label: '1개월' },
  { key: 3, label: '3개월' },
  { key: 6, label: '6개월' },
  { key: 12, label: '1년' },
]

/** 개월수 → from ISO8601 (현재 기준 N개월 전) */
function periodFrom(months: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() - months)
  return d.toISOString()
}

/** F-22: 멤버십 등급/상태 표시 라벨 */
const MEMBERSHIP_TIER_LABEL: Record<'free' | 'pro' | 'premium', string> = { free: '무료', pro: '프로', premium: '프리미엄' }
const MEMBERSHIP_STATUS_LABEL: Record<'active' | 'expired' | 'cancelled', string> = { active: '이용 중', expired: '만료', cancelled: '해지' }

/** F-22: 멤버십 현황 응답 (server MembershipResponseDto 미러 — api.getMembership 반환) */
type MembershipView = Awaited<ReturnType<typeof api.getMembership>>

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
  const [logs, setLogs] = useState<CreditLogEntry[]>([])
  const [balance, setBalance] = useState<PointBalanceView | null>(null)
  // F-21: 사용 내역 기간 필터 + 오프셋 페이지네이션 + 구독 풀 소멸 예정
  const [period, setPeriod] = useState<LogPeriod>('all')
  const [logsOffset, setLogsOffset] = useState(0)
  const [hasMoreLogs, setHasMoreLogs] = useState(false)
  const [logsLoading, setLogsLoading] = useState(false)
  const [expiring, setExpiring] = useState<{ expiringAmount: number; expiresAt: string } | null>(null)
  const [membership, setMembership] = useState<MembershipView | null>(null)  // F-22
  const purchaseAction = useLoadingAction()  // 결제 버튼 더블클릭 방지

  /**
   * F-21: 사용 내역 로드. 'all'(무필터)은 기존 동작(서버 기본 최신순 100건, 페이지네이션 없음),
   * 기간 선택 시 from/to + limit/offset 로 조회하고 length===limit 로 더보기 노출을 추정한다.
   */
  const loadLogs = (p: LogPeriod, offset: number, replace: boolean) => {
    setLogsLoading(true)
    const params =
      p === 'all'
        ? undefined
        : { from: periodFrom(p), to: new Date().toISOString(), limit: LOG_PAGE_SIZE, offset }
    api.getCreditLogs(params)
      .then(rows => {
        setLogs(prev => (replace ? rows : [...prev, ...rows]))
        setHasMoreLogs(p !== 'all' && rows.length === LOG_PAGE_SIZE)
      })
      .catch(() => {})
      .finally(() => setLogsLoading(false))
  }

  const handlePeriod = (p: LogPeriod) => {
    setPeriod(p)
    setLogsOffset(0)
    loadLogs(p, 0, true)
  }

  const handleMoreLogs = () => {
    const next = logsOffset + LOG_PAGE_SIZE
    setLogsOffset(next)
    loadLogs(period, next, false)
  }

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
      // 서버 미연결 시 기본값 (server domain/model/config.ts CREDIT_PRODUCTS 정본 미러 — points/pricePerPoint pt 단위)
      setProducts([
        { id: 'credit-starter', name: '입문 패키지', points: 25000, bonusRate: 0, price: 3000, pricePerPoint: 0.12 },
        { id: 'credit-basic', name: '기본 패키지', points: 41667, bonusRate: 0, price: 5000, pricePerPoint: 0.12 },
        { id: 'credit-popular', name: '인기 패키지', points: 91667, bonusRate: 0.1, price: 10000, pricePerPoint: 0.10909 },
        { id: 'credit-best', name: '베스트 패키지', points: 287500, bonusRate: 0.15, price: 30000, pricePerPoint: 0.10435 },
      ])
    })
    api.getPointBalance().then(setBalance).catch(() => {})
    // F-21: 초기 로드는 무필터(기존 동작 그대로 — 회귀 0) + 구독 풀 소멸 예정 조회
    api.getCreditLogs().then(setLogs).catch(() => {})
    api.getExpiring().then(setExpiring).catch(() => {})
    // F-22: 멤버십 현황 조회 (현황 표시만 — 구독 가입/해지는 멤버십 페이지 '준비중' 가드 유지)
    api.getMembership().then(setMembership).catch(() => {})
  }, [])

  if (loading || !user) return null

  // 잔액: server 응답 우선, 미수신 시 user.credits 폴백.
  // user.credits 는 server `/auth/profile` 가 신 ledger 4 출처 합(total, pt 단위)을 매핑한 값이므로
  // 이미 pt — ×1,000 환산 금지 (CC-4 Phase 3 案 P3-Y 옵션 A, auth.controller resolveCredits).
  const balanceView: PointBalanceView =
    balance ?? { available: user.credits }

  return (
    <div className="min-h-screen bg-white">
      <PlatformNav />

      <main className="max-w-3xl mx-auto px-6 py-8">
        <Link href="/dashboard" className="text-sm text-neutral-400 hover:text-neutral-800 transition mb-6 inline-block">&larr; 대시보드</Link>

        {/* 잔액 표시 — 4 출처 + deficit (server 가 출처 회계 응답 시 분해) */}
        <CreditBalanceCard balance={balanceView} />

        {/* F-21: 구독 풀 소멸 예정 (활성 유료 구독만 — free/미구독/잔액0 시 미표시) */}
        {expiring && expiring.expiringAmount > 0 && (
          <div className="mb-6 rounded-xl border border-neutral-200 bg-[#f5f5f5] px-5 py-3">
            <p className="text-sm text-black">
              구독 풀 <span className="text-[#e53e3e] font-bold tabular-nums">{formatPoints(expiring.expiringAmount)} pt</span> 소멸 예정
              <span className="text-neutral-400"> · {new Date(expiring.expiresAt).toLocaleDateString('ko-KR')}</span>
            </p>
            <p className="text-xs text-neutral-400 mt-0.5">구독 풀은 매월 리셋되며 남은 포인트는 이월되지 않습니다.</p>
          </div>
        )}

        {/* 멤버십 현황 (F-22) — 유료 구독이면 등급/월풀/잔여/리셋 현황, 아니면 구독 유도 CTA.
            현황 표시 전용 — 구독 가입/해지는 멤버십 페이지 '준비중' 가드 유지(미접촉). */}
        {membership && membership.tier !== 'free' ? (
          <div className="mb-8 rounded-xl border border-neutral-200 bg-[#f5f5f5] px-5 py-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-black font-medium">
                {MEMBERSHIP_TIER_LABEL[membership.tier]} 플랜
                {membership.status !== 'active' && (
                  <span className="ml-1.5 text-xs text-[#e53e3e]">({MEMBERSHIP_STATUS_LABEL[membership.status]})</span>
                )}
              </p>
              <Link href="/dashboard/membership" className="text-sm text-neutral-500 hover:text-black transition">관리 &rarr;</Link>
            </div>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-black tabular-nums">{formatPoints(membership.poolBalance)}</span>
              <span className="text-sm text-neutral-400">/ {formatPoints(membership.monthlyPoolPoints)} pt</span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              월 포인트 풀 잔여
              {membership.poolResetAt && ` · ${new Date(membership.poolResetAt).toLocaleDateString('ko-KR')} 리셋`}
            </p>
          </div>
        ) : (
          <Link
            href="/dashboard/membership"
            className="block mb-8 rounded-xl border border-neutral-200 bg-[#f5f5f5] px-5 py-4 hover:border-neutral-300 transition"
          >
            <p className="text-sm text-black font-medium">멤버십 구독으로 매월 포인트 받기 &rarr;</p>
            <p className="text-xs text-neutral-400 mt-0.5">프로·프리미엄 플랜은 매월 포인트 풀이 충전됩니다.</p>
          </Link>
        )}

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
                {formatPoints(product.points)} pt
              </p>
              <p className="text-[#e53e3e] text-lg mt-1">₩{product.price.toLocaleString()}</p>
              <p className="text-neutral-400 text-sm mt-2">
                1,000pt당 ₩{Math.round(product.pricePerPoint * 1000).toLocaleString()}
              </p>
              {product.id === 'credit-best' && (
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

        {/* 포인트 사용 내역 — F-21: 기간 필터(전체/1·3·6/1년) + 오프셋 더보기 */}
        {(logs.length > 0 || period !== 'all') && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[11px] uppercase tracking-[0.3em] text-neutral-400">사용 내역</h3>
              <div className="flex gap-1">
                {PERIOD_OPTIONS.map(opt => (
                  <button
                    key={String(opt.key)}
                    onClick={() => handlePeriod(opt.key)}
                    className={`px-2.5 py-1 rounded-full text-xs transition ${
                      period === opt.key ? 'bg-black text-white' : 'bg-[#f5f5f5] text-neutral-500 hover:text-black'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            {logs.length > 0 ? (
              <div className="border border-neutral-200 rounded-xl overflow-hidden">
                {logs.map(log => (
                  <div key={log.id} className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 last:border-0">
                    <div>
                      <p className="text-sm text-black">{log.reason}</p>
                      <p className="text-xs text-neutral-400">{new Date(log.createdAt).toLocaleDateString('ko-KR')}</p>
                    </div>
                    <span className={`text-sm font-bold tabular-nums ${log.amount > 0 ? 'text-green-600' : 'text-[#e53e3e]'}`}>
                      {log.amount > 0 ? '+' : ''}{formatPoints(log.amount)} pt
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-400 py-6 text-center">해당 기간의 사용 내역이 없습니다.</p>
            )}
            {hasMoreLogs && (
              <button
                onClick={handleMoreLogs}
                disabled={logsLoading}
                className="w-full mt-3 py-2.5 text-sm text-neutral-500 hover:text-black border border-neutral-200 rounded-lg transition disabled:opacity-50"
              >
                {logsLoading ? '불러오는 중...' : '더보기'}
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
