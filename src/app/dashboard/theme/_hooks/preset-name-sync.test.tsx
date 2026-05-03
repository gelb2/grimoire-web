/**
 * @vitest-environment jsdom
 *
 * Sprint: sprint-theme-editor-name-sync (P2-#10)
 * 계약: reports/sprint-theme-editor-name-sync-progress.md AC-1~AC-4
 *
 * useThemeName hook의 preset 자동 동기 정책을 검증한다.
 * AC-5(새로고침 후 초기화)는 hook 재mount = 새 인스턴스로 자연 보장 — 별도 it 1건으로 검증.
 */
import { describe, it, expect } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useThemeName } from "./useThemeName"

describe("테마 에디터 preset name 자동 동기 (useThemeName)", () => {
  it("AC-1: name 미수정 상태에서 preset 변경 → label로 동기", () => {
    const { result } = renderHook(() => useThemeName(""))
    expect(result.current.userEditedName).toBe(false)

    act(() => result.current.syncNameFromPreset("따뜻한 봄"))
    expect(result.current.themeName).toBe("따뜻한 봄")
    expect(result.current.userEditedName).toBe(false)
  })

  it("AC-2: name 직접 수정 후 preset 변경 → name 보존", () => {
    const { result } = renderHook(() => useThemeName(""))
    act(() => result.current.handleNameChange("내 첫 테마"))
    expect(result.current.userEditedName).toBe(true)
    expect(result.current.themeName).toBe("내 첫 테마")

    act(() => result.current.syncNameFromPreset("따뜻한 봄"))
    expect(result.current.themeName).toBe("내 첫 테마")
  })

  it("AC-3: name 직접 수정 후 빈 문자열로 비움 → preset 변경 → 빈 문자열 보존", () => {
    const { result } = renderHook(() => useThemeName(""))
    act(() => result.current.handleNameChange("X"))
    act(() => result.current.handleNameChange(""))
    expect(result.current.userEditedName).toBe(true)
    expect(result.current.themeName).toBe("")

    act(() => result.current.syncNameFromPreset("따뜻한 봄"))
    expect(result.current.themeName).toBe("")
  })

  it("AC-4: edit 모드 서버 자동 로드(setNameFromServer) 후 preset 변경 → label로 동기", () => {
    const { result } = renderHook(() => useThemeName(""))
    act(() => result.current.setNameFromServer("기존 저장된 이름"))
    expect(result.current.themeName).toBe("기존 저장된 이름")
    expect(result.current.userEditedName).toBe(false) // 서버 로드는 사용자 편집 아님

    act(() => result.current.syncNameFromPreset("따뜻한 봄"))
    expect(result.current.themeName).toBe("따뜻한 봄")
  })

  it("AC-5: hook 재마운트(새로고침 시뮬) 시 userEditedName 초기화 → preset label로 동기", () => {
    // 1차 mount — 사용자 편집
    const first = renderHook(() => useThemeName(""))
    act(() => first.result.current.handleNameChange("My Name"))
    expect(first.result.current.userEditedName).toBe(true)

    // 새로고침 시뮬 = unmount 후 새 mount
    first.unmount()
    const second = renderHook(() => useThemeName(""))
    expect(second.result.current.userEditedName).toBe(false)

    act(() => second.result.current.syncNameFromPreset("따뜻한 봄"))
    expect(second.result.current.themeName).toBe("따뜻한 봄")
  })

  it("회귀 가드: syncNameFromPreset에 label undefined 전달 시 themeName 변경 없음", () => {
    const { result } = renderHook(() => useThemeName("초기"))
    act(() => result.current.syncNameFromPreset(undefined))
    expect(result.current.themeName).toBe("초기")
  })
})
