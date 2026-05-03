"use client"

import { useCallback, useState } from "react"

/**
 * 테마 에디터 — themeName state + preset 변경 시 자동 동기 정책 (P2-#10 UX).
 *
 * 정책:
 * - 사용자가 name input을 직접 수정한 적이 없으면(`userEditedName === false`),
 *   preset 변경 시 preset label로 자동 동기.
 * - 사용자가 한 번이라도 input에 onChange를 발생시키면(`userEditedName === true`),
 *   이후 preset 변경 시 themeName 보존(덮어쓰기 금지).
 * - 자동 로드(useEffect의 `setNameFromServer`)는 사용자 편집이 아니므로 flag 변경 안 함.
 *
 * Sprint 계약: reports/sprint-theme-editor-name-sync-progress.md AC-1~AC-5
 */
export function useThemeName(initial = "") {
  const [themeName, setThemeName] = useState(initial)
  const [userEditedName, setUserEditedName] = useState(false)

  /** 사용자 input 이벤트로 호출 — flag를 true로 마킹 */
  const handleNameChange = useCallback((name: string) => {
    setThemeName(name)
    setUserEditedName(true)
  }, [])

  /** 서버 자동 로드 시 호출 — flag 변경 없음 */
  const setNameFromServer = useCallback((name: string) => {
    setThemeName(name)
  }, [])

  /** preset 변경 시 호출 — userEditedName=false일 때만 label로 동기 */
  const syncNameFromPreset = useCallback((label?: string) => {
    if (label && !userEditedName) setThemeName(label)
  }, [userEditedName])

  return {
    themeName,
    userEditedName,
    handleNameChange,
    setNameFromServer,
    syncNameFromPreset,
  }
}
