import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DifyAppShare - Difyワークフローチャットテスト',
  description: '複数のDifyワークフローアプリケーションを統合管理し、ブラウザ上で簡単にチャットテストができる専用ウェブアプリケーション',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}

