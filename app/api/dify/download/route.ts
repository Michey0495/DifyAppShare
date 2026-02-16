import { NextRequest, NextResponse } from 'next/server'

// Difyのファイルダウンロードプロキシ
// ブラウザからDifyの署名付きURLに直接アクセスするとCORS制限にかかるため、
// サーバー側で取得してクライアントに転送する
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const fileUrl = searchParams.get('url')
  const filename = searchParams.get('filename') || 'download'

  if (!fileUrl) {
    return NextResponse.json(
      { error: 'Missing url parameter' },
      { status: 400 }
    )
  }

  // URLのバリデーション: Difyのホストからのファイルのみ許可
  try {
    const parsed = new URL(fileUrl)
    // filesパスを含むURLのみ許可
    if (!parsed.pathname.includes('/files/')) {
      return NextResponse.json(
        { error: 'Invalid file URL' },
        { status: 400 }
      )
    }
  } catch {
    return NextResponse.json(
      { error: 'Invalid URL format' },
      { status: 400 }
    )
  }

  try {
    const response = await fetch(fileUrl, {
      headers: {
        'Accept': '*/*',
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch file: ${response.status}` },
        { status: response.status }
      )
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const body = await response.arrayBuffer()

    return new NextResponse(body, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Content-Length': body.byteLength.toString(),
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('File download proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    )
  }
}
