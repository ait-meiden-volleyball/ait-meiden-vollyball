# 愛工大名電バレーボール部 公式サイト

愛工大名電バレーボール部の公式Webサイトです。中学生・保護者・学校関係者・活動支援企業に向けて、文武両道、高校プロ監督制、進路支援、大会結果などを紹介します。

## 技術構成

- HTML
- CSS
- JavaScript
- 外部フレームワーク、ビルド処理なし

## ページ構成

- `index.html` - トップページ
- `pages/team.html` - 理念・チーム
- `pages/staff.html` - 高校プロ監督・スタッフ
- `pages/career.html` - 進路実績・進路支援
- `pages/results.html` - 大会結果
- `pages/recruit.html` - 入部希望者・保護者向け情報
- `pages/sponsors.html` - 活動支援企業
- `pages/contact.html` - お問い合わせ案内

## ローカル確認

プロジェクトルートで以下を実行します。

```sh
ruby -run -e httpd . -p 4173
```

ブラウザで `http://localhost:4173/` を開いてください。

## Vercel公開

静的サイトのため、ビルドコマンドや出力フォルダの指定は不要です。GitHubリポジトリをVercelへインポートすると、ルートの`index.html`がトップページとして公開されます。

## 公開前の更新項目

- 体験入部の受付開始後、`data-application-url`へ学校公式申込URLを設定
- 活動支援企業の公式サイトURLが確定したら、各ロゴへリンクを設定
- 公開ドメイン確定後、OGP URLや必要な解析タグを追加
