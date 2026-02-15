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

  useEffect(() => {
    if (isModalOpen) setIsOpen(false)
  }, [isModalOpen])

  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 200,
  })

  useEffect(() => {
    if (isOpen && !isModalOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 220),
      })
    }
  }, [isOpen, isModalOpen])

  const shouldShowDropdown = !isModalOpen && isOpen

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => {
          if (!isModalOpen) setIsOpen(!isOpen)
        }}
        disabled={isModalOpen}
        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:border-slate-300 text-sm min-w-[180px] text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {currentApp && (
          <div className="w-5 h-5 rounded bg-indigo-50 flex items-center justify-center shrink-0 text-[10px] font-semibold text-indigo-600">
            {currentApp.name.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="flex-1 text-left truncate font-medium">
          {currentApp ? currentApp.name : 'アプリを選択'}
        </span>
        <ChevronDown className="w-3.5 h-3.5 shrink-0 text-slate-400" />
      </button>

      {shouldShowDropdown && (
        <>
          <div
            className="fixed inset-0 z-[1]"
            onClick={() => setIsOpen(false)}
          />
          <div
            ref={dropdownRef}
            className="fixed z-[2] max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
            }}
          >
            {apps.length === 0 ? (
              <div className="px-3 py-3 text-sm text-slate-400">
                アプリ未登録
              </div>
            ) : (
              <div className="py-1">
                {apps.map((app) => (
                  <button
                    key={app.id}
                    onClick={() => {
                      onSelect(app.id)
                      setIsOpen(false)
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
                      currentAppId === app.id
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded flex items-center justify-center shrink-0 text-[10px] font-semibold ${
                        currentAppId === app.id
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {app.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{app.name}</div>
                      {app.description && (
                        <div className="text-xs text-slate-400 truncate mt-0.5">
                          {app.description}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
