"use client"

import { usePathname } from "next/navigation"
import { Header } from "@/components/header"

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // Não mostrar o cabeçalho em páginas que começam com /embed
  const showHeader = !pathname.startsWith('/embed')

  return (
    <>
      {showHeader && <Header />}
      {children}
    </>
  )
}