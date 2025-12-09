import { NextRequest, NextResponse } from 'next/server'

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
    const { apiEndpoint, apiKey, query, conversationId, inputs, responseMode, appType } = body

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

    // エンドポイントの正規化
    const endpoint = apiEndpoint.endsWith('/') 
      ? apiEndpoint.slice(0, -1) 
      : apiEndpoint

    // アプリタイプの判定（エンドポイントURLから自動判定）
    const isWorkflow = appType === 'workflow' || 
                       endpoint.includes('/workflows/run') ||
                       endpoint.endsWith('/workflows/run')

    let url: string
    let requestData: any

    if (isWorkflow) {
      // ワークフローアプリの場合
      url = endpoint.endsWith('/workflows/run')
        ? endpoint
        : `${endpoint}/workflows/run`

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

      url = endpoint.endsWith('/chat-messages') 
        ? endpoint 
        : `${endpoint}/chat-messages`

      requestData = {
        inputs: inputs || {},
        query,
        response_mode: responseMode || 'streaming',
        conversation_id: conversationId,
        user: 'dify-app-share-user',
      }
    }

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

