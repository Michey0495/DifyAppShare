'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/stores/app-store'
import { ChevronDown } from 'lucide-react'

interface AppSelectorProps {
  sessionId: string
  currentAppId: string | null
  onSelect: (appId: string) => void
}

export function AppSelector({
  sessionId,
  currentAppId,
  onSelect,
}: AppSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const apps = useAppStore((state) => state.apps)
  const isModalOpen = useAppStore((state) => state.isModalOpen)
  const currentApp = currentAppId
    ? apps.find((app) => app.id === currentAppId)
    : null

  // モーダルが開いている時、ドロップダウンを閉じる
  useEffect(() => {
    if (isModalOpen && isOpen) {
      setIsOpen(false)
    }
  }, [isModalOpen, isOpen])

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium min-w-[200px] text-gray-900"
      >
        <span className="flex-1 text-left truncate">
          {currentApp ? currentApp.name : 'アプリを選択'}
        </span>
        <ChevronDown className="w-4 h-4 flex-shrink-0 text-gray-700" />
      </button>

      {isOpen && !isModalOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto relative">
            {apps.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-700">
                アプリケーションが登録されていません
              </div>
            ) : (
              apps.map((app) => (
                <button
                  key={app.id}
                  onClick={() => {
                    onSelect(app.id)
                    setIsOpen(false)
                  }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 transition-colors ${
                    currentAppId === app.id ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                  }`}
                >
                  <div className="font-medium">{app.name}</div>
                  {app.description && (
                    <div className="text-xs text-gray-700 truncate mt-0.5">
                      {app.description}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}

