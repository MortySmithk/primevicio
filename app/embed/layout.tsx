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
    <html lang="pt-BR" className="h-screen">
      <body className="h-screen bg-black">{children}</body>
    </html>
  );
}