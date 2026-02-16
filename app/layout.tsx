import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { BottomNav } from "./components/BottomNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LetsGo",
  description: "Fitness Progress",
  manifest: "/manifest.json",
  themeColor: "#000000",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LetsGo",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="LetsGo" />
        <meta name="theme-color" content="#000000" />
      </head>

      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          {/* App Background wie in deinem Figma Code */}
          <div className="min-h-screen bg-gradient-to-br from-neutral-100 via-neutral-50 to-neutral-200 dark:from-neutral-950 dark:via-black dark:to-neutral-900 transition-colors">
            {/* Content + Platz für BottomNav */}
            <div className="mx-auto max-w-md px-4 pt-4 pb-28">
              {children}
            </div>
          </div>

          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
