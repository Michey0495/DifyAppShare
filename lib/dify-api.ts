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
      const response = await fetch(`${this.apiEndpoint}/chat-messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
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

