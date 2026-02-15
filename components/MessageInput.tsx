'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import { Send, Paperclip, X, FileText } from 'lucide-react'

interface MessageInputProps {
  onSend: (message: string, file?: File) => void
  disabled?: boolean
  placeholder?: string
}

// 受け付けるファイル拡張子
const ACCEPTED_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp',
  '.pdf',
  '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.csv', '.tsv',
  '.txt', '.md', '.json', '.xml', '.html',
  '.mp3', '.wav', '.ogg', '.m4a',
  '.mp4', '.webm', '.mov',
].join(',')

export function MessageInput({
  onSend,
  disabled = false,
  placeholder = 'メッセージを入力...',
}: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [attachedFile, setAttachedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSend = () => {
    const trimmed = message.trim()
    // テキストかファイルのどちらかがあれば送信可能
    if ((trimmed || attachedFile) && !disabled) {
      onSend(trimmed, attachedFile || undefined)
      setMessage('')
      setAttachedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAttachedFile(file)
    }
  }

  const handleFileRemove = () => {
    setAttachedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const canSend = (message.trim() || attachedFile) && !disabled

  return (
    <div className="space-y-2">
      {attachedFile && (
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-800">
          <FileText className="w-4 h-4 text-gray-500 shrink-0" />
          <span className="truncate">{attachedFile.name}</span>
          <span className="text-gray-500 shrink-0">
            ({formatFileSize(attachedFile.size)})
          </span>
          <button
            onClick={handleFileRemove}
            className="ml-auto p-0.5 text-gray-500 hover:text-gray-700 rounded transition-colors"
            title="ファイルを取り消す"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      <div className="flex items-end gap-2">
        <button
          onClick={handleFileSelect}
          disabled={disabled}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="ファイルを添付"
        >
          <Paperclip className="w-5 h-5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          onChange={handleFileChange}
          className="hidden"
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-900 placeholder:text-gray-500"
          style={{ minHeight: '40px', maxHeight: '120px' }}
        />
        <button
          onClick={handleSend}
          disabled={!canSend}
          className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
