import { NextRequest, NextResponse } from 'next/server'

// APIキーとエンドポイントのサニタイズ
function sanitizeInput(value: string): string {
  return value
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '')
    .replace(/^["'`]+|["'`]+$/g, '')
    .replace(/[\r\n\t]/g, '')
    .trim()
}

// MIMEタイプからDifyのファイルタイプを判定
function detectDifyFileType(mimeType: string): 'image' | 'document' | 'audio' | 'video' | 'custom' {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('audio/')) return 'audio'
  if (mimeType.startsWith('video/')) return 'video'

  const documentMimes = [
    'application/pdf',
    'text/plain',
    'text/csv',
    'text/html',
    'text/markdown',
    'application/json',
    'application/xml',
    'text/xml',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',   // .docx
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',          // .xlsx
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',  // .pptx
    'application/msword',           // .doc
    'application/vnd.ms-excel',     // .xls
    'application/vnd.ms-powerpoint', // .ppt
  ]
  if (documentMimes.includes(mimeType)) return 'document'

  return 'custom'
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const apiEndpoint = sanitizeInput((formData.get('apiEndpoint') as string) || '')
    const apiKey = sanitizeInput((formData.get('apiKey') as string) || '')

    if (!file || !apiEndpoint || !apiKey) {
      return NextResponse.json(
        { error: 'file, apiEndpoint, apiKey はすべて必須です' },
        { status: 400 }
      )
    }

    // エンドポイントの正規化: /v1 の base URL を取得
    let baseUrl = apiEndpoint.endsWith('/')
      ? apiEndpoint.slice(0, -1)
      : apiEndpoint

    // /chat-messages や /workflows/run を取り除いてベースURLを得る
    const pathsToStrip = ['/chat-messages', '/workflows/run']
    for (const path of pathsToStrip) {
      if (baseUrl.endsWith(path)) {
        baseUrl = baseUrl.slice(0, -path.length)
        break
      }
    }

    const uploadUrl = `${baseUrl}/files/upload`

    // Dify API にファイルをアップロード
    const difyFormData = new FormData()
    difyFormData.append('file', file)
    difyFormData.append('user', 'dify-app-share-user')

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: difyFormData,
    })

    if (!response.ok) {
      let errorMessage = `Upload Error: ${response.status} ${response.statusText}`
      try {
        const errorData = await response.json()
        if (errorData.message) errorMessage = errorData.message
        else if (errorData.error) errorMessage = errorData.error
      } catch {
        // JSON解析失敗時はデフォルトメッセージのまま
      }
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      )
    }

    const data = await response.json()

    // ファイルタイプを判定して返す
    const fileType = detectDifyFileType(file.type)

    return NextResponse.json({
      ...data,
      detectedType: fileType,
    })
  } catch (error) {
    console.error('File upload proxy error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error
          ? error.message
          : 'ファイルアップロード中にエラーが発生しました',
      },
      { status: 500 }
    )
  }
}
