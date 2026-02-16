'use client'

import { useState, useEffect } from 'react'
import { Download, FileCode, MessageSquare, Workflow, ChevronDown, ChevronUp } from 'lucide-react'

interface TemplateEntry {
  name: string
  mode: string
  description: string
  filename: string
  size: number
  setup: string
}

function modeLabel(mode: string) {
  switch (mode) {
    case 'workflow': return 'Workflow'
    case 'chat': return 'Chat'
    default: return mode
  }
}

function ModeIcon({ mode }: { mode: string }) {
  switch (mode) {
    case 'workflow': return <Workflow className="w-4 h-4" />
    case 'chat': return <MessageSquare className="w-4 h-4" />
    default: return <FileCode className="w-4 h-4" />
  }
}

function modeColor(mode: string) {
  switch (mode) {
    case 'workflow': return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'chat': return 'bg-green-50 text-green-700 border-green-200'
    default: return 'bg-slate-50 text-slate-700 border-slate-200'
  }
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}

export function TemplateGallery() {
  const [templates, setTemplates] = useState<TemplateEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [guideOpen, setGuideOpen] = useState(false)

  useEffect(() => {
    fetch('/templates/manifest.json')
      .then(res => res.json())
      .then((data: TemplateEntry[]) => {
        setTemplates(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleDownload = (template: TemplateEntry) => {
    const a = document.createElement('a')
    a.href = `/templates/${encodeURIComponent(template.filename)}`
    a.download = template.filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        テンプレートを読み込み中...
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h2 className="text-base font-semibold text-slate-900 mb-1">
          Dify DSL テンプレート
        </h2>
        <p className="text-sm text-slate-500">
          .yml ファイルをダウンロードし、Difyにインポートするとすぐ使えます
        </p>
      </div>

      {/* インポート手順 */}
      <div className="mb-8 border border-slate-200 rounded-xl overflow-hidden">
        <button
          onClick={() => setGuideOpen(!guideOpen)}
          className="w-full flex items-center justify-between px-5 py-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
        >
          <span className="text-sm font-medium text-slate-800">
            導入手順
          </span>
          {guideOpen
            ? <ChevronUp className="w-4 h-4 text-slate-400" />
            : <ChevronDown className="w-4 h-4 text-slate-400" />
          }
        </button>
        {guideOpen && (
          <div className="px-5 py-4 text-sm text-slate-700 space-y-4 border-t border-slate-200 bg-white">
            <div>
              <p className="font-medium text-slate-800 mb-2">Difyへのインポート</p>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-600 text-[13px]">
                <li>下のテンプレートから .yml ファイルをダウンロード</li>
                <li>Dify にログインし「スタジオ」を開く</li>
                <li>「DSLファイルをインポート」からダウンロードした .yml を選択</li>
                <li>アプリが作成されるので、各LLMノードでモデルを選択して「公開」</li>
              </ol>
            </div>
            <div>
              <p className="font-medium text-slate-800 mb-2">DifyAppShareへの接続</p>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-600 text-[13px]">
                <li>Dify でアプリを公開後、「バックエンドサービスAPI」からAPIキーを発行</li>
                <li>DifyAppShare の Chat 画面でアプリを登録</li>
                <li>APIエンドポイントはベースURL（例: http://your-dify.com/v1）を入力</li>
                <li>APIキーは app- で始まるキーを貼り付け</li>
              </ol>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              ワークフロー型テンプレートの開始ノードには変数 question（必須）が定義済みです。
              DifyAppShareはユーザーの入力テキストをこの変数に自動送信します。
              変数名を変えるとエラーになるので注意してください。
            </div>
          </div>
        )}
      </div>

      {/* テンプレート一覧 */}
      <div className="space-y-3">
        {templates.map((template, idx) => (
          <div
            key={idx}
            className="border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-colors bg-white"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-2">
                  <h3 className="text-sm font-semibold text-slate-900">
                    {template.name}
                  </h3>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${modeColor(template.mode)}`}>
                    <ModeIcon mode={template.mode} />
                    {modeLabel(template.mode)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed mb-2">
                  {template.description}
                </p>
                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span>{template.filename}</span>
                  <span>{formatSize(template.size)}</span>
                  <span className="text-slate-300">|</span>
                  <span>{template.setup}</span>
                </div>
              </div>
              <button
                onClick={() => handleDownload(template)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-800 transition-colors shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                DSL
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
