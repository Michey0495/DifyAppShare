'use client'

import { useState } from 'react'
import { useSessionStore } from '@/stores/session-store'
import { useAppStore } from '@/stores/app-store'
import { DifyAPI } from '@/lib/dify-api'
import { ChatMessage, DifyFileReference } from '@/types'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { AppSelector } from './AppSelector'
import { RotateCcw, Loader2, Upload, MessageSquare } from 'lucide-react'

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
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!session) return null

  const app = session.appId ? getApp(session.appId) : null

  const handleSendMessage = async (content: string, file?: File) => {
    if (!session.appId || !app) {
      setError('アプリケーションが選択されていません')
      return
    }

    const displayContent = file
      ? content
        ? `${content}\n[添付: ${file.name}]`
        : `[添付: ${file.name}]`
      : content
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: displayContent,
      timestamp: new Date().toISOString(),
      fileName: file?.name,
    }

    addMessage(sessionId, userMessage)
    setIsLoading(true)
    setError(null)

    try {
      const difyAPI = new DifyAPI(app.apiEndpoint, app.apiKey)

      let files: DifyFileReference[] | undefined
      if (file) {
        setIsUploading(true)
        try {
          const uploaded = await difyAPI.uploadFile(file)
          files = [
            {
              type: uploaded.fileType,
              transfer_method: 'local_file',
              upload_file_id: uploaded.uploadFileId,
            },
          ]
        } finally {
          setIsUploading(false)
        }
      }

      const query = content || 'このファイルの内容を分析してください'
      const stream = await difyAPI.sendMessage(
        query,
        undefined,
        undefined,
        'streaming',
        files
      )

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
        const isWorkflow = difyAPI.getAppType() === 'workflow'

        for await (const chunk of parser) {
          if (isWorkflow) {
            if (chunk.event === 'text_chunk' && chunk.data?.text) {
              fullContent += chunk.data.text
              const cs = useSessionStore.getState().getSession(sessionId)
              if (cs) {
                const msgs = [...cs.messages]
                msgs[messageIndex] = { ...assistantMessage, content: fullContent }
                useSessionStore.getState().updateSession(sessionId, {
                  messages: msgs,
                })
              }
            } else if (
              chunk.event === 'workflow_finished' &&
              chunk.data?.outputs
            ) {
              const outputs = chunk.data.outputs
              const textKeys = ['text', 'output', 'result', 'answer', 'response']
              for (const key of textKeys) {
                if (outputs[key] && typeof outputs[key] === 'string') {
                  fullContent = outputs[key]
                  break
                }
              }
              if (!fullContent && Object.keys(outputs).length > 0) {
                fullContent = JSON.stringify(outputs, null, 2)
              }
              const cs = useSessionStore.getState().getSession(sessionId)
              if (cs) {
                const msgs = [...cs.messages]
                msgs[messageIndex] = {
                  ...assistantMessage,
                  content: fullContent || 'ワークフローが完了しました',
                }
                useSessionStore.getState().updateSession(sessionId, {
                  messages: msgs,
                })
              }
            }
          } else {
            if (chunk.event === 'message' || chunk.event === 'message_end') {
              if (chunk.answer) {
                fullContent += chunk.answer
                const cs = useSessionStore.getState().getSession(sessionId)
                if (cs) {
                  const msgs = [...cs.messages]
                  msgs[messageIndex] = { ...assistantMessage, content: fullContent }
                  useSessionStore.getState().updateSession(sessionId, {
                    messages: msgs,
                  })
                }
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
    <div className="flex flex-col h-full border border-slate-200 rounded-xl bg-white overflow-hidden">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-100 bg-slate-50/50 shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <AppSelector
            sessionId={sessionId}
            currentAppId={session.appId}
            onSelect={handleAppSelect}
          />
        </div>
        <button
          onClick={handleReset}
          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors"
          title="リセット"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {session.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageSquare className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-xs text-slate-400">
                {app ? 'メッセージを入力' : 'アプリを選択'}
              </p>
            </div>
          </div>
        ) : (
          <MessageList messages={session.messages} />
        )}
        {(isUploading || isLoading) && (
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            {isUploading ? (
              <>
                <Upload className="w-3.5 h-3.5 animate-pulse" />
                <span>アップロード中...</span>
              </>
            ) : (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>生成中...</span>
              </>
            )}
          </div>
        )}
        {error && (
          <div className="px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs">
            {error}
          </div>
        )}
      </div>

      {/* 入力エリア */}
      <div className="px-3 py-2.5 border-t border-slate-100">
        <MessageInput
          onSend={handleSendMessage}
          disabled={!app || isLoading}
          placeholder={app ? 'メッセージを入力...' : 'アプリを選択してください'}
        />
      </div>
    </div>
  )
}
