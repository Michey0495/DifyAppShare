'use client'

import { useState, useEffect, useRef } from 'react'
import { useSessionStore } from '@/stores/session-store'
import { useAppStore } from '@/stores/app-store'
import { DifyAPI } from '@/lib/dify-api'
import { ChatMessage, DifyFileReference, DifyApp } from '@/types'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { AppManager } from './AppManager'
import {
  RotateCcw,
  Loader2,
  Upload,
  MessageSquare,
  ChevronLeft,
  Plus,
} from 'lucide-react'

export function SingleChatView() {
  const apps = useAppStore((state) => state.apps)
  const getApp = useAppStore((state) => state.getApp)
  const sessions = useSessionStore((state) => state.sessions)
  const createSession = useSessionStore((state) => state.createSession)
  const addMessage = useSessionStore((state) => state.addMessage)
  const resetSession = useSessionStore((state) => state.resetSession)
  const assignApp = useSessionStore((state) => state.assignApp)

  const [selectedAppId, setSelectedAppId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 初回: アプリが登録済みなら先頭を選択
  useEffect(() => {
    if (!selectedAppId && apps.length > 0) {
      setSelectedAppId(apps[0].id)
    }
  }, [apps, selectedAppId])

  // チャットビュー用のセッションIDを生成
  const chatSessionId = selectedAppId ? `chat-view-${selectedAppId}` : null

  // 選択中アプリのセッションが無ければ作成
  useEffect(() => {
    if (chatSessionId && selectedAppId) {
      const existing = useSessionStore.getState().getSession(chatSessionId)
      if (!existing) {
        createSession(chatSessionId)
        const app = getApp(selectedAppId)
        if (app) {
          assignApp(chatSessionId, selectedAppId, app.name)
        }
      }
    }
  }, [chatSessionId, selectedAppId, createSession, assignApp, getApp])

  // sessionsの変更を監視して再レンダリングをトリガー
  const allSessions = useSessionStore((state) => state.sessions)
  const session = chatSessionId
    ? allSessions.find((s) => s.sessionId === chatSessionId) ?? null
    : null
  const selectedApp = selectedAppId ? getApp(selectedAppId) : null

  // メッセージが追加されたら自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [session?.messages.length])

  const handleSelectApp = (appId: string) => {
    setSelectedAppId(appId)
    setError(null)
  }

  const handleSendMessage = async (content: string, file?: File) => {
    if (!chatSessionId || !selectedApp) {
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

    addMessage(chatSessionId, userMessage)
    setIsLoading(true)
    setError(null)

    try {
      const difyAPI = new DifyAPI(selectedApp.apiEndpoint, selectedApp.apiKey)

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

        addMessage(chatSessionId, assistantMessage)
        const currentMessages =
          useSessionStore.getState().getSession(chatSessionId)?.messages || []
        const messageIndex = currentMessages.length - 1

        const parser = difyAPI.parseStreamResponse(stream)
        let fullContent = ''
        const isWorkflow = difyAPI.getAppType() === 'workflow'

        for await (const chunk of parser) {
          if (isWorkflow) {
            if (chunk.event === 'text_chunk' && chunk.data?.text) {
              fullContent += chunk.data.text
              const updatedMessage: ChatMessage = {
                ...assistantMessage,
                content: fullContent,
              }
              const cs =
                useSessionStore.getState().getSession(chatSessionId)
              if (cs) {
                const msgs = [...cs.messages]
                msgs[messageIndex] = updatedMessage
                useSessionStore.getState().updateSession(chatSessionId, {
                  messages: msgs,
                })
              }
            } else if (
              chunk.event === 'workflow_finished' &&
              chunk.data?.outputs
            ) {
              const outputs = chunk.data.outputs
              const textKeys = [
                'text',
                'output',
                'result',
                'answer',
                'response',
              ]
              for (const key of textKeys) {
                if (outputs[key] && typeof outputs[key] === 'string') {
                  fullContent = outputs[key]
                  break
                }
              }
              if (!fullContent && Object.keys(outputs).length > 0) {
                fullContent = JSON.stringify(outputs, null, 2)
              }
              const updatedMessage: ChatMessage = {
                ...assistantMessage,
                content: fullContent || 'ワークフローが完了しました',
              }
              const cs =
                useSessionStore.getState().getSession(chatSessionId)
              if (cs) {
                const msgs = [...cs.messages]
                msgs[messageIndex] = updatedMessage
                useSessionStore.getState().updateSession(chatSessionId, {
                  messages: msgs,
                })
              }
            }
          } else {
            if (
              chunk.event === 'message' ||
              chunk.event === 'message_end'
            ) {
              if (chunk.answer) {
                fullContent += chunk.answer
                const updatedMessage: ChatMessage = {
                  ...assistantMessage,
                  content: fullContent,
                }
                const cs =
                  useSessionStore.getState().getSession(chatSessionId)
                if (cs) {
                  const msgs = [...cs.messages]
                  msgs[messageIndex] = updatedMessage
                  useSessionStore.getState().updateSession(chatSessionId, {
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
        addMessage(chatSessionId, assistantMessage)
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
      addMessage(chatSessionId, errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    if (chatSessionId && confirm('会話をリセットしますか？')) {
      resetSession(chatSessionId)
      setError(null)
    }
  }

  return (
    <div className="flex h-[calc(100vh-73px)]">
      {/* サイドバー */}
      <div
        className={`${
          sidebarOpen ? 'w-72' : 'w-0'
        } transition-all duration-200 overflow-hidden border-r border-gray-200 bg-white flex flex-col shrink-0`}
      >
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">
            登録アプリ
          </h2>
          <AppManager />
        </div>

        <div className="flex-1 overflow-y-auto">
          {apps.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">
              アプリが未登録です
            </div>
          ) : (
            <div className="py-2">
              {apps.map((app) => (
                <button
                  key={app.id}
                  onClick={() => handleSelectApp(app.id)}
                  className={`w-full text-left px-4 py-3 transition-colors ${
                    selectedAppId === app.id
                      ? 'bg-blue-50 border-r-2 border-blue-500'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare
                      className={`w-4 h-4 shrink-0 ${
                        selectedAppId === app.id
                          ? 'text-blue-600'
                          : 'text-gray-400'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div
                        className={`text-sm font-medium truncate ${
                          selectedAppId === app.id
                            ? 'text-blue-900'
                            : 'text-gray-900'
                        }`}
                      >
                        {app.name}
                      </div>
                      {app.description && (
                        <div className="text-xs text-gray-500 truncate mt-0.5">
                          {app.description}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* サイドバー開閉トグル */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="self-center -ml-px px-1 py-6 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-r-md transition-colors z-10"
        title={sidebarOpen ? 'サイドバーを閉じる' : 'サイドバーを開く'}
      >
        <ChevronLeft
          className={`w-4 h-4 text-gray-500 transition-transform ${
            sidebarOpen ? '' : 'rotate-180'
          }`}
        />
      </button>

      {/* メインチャットエリア */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {selectedApp ? (
          <>
            {/* チャットヘッダー */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-gray-50 shrink-0">
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-gray-900 truncate">
                  {selectedApp.name}
                </h3>
                {selectedApp.description && (
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {selectedApp.description}
                  </p>
                )}
              </div>
              <button
                onClick={handleReset}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors shrink-0"
                title="会話をリセット"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* メッセージエリア */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {session && session.messages.length > 0 ? (
                <div className="max-w-3xl mx-auto space-y-4">
                  <MessageList messages={session.messages} />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-400">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3" />
                    <p className="text-sm">
                      メッセージを入力して会話を始めてください
                    </p>
                  </div>
                </div>
              )}
              {isUploading && (
                <div className="max-w-3xl mx-auto mt-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Upload className="w-4 h-4 animate-pulse" />
                    <span>ファイルをアップロード中...</span>
                  </div>
                </div>
              )}
              {isLoading && !isUploading && (
                <div className="max-w-3xl mx-auto mt-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>応答を生成中...</span>
                  </div>
                </div>
              )}
              {error && (
                <div className="max-w-3xl mx-auto mt-4">
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* 入力エリア */}
            <div className="border-t border-gray-200 bg-white px-6 py-4 shrink-0">
              <div className="max-w-3xl mx-auto">
                <MessageInput
                  onSend={handleSendMessage}
                  disabled={isLoading}
                  placeholder="メッセージを入力..."
                />
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4" />
              <p className="text-lg mb-2">アプリを選択してください</p>
              <p className="text-sm">
                左のサイドバーからDifyアプリを選んで会話を始められます
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
