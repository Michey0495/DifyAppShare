'use client'

import { ChatMessage } from '@/types'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github.css'

interface MessageItemProps {
  message: ChatMessage
}

export function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === 'user'
  const timestamp = format(new Date(message.timestamp), 'HH:mm', { locale: ja })

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          isUser
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 text-gray-900'
        }`}
      >
        <div
          className={`text-sm whitespace-pre-wrap break-words ${
            isUser ? 'text-white' : 'text-gray-800'
          }`}
        >
          {isUser ? (
            <p>{message.content}</p>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              className="prose prose-sm max-w-none"
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>
        <div
          className={`text-xs mt-1 ${
            isUser ? 'text-blue-100' : 'text-gray-700'
          }`}
        >
          {timestamp}
        </div>
      </div>
    </div>
  )
}

