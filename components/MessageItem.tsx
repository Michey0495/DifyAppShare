'use client'

import { ChatMessage, DownloadableFile } from '@/types'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github.css'
import { User, Bot, Download, FileText, Presentation } from 'lucide-react'

// ファイルをブラウザからダウンロード
async function downloadFile(file: DownloadableFile) {
  if (file.url) {
    // Difyの署名付きURLからバイナリをダウンロード
    // CORS回避のためプロキシ経由で取得
    try {
      const proxyUrl = `/api/dify/download?${new URLSearchParams({ url: file.url, filename: file.name })}`
      const response = await fetch(proxyUrl)
      if (!response.ok) throw new Error(`Download failed: ${response.status}`)
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = file.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
    } catch (err) {
      console.error('File download error:', err)
      // プロキシ失敗時は直接URLを開く
      window.open(file.url, '_blank')
    }
  } else if (file.content) {
    // テキストコンテンツをBlobに変換してダウンロード
    const blob = new Blob([file.content], { type: file.mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}

// ファイル種別に応じたアイコンを返す
function FileIcon({ file }: { file: DownloadableFile }) {
  const ext = file.extension?.toLowerCase() || ''
  if (ext === '.pptx' || ext === '.ppt') {
    return <Presentation className="w-3.5 h-3.5" />
  }
  return <FileText className="w-3.5 h-3.5" />
}

interface MessageItemProps {
  message: ChatMessage
}

export function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === 'user'
  const timestamp = format(new Date(message.timestamp), 'HH:mm', { locale: ja })
  const hasFiles = !isUser && message.files && message.files.length > 0

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* アバター */}
      <div
        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
          isUser ? 'bg-indigo-600' : 'bg-slate-100'
        }`}
      >
        {isUser ? (
          <User className="w-3.5 h-3.5 text-white" />
        ) : (
          <Bot className="w-3.5 h-3.5 text-slate-500" />
        )}
      </div>

      {/* メッセージ本体 */}
      <div className={`max-w-[75%] ${isUser ? 'text-right' : ''}`}>
        <div
          className={`inline-block text-left rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? 'bg-indigo-600 text-white rounded-tr-md'
              : 'bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-md'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              className="prose prose-sm max-w-none prose-slate"
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>

        {/* ダウンロード可能ファイル一覧 */}
        {hasFiles && (
          <div className="mt-2 space-y-1.5">
            {message.files!.map((file, idx) => (
              <button
                key={idx}
                onClick={() => downloadFile(file)}
                className="flex items-center gap-2 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors w-full text-left group"
              >
                <div className="w-6 h-6 rounded bg-indigo-50 flex items-center justify-center shrink-0 text-indigo-600 group-hover:bg-indigo-100">
                  <FileIcon file={file} />
                </div>
                <span className="truncate flex-1 text-slate-700">{file.name}</span>
                <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0" />
              </button>
            ))}
          </div>
        )}

        <div
          className={`text-[11px] mt-1 px-1 ${
            isUser ? 'text-slate-400' : 'text-slate-400'
          }`}
        >
          {timestamp}
        </div>
      </div>
    </div>
  )
}
