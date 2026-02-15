# DifyAppShare YAMLテンプレート

DifyAppShareアプリと連携するためのDify DSLテンプレート集。
テキスト入力とファイル添付（画像、PDF、Office、CSV、音声、動画）を受け付ける設定が済んでいる状態で提供する。

---

## テンプレート一覧

### dify_template_saas_chat.yml（チャットアプリ型）

会話形式のチャットアプリ。DifyAppShareからテキストとファイルを送ると、LLMが対話的に応答する。

- ファイルアップロード: 全形式有効
- opening_statement: 初回表示メッセージ（対応形式の案内付き）
- suggested_questions: 3つのサンプル質問
- プロンプト: pre_prompt に書き換え前提のプレースホルダーを配置

用途の例: カスタマーサポート、文書Q&A、画像分析チャット

### dify_template_saas_workflow.yml（ワークフロー型 基本）

Start -> LLM -> End の最小構成ワークフロー。

- Start: `question`（テキスト、必須）+ `file`（ファイル、任意）
- LLM: システムプロンプト + ユーザー入力 + ファイルVision有効
- End: LLMのテキスト出力をそのまま返す

用途の例: 文書解析、画像OCR、一問一答型の処理

### dify_template_saas_workflow_advanced.yml（ワークフロー型 RAG+分岐付き）

Start -> Knowledge Retrieval -> IF/ELSE -> LLM -> End の構成。

- Start: `question`（テキスト）+ `file`（ファイル）+ `category`（セレクト: 分析/要約/翻訳/その他）
- Knowledge Retrieval: ナレッジベース検索（データセットIDは空。インポート後に設定する）
- IF/ELSE: categoryが「分析」かどうかで分岐（スケルトン）
- LLM: ナレッジコンテキスト付きプロンプト + ファイルVision

用途の例: 社内ナレッジRAG、カテゴリ別文書処理、多機能AIアシスタント

---

## Difyへのインポート手順

1. Dify管理画面にログインする
2. 左メニュー「スタジオ」を開く
3. 右上の「アプリを作成」ドロップダウンから「DSLファイルをインポート」を選ぶ
4. テンプレートYAMLファイルをドラッグ&ドロップまたは選択してアップロード
5. アプリが作成される

インポート後に必ずやること:
- LLMノード（またはモデル設定）でお使いのモデル（GPT-4o、Claude等）を選択する
- プロンプトを用途に合わせて書き換える
- advanced版はナレッジベースを紐付ける

---

## DifyAppShareアプリとの連携

DifyAppShareは2つのアプリタイプに対応している。

チャットアプリ（mode: chat）の場合:
- APIエンドポイント末尾が `/chat-messages` になる
- `query` にテキスト、`files` 配列にアップロード済みファイルIDを送信
- `conversation_id` で会話を継続

ワークフローアプリ（mode: workflow）の場合:
- APIエンドポイント末尾が `/workflows/run` になる
- `inputs.question` にテキストを格納
- `files` 配列にアップロード済みファイルIDを送信
- Startノードの変数名 `question` は固定（アプリ側のコードがこの名前を使う）

---

## カスタマイズのヒント

### 変数名を変えたい場合

DifyAppShareの `/app/api/dify/route.ts` では、ワークフロー実行時に `query` を `inputs.question` にマッピングしている。変数名を変更する場合はアプリ側のコードも合わせて修正すること。

### ファイル処理を強化したい場合

- ワークフロー型なら Start と LLM の間に「ドキュメントエクストラクタ」ノードを追加し、ファイルからテキストを抽出してからLLMに渡すと精度が上がる
- 画像の場合は LLM の Vision 機能が直接処理するので、エクストラクタは不要

### 複数の分岐先を作りたい場合

advanced版のIF/ELSEは2分岐のみ。カテゴリ4種に対応するには:
- IF/ELSEを直列に繋いで「分析」「要約」「翻訳」「その他」を順番に判定する
- または「コード実行」ノードで分岐ロジックを書き、後続ノードへの入力を切り替える

### ナレッジベースが不要な場合

advanced版の Knowledge Retrieval ノードを削除し、Start から直接 IF/ELSE に接続すればよい。LLMノードの context 設定も無効にする。

---

## 対応ファイル形式一覧

| 分類 | 拡張子 |
|------|--------|
| 画像 | .jpg, .jpeg, .png, .gif, .webp |
| 文書 | .pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx |
| データ | .csv, .txt, .md, .json, .xml, .html |
| 音声 | .mp3, .wav |
| 動画 | .mp4, .webm, .mov |
