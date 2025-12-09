'use client'

import { useState, useRef, useEffect } from 'react'
import { useSessionStore } from '@/stores/session-store'
import { useAppStore } from '@/stores/app-store'
import { DifyAPI } from '@/lib/dify-api'
import { ChatMessage } from '@/types'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { AppSelector } from './AppSelector'
import { RotateCcw, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface ChatSpaceProps {
  sessionId: string
}

export function ChatSpace({ sessionId }: ChatSpaceProps) {
  const session = useSessionStore((state) => state.getSession(sessionId))
  const addMessage = useSessionStore((state) => state.addMessage)
  const resetSession = useSessionStore((state) => state.resetSession)
  const assignApp = useSessionStore((state) => state.assignApp)
  const getApp = useAppStore((state) => state.getApp)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [session?.messages])

  if (!session) return null

  const app = session.appId ? getApp(session.appId) : null

  const handleSendMessage = async (content: string) => {
    if (!session.appId || !app) {
      setError('アプリケーションが選択されていません')
      return
    }

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    }

    addMessage(sessionId, userMessage)
    setIsLoading(true)
    setError(null)

    try {
      const difyAPI = new DifyAPI(app.apiEndpoint, app.apiKey)
      const stream = await difyAPI.sendMessage(content)

      if (stream instanceof ReadableStream) {
        const assistantMessage: ChatMessage = {
          id: `msg-${Date.now()}-assistant`,
          role: 'assistant',
          content: '',
          timestamp: new Date().toISOString(),
        }

        addMessage(sessionId, assistantMessage)
        const messageIndex = session.messages.length

        const parser = difyAPI.parseStreamResponse(stream)
        let fullContent = ''

        for await (const chunk of parser) {
          if (chunk.event === 'message' || chunk.event === 'message_end') {
            if (chunk.answer) {
              fullContent += chunk.answer
              const updatedMessage: ChatMessage = {
                ...assistantMessage,
                content: fullContent,
              }
              const currentSession = useSessionStore.getState().getSession(sessionId)
              if (currentSession) {
                const updatedMessages = [...currentSession.messages]
                updatedMessages[messageIndex] = updatedMessage
                useSessionStore.getState().updateSession(sessionId, {
                  messages: updatedMessages,
                })
              }
            }
          }
        }
      } else {
        const assistantMessage: ChatMessage = {
          id: `msg-${Date.now()}-assistant`,
          role: 'assistant',
          content: stream.answer || '応答がありませんでした',
          timestamp: new Date().toISOString(),
        }
        addMessage(sessionId, assistantMessage)
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'メッセージの送信に失敗しました'
      setError(errorMessage)
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: `エラー: ${errorMessage}`,
        timestamp: new Date().toISOString(),
      }
      addMessage(sessionId, errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    if (confirm('セッションをリセットしますか？')) {
      resetSession(sessionId)
      setError(null)
    }
  }

  const handleAppSelect = (appId: string) => {
    const selectedApp = getApp(appId)
    if (selectedApp) {
      assignApp(sessionId, appId, selectedApp.name)
    }
  }

  return (
    <div className="flex flex-col h-full border border-gray-200 rounded-lg bg-white shadow-sm">
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <AppSelector
            sessionId={sessionId}
            currentAppId={session.appId}
            onSelect={handleAppSelect}
          />
          {app && (
            <span className="text-xs text-gray-700 truncate font-medium">
              {app.description}
            </span>
          )}
        </div>
        <button
          onClick={handleReset}
          className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
          title="セッションをリセット"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {session.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-600 text-sm">
            {app
              ? 'メッセージを入力してチャットを開始してください'
              : 'アプリケーションを選択してください'}
          </div>
        ) : (
          <MessageList messages={session.messages} />
        )}
        {isLoading && (
          <div className="flex items-center gap-2 text-gray-700 text-sm font-medium">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>応答を生成中...</span>
          </div>
        )}
        {error && (
          <div className="p-3 bg-red-50 border border-red-300 rounded-lg text-red-700 text-sm font-medium shadow-sm">
            {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-gray-200">
        <MessageInput
          onSend={handleSendMessage}
          disabled={!app || isLoading}
          placeholder={
            app ? 'メッセージを入力...' : 'アプリケーションを選択してください'
          }
        />
      </div>
    </div>
  )
}

