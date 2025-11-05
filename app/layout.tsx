import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Sidebar } from "@/components/sidebar"
import { WindowDragRegion } from "@/components/window-drag-region"
import { ErrorBoundary } from "@/components/error-boundary"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "the stash",
  description: "mp3/wav storage and management",
  manifest: "/manifest.json",
  themeColor: "#000000",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black",
    title: "the stash",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <WindowDragRegion />
          <Sidebar />
          <main className="ml-0 md:ml-64 transition-all duration-300 min-h-screen pt-16 md:pt-0">
            {children}
          </main>
        </ErrorBoundary>
      </body>
    </html>
  )
}
