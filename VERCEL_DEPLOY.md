# Vercelへのデプロイ手順

## 方法1: Vercel Web UIからデプロイ（推奨）

### 手順

1. **Vercelにアクセス**
   - https://vercel.com にアクセス
   - GitHubアカウントでログイン（またはサインアップ）

2. **プロジェクトをインポート**
   - ダッシュボードで「Add New...」→「Project」をクリック
   - 「Import Git Repository」から `Michey0495/DifyAppShare` を選択
   - 「Import」をクリック

3. **プロジェクト設定**
   - **Framework Preset**: Next.js（自動検出されるはず）
   - **Root Directory**: `./`（そのまま）
   - **Build Command**: `npm run build`（自動設定されるはず）
   - **Output Directory**: `.next`（自動設定されるはず）
   - **Install Command**: `npm install`（自動設定されるはず）

4. **環境変数**
   - 現在は環境変数は不要ですが、将来的に必要になった場合はここで設定できます

5. **デプロイ**
   - 「Deploy」ボタンをクリック
   - 数分でデプロイが完了します

6. **デプロイ完了後**
   - 自動的にURLが生成されます（例: `dify-app-share.vercel.app`）
   - カスタムドメインも設定可能です

## 方法2: Vercel CLIからデプロイ

### 手順

1. **Vercelにログイン**
   ```bash
   cd /Users/coelaqanth_006/Desktop/03tutor/DifyRe/DifyAppShare
   vercel login
   ```

2. **デプロイ**
   ```bash
   vercel
   ```
   - 初回は設定を聞かれますが、基本的にEnterキーで進めます
   - プロジェクト名や設定を確認します

3. **本番環境にデプロイ**
   ```bash
   vercel --prod
   ```

## 注意事項

- Next.js 14のApp Routerを使用しているため、Vercelが自動的に最適化してくれます
- ビルドが成功することを確認してください（`npm run build`でローカルでテスト可能）
- GitHubリポジトリと連携すると、プッシュのたびに自動デプロイされます

## トラブルシューティング

### ビルドエラーが発生する場合
- ローカルで `npm run build` を実行してエラーを確認
- `package.json`の依存関係が正しいか確認
- Node.jsのバージョンが18以上であることを確認

### 環境変数が必要な場合
- Vercelのプロジェクト設定 → Environment Variables から設定
- 本番環境、プレビュー環境、開発環境で個別に設定可能

