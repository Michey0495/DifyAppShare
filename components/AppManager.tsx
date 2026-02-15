'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/stores/app-store'
import { DifyApp } from '@/types'
import { Plus, X, Edit2 } from 'lucide-react'

// コピペ時の不可視文字・引用符・改行を除去
function sanitizeInput(value: string): string {
  return value
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '')
    .replace(/^["'`]+|["'`]+$/g, '')
    .replace(/[\r\n\t]/g, '')
    .trim()
}

export function AppManager() {
  const [isOpen, setIsOpen] = useState(false)
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const apps = useAppStore((state) => state.apps)
  const addApp = useAppStore((state) => state.addApp)
  const updateApp = useAppStore((state) => state.updateApp)
  const deleteApp = useAppStore((state) => state.deleteApp)
  const maxApps = useAppStore((state) => state.maxApps)
  const setModalOpen = useAppStore((state) => state.setModalOpen)

  useEffect(() => {
    setModalOpen(isOpen)
  }, [isOpen, setModalOpen])

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    apiEndpoint: '',
    apiKey: '',
    createdBy: '',
    appType: 'chat' as 'chat' | 'chatflow' | 'workflow',
  })

  const openModal = () => {
    setIsOpen(true)
    setModalOpen(true)
  }

  const closeModal = () => {
    setIsOpen(false)
    setModalOpen(false)
    setIsEditing(null)
    setFormError(null)
    setFormData({ name: '', description: '', apiEndpoint: '', apiKey: '', createdBy: '', appType: 'chat' })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    // 保存前にサニタイズ
    const cleanData = {
      ...formData,
      apiEndpoint: sanitizeInput(formData.apiEndpoint),
      apiKey: sanitizeInput(formData.apiKey),
    }

    // APIキーのバリデーション
    if (!cleanData.apiKey.startsWith('app-')) {
      setFormError('APIキーは「app-」で始まる文字列です。DifyのバックエンドサービスAPIページからコピーしてください。')
      return
    }

    // エンドポイントのバリデーション
    if (!cleanData.apiEndpoint.includes('/v1')) {
      setFormError('エンドポイントに「/v1」が含まれていません。DifyのAPIページに表示されるベースURLをそのまま貼り付けてください。')
      return
    }

    if (isEditing) {
      updateApp(isEditing, cleanData)
    } else {
      addApp(cleanData)
    }
    closeModal()
  }

  const handleEdit = (app: DifyApp) => {
    setFormData({
      name: app.name,
      description: app.description,
      apiEndpoint: app.apiEndpoint,
      apiKey: app.apiKey,
      createdBy: app.createdBy,
      appType: app.appType || 'chat',
    })
    setIsEditing(app.id)
    openModal()
  }

  const handleDelete = (id: string) => {
    if (confirm('このアプリケーションを削除しますか？')) {
      deleteApp(id)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">
          {apps.length} / {maxApps}
        </span>
        <button
          onClick={() => {
            setIsEditing(null)
            setFormData({ name: '', description: '', apiEndpoint: '', apiKey: '', createdBy: '', appType: 'chat' })
            openModal()
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          追加
        </button>
      </div>

      {/* モーダル */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999]"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">
                {isEditing ? 'アプリを編集' : 'アプリを追加'}
              </h2>
              <button
                onClick={closeModal}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  アプリ名
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-colors"
                  placeholder="プロジェクト報告アシスタント"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  アプリタイプ
                </label>
                <div className="flex gap-1.5">
                  {([
                    { value: 'chat', label: 'チャットボット' },
                    { value: 'chatflow', label: 'チャットフロー' },
                    { value: 'workflow', label: 'ワークフロー' },
                  ] as const).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, appType: opt.value })}
                      className={`flex-1 px-2.5 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                        formData.appType === opt.value
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-1.5">
                  Difyで作成したアプリのタイプを選択
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  説明
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 resize-none transition-colors"
                  placeholder="このアプリの用途を入力"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  APIエンドポイント
                </label>
                <input
                  type="url"
                  value={formData.apiEndpoint}
                  onChange={(e) => setFormData({ ...formData, apiEndpoint: e.target.value })}
                  onPaste={(e) => {
                    e.preventDefault()
                    const pasted = sanitizeInput(e.clipboardData.getData('text'))
                    setFormData({ ...formData, apiEndpoint: pasted })
                  }}
                  required
                  placeholder="http://dify-tutorial.ezoai.jp/v1"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-colors"
                />
                <p className="text-xs text-slate-400 mt-1.5">
                  DifyのバックエンドサービスAPIに表示されるベースURL
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  APIキー
                </label>
                <input
                  type="text"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  onPaste={(e) => {
                    e.preventDefault()
                    const pasted = sanitizeInput(e.clipboardData.getData('text'))
                    setFormData({ ...formData, apiKey: pasted })
                  }}
                  required
                  placeholder="app-xxxxxxxxxxxx"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 font-mono text-xs transition-colors"
                />
                <p className="text-xs text-slate-400 mt-1.5">
                  DifyのバックエンドサービスAPIページで発行したキー
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  作成者名
                </label>
                <input
                  type="text"
                  value={formData.createdBy}
                  onChange={(e) => setFormData({ ...formData, createdBy: e.target.value })}
                  placeholder="任意"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-colors"
                />
              </div>

              {formError && (
                <div className="px-3.5 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-medium bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  {isEditing ? '更新' : '追加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* アプリ一覧（Grid view用） */}
      <div className="mt-3 space-y-1.5">
        {apps.map((app) => (
          <div
            key={app.id}
            className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors group"
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 text-xs font-semibold text-indigo-600">
                {app.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-slate-800 truncate">
                  {app.name}
                </div>
                {app.description && (
                  <div className="text-xs text-slate-400 truncate mt-0.5">
                    {app.description}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
              <button
                onClick={() => handleEdit(app)}
                className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDelete(app.id)}
                className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
