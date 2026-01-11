import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { CartProvider } from "@/components/providers/cart-provider"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "Bazarika - Your Trusted Online Store in Bangladesh",
    template: "%s | Bazarika",
  },
  description:
    "Shop the best products at unbeatable prices. Electronics, fashion, home goods and more with fast delivery across Bangladesh.",
  keywords: ["online shopping", "Bangladesh", "e-commerce", "electronics", "fashion", "home goods"],
  authors: [{ name: "Bazarika" }],
  creator: "Bazarika",
  openGraph: {
    type: "website",
    locale: "en_BD",
    siteName: "Bazarika",
    title: "Bazarika - Your Trusted Online Store in Bangladesh",
    description: "Shop the best products at unbeatable prices with fast delivery across Bangladesh.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bazarika - Your Trusted Online Store in Bangladesh",
    description: "Shop the best products at unbeatable prices with fast delivery across Bangladesh.",
  },
  icons: {
    icon: [
      { url: "/icon-light-32x32.png", media: "(prefers-color-scheme: light)" },
      { url: "/icon-dark-32x32.png", media: "(prefers-color-scheme: dark)" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },
    generator: 'v0.app'
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <CartProvider>
            {children}
            <Toaster />
          </CartProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
