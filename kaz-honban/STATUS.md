# NihonGo 本番 — 現状サマリ

最終更新: 2026-04-13 / 最新コミット: `3687d42`

---

## 🟢 今すぐ使える機能（動作確認済み）

### 学習者（Learner）フロー

| 機能 | 使い方 | 実装 |
|---|---|---|
| **サインアップ** | `/signup` → Google / Apple / Email | `src/app/(auth)/signup/page.tsx` |
| **講師を探す** | `/teachers` | カテゴリ・価格・言語（複数）・レベル・曜日・時間帯で絞り込み可能 |
| **ソート** | おすすめ / 評価順 / 価格順 / 新着順 | 空きスロットなしの講師は自動的に下位に |
| **講師詳細** | `/teachers/[id]` | タブ式（About / Schedule / Reviews）、紹介動画、Stickyな予約CTA |
| **紹介動画シェア** | 講師詳細の「Share」ボタン | X / LINE / Instagram / URLコピー |
| **お気に入り** | カードのハート / `/favorites` | トグルで即保存 |
| **予約** | 空きスロット選択 → `/booking/confirm` | 時間選択、学習者ノート、重複予約警告モーダル付 |
| **時差併記** | スロットボタン内 | 学習者ローカル時刻＋講師ローカル時刻の二段表示 |
| **予約前準備ヒント** | `/bookings`の未開始予約 | 目標設定・デバイス確認・ノート準備のチェックリスト |
| **入室** | 予約15分前から`/room/[id]` | デバイスチェック（権限拒否/物理不在を区別）、Try Again、タイマー、チャット |
| **レビュー** | レッスン完了後 `/bookings/[id]/review` | 星5評価＋コメント1000文字まで |
| **履歴** | `/history` / `/dashboard` | 完了・キャンセル・no-showを一覧 |
| **通知ベル** | ヘッダー | 予約確定、キャンセル、レッスン完了、レポート受信 |
| **多言語切替** | ヘッダーの🇯🇵/🇺🇸 | 英語 / 日本語（localStorage保存） |
| **サポート連絡** | サイドバー「Help & support」 | `NEXT_PUBLIC_SUPPORT_EMAIL` にmailto |

### 講師（Teacher）フロー

| 機能 | 使い方 | 実装 |
|---|---|---|
| **招待受諾** | `/signup?role=teacher&invite=XXX` | 招待コード検証、`teacher_invites`に記録 |
| **プロフィール作成** | `/teacher/profile` | 写真、headline、200字以上bio、カテゴリ・言語・レベル、料金、体験レッスン、動画URL/アップロード |
| **オンボーディング進捗** | `/teacher/dashboard` 上部 | チェックリスト式（avatar / headline / bio / カテゴリ / スケジュール / 動画）、%表示、approval ステータスバッジ |
| **スケジュール設定** | `/teacher/schedule` | 曜日×時間帯テンプレート、バッファ設定、手動スロット生成も可能 |
| **予約一覧** | `/teacher/bookings` | Upcoming / Past タブ、ステータス表示 |
| **生徒事前情報** | 予約カードの「Student info」展開 | 日本語レベル、学習目標、興味、母語、学習者ノート |
| **レッスン開始** | 予約15分前から「Start Lesson」 | `/room/[id]` |
| **レッスンレポート** | 完了後 `/teacher/bookings/[id]/report` | テンプレート選択、概要・宿題・次回提案・内部メモ |
| **ダッシュボード** | `/teacher/dashboard` | 今月レッスン数、平均評価、次の生徒、今日のスケジュール、未提出レポート |
| **体験レッスンバッジ** | `trial_enabled=true` で自動表示 | 講師カードに「Free trial」「Trial $N」 |

### 管理者（Admin）フロー

| 機能 | 使い方 | 実装 |
|---|---|---|
| **講師招待** | `/admin/invites` | 招待コード発行 + Resend自動送信（emailがあれば） |
| **講師審査** | `/admin/teachers` | submitted状態を approved / rejected |
| **ユーザー検索** | `/admin/users` | email / 名前検索 |

### ビデオ通話

| 機能 | 実装 |
|---|---|
| **Daily.co ルーム** | 入室時にAPI Routeで即時生成（`/api/bookings/[id]/join`） |
| **トークン発行** | 参加者ごとに期限付きmeeting token |
| **タイマー** | 残り5分で警告色、2分で赤点滅、0分でカウントアップ |
| **振動通知** | モバイルで5分・2分前にバイブ |
| **チャット** | Supabase Realtime、画像共有対応 |
| **クイックフレーズ** | よく使う日本語フレーズワンタップ送信 |
| **単語カード** | 授業中の単語記録 |

### 自動化（Vercel Cron）

| ジョブ | 頻度 | 役割 |
|---|---|---|
| `release-holds` | 5分毎 | 期限切れhold解放 |
| `complete-lessons` | 10分毎 | `scheduled_end_at`を過ぎたin_sessionをcompletedに |
| `check-no-shows` | 15分毎 | 15分未入室をno_show、スロット解放、通知 |
| `generate-slots` | 毎日17:00 UTC | schedule_templatesから14日先まで自動生成（冪等） |
| `send-reminders` | 6時間毎 | 開始18〜30h前の予約に双方メール |

### メール（Resend）

| トリガー | 宛先 |
|---|---|
| 予約確定 | 学習者＋講師 |
| 前日リマインド | 学習者＋講師（24h前） |
| 講師招待 | 招待メール |

`RESEND_API_KEY` 未設定時は黙ってスキップ（dev環境対応）。

---

## 🟡 既に実装だが未ローンチ（要本番設定）

デプロイ前にユーザー側で以下を実施:

1. **Supabase マイグレーション適用**
   - `supabase/migrations/20260414000000_generate_slots_function.sql`
   - `supabase/migrations/20260414000100_booking_reminder_flag.sql`

2. **Vercel 環境変数**
   ```
   CRON_SECRET=<任意の長いランダム文字列>
   RESEND_API_KEY=re_xxxxx
   RESEND_FROM_EMAIL=NihonGo <noreply@yourdomain.com>
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   NEXT_PUBLIC_SUPPORT_EMAIL=support@yourdomain.com
   ```

3. **Resend DNS認証** — `yourdomain.com` の SPF / DKIM / DMARC 設定

4. **Supabase Storage**
   - `avatars` バケット作成（プロフィール写真）
   - `intro-videos` バケット作成（紹介動画アップロード）

---

## 🟠 部分実装・改善余地あり

| 項目 | 現状 | 必要な作業 |
|---|---|---|
| **講師プロフィール4ステップウィザード** | 1画面長尺フォーム（チェックリストで代替） | ステップ分割UIに置換（FIX-14） |
| **15分無料トライアル予約フロー** | バッジ表示のみ | `trial_enabled` のスロットに別料金適用 |
| **Apple Sign-In** | ボタンあり | Supabase Dashboardで Apple provider 設定必要 |
| **監査ログ / 通報** | なし | Phase 3 |
| **詳細フィルター（資格、指導経験）** | なし | Phase 3 |
| **リピート予約ショートカット** | なし | Phase 2（FIX-16） |
| **講師の1日最大レッスン数上限** | なし | Phase 2（FIX-17） |

---

## 🔴 Phase 2以降（設計済み、未実装）

- **PayPal決済** — `PAYMENT_ENABLED=false` で現在スキップ。`payments` テーブルは存在
- **レッスン延長** — 現状は手動。課金化はPhase 2
- **定期レッスン（週1固定など）** — Phase 2
- **多言語UI拡張** — 現状 en / ja のみ

---

## 📐 技術スタック

- **Next.js 15** (App Router) + TypeScript 5.8
- **React 19**
- **Tailwind CSS v4** + shadcn/ui
- **Supabase** (PostgreSQL + Auth + Storage + Realtime)
- **Daily.co** (WebRTC prebuilt)
- **Resend** (メール)
- **Vercel** (ホスティング + Cron)
- **Zod** (バリデーション)
- **Lucide React** (アイコン)

---

## 🗂 DB スキーマ（15テーブル）

- `profiles` — 全ユーザー共通情報、timezone含む
- `user_roles` — learner / teacher / admin
- `teacher_profiles` — headline, bio, rate, categories[], languages[], levels[], trial, approval_status
- `learner_profiles` — learning_goals, interests[], japanese_level, native_language
- `teacher_invites` — 招待コード、expiry、used_by
- `schedule_templates` — 曜日×時間帯、buffer_minutes
- `availability_slots` — start_at, end_at, status (open/held/booked/blocked)
- `bookings` — learner, teacher, slot, status (5種), learner_note, reminder_sent_at
- `daily_rooms` — Daily.co room情報
- `messages` — チャット、画像対応
- `reviews` — 星評価、コメント、自動集計
- `lesson_reports` — テンプレート、概要、宿題、次回提案、内部メモ
- `favorites` — 学習者→講師の1対1
- `notifications` — アプリ内通知、8種類
- `payments` — Phase 2用、paypal_order_id含む

RLS全テーブル有効。`profiles.timezone`・`learner_profiles.interests`等は `service_role` 経由で講師に表示（予約一覧のみ）。

---

## 🚀 ベータ投入チェックリスト

- [ ] Supabase 本番プロジェクト作成
- [ ] schema.sql 適用 + 新マイグレーション2本適用
- [ ] Google OAuth provider 設定（Supabase Dashboard）
- [ ] Apple OAuth provider 設定（任意）
- [ ] Storage バケット `avatars` / `intro-videos` 作成
- [ ] Daily.co API key取得
- [ ] Resend アカウント＋ドメイン認証
- [ ] Vercel 本番環境変数設定
- [ ] 管理者ユーザー1名作成（`supabase/create-admin.sql`）
- [ ] 講師40名に招待メール送信
- [ ] 初回スロット生成（cronを手動トリガー or 待機）
- [ ] 内部テスト通し: サインアップ → 予約 → 入室 → レビュー
- [ ] Instagram bio にリンク投入

---

## 📊 このセッションで解決済み

4コミット、59ファイル変更、+2500行:

1. **`891af09`** — デプロイブロッカー一掃（next.config / cron / slot生成 / メール / room UX / a11y / i18n）
2. **`d3d8374`** — 講師オンボーディングチェックリスト + 生徒事前情報
3. **`d73270c`** — 予約前準備ヒント + 新規講師ブースト + トライアルバッジ + サポートリンク
4. **`3687d42`** — タイムゾーン併記

実質的なベータ阻害要因はすべて解消、限定ベータ投入可能な品質に到達。
