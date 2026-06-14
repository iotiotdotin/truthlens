import { Geist, Geist_Mono } from "next/font/google"
import type { Metadata } from "next"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils";

const description =
  "TruthLens is an AI diligence desk that stress-tests startup ideas through specialist judge agents and generates investment-ready analysis."

export const metadata: Metadata = {
  title: {
    default: "TruthLens",
    template: "%s | TruthLens",
  },
  description,
  applicationName: "TruthLens",
  openGraph: {
    title: "TruthLens",
    description,
    siteName: "TruthLens",
    type: "website",
  },
}

const geist = Geist({subsets:['latin'],variable:'--font-sans'})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", geist.variable)}
    >
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
