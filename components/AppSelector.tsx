'use client'

import { useState } from 'react'
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
  const currentApp = currentAppId
    ? apps.find((app) => app.id === currentAppId)
    : null

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium min-w-[200px]"
      >
        <span className="flex-1 text-left truncate">
          {currentApp ? currentApp.name : 'アプリを選択'}
        </span>
        <ChevronDown className="w-4 h-4 flex-shrink-0" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
            {apps.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">
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
                    currentAppId === app.id ? 'bg-blue-50 text-blue-600' : ''
                  }`}
                >
                  <div className="font-medium">{app.name}</div>
                  {app.description && (
                    <div className="text-xs text-gray-500 truncate">
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

