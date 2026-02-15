# DifyAppShare YAMLテンプレート

DifyAppShareアプリと連携するためのDify DSLテンプレート集。

---

## DifyAppShareが送る情報（重要）

DifyAppShareからDifyに送られるデータは以下の2つだけ。

チャットボット・チャットフローの場合:
- query: ユーザーが入力したテキスト
- files: 添付ファイル（アップロード済みID）

ワークフローの場合:
- inputs.question: ユーザーが入力したテキスト
- files: 添付ファイル（アップロード済みID）

ワークフローのStartノードで使える変数名は `question` に固定されている。
それ以外の入力変数を追加する場合は required: false（任意）にすること。
requiredにするとDifyAppShareから値が送られずエラーになる。

---

## 接続手順

1. Difyでアプリを作成し、公開する
2. 「バックエンドサービスAPI」のページでAPIキーを発行する
3. DifyAppShareでアプリを登録する:
   - アプリタイプ: チャットボット / チャットフロー / ワークフロー のいずれかを選択
   - APIエンドポイント: `http://dify-tutorial.ezoai.jp/v1`（ベースURLのみ）
   - APIキー: 発行した `app-` で始まるキーを貼り付け

エンドポイントはどのアプリタイプでも同じベースURLでよい。
DifyAppShareが自動的に正しいパスを付加する:
- チャットボット・チャットフロー → /v1/chat-messages
- ワークフロー → /v1/workflows/run
- ファイルアップロード → /v1/files/upload

---

## テンプレート一覧

### dify_template_saas_chat.yml（チャットボット型）

会話形式のアプリ。DifyAppShareからテキストとファイルを送ると、LLMが対話的に応答する。

- インポート後にやること: LLMモデルの選択、pre_promptの書き換え
- DifyAppShareでの登録時: アプリタイプ「チャットボット」を選択

### dify_template_saas_workflow.yml（ワークフロー型 基本）

Start → LLM → End の最小構成ワークフロー。

- Start変数: question（テキスト、必須）、file（ファイル、任意）
- インポート後にやること: LLMモデルの選択、プロンプトの書き換え
- DifyAppShareでの登録時: アプリタイプ「ワークフロー」を選択

### dify_template_saas_workflow_advanced.yml（ワークフロー型 拡張）

Start → LLM → End にcategory変数（任意）を追加した構成。
LLMプロンプト内でcategoryを参照し、処理を切り替える。

- Start変数: question（テキスト、必須）、file（ファイル、任意）、category（セレクト、任意）
- categoryはDify UI上での手動実行時に使える。DifyAppShareからは送られない
- インポート後にやること: LLMモデルの選択、プロンプトの書き換え
- DifyAppShareでの登録時: アプリタイプ「ワークフロー」を選択

---

## Difyでアプリを自作する場合のルール

DifyAppShareと連携するアプリを自分で作る場合、以下を守ること。

チャットボット・チャットフロー:
- 特別な制約なし。通常どおりDifyでアプリを作ればDifyAppShareから使える

ワークフロー:
- Startノードにparagraph型の変数 `question` を必須で作る（変数名は必ず question）
- ファイルを受け取りたい場合はfile型の変数 `file` を任意で追加する
- それ以外の変数を追加してもよいが、必ず required: false にする

---

## 対応ファイル形式

| 分類 | 拡張子 |
|------|--------|
| 画像 | .jpg, .jpeg, .png, .gif, .webp |
| 文書 | .pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx |
| データ | .csv, .txt, .md, .json, .xml, .html |
| 音声 | .mp3, .wav |
| 動画 | .mp4, .webm, .mov |
