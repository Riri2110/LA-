# COLOR HUNT

大学バドミントンサークル「ラブオール」のチーム対抗カラーハント用Webアプリです。

## 構成

- Next.js App Router
- Supabase Database
- Supabase Storage（非公開バケット）
- Vercel

## 1. Supabaseを準備する

1. https://supabase.com にアクセスし、サインインします。
2. **New project** を選び、プロジェクトを作成します。
3. 作成後、左メニューの **Project Settings → API** を開きます。
4. **Project URL** と **service_role key** を控えます。

service_role keyはブラウザやGitHubに公開しないでください。

## 2. データベースとStorageを作成する

1. Supabase左メニューの **SQL Editor** を開きます。
2. **New query** を押します。
3. リポジトリ内の `supabase/migration.sql` を開き、全文をコピーして貼り付けます。
4. 右下の **Run** を押します。

実行すると次が作成されます。

- 仮チーム4件（チーム名と色のみ。パスワード未設定）
- 投稿テーブル
- イベント受付設定
- 非公開Storageバケット `color-hunt-private`

RLSを有効化し、ブラウザからの直接アクセスは行えません。

## 3. 環境変数を設定する

VS Codeの左サイドバーで **Explorer** を開きます。
`.env.example` を右クリックし、**Rename** で `.env.local` に変更します。
次の値を設定します。

```env
SUPABASE_URL=https://xxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=取得したservice_role key
SESSION_SECRET=32文字以上のランダム文字列
ADMIN_PASSWORD=運営者用の強いパスワード
```

SESSION_SECRETは次のコマンドで生成できます。

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 4. ローカルで起動する

VS Code上部メニューの **ターミナル → 新しいターミナル** を押します。
依存関係をインストールします。

```bash
npm install
```

起動します。

```bash
npm run dev
```

ターミナルに表示された `http://localhost:3000` をブラウザで開きます。

## 5. 初期設定と利用手順

1. トップで **運営者ログイン** を押します。
2. `.env.local` の `ADMIN_PASSWORD` を入力します。
3. 運営者画面で各チームの名前、色、パスワードを設定します。
4. トップの **チームで参加** からログインします。
5. 16個のお題マスをタップして写真を撮影または選択します。
6. 運営者画面の **全チーム一覧** または `/common` で進捗を確認します。
7. イベント終了後は運営者画面で **イベント終了** を押します。

## セキュリティ

- APIサーバーがチームID、運営者セッション、投稿可否を確認します。
- チームは自分のチーム以外へ投稿・参照できません。
- Storageは非公開です。
- Service Role Keyと運営者パスワードはサーバー環境変数だけに置いてください。
- `.env.local` はGitにコミットしないでください。

## Vercelで公開する

1. GitHubで新しいリポジトリを作成し、このプロジェクトをプッシュします。
2. https://vercel.com にサインインします。
3. **Add New → Project** を押します。
4. GitHubリポジトリを選択します。
5. **Environment Variables** に次を登録します。
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SESSION_SECRET`
   - `ADMIN_PASSWORD`
6. **Deploy** を押します。
7. 完了後に表示されたURLをスマートフォンで開きます。
