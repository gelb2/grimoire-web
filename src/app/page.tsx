import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Grimoire - 작가별 맞춤 소설 퍼블리싱 플랫폼",
  description: "작가별 맞춤 공간을 제공하는 소설 퍼블리싱 플랫폼",
}

export default function HomePage() {
  redirect("/explore")
}
