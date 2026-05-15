/**
 * features/account — 사용자 본인 영역 (USER-SOFT-DELETE sprint §15-1 web).
 *
 * 본 slice는 본인 계정 영역 (프로필/탈퇴/익명화) 컴포넌트를 박제한다.
 * 관리자 영역(force delete / GDPR anonymize)은 `app/admin/tabs/UsersTab.tsx` 영역.
 */
export { AccountDeleteDialog } from './AccountDeleteDialog'
export type { AccountDeleteDialogProps } from './AccountDeleteDialog'
