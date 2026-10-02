import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import { TooltipProvider } from "@/components/ui/tooltip"

import { BRAND_NAME, BRAND_TAGLINE, SITE_URL } from "@/lib/brand"

import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: BRAND_NAME,
    template: `%s · ${BRAND_NAME}`,
  },
  description: BRAND_TAGLINE,
  openGraph: {
    title: BRAND_NAME,
    description: BRAND_TAGLINE,
    url: SITE_URL,
    siteName: BRAND_NAME,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND_NAME,
    description: BRAND_TAGLINE,
  },
}

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: BRAND_NAME,
      url: SITE_URL,
    },
    {
      "@type": "WebSite",
      name: BRAND_NAME,
      url: SITE_URL,
      description: BRAND_TAGLINE,
    },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD requires raw script text; `<` is escaped below.
          dangerouslySetInnerHTML={{
            // Escaping `<` prevents injected values from closing this script element.
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
        />
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  )
}
