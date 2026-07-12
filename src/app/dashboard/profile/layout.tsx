export const metadata = { title: '프로필 설정 | Grimoire' }
// W-12: AuthProvider 는 상위 dashboard/layout.tsx 가 제공 — 중첩 제거(getProfile 이중호출 방지)
export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
