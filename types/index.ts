export interface DifyApp {
  id: string
  name: string
  description: string
  apiEndpoint: string
  apiKey: string
  createdBy: string
  createdAt: string
  updatedAt: string
  appType?: 'chat' | 'workflow' // アプリタイプ（自動判定も可能）
}

export interface ChatSession {
  sessionId: string
  appId: string | null
  appName?: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
}

export interface AppSettings {
  apiTimeout: number
  retryCount: number
  theme: 'light' | 'dark'
  language: 'ja' | 'en'
}

// Dify ファイルアップロードレスポンス
export interface DifyFileUploadResponse {
  id: string
  name: string
  size: number
  extension: string
  mime_type: string
  created_by: string
  created_at: number
}

// 添付ファイル情報（Dify APIリクエスト用）
export interface DifyFileReference {
  type: 'image' | 'document' | 'audio' | 'video' | 'custom'
  transfer_method: 'local_file'
  upload_file_id: string
}

// クライアント側で保持する添付ファイル情報
export interface AttachedFile {
  file: File
  uploadedId?: string // アップロード完了後にセットされる
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  fileName?: string // 添付ファイル名（表示用）
}

export interface DifyChatRequest {
  inputs: Record<string, any>
  query: string
  response_mode: 'blocking' | 'streaming'
  conversation_id?: string
  user?: string
  files?: DifyFileReference[]
}

export interface DifyChatResponse {
  event: string
  task_id: string
  id?: string
  message_id?: string
  conversation_id?: string
  answer?: string
  created_at?: number
  workflow_run_id?: string
  data?: {
    text?: string
    outputs?: Record<string, any>
    status?: string
    [key: string]: any
  }
}

export interface DifyWorkflowRequest {
  inputs: Record<string, any>
  response_mode: 'blocking' | 'streaming'
  user: string
  files?: DifyFileReference[]
  trace_id?: string
}

