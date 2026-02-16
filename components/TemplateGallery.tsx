'use client'

import { useState, useEffect } from 'react'
import { Download, MessageSquare, Workflow, X } from 'lucide-react'

interface TemplateEntry {
  name: string
  mode: string
  description: string
  filename: string
  size: number
  setup: string
}

interface TemplateManifest {
  templates: TemplateEntry[]
  examples: TemplateEntry[]
}

function ModeIcon({ mode }: { mode: string }) {
  if (mode === 'workflow') return <Workflow className="w-3.5 h-3.5" />
  return <MessageSquare className="w-3.5 h-3.5" />
}

function modeBadgeClass(mode: string) {
  if (mode === 'workflow') return 'bg-blue-50 text-blue-600 border-blue-200'
  return 'bg-green-50 text-green-600 border-green-200'
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}

interface Props {
  open: boolean
  onClose: () => void
}

export function TemplateGallery({ open, onClose }: Props) {
  const [manifest, setManifest] = useState<TemplateManifest | null>(null)

  useEffect(() => {
    if (!open) return
    fetch('/templates/manifest.json')
      .then(res => res.json())
      .then((data: TemplateManifest) => setManifest(data))
      .catch(() => {})
  }, [open])

  if (!open) return null

  const handleDownload = (entry: TemplateEntry) => {
    const a = document.createElement('a')
    a.href = `/templates/${encodeURIComponent(entry.filename)}`
    a.download = entry.filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const renderCard = (entry: TemplateEntry) => (
    <div
      key={entry.filename}
      className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors bg-white"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-sm font-medium text-slate-900">
              {entry.name}
            </span>
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${modeBadgeClass(entry.mode)}`}>
              <ModeIcon mode={entry.mode} />
              {entry.mode === 'workflow' ? 'Workflow' : 'Chat'}
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed mb-2">
            {entry.description}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span>{formatSize(entry.size)}</span>
            <span className="text-slate-200">|</span>
            <span>{entry.setup}</span>
          </div>
        </div>
        <button
          onClick={() => handleDownload(entry)}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-800 transition-colors shrink-0"
        >
          <Download className="w-3 h-3" />
          DSL
        </button>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* オーバーレイ */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />

      {/* モーダル本体 */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Dify DSL テンプレート
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              .yml をダウンロードしてDifyにインポート
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="overflow-y-auto px-5 py-4 space-y-5">
          {manifest ? (
            <>
              {/* テンプレート */}
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  テンプレート
                </h3>
                <div className="space-y-2.5">
                  {manifest.templates.map(renderCard)}
                </div>
              </div>

              {/* 完成イメージ */}
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  完成イメージ
                </h3>
                <div className="space-y-2.5">
                  {manifest.examples.map(renderCard)}
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center py-12 text-sm text-slate-400">
              読み込み中...
            </div>
          )}

          {/* 導入手順 */}
          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              導入手順
            </p>
            <ol className="list-decimal list-inside space-y-1 text-xs text-slate-500 leading-relaxed">
              <li>.yml をダウンロード</li>
              <li>Difyにログインし「スタジオ」を開く</li>
              <li>「DSLファイルをインポート」から .yml を選択</li>
              <li>LLMノードでモデルを選択して「公開」</li>
              <li>「バックエンドサービスAPI」からAPIキーを発行</li>
              <li>このアプリでAPIエンドポイントとキーを登録</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
