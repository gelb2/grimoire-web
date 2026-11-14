import { cache } from 'react'
import { api } from './api'

// 같은 서버 렌더의 layout·metadata·page만 공유한다. 요청 간/사용자 간 전역 캐시가 아니다.
export const loadPublicAuthor = cache((author: string) => api.getAuthorSpace<any>(author))
export const loadPublicWork = cache((author: string, work: string) => api.getWork<any>(author, work))
export const loadPublicEpisode = cache((author: string, work: string, episode: string) => api.getEpisode<any>(author, work, episode))
