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
        <script src="https://cdn.jsdelivr.net/npm/disable-devtool@latest"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              DisableDevtool({
                disableMenu: true,
                disableSelect: false,
                disableCopy: false,
                disableCut: true,
                disablePaste: false,
                clearLog: true,
                interval: 500,
                detectors: [0, 1, 3, 4, 5, 6, 7],
                ondevtoolopen: function(type, next) {
                  window.location.href = 'https://i.ibb.co/5hH6bbp2/tentando-inspecionar-o-site.png';
                }
              });
            `,
          }}
        />
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