'use client'

import { useState } from 'react'
import { useAppStore } from '@/stores/app-store'
import { DifyApp } from '@/types'
import { Plus, X, Edit2 } from 'lucide-react'

export function AppManager() {
  const [isOpen, setIsOpen] = useState(false)
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const apps = useAppStore((state) => state.apps)
  const addApp = useAppStore((state) => state.addApp)
  const updateApp = useAppStore((state) => state.updateApp)
  const deleteApp = useAppStore((state) => state.deleteApp)
  const maxApps = useAppStore((state) => state.maxApps)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    apiEndpoint: '',
    apiKey: '',
    createdBy: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isEditing) {
      updateApp(isEditing, formData)
    } else {
      addApp(formData)
    }
    setFormData({
      name: '',
      description: '',
      apiEndpoint: '',
      apiKey: '',
      createdBy: '',
    })
    setIsEditing(null)
    setIsOpen(false)
  }

  const handleEdit = (app: DifyApp) => {
    setFormData({
      name: app.name,
      description: app.description,
      apiEndpoint: app.apiEndpoint,
      apiKey: app.apiKey,
      createdBy: app.createdBy,
    })
    setIsEditing(app.id)
    setIsOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('このアプリケーションを削除しますか？')) {
      deleteApp(id)
    }
  }

  return (
    <>
      <button
        onClick={() => {
          setIsOpen(true)
          setIsEditing(null)
          setFormData({
            name: '',
            description: '',
            apiEndpoint: '',
            apiKey: '',
            createdBy: '',
          })
        }}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        アプリを追加
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {isEditing ? 'アプリを編集' : 'アプリを追加'}
              </h2>
              <button
                onClick={() => {
                  setIsOpen(false)
                  setIsEditing(null)
                }}
                className="text-gray-600 hover:text-gray-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900">
                  アプリ名 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900">
                  説明
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900">
                  APIエンドポイント *
                </label>
                <input
                  type="url"
                  value={formData.apiEndpoint}
                  onChange={(e) =>
                    setFormData({ ...formData, apiEndpoint: e.target.value })
                  }
                  required
                  placeholder="https://api.dify.ai/v1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-500"
                />
                <p className="text-xs text-gray-700 mt-1">
                  ワークフローアプリ: https://api.dify.ai/v1/workflows/run<br />
                  チャットアプリ: https://api.dify.ai/v1<br />
                  <span className="text-gray-600">※エンドポイントURLから自動判定されます</span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900">
                  APIキー *
                </label>
                <input
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) =>
                    setFormData({ ...formData, apiKey: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900">
                  作成者名
                </label>
                <input
                  type="text"
                  value={formData.createdBy}
                  onChange={(e) =>
                    setFormData({ ...formData, createdBy: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false)
                    setIsEditing(null)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-900"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  {isEditing ? '更新' : '追加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mt-4 space-y-2">
              <div className="text-sm text-gray-700 font-medium">
                登録済み: {apps.length} / {maxApps}
              </div>
        {apps.map((app) => (
          <div
            key={app.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
              <div className="flex-1 min-w-0">
              <div className="font-medium truncate text-gray-900">{app.name}</div>
              {app.description && (
                <div className="text-sm text-gray-700 truncate mt-1">
                  {app.description}
                </div>
              )}
              <div className="text-xs text-gray-700 mt-1">
                作成者: {app.createdBy || '不明'}
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={() => handleEdit(app)}
                className="p-1.5 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(app.id)}
                className="p-1.5 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

