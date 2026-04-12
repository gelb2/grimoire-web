/** JSON 배열을 CSV 문자열로 변환 후 다운로드 */
export function downloadCsv(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return

  const keys = Object.keys(data[0])
  const header = keys.join(',')
  const rows = data.map(row =>
    keys.map(k => {
      const v = row[k]
      const str = v == null ? '' : String(v)
      // 쉼표/줄바꿈/따옴표가 있으면 escape
      return str.includes(',') || str.includes('\n') || str.includes('"')
        ? `"${str.replace(/"/g, '""')}"`
        : str
    }).join(','),
  )

  const bom = '\uFEFF' // UTF-8 BOM (Excel 한글 깨짐 방지)
  const csv = bom + [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
