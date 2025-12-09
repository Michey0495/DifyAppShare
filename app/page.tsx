'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/stores/app-store'
import { useSessionStore } from '@/stores/session-store'
import { ChatSpace } from '@/components/ChatSpace'
import { AppManager } from '@/components/AppManager'
import { Settings } from 'lucide-react'

export default function Home() {
  const loadApps = useAppStore((state) => state.loadApps)
  const loadSessions = useSessionStore((state) => state.loadSessions)
  const sessions = useSessionStore((state) => state.sessions)

  useEffect(() => {
    loadApps()
    loadSessions()
  }, [loadApps, loadSessions])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                DifyAppShare
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Difyワークフローチャットテスト環境
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-6">
              <h2 className="text-lg font-semibold mb-4">アプリ管理</h2>
              <AppManager />
            </div>
          </aside>

          <div className="lg:col-span-3">
            <div className="mb-4">
              <h2 className="text-lg font-semibold mb-2">チャットスペース</h2>
              <p className="text-sm text-gray-600">
                各スペースにDifyアプリケーションを割り当ててチャットテストができます
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sessions.map((session) => (
                <div key={session.sessionId} className="h-[600px]">
                  <ChatSpace sessionId={session.sessionId} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

