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

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
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

export interface DifyChatRequest {
  inputs: Record<string, any>
  query: string
  response_mode: 'blocking' | 'streaming'
  conversation_id?: string
  user?: string
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
  files?: Array<{
    type: string
    transfer_method: string
    url?: string
    upload_file_id?: string
  }>
  trace_id?: string
}

