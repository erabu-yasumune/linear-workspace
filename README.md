# Linear Workspace

Linear APIを使用してタスクをガントチャート形式で表示するNext.jsアプリケーション。

## セットアップ

1. 環境ファイルをコピーして設定(プロジェクトのルートディレクトリで実施):
   ```bash
   cp .env.example .env
   ```

3. `.env`ファイル内の`LINEAR_API_KEY`にLinearのAPIキーを設定:
   ```
   LINEAR_API_KEY={your_linear_api_key_here}
   ```

4. 依存関係をインストール:
   ```bash
   npm install
   ```

## 起動方法

開発サーバーを起動:
```bash
npm run dev
```

## URL

アプリケーションは以下のURLでアクセス可能:
http://localhost:3900

## 機能

- Linear APIから取得したタスクをガントチャート形式で表示
- サイクル別のフィルタリング
- Assignee別のフィルタリング
- 手動同期ボタン
