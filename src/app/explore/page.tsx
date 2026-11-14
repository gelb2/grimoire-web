import { api } from '@/lib/api'
import ExploreClient from './ExploreClient'

export const dynamic = 'force-dynamic'

export default async function ExplorePage() {
  const [popular, recent, gifted] = await Promise.all([
    api.getPopularWorksPaginated(1, 12).catch(() => null),
    api.getRecentWorksPaginated(1, 12).catch(() => null),
    api.getMostGiftedAuthors(8).catch(() => []),
  ])
  return <ExploreClient initialData={popular && recent ? { popular, recent, gifted } : undefined} />
}
