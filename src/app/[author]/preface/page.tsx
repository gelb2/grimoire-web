import type { Metadata } from "next"
import { PrefaceViewer } from "@/features/universe/ui/PrefaceViewer"
import { prefaceData } from "@/features/universe/data/contentDataSource/preface"

export const metadata: Metadata = {
  title: "일러두기",
  description: "편집자 서문 — Grimoire",
}

export default function PrefacePage() {
  return (
    <PrefaceViewer
      paragraphs={prefaceData.paragraphs}
      lastLine={prefaceData.lastLine}
    />
  )
}
