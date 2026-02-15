'use client'

import { useState, useEffect, useRef } from 'react'
import { useSessionStore } from '@/stores/session-store'
import { useAppStore } from '@/stores/app-store'
import { DifyAPI } from '@/lib/dify-api'
import { ChatMessage, DifyFileReference } from '@/types'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { AppManager } from './AppManager'
import {
  RotateCcw,
  Loader2,
  Upload,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'

export function SingleChatView() {
  const apps = useAppStore((state) => state.apps)
  const getApp = useAppStore((state) => state.getApp)
  const createSession = useSessionStore((state) => state.createSession)
  const addMessage = useSessionStore((state) => state.addMessage)
  const resetSession = useSessionStore((state) => state.resetSession)
  const assignApp = useSessionStore((state) => state.assignApp)
  const allSessions = useSessionStore((state) => state.sessions)

  const [selectedAppId, setSelectedAppId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!selectedAppId && apps.length > 0) {
      setSelectedAppId(apps[0].id)
    }
  }, [apps, selectedAppId])

  const chatSessionId = selectedAppId ? `chat-view-${selectedAppId}` : null

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

  const session = chatSessionId
    ? allSessions.find((s) => s.sessionId === chatSessionId) ?? null
    : null
  const selectedApp = selectedAppId ? getApp(selectedAppId) : null

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
              const cs =
                useSessionStore.getState().getSession(chatSessionId)
              if (cs) {
                const msgs = [...cs.messages]
                msgs[messageIndex] = { ...assistantMessage, content: fullContent }
                useSessionStore.getState().updateSession(chatSessionId, {
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
              const cs =
                useSessionStore.getState().getSession(chatSessionId)
              if (cs) {
                const msgs = [...cs.messages]
                msgs[messageIndex] = {
                  ...assistantMessage,
                  content: fullContent || 'ワークフローが完了しました',
                }
                useSessionStore.getState().updateSession(chatSessionId, {
                  messages: msgs,
                })
              }
            }
          } else {
            if (chunk.event === 'message' || chunk.event === 'message_end') {
              if (chunk.answer) {
                fullContent += chunk.answer
                const cs =
                  useSessionStore.getState().getSession(chatSessionId)
                if (cs) {
                  const msgs = [...cs.messages]
                  msgs[messageIndex] = { ...assistantMessage, content: fullContent }
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
    <div className="flex h-[calc(100vh-57px)]">
      {/* サイドバー */}
      <aside
        className={`${
          sidebarOpen ? 'w-[280px]' : 'w-0'
        } transition-all duration-200 overflow-hidden bg-slate-50/70 border-r border-slate-200/80 flex flex-col shrink-0`}
      >
        {/* アプリ管理セクション */}
        <div className="px-4 pt-5 pb-3 border-b border-slate-200/60">
          <AppManager />
        </div>

        {/* アプリ一覧 */}
        <div className="flex-1 overflow-y-auto py-1">
          {apps.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-400">
              アプリが未登録です
            </div>
          ) : (
            apps.map((app) => {
              const isActive = selectedAppId === app.id
              return (
                <button
                  key={app.id}
                  onClick={() => handleSelectApp(app.id)}
                  className={`w-full text-left px-4 py-2.5 transition-colors ${
                    isActive
                      ? 'bg-indigo-50/80 border-l-2 border-indigo-500'
                      : 'border-l-2 border-transparent hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-semibold ${
                        isActive
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-slate-200/70 text-slate-500'
                      }`}
                    >
                      {app.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div
                        className={`text-sm font-medium truncate ${
                          isActive ? 'text-indigo-900' : 'text-slate-800'
                        }`}
                      >
                        {app.name}
                      </div>
                      {app.description && (
                        <div className="text-xs text-slate-400 truncate mt-0.5 leading-relaxed">
                          {app.description}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </aside>

      {/* サイドバートグル */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="self-start mt-3 -ml-px px-1 py-3 bg-slate-50 hover:bg-slate-100 border border-l-0 border-slate-200/80 rounded-r-md transition-colors"
        title={sidebarOpen ? 'サイドバーを閉じる' : 'サイドバーを開く'}
      >
        {sidebarOpen ? (
          <PanelLeftClose className="w-3.5 h-3.5 text-slate-400" />
        ) : (
          <PanelLeftOpen className="w-3.5 h-3.5 text-slate-400" />
        )}
      </button>

      {/* メインチャットエリア */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {selectedApp ? (
          <>
            {/* チャットヘッダー */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-slate-900 truncate">
                    {selectedApp.name}
                  </h3>
                  {selectedApp.description && (
                    <p className="text-xs text-slate-400 truncate">
                      {selectedApp.description}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={handleReset}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
                title="会話をリセット"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* メッセージエリア */}
            <div className="flex-1 overflow-y-auto">
              {session && session.messages.length > 0 ? (
                <div className="max-w-2xl mx-auto px-6 py-6 space-y-5">
                  <MessageList messages={session.messages} />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center px-6">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      メッセージを入力して
                      <br />
                      会話を始めてください
                    </p>
                  </div>
                </div>
              )}

              {/* ローディング表示 */}
              {(isUploading || isLoading) && (
                <div className="max-w-2xl mx-auto px-6 pb-4">
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    {isUploading ? (
                      <>
                        <Upload className="w-4 h-4 animate-pulse" />
                        <span>アップロード中...</span>
                      </>
                    ) : (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>応答を生成中...</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {error && (
                <div className="max-w-2xl mx-auto px-6 pb-4">
                  <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">
                    {error}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* 入力エリア */}
            <div className="border-t border-slate-100 bg-white px-6 py-4 shrink-0">
              <div className="max-w-2xl mx-auto">
                <MessageInput
                  onSend={handleSendMessage}
                  disabled={isLoading}
                  placeholder="メッセージを入力..."
                />
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center px-6">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-5">
                <MessageSquare className="w-7 h-7 text-slate-300" />
              </div>
              <p className="text-base text-slate-400 mb-1">
                アプリを選択してください
              </p>
              <p className="text-sm text-slate-300">
                サイドバーからDifyアプリを選んで会話を始められます
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
