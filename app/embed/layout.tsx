// app/embed/layout.tsx

export const metadata = {
  // Oculta a página de buscadores como o Google
  robots: {
    index: false,
    follow: false,
  },
};

export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="h-full bg-black">{children}</body>
    </html>
  );
}