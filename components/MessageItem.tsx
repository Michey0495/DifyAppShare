'use client'

import { ChatMessage } from '@/types'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github.css'
import { User, Bot } from 'lucide-react'

interface MessageItemProps {
  message: ChatMessage
}

export function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === 'user'
  const timestamp = format(new Date(message.timestamp), 'HH:mm', { locale: ja })

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
