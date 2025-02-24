# オセロゲーム

Next.js、TypeScript、Socket.IOを使用したオンライン対戦可能なオセロゲームです。

## 機能

- ソロプレイ（AI対戦）
  - 3段階の難易度設定
  - ヒント表示機能
- オンライン対戦
  - リアルタイムでの対戦
  - ルーム機能
  - 対戦相手の待機状態表示
- モダンなUI/UX
  - アニメーション効果
  - レスポンシブデザイン
  - 直感的な操作

## 技術スタック

- Next.js 15.1.7
- TypeScript
- Socket.IO
- Tailwind CSS
- Framer Motion
- Lucide React

## 開発環境のセットアップ

```bash
# リポジトリのクローン
git clone [リポジトリURL]

# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

## デプロイ

```bash
# ビルド
npm run build

# 本番環境での起動
npm run start
```

## ライセンス

MIT

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
