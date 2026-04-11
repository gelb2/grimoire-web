"use client"
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

export function RevenueTab() {
  const [data, setData] = useState<any>(null)
  useEffect(() => { api.adminGetRevenue().then(setData).catch(() => {}) }, [])

  if (!data) return <p className="text-neutral-500">로딩 중...</p>

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-green-400">₩{(data.totalRevenue ?? 0).toLocaleString()}</p>
          <p className="text-xs text-neutral-500 mt-1">총 매출</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-blue-400">₩{(data.monthlyRevenue ?? 0).toLocaleString()}</p>
          <p className="text-xs text-neutral-500 mt-1">이번 달</p>
        </div>
      </div>

      {data.products?.length > 0 && (
        <div className="border border-neutral-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-900 text-neutral-500">
              <tr><th className="px-4 py-2 text-left">상품</th><th className="px-4 py-2 text-center">건수</th><th className="px-4 py-2 text-right">매출</th></tr>
            </thead>
            <tbody>
              {data.products.map((p: any) => (
                <tr key={p.productId} className="border-t border-neutral-800">
                  <td className="px-4 py-2 text-white">{p.productId}</td>
                  <td className="px-4 py-2 text-center text-neutral-400">{p.count}건</td>
                  <td className="px-4 py-2 text-right text-green-400">₩{(p.total ?? 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
