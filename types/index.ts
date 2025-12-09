export interface DifyApp {
  id: string
  name: string
  description: string
  apiEndpoint: string
  apiKey: string
  createdBy: string
  createdAt: string
  updatedAt: string
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
  id: string
  message_id: string
  conversation_id: string
  answer: string
  created_at: number
}

