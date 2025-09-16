"use client"

import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Film, Tv, Search, Heart, Clapperboard, Drama } from "lucide-react"
import { cn } from "@/lib/utils"
import { useFavorites } from "@/components/favorites-context"
import { Toaster } from "@/components/ui/toaster"

const navLinks = [
  { href: "/", label: "Início", icon: Clapperboard },
  { href: "/filmes", label: "Filmes", icon: Film },
  { href: "/series", label: "Séries", icon: Tv },
  { href: "/animes", label: "Animes", icon: Clapperboard },
  { href: "/doramas", label: "Doramas", icon: Drama },
]

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { favorites } = useFavorites()

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const query = formData.get("query") as string
    if (query.trim()) {
      router.push(`/search?query=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <>
      <Toaster />
      <header className="fixed inset-x-0 top-0 z-50 p-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between rounded-xl border border-white/10 bg-zinc-900/60 px-6 backdrop-blur-md">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 py-3">
              <img src="https://i.ibb.co/rKhmNPtV/primevicio.png" alt="PrimeVicio Logo" className="h-10 w-auto" />
            </Link>
            <nav className="hidden items-center gap-2 md:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    pathname === link.href
                      ? "bg-white/10 text-white"
                      : "text-zinc-400 hover:bg-white/5 hover:text-white",
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <form onSubmit={handleSearch} className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                name="query"
                placeholder="Buscar filmes e séries..."
                defaultValue={searchParams.get("query") || ""}
                className="w-full rounded-md border border-white/10 bg-white/5 py-1.5 pl-9 pr-3 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </form>
            <Link
              href="/favorites"
              className="rounded-md bg-white/5 p-2 text-zinc-300 ring-1 ring-inset ring-white/10 hover:bg-white/10 hover:text-white"
              aria-label="Favoritos"
            >
              <div className="relative">
                <Heart className="h-5 w-5" />
                {favorites.length > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] text-white">
                    {favorites.length}
                  </span>
                )}
              </div>
            </Link>
          </div>
        </div>
      </header>
    </>
  )
}