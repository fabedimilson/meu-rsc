import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meu RSC - IFAM",
  description: "Portal de Reconhecimento de Saberes e Competências dos servidores PCCTAE do Instituto Federal do Amazonas.",
  metadataBase: new URL("https://meu-rsc.vercel.app"),
  openGraph: {
    title: "Meu RSC - IFAM",
    description: "Plataforma oficial para solicitação e acompanhamento do RSC no IFAM.",
    url: "https://meu-rsc.vercel.app",
    siteName: "Meu RSC - IFAM",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Meu RSC - IFAM",
      },
    ],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  robots: "index, follow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700;900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
        <meta name="google" content="notranslate" />
        <style>{`
          .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
            user-select: none;
          }
          .icon-fill {
            font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
          }
          * { font-family: 'Public Sans', system-ui, sans-serif; }
        `}</style>
      </head>
      <body className="antialiased bg-[#fbf9f8] text-[#1b1c1c]">
        {children}
      </body>
    </html>
  );
}
