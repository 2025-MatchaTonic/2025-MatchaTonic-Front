import React from "react"
import type { Metadata, Viewport } from 'next'
import { JetBrains_Mono } from 'next/font/google'

import './globals.css'

const _jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'], 
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jetbrains-mono' 
})

export const metadata: Metadata = {
  title: 'ProMate - 기획은 줄이고 실행은 앞당기세요',
  description: '소규모 학생 팀을 위한 AI 기반 프로젝트 시작 플랫폼. 프로젝트 세팅을 자동으로 완성해드립니다.',
}

export const viewport: Viewport = {
  themeColor: '#31694E',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body className={`${_jetbrainsMono.variable} font-sans antialiased font-medium text-base`}>{children}</body>
    </html>
  )
}
