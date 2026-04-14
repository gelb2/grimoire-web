// 스켈레톤 로딩 그리드
export function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4">
      <div className="h-48 rounded-lg bg-neutral-100 animate-pulse" />
      <div className="flex flex-col gap-4">
        <div className="h-[92px] rounded-lg bg-neutral-100 animate-pulse" />
        <div className="h-[92px] rounded-lg bg-neutral-100 animate-pulse" />
      </div>
    </div>
  )
}
