// app/player/layout.tsx
import React from 'react';
import '../globals.css'; // Importa os estilos globais para o tailwind funcionar

export const metadata = {
  // Oculta a página de buscadores como o Google
  robots: {
    index: false,
    follow: false,
  },
};

export default function PlayerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full bg-black">
      <head>
        {/* Script para desativar ferramentas de desenvolvedor, como nas outras páginas */}
        <script src="https://cdn.jsdelivr.net/npm/disable-devtool@latest" async></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof DisableDevtool === 'function') {
                DisableDevtool({
                  disableMenu: true,
                  ondevtoolopen: function() {
                    window.location.href = 'https://i.ibb.co/5hH6bbp2/tentando-inspecionar-o-site.png';
                  }
                });
              }
            `,
          }}
        />
      </head>
      <body className="h-full">
        {children}
      </body>
    </html>
  );
}