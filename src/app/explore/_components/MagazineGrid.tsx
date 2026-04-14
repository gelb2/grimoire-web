"use client"

import { memo } from 'react'
import { WorkCard } from '@/components/WorkCard'

export interface MagazineWork {
  id: string
  title: string
  authorName?: string
  authorSlug?: string
  slug: string
  genre?: string
  episodeCount?: number
  viewCount?: number
}

// 매거진 비대칭 그리드 (memo로 불필요한 리렌더링 방지)
export const MagazineGrid = memo(function MagazineGrid({ works }: { works: MagazineWork[] }) {
  const groups: MagazineWork[][] = []
  for (let i = 0; i < works.length; i += 3) {
    groups.push(works.slice(i, i + 3))
  }

  return (
    <div className="space-y-4">
      {groups.map((group, gi) => {
        const isReversed = gi % 2 === 1
        const big = group[0]
        const smalls = group.slice(1)

        if (group.length < 3) {
          return (
            <div key={gi} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {group.map(work => (
                <WorkCard
                  key={work.id}
                  title={work.title}
                  authorName={work.authorName ?? ''}
                  authorSlug={work.authorSlug ?? ''}
                  workSlug={work.slug}
                  genre={work.genre}
                  episodeCount={work.episodeCount ?? 0}
                  viewCount={work.viewCount}
                  variant="platform"
                />
              ))}
            </div>
          )
        }

        const bigCard = (
          <WorkCard
            key={big.id}
            title={big.title}
            authorName={big.authorName ?? ''}
            authorSlug={big.authorSlug ?? ''}
            workSlug={big.slug}
            genre={big.genre}
            episodeCount={big.episodeCount ?? 0}
            viewCount={big.viewCount}
            variant="platform"
          />
        )

        const smallCards = (
          <div className="flex flex-col gap-4">
            {smalls.map(work => (
              <WorkCard
                key={work.id}
                title={work.title}
                authorName={work.authorName ?? ''}
                authorSlug={work.authorSlug ?? ''}
                workSlug={work.slug}
                genre={work.genre}
                episodeCount={work.episodeCount ?? 0}
                viewCount={work.viewCount}
                variant="platform"
              />
            ))}
          </div>
        )

        return (
          <div key={gi} className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4">
            {isReversed ? (
              <>
                <div className="md:order-2">{bigCard}</div>
                <div className="md:order-1">{smallCards}</div>
              </>
            ) : (
              <>
                {bigCard}
                {smallCards}
              </>
            )}
          </div>
        )
      })}
    </div>
  )
})
