"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { WorksTab } from './tabs/WorksTab'
import { CommentsTab } from './tabs/CommentsTab'
import { PaymentsTab } from './tabs/PaymentsTab'
import { AccessLogsTab } from './tabs/AccessLogsTab'
import { SanctionsTab } from './tabs/SanctionsTab'
import { ReportsTab } from './tabs/ReportsTab'
import { SettingsTab } from './tabs/SettingsTab'
import { AnnouncementsTab } from './tabs/AnnouncementsTab'
import { FeaturedTab } from './tabs/FeaturedTab'
import { RevenueTab } from './tabs/RevenueTab'
import { ThemesTab } from './tabs/ThemesTab'
import { CreditsTab } from './tabs/CreditsTab'
import { UsersTab } from './tabs/UsersTab'

type Tab = 'stats' | 'authors' | 'users' | 'works' | 'sanctions' | 'reports' | 'comments' | 'payments' | 'revenue' | 'credits' | 'announcements' | 'featured' | 'themes' | 'access' | 'settings' | 'audit'

const TAB_LABELS: Record<Tab, string> = {
  stats: '통계', authors: '사용자', users: '탈퇴/익명화', works: '콘텐츠', sanctions: '제재',
  reports: '신고', comments: '댓글', payments: '결제', revenue: '수익',
  credits: '포인트',
  announcements: '공지', featured: '추천', themes: '테마',
  access: '접근 로그', settings: '설정', audit: '감사 로그',
}

interface AdminUser { id: string; name: string; email: string; role: string }

export default function AdminPage() {
  const router = useRouter()
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('stats')

  useEffect(() => {
    api.adminGetStats()
      .then(() => api.getProfile().then(u => {
        if (u.role === 'admin') setAdmin(u as unknown as AdminUser)
        else router.replace('/admin/login')
      }).catch(() => router.replace('/admin/login')))
      .catch(() => router.replace('/admin/login'))
      .finally(() => setLoading(false))
  }, [router])

  if (loading || !admin) return (
    <div className="min-h-screen flex items-center justify-center"><p className="text-neutral-500">인증 확인 중...</p></div>
  )

  return (
    <main className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">관리자 패널</h1>
        <span className="text-sm text-neutral-500">{admin.name} ({admin.email})</span>
      </div>

      <div className="flex gap-1 mb-6 border-b border-neutral-700 overflow-x-auto">
        {(Object.keys(TAB_LABELS) as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm whitespace-nowrap transition ${tab === t ? 'border-b-2 border-white text-white font-medium' : 'text-neutral-500 hover:text-neutral-300'}`}>
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {tab === 'stats' && <StatsTab />}
      {tab === 'authors' && <AuthorsTab />}
      {tab === 'users' && <UsersTab />}
      {tab === 'works' && <WorksTab />}
      {tab === 'sanctions' && <SanctionsTab />}
      {tab === 'reports' && <ReportsTab />}
      {tab === 'comments' && <CommentsTab />}
      {tab === 'payments' && <PaymentsTab />}
      {tab === 'revenue' && <RevenueTab />}
      {tab === 'credits' && <CreditsTab />}
      {tab === 'announcements' && <AnnouncementsTab />}
      {tab === 'featured' && <FeaturedTab />}
      {tab === 'themes' && <ThemesTab />}
      {tab === 'access' && <AccessLogsTab />}
      {tab === 'settings' && <SettingsTab />}
      {tab === 'audit' && <AuditTab />}
    </main>
  )
}

// ─── 통계 탭 (KPI + 시계열 차트) ───
function StatsTab() {
  const [stats, setStats] = useState<any>(null)
  const [chart, setChart] = useState<{ date: string; count: number }[]>([])
  const [metric, setMetric] = useState('signups')

  useEffect(() => { api.adminGetStats().then(setStats).catch(() => {}) }, [])
  useEffect(() => { api.adminGetTimeseries(metric, 30).then(setChart).catch(() => setChart([])) }, [metric])

  if (!stats) return <p className="text-neutral-500">로딩 중...</p>

  const items = [
    { label: '작가 수', value: stats.totalAuthors },
    { label: '작품 수', value: stats.totalWorks },
    { label: '에피소드 수', value: stats.totalEpisodes },
    { label: '포인트 소비', value: stats.totalCreditsConsumed },
    { label: '댓글 수', value: stats.totalComments },
    { label: '결제 완료', value: stats.totalPaymentsCompleted },
  ]

  const maxCount = Math.max(...chart.map(c => c.count), 1)

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {items.map(item => (
          <div key={item.label} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-white">{(item.value ?? 0).toLocaleString()}</p>
            <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wider">{item.label}</p>
          </div>
        ))}
      </div>

      {/* 시계열 차트 */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-white">30일 추이</h3>
          <select value={metric} onChange={e => setMetric(e.target.value)}
            className="px-2 py-1 bg-neutral-800 border border-neutral-700 rounded text-xs text-white">
            <option value="signups">가입자</option>
            <option value="views">조회수</option>
            <option value="payments">결제</option>
          </select>
        </div>
        {chart.length === 0 ? <p className="text-neutral-500 text-sm text-center py-8">데이터 없음</p> : (
          <div className="flex items-end gap-px h-32">
            {chart.map((c, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end group relative">
                <div className="w-full bg-blue-500/80 rounded-t-sm transition-all" style={{ height: `${(c.count / maxCount) * 100}%`, minHeight: c.count > 0 ? '2px' : '0' }} />
                <div className="absolute -top-6 bg-neutral-800 text-white text-[10px] px-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">
                  {c.date.slice(5)} : {c.count}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── 사용자 관리 탭 (+ 플랜변경) ───
function AuthorsTab() {
  const [authors, setAuthors] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [planEdit, setPlanEdit] = useState<string | null>(null)

  const load = useCallback(() => {
    api.adminListAuthors({ page, limit: 20, q: query || undefined })
      .then(d => { setAuthors(d.items); setTotal(d.total) }).catch(() => {})
  }, [page, query])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" 작가를 삭제하시겠습니까?`)) return
    try { await api.adminDeleteAuthor(id); load() } catch (e: any) { alert(e.message) }
  }

  const handleRoleToggle = async (id: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin'
    if (!confirm(`역할을 ${newRole}로 변경하시겠습니까?`)) return
    try { await api.adminChangeRole(id, newRole); load() } catch (e: any) { alert(e.message) }
  }

  const handlePlanChange = async (id: string, plan: string, days: number) => {
    try { await api.adminChangePlan(id, plan, days); setPlanEdit(null); load() } catch (e: any) { alert(e.message) }
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <input value={query} onChange={e => { setQuery(e.target.value); setPage(1) }}
          placeholder="이름, 슬러그, 이메일 검색..." className="flex-1 px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-sm text-white placeholder-neutral-500" />
        <button onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-white text-black text-sm rounded-lg font-medium">{showCreate ? '취소' : '+ 새 작가'}</button>
      </div>

      {showCreate && <CreateAuthorForm onDone={() => { setShowCreate(false); load() }} />}

      <div className="border border-neutral-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900 text-neutral-500">
            <tr>
              <th className="px-3 py-2 text-left">작가</th>
              <th className="px-3 py-2 text-left">이메일</th>
              <th className="px-3 py-2 text-center">포인트</th>
              <th className="px-3 py-2 text-center">플랜</th>
              <th className="px-3 py-2 text-center">역할</th>
              <th className="px-3 py-2 text-center">액션</th>
            </tr>
          </thead>
          <tbody>
            {authors.map(a => (
              <>
                <tr key={a.id} className="border-t border-neutral-800 hover:bg-neutral-900/50">
                  <td className="px-3 py-2"><span className="font-medium text-white">{a.name}</span> <span className="text-neutral-500 text-xs">@{a.slug}</span></td>
                  <td className="px-3 py-2 text-neutral-400 text-xs">{a.email}</td>
                  <td className="px-3 py-2 text-center text-white">{(a.credits ?? 0).toLocaleString('ko-KR')}</td>
                  <td className="px-3 py-2 text-center">
                    <button onClick={() => setPlanEdit(planEdit === a.id ? null : a.id)}
                      className={`px-2 py-0.5 rounded text-xs ${a.plan === 'premium' ? 'bg-yellow-900/50 text-yellow-400' : a.plan === 'pro' ? 'bg-blue-900/50 text-blue-400' : 'bg-neutral-800 text-neutral-400'}`}>
                      {a.plan}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button onClick={() => handleRoleToggle(a.id, a.role)}
                      className={`px-2 py-0.5 rounded text-xs ${a.role === 'admin' ? 'bg-red-900/50 text-red-400' : 'bg-neutral-800 text-neutral-400'}`}>{a.role}</button>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button onClick={() => handleDelete(a.id, a.name)} className="text-red-400 text-xs hover:underline">삭제</button>
                  </td>
                </tr>
                {planEdit === a.id && (
                  <tr key={`plan-${a.id}`}><td colSpan={6} className="px-3 py-2 bg-neutral-900">
                    <PlanChangeForm currentPlan={a.plan} onSubmit={(plan, days) => handlePlanChange(a.id, plan, days)} onCancel={() => setPlanEdit(null)} />
                  </td></tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {total > 20 && (
        <div className="flex justify-center gap-2 mt-4">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border border-neutral-700 rounded text-sm disabled:opacity-30">&larr;</button>
          <span className="px-3 py-1 text-sm text-neutral-400">{page} / {Math.ceil(total / 20)}</span>
          <button disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border border-neutral-700 rounded text-sm disabled:opacity-30">&rarr;</button>
        </div>
      )}
    </div>
  )
}

function PlanChangeForm({ currentPlan, onSubmit, onCancel }: { currentPlan: string; onSubmit: (plan: string, days: number) => void; onCancel: () => void }) {
  const [plan, setPlan] = useState(currentPlan)
  const [days, setDays] = useState(30)
  return (
    <div className="flex gap-2 items-center">
      <select value={plan} onChange={e => setPlan(e.target.value)} className="px-2 py-1 bg-neutral-800 border border-neutral-700 rounded text-xs text-white">
        <option value="free">Free</option><option value="pro">Pro</option><option value="premium">Premium</option>
      </select>
      <input type="number" value={days} onChange={e => setDays(parseInt(e.target.value) || 0)} placeholder="일수"
        className="w-20 px-2 py-1 bg-neutral-800 border border-neutral-700 rounded text-xs text-white" />
      <span className="text-neutral-500 text-xs">일</span>
      <button onClick={() => onSubmit(plan, days)} className="px-3 py-1 bg-white text-black text-xs rounded font-medium">변경</button>
      <button onClick={onCancel} className="text-neutral-500 text-xs">취소</button>
    </div>
  )
}

function CreateAuthorForm({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState({ email: '', name: '', slug: '', password: '', plan: 'free' })
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setError('')
    try { await api.adminCreateAuthor(form); onDone() } catch (e: any) { setError(e.message) }
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 mb-4">
      <div className="grid grid-cols-2 gap-3 mb-3">
        {['이름', '슬러그', '이메일', '비밀번호'].map((ph, i) => (
          <input key={ph} placeholder={ph} type={i === 3 ? 'password' : 'text'}
            value={Object.values(form)[i + 2 <= 3 ? i : i]}
            onChange={e => setForm(f => ({ ...f, [['name', 'slug', 'email', 'password'][i]]: e.target.value }))}
            className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white placeholder-neutral-500" />
        ))}
      </div>
      <div className="flex gap-2 items-center">
        <select value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value }))} className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white">
          <option value="free">Free</option><option value="pro">Pro</option><option value="premium">Premium</option>
        </select>
        <button onClick={handleSubmit} className="px-4 py-2 bg-white text-black text-sm rounded-lg font-medium">생성</button>
        {error && <span className="text-red-400 text-xs">{error}</span>}
      </div>
    </div>
  )
}

// ─── 감사 로그 탭 ───
function AuditTab() {
  const [logs, setLogs] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)

  useEffect(() => { api.adminGetAuditLogs({ page }).then(d => { setLogs(d.items); setTotal(d.total) }).catch(() => {}) }, [page])

  if (logs.length === 0) return <p className="text-neutral-500 text-sm">감사 로그가 없습니다.</p>

  return (
    <div>
      <div className="border border-neutral-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900 text-neutral-500">
            <tr><th className="px-4 py-2 text-left">시각</th><th className="px-4 py-2 text-left">액션</th><th className="px-4 py-2 text-left">대상</th><th className="px-4 py-2 text-left">상세</th></tr>
          </thead>
          <tbody>
            {logs.map((log: any) => (
              <tr key={log.id} className="border-t border-neutral-800">
                <td className="px-4 py-2 text-neutral-500 text-xs">{new Date(log.createdAt).toLocaleString('ko-KR')}</td>
                <td className="px-4 py-2"><span className="bg-neutral-800 px-2 py-0.5 rounded text-xs">{log.action}</span></td>
                <td className="px-4 py-2 text-neutral-500 text-xs font-mono">{log.targetId?.slice(0, 8) ?? '-'}</td>
                <td className="px-4 py-2 text-xs text-neutral-500">{log.detail ? JSON.stringify(log.detail).slice(0, 80) : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
