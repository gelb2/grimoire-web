"use client"
/**
 * Sprint: PAY-S6 운영알림 최소안 (2026-06-27)
 *
 * 배경 — Circuit Breaker OPEN / 결제 permanent_failed / reconciliation mismatch가
 * 현재 AuditLog only → 운영자가 실시간으로 못 봄. PAY-S3 `CircuitBreakerPanel`
 * (SettingsTab "결제 인프라" sub-section) 상단에 경보 인디케이터를 결합한다.
 * 외부 SaaS(Sentry)는 boundary라 제외 — 최소안 = 가용 admin 데이터 재활용.
 *
 * 가용 데이터 (server 추가 0건, BFF 프록시 경유):
 *  - Circuit OPEN: `adminGetCircuitBreakerState()` — 2 호출점 중 하나라도 state='open'
 *  - permanent_failed 누적: `adminGetAuditLogs({ action: 'webhook_permanent_failed' })`.total
 *    (server `webhook-retry.job` DLQ 박제, operator='system_dlq' — MAX_RETRY 초과 영구 실패)
 *  - reconciliation mismatch 누적: `adminGetAuditLogs({ action: 'reconciliation_refund_mismatch' })`.total
 *    (server `payment-reconciliation.job` S2 박제, operator='system_reconciliation')
 *  - audit action 필터는 Prisma 정확매칭(`prisma-audit-log.repository.ts` where:{action})
 *
 * 시각 정본 종속 — neutral-* admin 스코프 (사슴악마 직접 대상 아님, 플랫폼 일관성 유지):
 *  - 경보 배너: `bg-red-900/30 border-red-800 text-red-300` (CircuitBreakerPanel error 배너 패턴)
 *  - OPEN 배지: `bg-red-900/50 text-red-400` (AccessLogsTab `ACTION_COLORS.login_fail` 패턴)
 *  - 정상 배지: `bg-green-900/50 text-green-400` (AccessLogsTab `ACTION_COLORS.login_success` 패턴)
 *  - 카운트 강조: `bg-yellow-900/50 text-yellow-400` (AccessLogsTab `password_change` 패턴)
 *  - 새 시각 정본 신설 0건. AccessLogsTab + CircuitBreakerPanel 패턴 차용.
 *
 * 한계 (server 추가 식별 — 본 컴포넌트가 구현하지 않음):
 *  - permanent_failed / reconciliation mismatch는 AuditLog '누적' total만 노출됨
 *    (시간범위/미해결 필터 endpoint 부재 → "누적" 라벨로 명시). 운영 경보 정밀화는 server 위임.
 */
import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'

/** server AuditLog action 상수 (정확매칭) — 변경 시 server와 동기화 필요. */
const AUDIT_ACTION_PERMANENT_FAILED = 'webhook_permanent_failed'
const AUDIT_ACTION_RECONCILIATION_MISMATCH = 'reconciliation_refund_mismatch'

const POLL_INTERVAL_MS = 30_000

interface AlertSummary {
  circuitOpen: boolean
  permanentFailedCount: number
  mismatchCount: number
}

export function PaymentInfraAlertBadge() {
  const [summary, setSummary] = useState<AlertSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const [circuit, permanentFailed, mismatch] = await Promise.all([
        api.adminGetCircuitBreakerState(),
        api.adminGetAuditLogs({ action: AUDIT_ACTION_PERMANENT_FAILED }),
        api.adminGetAuditLogs({ action: AUDIT_ACTION_RECONCILIATION_MISMATCH }),
      ])

      const states = 'states' in circuit ? circuit.states : [circuit]
      const circuitOpen = states.some(s => s.state === 'open')

      setSummary({
        circuitOpen,
        permanentFailedCount: permanentFailed.total,
        mismatchCount: mismatch.total,
      })
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : '경보 상태 조회 실패')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(load, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [load])

  if (loading) {
    return <p className="text-neutral-500 text-xs" data-testid="alert-loading">경보 상태 로딩 중...</p>
  }

  if (error) {
    return (
      <div
        data-testid="alert-error"
        className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-400"
      >
        경보 상태를 불러오지 못했습니다: {error}
      </div>
    )
  }

  if (!summary) return null

  const hasAlert =
    summary.circuitOpen || summary.permanentFailedCount > 0 || summary.mismatchCount > 0

  // 모두 정상 — 작은 정상 배지만 노출 (과한 시각 변경 금지)
  if (!hasAlert) {
    return (
      <div className="flex items-center gap-2" data-testid="alert-ok">
        <span className="px-2 py-0.5 rounded text-xs bg-green-900/50 text-green-400">정상</span>
        <span className="text-xs text-neutral-600">
          Circuit CLOSED · permanent_failed 0 · reconciliation mismatch 0
        </span>
      </div>
    )
  }

  // 경보 — 빨강 배너 + 세부 배지
  return (
    <div
      data-testid="alert-active"
      className="bg-red-900/30 border border-red-800 rounded-lg px-4 py-3 space-y-2"
    >
      <div className="flex items-center gap-2">
        <span className="px-2 py-0.5 rounded text-xs bg-red-900/50 text-red-400">⚠️ 경보</span>
        <span className="text-sm text-red-200">결제 인프라 이상 신호가 감지되었습니다.</span>
      </div>
      <div className="flex flex-wrap gap-3 text-xs">
        {summary.circuitOpen && (
          <span
            data-testid="alert-circuit-open"
            className="px-2 py-0.5 rounded bg-red-900/50 text-red-400"
          >
            Circuit Breaker OPEN — 결제 차단 중
          </span>
        )}
        {summary.permanentFailedCount > 0 && (
          <span
            data-testid="alert-permanent-failed"
            className="px-2 py-0.5 rounded bg-yellow-900/50 text-yellow-400"
          >
            permanent_failed {summary.permanentFailedCount}건 (누적)
          </span>
        )}
        {summary.mismatchCount > 0 && (
          <span
            data-testid="alert-mismatch"
            className="px-2 py-0.5 rounded bg-yellow-900/50 text-yellow-400"
          >
            reconciliation mismatch {summary.mismatchCount}건 (누적)
          </span>
        )}
      </div>
      <p className="text-xs text-neutral-500">
        누적 카운트는 감사 로그(AuditLog) 기준입니다. 상세는 아래 Circuit Breaker 패널 및 감사 로그를 확인하세요.
      </p>
    </div>
  )
}
