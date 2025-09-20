// components/layout-wrapper.tsx
"use client"

import { usePathname } from "next/navigation"
import { Header } from "@/components/Header"
import { Suspense } from 'react'

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // CORREÇÃO: Adicionado a verificação para não mostrar o header também na página /player
  const showHeader = !pathname.startsWith('/embed') && !pathname.startsWith('/player')

  return (
    <>
      {showHeader && (
        <Suspense fallback={null}>
          <Header />
        </Suspense>
      )}
      {children}
    </>
  )
}