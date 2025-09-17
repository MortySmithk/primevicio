// app/download/layout.tsx

import React from 'react';

export const metadata = {
  // Oculta a página de buscadores como o Google
  robots: {
    index: false,
    follow: false,
  },
};

export default function DownloadLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full">
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
      </head>
      <body className="h-full bg-black">
        {children}
      </body>
    </html>
  );
}