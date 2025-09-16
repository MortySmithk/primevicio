import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { FavoritesProvider } from "@/components/favorites-context"
import { LayoutWrapper } from "@/components/layout-wrapper" // Importação adicionada

export const metadata: Metadata = {
  title: "PrimeVicio - Sua API de Filmes e Séries",
  description: "Explore um universo de entretenimento.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body className="bg-zinc-950">
        <FavoritesProvider>
          {/* O Header foi movido para dentro do LayoutWrapper */}
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </FavoritesProvider>
      </body>
    </html>
  )
}