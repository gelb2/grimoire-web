"use client"

import Link from 'next/link'
import { useAuth } from '@/features/auth'

const quickActions = [
  { href: '/dashboard/upload', title: '원고 업로드', desc: 'MD, TXT, DOCX' },
  { href: '/dashboard/episodes', title: '원고 관리', desc: '파일 덮어쓰기 · 삭제' },
  { href: '/dashboard/theme', title: '테마 에디터', desc: '작가공간 디자인' },
  { href: '/dashboard/chat', title: 'AI 어시스턴트', desc: '원고 분석·캐릭터·문체' },
  { href: '/dashboard/analysis', title: 'AI 일관성 분석', desc: '설정·문체·캐릭터 검증' },
  { href: '/dashboard/analysis/history', title: '분석 기록', desc: '과거 분석 결과 열람' },
  { href: '/dashboard/analytics', title: '작품 통계', desc: '조회수·좋아요·구독' },
  { href: '/dashboard/credits', title: '크레딧 충전', desc: '크레딧 관리' },
  { href: '/dashboard/profile', title: '프로필 설정', desc: '작가 정보 수정' },
  { href: '/library', title: '서재', desc: '작품 + 구독 관리' },
]

export function QuickActions() {
  const { user } = useAuth()
  const allActions = user ? [{ href: `/${user.slug}`, title: '내 작가 공간', desc: '독자에게 보이는 내 공간' }, ...quickActions] : quickActions

  return (
    <section className="mb-12">
      <div className="flex items-baseline gap-4 mb-2">
        <h2 className="text-2xl font-black text-black">빠른 액션</h2>
        <div className="flex-1 h-px bg-black" />
      </div>
      {allActions.map((action, i) => (
        <Link
          key={action.href}
          href={action.href}
          className="group grid grid-cols-[50px_1fr_auto] items-baseline gap-4 py-4 border-b border-neutral-200 hover:border-black transition-colors"
        >
          <span className="text-sm font-mono text-neutral-300 group-hover:text-[#e53e3e] transition-colors">
            {String(i + 1).padStart(2, '0')}
          </span>
          <div>
            <h3 className="text-base font-bold text-black group-hover:text-[#e53e3e] transition-colors">{action.title}</h3>
            <p className="text-xs text-neutral-500">{action.desc}</p>
          </div>
          <span className="text-xs text-neutral-400 group-hover:text-black transition-colors">&rarr;</span>
        </Link>
      ))}
    </section>
  )
}
