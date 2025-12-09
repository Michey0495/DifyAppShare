# GitHubへのプッシュ手順

## 現在の状況
- ローカルリポジトリには2つのコミットがあります
- リモートリポジトリが設定されていません

## 手順

### 1. GitHubリポジトリのURLを確認
GitHubでリポジトリページを開き、「Code」ボタンからHTTPSのURLをコピーしてください。
例: `https://github.com/ユーザー名/DifyAppShare.git`

### 2. リモートリポジトリを追加
```bash
cd /Users/coelaqanth_006/Desktop/03tutor/DifyRe/DifyAppShare
git remote add origin https://github.com/ユーザー名/DifyAppShare.git
```

### 3. プッシュ
```bash
git push -u origin main
```

## 注意事項
- GitHubリポジトリが既に存在し、ファイルが含まれている場合は、先にpullする必要がある場合があります
- 認証が必要な場合は、Personal Access TokenまたはSSHキーを使用してください

