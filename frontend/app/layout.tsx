/** @format */

import type {Metadata} from "next"
import {
  Geist,
  Geist_Mono,
  Space_Grotesk,
  Inter,
  JetBrains_Mono
} from "next/font/google"
import "./globals.css"

import {AuthProvider} from "@/lib/auth-context"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"]
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"]
})

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"]
})

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"]
})

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"]
})

export const metadata: Metadata = {
  title: "Job Dashboard",
  description: "Track your job applications"
}

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html
      lang='de'
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}>
      <body className='min-h-full flex flex-col'>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
