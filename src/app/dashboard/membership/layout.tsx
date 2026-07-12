export const metadata = { title: '멤버십 | Grimoire' }
// W-12: AuthProvider 는 상위 dashboard/layout.tsx 가 제공 — 중첩 제거(getProfile 이중호출 방지)
export default function MembershipLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
