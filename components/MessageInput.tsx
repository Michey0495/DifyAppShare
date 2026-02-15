'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import { Send, Paperclip, X, FileText } from 'lucide-react'

interface MessageInputProps {
  onSend: (message: string, file?: File) => void
  disabled?: boolean
  placeholder?: string
}

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
    if ((trimmed || attachedFile) && !disabled) {
      onSend(trimmed, attachedFile || undefined)
      setMessage('')
      setAttachedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setAttachedFile(file)
  }

  const handleFileRemove = () => {
    setAttachedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
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
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600">
          <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate max-w-[200px]">{attachedFile.name}</span>
          <span className="text-slate-400 text-xs shrink-0">
            {formatFileSize(attachedFile.size)}
          </span>
          <button
            onClick={handleFileRemove}
            className="p-0.5 text-slate-400 hover:text-slate-600 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      <div className="flex items-end gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="ファイルを添付"
        >
          <Paperclip className="w-[18px] h-[18px]" />
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
          className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl resize-none text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 disabled:bg-slate-100 disabled:cursor-not-allowed transition-colors"
          style={{ minHeight: '42px', maxHeight: '120px' }}
        />
        <button
          onClick={handleSend}
          disabled={!canSend}
          className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-[18px] h-[18px]" />
        </button>
      </div>
    </div>
  )
}
