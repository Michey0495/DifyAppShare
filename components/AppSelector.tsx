'use client'

import { useState, useEffect, useRef } from 'react'
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
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const apps = useAppStore((state) => state.apps)
  const isModalOpen = useAppStore((state) => state.isModalOpen)
  const currentApp = currentAppId
    ? apps.find((app) => app.id === currentAppId)
    : null

  // モーダルが開いている時、ドロップダウンを強制的に閉じる
  useEffect(() => {
    if (isModalOpen) {
      setIsOpen(false)
    }
  }, [isModalOpen])

  // ドロップダウンの位置を計算（モーダルが閉じている時のみ）
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 200 })
  
  useEffect(() => {
    if (isOpen && !isModalOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      })
    }
  }, [isOpen, isModalOpen])

  // モーダルが開いている時は、ドロップダウンを絶対に表示しない
  const shouldShowDropdown = !isModalOpen && isOpen

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => {
          if (!isModalOpen) {
            setIsOpen(!isOpen)
          }
        }}
        disabled={isModalOpen}
        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium min-w-[200px] text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="flex-1 text-left truncate">
          {currentApp ? currentApp.name : 'アプリを選択'}
        </span>
        <ChevronDown className="w-4 h-4 flex-shrink-0 text-gray-700" />
      </button>

      {/* モーダルが開いている時は絶対にドロップダウンを表示しない */}
      {shouldShowDropdown && (
        <>
          <div
            className="fixed inset-0 z-[1]"
            onClick={() => setIsOpen(false)}
          />
          <div 
            ref={dropdownRef}
            className="fixed z-[2] max-h-60 overflow-y-auto bg-white border border-gray-300 rounded-lg shadow-xl"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
              minWidth: '200px',
            }}
          >
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

