import type { Metadata } from "next"
import { AfterwrdViewer } from "@/features/universe/ui/AfterwrdViewer"
import { afterwordData } from "@/features/universe/data/contentDataSource/afterword"

export const metadata: Metadata = {
  title: "후기",
  description: "후기 — Grimoire",
}

export default function AfterwordPage() {
  return (
    <AfterwrdViewer
      glitchText={afterwordData.glitchText}
      footnote={afterwordData.footnote}
    />
  )
}
