"use client"
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { CircuitBreakerPanel } from './components/CircuitBreakerPanel'

const SETTING_LABELS: Record<string, { label: string; type: 'toggle' | 'number' }> = {
  maintenance_mode: { label: '점검 모드', type: 'toggle' },
  recaptcha_enabled: { label: 'reCAPTCHA 활성화', type: 'toggle' },
  rate_limit_login: { label: '로그인 레이트리밋 (분당)', type: 'number' },
  rate_limit_register: { label: '회원가입 레이트리밋 (시간당)', type: 'number' },
}

export function SettingsTab() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => { api.adminGetSettings().then(setSettings).catch(() => {}) }, [])

  const handleToggle = async (key: string) => {
    const newVal = settings[key] === 'true' ? 'false' : 'true'
    setSaving(key)
    try {
      await api.adminUpdateSetting(key, newVal)
      setSettings(s => ({ ...s, [key]: newVal }))
    } catch (e: any) { alert(e.message) }
    finally { setSaving(null) }
  }

  const handleNumber = async (key: string, value: string) => {
    setSaving(key)
    try {
      await api.adminUpdateSetting(key, value)
      setSettings(s => ({ ...s, [key]: value }))
    } catch (e: any) { alert(e.message) }
    finally { setSaving(null) }
  }

  return (
    <div className="space-y-8">
      <div className="max-w-lg space-y-4">
        {Object.entries(SETTING_LABELS).map(([key, { label, type }]) => (
          <div key={key} className="flex items-center justify-between bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3">
            <span className="text-sm text-white">{label}</span>
            {type === 'toggle' ? (
              <button onClick={() => handleToggle(key)} disabled={saving === key}
                className={`relative w-12 h-6 rounded-full transition ${settings[key] === 'true' ? 'bg-green-600' : 'bg-neutral-700'}`}>
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${settings[key] === 'true' ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            ) : (
              <input type="number" value={settings[key] || ''} onChange={e => setSettings(s => ({ ...s, [key]: e.target.value }))}
                onBlur={e => handleNumber(key, e.target.value)}
                className="w-20 px-2 py-1 bg-neutral-800 border border-neutral-700 rounded text-sm text-white text-center" />
            )}
          </div>
        ))}

        <div className="pt-4 border-t border-neutral-800">
          <p className="text-xs text-neutral-600">설정 변경은 감사 로그에 기록됩니다. 점검 모드 활성화 시 모든 사용자 접근이 차단됩니다.</p>
        </div>
      </div>

      {/* PAY-S3 — Circuit Breaker 운영자 패널 (G2 = SettingsTab 내 sub-section "결제 인프라") */}
      <section className="max-w-2xl space-y-3">
        <div>
          <h2 className="text-sm font-medium text-white">결제 인프라 — Circuit Breaker</h2>
          <p className="text-xs text-neutral-600 mt-1">
            Polar SDK 호출 경계 가용성 정책. 사고 대응·연습 시 수동 차단/복구.
          </p>
        </div>
        <CircuitBreakerPanel />
      </section>
    </div>
  )
}
