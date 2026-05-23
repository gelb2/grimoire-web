"use client"
/**
 * Sprint: sprint-pay-s3-circuit-breaker-admin (PAY-S3 Phase B)
 *
 * shared-contracts §27 CircuitBreakerPolicy + planner §6 정본.
 *
 * 위치 — SettingsTab 내 sub-section "결제 인프라 — Circuit Breaker"
 *  (G2 확정 — 새 admin 탭 신설 0건, Tab type 16값 유지).
 *
 * 시각 정본 종속 — neutral-* + g-* (사슴악마 토큰만):
 *  - CLOSED 배지: `bg-green-900/50 text-green-400` (AccessLogsTab `ACTION_COLORS.login_success` 패턴)
 *  - OPEN 배지: `bg-red-900/50 text-red-400` (AccessLogsTab `ACTION_COLORS.login_fail` 패턴)
 *  - HALF_OPEN 배지: `bg-yellow-900/50 text-yellow-400` (AccessLogsTab `ACTION_COLORS.password_change` 패턴)
 *  - Trip 버튼: `bg-red-700/50` + ⚠️ 경고 텍스트 (파괴적 액션 시각 강조)
 *  - 새 시각 정본 신설 0건. AccessLogsTab + CreditsTab + UsersTab 패턴 차용.
 *
 * 파괴적 액션 게이트 (planner §4 graceful):
 *  - Reset 버튼: confirm 다이얼로그 + reason 필수 (빈값 시 클라이언트 차단)
 *  - Trip 버튼: ⚠️ confirm + reason 필수 + 결제 즉시 503 변환 경고
 *  - 성공 시 자동 refresh — 운영자가 상태 즉시 확인 가능
 *  - server는 reason 빈값 시 400 + 분당 5회 Throttle (planner §4-2)
 */
import { useState, useEffect, useCallback } from 'react'
import { api, type CircuitBreakerStateResponseDto } from '@/lib/api'

const CIRCUIT_KEYS: Array<'polar:checkouts:create' | 'polar:checkouts:list'> = [
  'polar:checkouts:create',
  'polar:checkouts:list',
]

const STATE_BADGE_COLORS: Record<'closed' | 'open' | 'half_open', string> = {
  closed: 'bg-green-900/50 text-green-400',
  open: 'bg-red-900/50 text-red-400',
  half_open: 'bg-yellow-900/50 text-yellow-400',
}

const STATE_LABELS: Record<'closed' | 'open' | 'half_open', string> = {
  closed: 'CLOSED',
  open: 'OPEN',
  half_open: 'HALF_OPEN',
}

const POLL_INTERVAL_MS = 30_000

function formatTime(iso?: string): string {
  if (!iso) return '-'
  return new Date(iso).toLocaleString('ko-KR')
}

export function CircuitBreakerPanel() {
  const [states, setStates] = useState<CircuitBreakerStateResponseDto[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await api.adminGetCircuitBreakerState()
      // catchall — `{ states: [...] }` 형식 정합
      if ('states' in res) {
        setStates(res.states)
      } else {
        setStates([res])
      }
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : '상태 조회 실패')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(load, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [load])

  const handleReset = async (key: 'polar:checkouts:create' | 'polar:checkouts:list') => {
    const reason = window.prompt(
      `Circuit Breaker [${key}] 강제 복구 — 사유(reason)를 입력하세요. (audit log에 영구 박제)`,
    )
    if (reason === null) return
    const trimmed = reason.trim()
    if (!trimmed) {
      window.alert('사유(reason)는 필수입니다.')
      return
    }
    if (!window.confirm(`Circuit Breaker [${key}] 강제 복구 — 확인하시겠습니까?\n사유: ${trimmed}`)) return

    setActing(key)
    try {
      await api.adminResetCircuitBreaker(key, trimmed)
      await load()
    } catch (e) {
      window.alert(e instanceof Error ? e.message : '강제 복구 실패')
    } finally {
      setActing(null)
    }
  }

  const handleTrip = async (key: 'polar:checkouts:create' | 'polar:checkouts:list') => {
    const reason = window.prompt(
      `⚠️ Circuit Breaker [${key}] 강제 차단 — 결제가 즉시 503으로 변환됩니다.\n사유(reason)를 입력하세요. (audit log에 영구 박제)`,
    )
    if (reason === null) return
    const trimmed = reason.trim()
    if (!trimmed) {
      window.alert('사유(reason)는 필수입니다.')
      return
    }
    if (
      !window.confirm(
        `⚠️ Circuit Breaker [${key}] 강제 차단 — 결제 즉시 503 변환됩니다. 진행하시겠습니까?\n사유: ${trimmed}`,
      )
    )
      return

    setActing(key)
    try {
      await api.adminTripCircuitBreaker(key, trimmed)
      await load()
    } catch (e) {
      window.alert(e instanceof Error ? e.message : '강제 차단 실패')
    } finally {
      setActing(null)
    }
  }

  if (loading) {
    return <p className="text-neutral-500 text-sm">Circuit Breaker 상태 로딩 중...</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-neutral-500">
          폴링 30초 간격 자동 갱신. 수동 조작 시 audit log에 영구 박제됩니다.
        </p>
        <button
          onClick={load}
          className="px-3 py-1 bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-300 hover:text-white"
        >
          새로고침
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800 rounded-lg px-3 py-2 text-xs text-red-300">
          {error}
        </div>
      )}

      {CIRCUIT_KEYS.map(key => {
        const state = states.find(s => s.key === key)
        if (!state) {
          return (
            <div
              key={key}
              className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-sm text-neutral-500"
              data-testid={`cb-row-${key}`}
            >
              [{key}] 상태 미수신
            </div>
          )
        }
        return (
          <div
            key={key}
            data-testid={`cb-row-${key}`}
            className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm text-white">{key}</span>
              <span
                data-testid={`cb-badge-${key}`}
                className={`px-2 py-0.5 rounded text-xs ${STATE_BADGE_COLORS[state.state]}`}
              >
                {STATE_LABELS[state.state]}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-neutral-400">
              <div>
                <span className="text-neutral-600">실패 카운트:</span>{' '}
                <span className="text-white">{state.failureCount}</span>
              </div>
              <div>
                <span className="text-neutral-600">half-open 시도:</span>{' '}
                <span className="text-white">
                  {state.halfOpenTrialCount}/{state.halfOpenSuccessCount}
                </span>
              </div>
              <div>
                <span className="text-neutral-600">마지막 실패:</span>{' '}
                <span className="text-neutral-300">{formatTime(state.lastFailureAt)}</span>
              </div>
              <div>
                <span className="text-neutral-600">마지막 성공:</span>{' '}
                <span className="text-neutral-300">{formatTime(state.lastSuccessAt)}</span>
              </div>
              <div>
                <span className="text-neutral-600">차단 시각:</span>{' '}
                <span className="text-neutral-300">{formatTime(state.openedAt)}</span>
              </div>
              <div>
                <span className="text-neutral-600">half-open 진입:</span>{' '}
                <span className="text-neutral-300">{formatTime(state.halfOpenAt)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-neutral-500 pt-2 border-t border-neutral-800">
              <div>
                <span>임계치:</span> <span className="text-neutral-300">{state.policy.failureThreshold}</span>
              </div>
              <div>
                <span>cooldown:</span>{' '}
                <span className="text-neutral-300">{state.policy.cooldownMs}ms</span>
              </div>
              <div>
                <span>half-open 슬롯:</span>{' '}
                <span className="text-neutral-300">{state.policy.halfOpenTrial}</span>
              </div>
              <div>
                <span>reset window:</span>{' '}
                <span className="text-neutral-300">{state.policy.resetWindowMs}ms</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                data-testid={`cb-reset-${key}`}
                onClick={() => handleReset(key)}
                disabled={acting === key}
                className="px-3 py-1 bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-200 hover:text-white disabled:opacity-30"
              >
                강제 복구 (Reset)
              </button>
              <button
                data-testid={`cb-trip-${key}`}
                onClick={() => handleTrip(key)}
                disabled={acting === key}
                className="px-3 py-1 bg-red-700/50 border border-red-700 rounded text-xs text-red-100 hover:bg-red-700 hover:text-white disabled:opacity-30"
              >
                ⚠️ 강제 차단 (Trip)
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
