'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/stores/app-store'
import { useSessionStore } from '@/stores/session-store'
import { ChatSpace } from '@/components/ChatSpace'
import { AppManager } from '@/components/AppManager'
import { SingleChatView } from '@/components/SingleChatView'
import { TemplateGallery } from '@/components/TemplateGallery'
import { Logo } from '@/components/Logo'
import { MessageSquare, LayoutGrid, FolderDown } from 'lucide-react'

type ViewMode = 'chat' | 'grid' | 'templates'

export default function Home() {
  const loadApps = useAppStore((state) => state.loadApps)
  const loadSessions = useSessionStore((state) => state.loadSessions)
  const sessions = useSessionStore((state) => state.sessions)

  const [viewMode, setViewMode] = useState<ViewMode>('chat')

  useEffect(() => {
    loadApps()
    loadSessions()
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
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200/80 bg-white">
        <div className="max-w-screen-2xl mx-auto px-5 h-[56px] flex items-center justify-between">
          <Logo />

          <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
            <button
              onClick={() => handleViewChange('chat')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150 ${
                viewMode === 'chat'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Chat
            </button>
            <button
              onClick={() => handleViewChange('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150 ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Grid
            </button>
            <button
              onClick={() => handleViewChange('templates')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150 ${
                viewMode === 'templates'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <FolderDown className="w-3.5 h-3.5" />
              Templates
            </button>
          </div>

          {/* 右端のスペーサー（ロゴとの対称性のため） */}
          <div className="w-[140px]" />
        </div>
      </header>

      {viewMode === 'chat' ? (
        <SingleChatView />
      ) : viewMode === 'templates' ? (
        <TemplateGallery />
      ) : (
        <main className="max-w-screen-xl mx-auto px-5 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <aside className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-slate-200 p-5 sticky top-8">
                <h2 className="text-sm font-semibold text-slate-900 mb-4">
                  アプリ管理
                </h2>
                <AppManager />
              </div>
            </aside>

            <div className="lg:col-span-3">
              <div className="mb-6">
                <h2 className="text-base font-semibold text-slate-900 mb-1">
                  チャットスペース
                </h2>
                <p className="text-sm text-slate-500">
                  各スペースにDifyアプリを割り当ててテストできます
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {sessions.map((session) => (
                  <div key={session.sessionId} className="h-[560px]">
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
