"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

type Tab = 'stats' | 'authors' | 'credits' | 'audit'

interface AdminUser {
  id: string; name: string; email: string; role: string
}

interface AuthorRow {
  id: string; slug: string; name: string; email: string
  role: string; credits: number; plan: string; createdAt: string
}

export default function AdminPage() {
  const router = useRouter()
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('stats')

  useEffect(() => {
    // 관리자 인증 확인 — admin/stats 호출로 JWT + AdminGuard 검증
    api.adminGetStats()
      .then(() => {
        // stats 성공 = 관리자 인증 통과. profile 조회로 이름/이메일 가져옴
        api.getProfile()
          .then(u => {
            if (u.role === 'admin') setAdmin(u as unknown as AdminUser)
            else router.replace('/admin/login')
          })
          .catch(() => router.replace('/admin/login'))
      })
      .catch(() => router.replace('/admin/login'))
      .finally(() => setLoading(false))
  }, [router])

  if (loading || !admin) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-neutral-500">인증 확인 중...</p>
    </div>
  )

  return (
    <main className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">관리자 패널</h1>
        <span className="text-sm text-neutral-500">{admin.name} ({admin.email})</span>
      </div>

      {/* 탭 네비 */}
      <div className="flex gap-1 mb-6 border-b border-neutral-700">
        {(['stats', 'authors', 'credits', 'audit'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm transition ${tab === t ? 'border-b-2 border-white text-white font-medium' : 'text-neutral-500 hover:text-neutral-300'}`}>
            {{ stats: '통계', authors: '사용자', credits: '크레딧', audit: '감사 로그' }[t]}
          </button>
        ))}
      </div>

      {tab === 'stats' && <StatsTab />}
      {tab === 'authors' && <AuthorsTab />}
      {tab === 'credits' && <CreditsTab />}
      {tab === 'audit' && <AuditTab />}
    </main>
  )
}

// ─── fetch wrapper for admin page (public access to ApiClient.fetch) ───
// api.fetch is private, so we use the admin-specific methods

// ─── 통계 탭 ───
function StatsTab() {
  const [stats, setStats] = useState<any>(null)
  useEffect(() => { api.adminGetStats().then(setStats).catch(() => {}) }, [])

  if (!stats) return <p className="text-neutral-500">로딩 중...</p>

  const items = [
    { label: '작가 수', value: stats.totalAuthors },
    { label: '작품 수', value: stats.totalWorks },
    { label: '에피소드 수', value: stats.totalEpisodes },
    { label: '크레딧 소비', value: stats.totalCreditsConsumed },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map(item => (
        <div key={item.label} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-white">{item.value.toLocaleString()}</p>
          <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wider">{item.label}</p>
        </div>
      ))}
    </div>
  )
}

// ─── 사용자 관리 탭 ───
function AuthorsTab() {
  const [authors, setAuthors] = useState<AuthorRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const load = useCallback(() => {
    api.adminListAuthors({ page, limit: 20, q: query || undefined })
      .then(d => { setAuthors(d.items); setTotal(d.total) })
      .catch(() => {})
  }, [page, query])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" 작가를 삭제하시겠습니까?`)) return
    try {
      await api.adminDeleteAuthor(id)
      load()
    } catch (e: any) { alert(e.message) }
  }

  const handleRoleToggle = async (id: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin'
    if (!confirm(`역할을 ${newRole}로 변경하시겠습니까?`)) return
    try {
      await api.adminChangeRole(id, newRole)
      load()
    } catch (e: any) { alert(e.message) }
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <input value={query} onChange={e => { setQuery(e.target.value); setPage(1) }}
          placeholder="이름, 슬러그, 이메일 검색..."
          className="flex-1 px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-sm text-white placeholder-neutral-500" />
        <button onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-white text-black text-sm rounded-lg font-medium">{showCreate ? '취소' : '+ 새 작가'}</button>
      </div>

      {showCreate && <CreateAuthorForm onDone={() => { setShowCreate(false); load() }} />}

      <div className="border border-neutral-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900 text-neutral-500">
            <tr>
              <th className="px-4 py-2 text-left">작가</th>
              <th className="px-4 py-2 text-left">이메일</th>
              <th className="px-4 py-2 text-center">크레딧</th>
              <th className="px-4 py-2 text-center">플랜</th>
              <th className="px-4 py-2 text-center">역할</th>
              <th className="px-4 py-2 text-center">액션</th>
            </tr>
          </thead>
          <tbody>
            {authors.map(a => (
              <tr key={a.id} className="border-t border-neutral-800 hover:bg-neutral-900/50">
                <td className="px-4 py-2">
                  <span className="font-medium text-white">{a.name}</span>
                  <span className="text-neutral-500 ml-1 text-xs">@{a.slug}</span>
                </td>
                <td className="px-4 py-2 text-neutral-400">{a.email}</td>
                <td className="px-4 py-2 text-center text-white">{a.credits}</td>
                <td className="px-4 py-2 text-center">
                  <span className={`px-2 py-0.5 rounded text-xs ${a.plan === 'premium' ? 'bg-yellow-900/50 text-yellow-400' : a.plan === 'pro' ? 'bg-blue-900/50 text-blue-400' : 'bg-neutral-800 text-neutral-400'}`}>
                    {a.plan}
                  </span>
                </td>
                <td className="px-4 py-2 text-center">
                  <button onClick={() => handleRoleToggle(a.id, a.role)}
                    className={`px-2 py-0.5 rounded text-xs ${a.role === 'admin' ? 'bg-red-900/50 text-red-400' : 'bg-neutral-800 text-neutral-400'}`}>
                    {a.role}
                  </button>
                </td>
                <td className="px-4 py-2 text-center">
                  <button onClick={() => handleDelete(a.id, a.name)}
                    className="text-red-400 text-xs hover:underline">삭제</button>
                </td>
              </tr>
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

function CreateAuthorForm({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState({ email: '', name: '', slug: '', password: '', plan: 'free' })
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setError('')
    try {
      await api.adminCreateAuthor(form)
      onDone()
    } catch (e: any) { setError(e.message) }
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 mb-4">
      <div className="grid grid-cols-2 gap-3 mb-3">
        <input placeholder="이름" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white placeholder-neutral-500" />
        <input placeholder="슬러그" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
          className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white placeholder-neutral-500" />
        <input placeholder="이메일" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white placeholder-neutral-500" />
        <input placeholder="비밀번호" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
          className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white placeholder-neutral-500" />
      </div>
      <div className="flex gap-2 items-center">
        <select value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}
          className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white">
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="premium">Premium</option>
        </select>
        <button onClick={handleSubmit} className="px-4 py-2 bg-white text-black text-sm rounded-lg font-medium">생성</button>
        {error && <span className="text-red-400 text-xs">{error}</span>}
      </div>
    </div>
  )
}

// ─── 크레딧 관리 탭 ───
function CreditsTab() {
  const [authorId, setAuthorId] = useState('')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [result, setResult] = useState('')

  const handleGrant = async () => {
    try {
      const r = await api.adminGrantCredits(authorId, parseInt(amount), reason)
      setResult(`부여 완료: 잔액 ${r.credits}`)
    } catch (e: any) { setResult(`오류: ${e.message}`) }
  }

  const handleDeduct = async () => {
    try {
      const r = await api.adminDeductCredits(authorId, parseInt(amount), reason)
      setResult(`차감 완료: 잔액 ${r.credits}`)
    } catch (e: any) { setResult(`오류: ${e.message}`) }
  }

  return (
    <div className="max-w-lg">
      <div className="space-y-3 mb-4">
        <input placeholder="작가 ID" value={authorId} onChange={e => setAuthorId(e.target.value)}
          className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded text-sm text-white placeholder-neutral-500" />
        <input placeholder="수량" type="number" value={amount} onChange={e => setAmount(e.target.value)}
          className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded text-sm text-white placeholder-neutral-500" />
        <input placeholder="사유" value={reason} onChange={e => setReason(e.target.value)}
          className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded text-sm text-white placeholder-neutral-500" />
      </div>
      <div className="flex gap-2">
        <button onClick={handleGrant} className="px-4 py-2 bg-green-700 hover:bg-green-600 text-white text-sm rounded-lg">부여</button>
        <button onClick={handleDeduct} className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-sm rounded-lg">차감</button>
      </div>
      {result && <p className="mt-3 text-sm text-neutral-400">{result}</p>}
    </div>
  )
}

// ─── 감사 로그 탭 ───
function AuditTab() {
  const [logs, setLogs] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)

  useEffect(() => {
    api.adminGetAuditLogs({ page }).then(d => { setLogs(d.items); setTotal(d.total) }).catch(() => {})
  }, [page])

  if (logs.length === 0) return <p className="text-neutral-500 text-sm">감사 로그가 없습니다.</p>

  return (
    <div>
      <div className="border border-neutral-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900 text-neutral-500">
            <tr>
              <th className="px-4 py-2 text-left">시각</th>
              <th className="px-4 py-2 text-left">액션</th>
              <th className="px-4 py-2 text-left">대상</th>
              <th className="px-4 py-2 text-left">상세</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log: any) => (
              <tr key={log.id} className="border-t border-neutral-800">
                <td className="px-4 py-2 text-neutral-500">{new Date(log.createdAt).toLocaleString('ko-KR')}</td>
                <td className="px-4 py-2"><span className="bg-neutral-800 px-2 py-0.5 rounded text-xs">{log.action}</span></td>
                <td className="px-4 py-2 text-neutral-500 text-xs font-mono">{log.targetId?.slice(0, 8) ?? '-'}</td>
                <td className="px-4 py-2 text-xs text-neutral-500">{log.detail ? JSON.stringify(log.detail).slice(0, 60) : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
