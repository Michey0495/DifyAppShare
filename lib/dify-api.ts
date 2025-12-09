import axios, { AxiosInstance } from 'axios'
import { DifyChatRequest, DifyChatResponse } from '@/types'

export class DifyAPI {
  private apiEndpoint: string
  private apiKey: string
  private axiosInstance: AxiosInstance

  constructor(apiEndpoint: string, apiKey: string) {
    this.apiEndpoint = apiEndpoint
    this.apiKey = apiKey
    this.axiosInstance = axios.create({
      baseURL: apiEndpoint,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    })
  }

  async sendMessage(
    query: string,
    conversationId?: string,
    inputs?: Record<string, any>,
    responseMode: 'blocking' | 'streaming' = 'streaming'
  ): Promise<ReadableStream<Uint8Array> | DifyChatResponse> {
    const requestData: DifyChatRequest = {
      inputs: inputs || {},
      query,
      response_mode: responseMode,
      conversation_id: conversationId,
      user: 'dify-app-share-user',
    }

    if (responseMode === 'streaming') {
      // エンドポイントの末尾にスラッシュがないことを確認
      const endpoint = this.apiEndpoint.endsWith('/') 
        ? this.apiEndpoint.slice(0, -1) 
        : this.apiEndpoint
      const url = endpoint.endsWith('/chat-messages') 
        ? endpoint 
        : `${endpoint}/chat-messages`

      let response: Response
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        })
      } catch (fetchError) {
        // ネットワークエラー（CORS、接続エラーなど）
        if (fetchError instanceof TypeError && fetchError.message.includes('fetch')) {
          throw new Error('ネットワークエラー: APIエンドポイントに接続できません。CORS設定またはエンドポイントURLを確認してください。')
        }
        throw new Error(`接続エラー: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`)
      }

      if (!response.ok) {
        // エラーレスポンスの詳細を取得
        let errorMessage = `API Error: ${response.status} ${response.statusText}`
        try {
          const errorData = await response.json()
          if (errorData.message) {
            errorMessage = `API Error: ${response.status} - ${errorData.message}`
          } else if (errorData.error) {
            errorMessage = `API Error: ${response.status} - ${errorData.error}`
          } else if (errorData.code) {
            errorMessage = `API Error: ${response.status} - ${errorData.code}: ${errorData.message || errorData.error || ''}`
          }
        } catch (e) {
          // JSONパースに失敗した場合はデフォルトメッセージを使用
          const text = await response.text().catch(() => '')
          if (text) {
            errorMessage = `API Error: ${response.status} - ${text.substring(0, 200)}`
          }
        }
        throw new Error(errorMessage)
      }

      if (!response.body) {
        throw new Error('Response body is null')
      }

      return response.body
    } else {
      const response = await this.axiosInstance.post<DifyChatResponse>(
        '/chat-messages',
        requestData
      )
      return response.data
    }
  }

  async *parseStreamResponse(
    stream: ReadableStream<Uint8Array>
  ): AsyncGenerator<DifyChatResponse, void, unknown> {
    const reader = stream.getReader()
    const decoder = new TextDecoder()

    try {
      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.trim() === '') continue
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              yield data
            } catch (e) {
              console.error('Failed to parse stream data:', e)
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }
}

