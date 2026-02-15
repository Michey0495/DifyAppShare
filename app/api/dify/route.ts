import { NextRequest, NextResponse } from 'next/server'

// APIキーとエンドポイントのサニタイズ
// コピペ時の不可視文字、引用符、改行をすべて除去
function sanitizeInput(value: string): string {
  return value
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '') // ゼロ幅文字・NBSP除去
    .replace(/^["'`]+|["'`]+$/g, '')               // 前後の引用符除去
    .replace(/[\r\n\t]/g, '')                       // 改行・タブ除去
    .trim()
}

// CORS preflight リクエストの処理
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, conversationId, inputs, responseMode, appType, files } = body
    const apiEndpoint = sanitizeInput(body.apiEndpoint || '')
    const apiKey = sanitizeInput(body.apiKey || '')

    if (!apiEndpoint || !apiKey) {
      return NextResponse.json(
        { error: 'Missing required parameters: apiEndpoint or apiKey' },
        {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    // APIキーの形式チェック
    if (!apiKey.startsWith('app-')) {
      return NextResponse.json(
        { error: `APIキーの形式が正しくありません。「app-」で始まるキーを入力してください（現在の先頭: "${apiKey.substring(0, 6)}..."）` },
        {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    // エンドポイントの正規化: 末尾スラッシュ、/chat-messages、/workflows/run を除去してベースURLにする
    let baseUrl = apiEndpoint.endsWith('/')
      ? apiEndpoint.slice(0, -1)
      : apiEndpoint
    baseUrl = baseUrl.replace(/\/(chat-messages|workflows\/run)$/, '')

    // アプリタイプの判定（明示的なappTypeを優先、なければURLから推定）
    const isWorkflow = appType === 'workflow' ||
                       (!appType && (apiEndpoint.includes('/workflows/run')))

    let url: string
    let requestData: any

    if (isWorkflow) {
      // ワークフローアプリの場合
      url = `${baseUrl}/workflows/run`

      // ワークフローアプリはqueryではなくinputsに含める
      // 入力変数名は 'question' に固定（段落形式の256文字）
      const workflowInputs = inputs || {}
      if (query) {
        // queryが提供されている場合、'question'という変数名で設定
        workflowInputs['question'] = query
      }

      requestData = {
        inputs: workflowInputs,
        response_mode: responseMode || 'streaming',
        user: 'dify-app-share-user',
        ...(files && files.length > 0 ? { files } : {}),
      }
    } else {
      // チャットアプリの場合
      if (!query) {
        return NextResponse.json(
          { error: 'Missing required parameter: query (for chat apps)' },
          { 
            status: 400,
            headers: {
              'Access-Control-Allow-Origin': '*',
            },
          }
        )
      }

      url = `${baseUrl}/chat-messages`

      requestData = {
        inputs: inputs || {},
        query,
        response_mode: responseMode || 'streaming',
        conversation_id: conversationId,
        user: 'dify-app-share-user',
        ...(files && files.length > 0 ? { files } : {}),
      }
    }

    // デバッグログ（キーの先頭のみ表示）
    const maskedKey = apiKey.length > 8
      ? `${apiKey.substring(0, 8)}...(${apiKey.length}文字)`
      : `${apiKey}(${apiKey.length}文字)`
    console.log(`[Dify API] url=${url}, appType=${appType || 'auto'}, key=${maskedKey}`)

    // サーバー側からDify APIにリクエストを送信（CORS問題を回避）
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    })

    if (!response.ok) {
      let errorMessage = `API Error: ${response.status} ${response.statusText}`
      try {
        const errorData = await response.json()
        if (errorData.message) {
          errorMessage = errorData.message
        } else if (errorData.error) {
          errorMessage = errorData.error
        }
      } catch (e) {
        const text = await response.text().catch(() => '')
        if (text) {
          errorMessage = text.substring(0, 200)
        }
      }

      // 401エラーの場合、ユーザーに分かりやすいガイドを付加
      if (response.status === 401) {
        console.error(`[Dify API] 認証エラー: key=${maskedKey}, url=${url}`)
        errorMessage = `APIキーが無効です（キー先頭: ${apiKey.substring(0, 8)}...）。以下を確認してください: (1) DifyでアプリのAPIキーを再発行する (2) アプリが「公開」状態か確認する (3) キーをコピーし直して再登録する`
      }

      return NextResponse.json(
        { error: errorMessage },
        {
          status: response.status,
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    // ストリーミングレスポンスをそのまま転送
    if (responseMode === 'streaming' && response.body) {
      return new NextResponse(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
        },
      })
    } else {
      const data = await response.json()
      return NextResponse.json(data, {
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      })
    }
  } catch (error) {
    console.error('Dify API proxy error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error 
          ? error.message 
          : 'Unknown error occurred',
        details: error instanceof Error ? error.stack : undefined
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
}

