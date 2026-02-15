import axios, { AxiosInstance } from 'axios'
import { DifyChatRequest, DifyChatResponse, DifyFileReference, DifyFileUploadResponse } from '@/types'

export class DifyAPI {
  private apiEndpoint: string
  private apiKey: string
  private appType: 'chat' | 'chatflow' | 'workflow'
  private axiosInstance: AxiosInstance

  constructor(apiEndpoint: string, apiKey: string, appType?: 'chat' | 'chatflow' | 'workflow') {
    this.apiEndpoint = apiEndpoint
    this.apiKey = apiKey
    this.appType = appType || 'chat'

    this.axiosInstance = axios.create({
      baseURL: apiEndpoint,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    })
  }

  // Dify にファイルをアップロードし、upload_file_id とファイルタイプを返す
  async uploadFile(file: File): Promise<{ uploadFileId: string; fileType: DifyFileReference['type'] }> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('apiEndpoint', this.apiEndpoint)
    formData.append('apiKey', this.apiKey)

    const response = await fetch('/api/dify/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      let errorMessage = `Upload Error: ${response.status}`
      try {
        const errorData = await response.json()
        if (errorData.error) errorMessage = errorData.error
      } catch {
        // 無視
      }
      throw new Error(errorMessage)
    }

    const data = await response.json()
    return {
      uploadFileId: data.id,
      fileType: data.detectedType || 'document',
    }
  }

  async sendMessage(
    query: string,
    conversationId?: string,
    inputs?: Record<string, any>,
    responseMode: 'blocking' | 'streaming' = 'streaming',
    files?: DifyFileReference[]
  ): Promise<ReadableStream<Uint8Array> | DifyChatResponse> {
    // Next.jsのAPIルート経由でプロキシを使用（CORS問題を回避）
    try {
      const response = await fetch('/api/dify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiEndpoint: this.apiEndpoint,
          apiKey: this.apiKey,
          query,
          conversationId,
          inputs,
          responseMode,
          appType: this.appType,
          ...(files && files.length > 0 ? { files } : {}),
        }),
      })

      if (!response.ok) {
        let errorMessage = `API Error: ${response.status} ${response.statusText}`
        try {
          const errorData = await response.json()
          if (errorData.error) {
            errorMessage = errorData.error
          } else if (errorData.message) {
            errorMessage = errorData.message
          }
        } catch (e) {
          const text = await response.text().catch(() => '')
          if (text) {
            errorMessage = `API Error: ${response.status} - ${text.substring(0, 200)}`
          }
        }
        throw new Error(errorMessage)
      }

      if (responseMode === 'streaming') {
        if (!response.body) {
          throw new Error('Response body is null')
        }
        return response.body
      } else {
        const data = await response.json()
        return data
      }
    } catch (fetchError) {
      // ネットワークエラー（接続エラーなど）
      if (fetchError instanceof Error) {
        throw fetchError
      }
      throw new Error(`接続エラー: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`)
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

  getAppType(): 'chat' | 'chatflow' | 'workflow' {
    return this.appType
  }
}

