'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/stores/app-store'
import { useSessionStore } from '@/stores/session-store'
import { ChatSpace } from '@/components/ChatSpace'
import { AppManager } from '@/components/AppManager'
import { SingleChatView } from '@/components/SingleChatView'
import { MessageSquare, LayoutGrid, Settings } from 'lucide-react'

type ViewMode = 'chat' | 'grid'

export default function Home() {
  const loadApps = useAppStore((state) => state.loadApps)
  const loadSessions = useSessionStore((state) => state.loadSessions)
  const sessions = useSessionStore((state) => state.sessions)

  const [viewMode, setViewMode] = useState<ViewMode>('chat')

  useEffect(() => {
    loadApps()
    loadSessions()
    // localStorageから前回のビューモードを復元
    const saved = localStorage.getItem('dify-app-share-view-mode')
    if (saved === 'chat' || saved === 'grid') {
      setViewMode(saved)
    }
  }, [loadApps, loadSessions])

  const handleViewChange = (mode: ViewMode) => {
    setViewMode(mode)
    localStorage.setItem('dify-app-share-view-mode', mode)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">DifyAppShare</h1>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => handleViewChange('chat')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'chat'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Chat
            </button>
            <button
              onClick={() => handleViewChange('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Grid
            </button>
          </div>

          <div className="w-20" />
        </div>
      </header>

      {viewMode === 'chat' ? (
        <SingleChatView />
      ) : (
        <main className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <aside className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-4 sticky top-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-900">
                  アプリ管理
                </h2>
                <AppManager />
              </div>
            </aside>

            <div className="lg:col-span-3">
              <div className="mb-4">
                <h2 className="text-lg font-semibold mb-2 text-gray-900">
                  チャットスペース
                </h2>
                <p className="text-sm text-gray-700">
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
      )}
    </div>
  )
}
