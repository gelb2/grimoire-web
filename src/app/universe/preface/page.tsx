import type { Metadata } from "next"
import { PrefaceViewer } from "@/features/universe/ui/PrefaceViewer"
import { prefaceData } from "@/features/universe/data/contentDataSource/preface"

export const metadata: Metadata = {
  title: "일러두기",
  description: "사슴악마 단편소설 유니버스 — 편집자 서문",
}

export default function PrefacePage() {
  return (
    <PrefaceViewer
      paragraphs={prefaceData.paragraphs}
      lastLine={prefaceData.lastLine}
    />
  )
}
