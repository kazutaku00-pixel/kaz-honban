# NihonGo 本番サービス 要件定義書 v2（修正済み）
# — インスタ5万人 × 講師40人超で勝ちに行く —

---

## 0. 設計原則（全ての判断はここに立ち返る）

### 最重要原則
1. **モバイルファースト** — インスタ5万人の流入は90%以上スマホ。PC対応は後。スマホで先にデザイン。
2. **まず動く** — 決済は後。Phase 1は決済なしで予約→通話→レビューが一通り動くこと。
3. **シンプルに始める** — テーブル22個ではなく14個。ステータス11個ではなく5個。複雑化は後。
4. **継続率が全て** — レッスン報告・宿題・次回予約導線はPhase 1から入れる。

### 成功の4条件
1. 良い先生が**すぐ**見つかる（マッチング品質）
2. **確実に**予約できる（スケジュール整合性）
3. 当日**迷わず**繋がる（入室体験）
4. 終わったあと**また来たくなる**（継続率設計）

---

## 1. 成功指標（KPI）

### ローンチ後3ヶ月
| 指標 | 目標値 | 根拠 |
|------|-------|------|
| 登録生徒数 | 500人以上 | インスタ5万の1%転換 |
| アクティブ講師数 | 30人以上 | 40人中75%稼働 |
| 月間レッスン完了数 | 600回以上 | 講師1人×月20回 |
| レッスン完了率 | 90%以上 | 予約→完了 |
| 初回→2回目継続率 | 50%以上 | 宿題付きレッスン報告で実現 |
| 当日入室率 | 95%以上 | デバイスチェック+リマインドで実現 |
| 月間GMV | $9,000以上 | PayPal統合後 |

### ファネル追跡
```
Instagram → LP訪問 → 会員登録 → 初回予約 → 入室 → 完了 → レビュー → 次回予約
        ↑           ↑          ↑         ↑       ↑       ↑         ↑
     各段階の転換率を計測。ボトルネックを特定して改善。
```

---

## 2. フェーズ設計（★決済なしで動くことが最優先）

### Phase 1: コア体験（決済なしで全フロー動く）— Week 1-4
> 目標: 「講師を見つける→予約する→通話する→レビューする→次も来たくなる」が動く

**基盤:**
- [ ] プロジェクトセットアップ（Next.js 15 + Supabase + Vercel）
- [ ] DB スキーマ（15テーブル + RLS）※ teacher_invites追加
- [ ] 認証（**Google OAuth + Apple Sign-In メイン** + メール/パスワード サブ）
- [ ] ロール分岐（learner / teacher / admin）
- [ ] 登録直後の導線（学習者→講師一覧へ直行 / 講師→プロフィール設定ウィザード）

**講師セットアップ:**
- [ ] 講師招待リンク生成（管理者→講師にメール送信）
- [ ] 講師プロフィール設定ウィザード（4ステップ: 基本情報→教える内容→料金→審査申請）
- [ ] 講師審査画面（自動チェックリスト付き: 顔写真/bio文字数/カテゴリ等）
- [ ] 審査承認→「次はスケジュールを登録してください」導線

**スケジュール:**
- [ ] 曜日テンプレート登録（休憩バッファ5分含む）
- [ ] **スロット自動生成**（Vercel Cron、毎日実行、7日先まで自動展開）
- [ ] 個別スロットのブロック・追加

**予約:**
- [ ] **モバイル空き枠UI**（日付横スクロール + 時間リスト + 25分/50分選択）
- [ ] 予約フロー（決済なしモード）— 空き枠選択→確認→即確定
- [ ] 50分予約時は連続2スロットを同時hold→book
- [ ] 二重予約防止（FOR UPDATE行ロック）

**レッスン:**
- [ ] **モバイルファーストLP**（インスタ流入最適化）
- [ ] 講師一覧（検索・フィルター・ソート）
- [ ] 講師詳細ページ（空きスケジュール・レビュー・予約ボタン）
- [ ] Daily Prebuilt 埋め込み（通話ルーム）
- [ ] Room生成（入室ボタン押下時にオンデマンド生成、有効期限=終了+10分）
- [ ] 入室体験（デバイスチェック・待機画面・遅刻ガイダンス・タイマー）
- [ ] **レッスン自動完了**（Vercel Cron: scheduled_end_at到達で自動completed）
- [ ] 手動完了ボタン（講師が早期終了時に使用）

**完了後:**
- [ ] レビュー・評価（通話終了→レビュー画面自動遷移）
- [ ] **レッスン報告（テンプレート+クイック入力、記入は推奨・48時間以内）**
- [ ] **次回予約導線**（レビュー投稿後→同じ講師の空き枠3件表示→ワンタップ予約）

**ダッシュボード:**
- [ ] 学習者ダッシュボード（次回レッスン・宿題・おすすめ講師）
- [ ] 講師ダッシュボード（今日のスケジュール・次の生徒情報・月間実績）
- [ ] お気に入り機能
- [ ] 受講履歴（レッスン報告・宿題閲覧）

**通知・運用:**
- [ ] アプリ内通知
- [ ] **最低限メール通知**（Resend前倒し: 予約確定+前日リマインドの2種のみ）
- [ ] お問い合わせリンク（support@メールアドレス表示）
- [ ] 管理者：講師審査（チェックリスト付き）+ ユーザー一覧 + 予約ステータス手動変更

**Vercel Cron Jobs（Phase 1で必要）:**
- [ ] `/api/cron/release-holds` — 仮押さえ自動解放（5分間隔）
- [ ] `/api/cron/generate-slots` — テンプレートからスロット自動生成（毎日1回）
- [ ] `/api/cron/complete-lessons` — レッスン自動完了判定（5分間隔）
- [ ] `/api/cron/check-no-shows` — no-show自動判定（5分間隔）

### Phase 2: 収益化 + コミュニケーション — Week 5-6
- [ ] **PayPal Checkout統合**
- [ ] PayPal Webhook処理
- [ ] 予約フローに決済ステップ追加（決済あり/なしの切替フラグ）
- [ ] チャット（Supabase Realtime、予約単位）
- [ ] メール通知（Resend：予約確定、リマインド、キャンセル）
- [ ] 管理者：KPIダッシュボード + 返金処理
- [ ] トライアルレッスン機能（15分無料/格安枠）

### Phase 3: グロース + 品質 — Week 7-8
- [ ] 通報管理
- [ ] 監査ログ
- [ ] 回数券・継続パッケージ
- [ ] 画面共有
- [ ] i18n基盤（next-intl）
- [ ] SEO最適化
- [ ] Sentry + PostHog
- [ ] 本番ドメイン設定

---

## 3. 技術スタック

| レイヤー | 技術 | 理由 |
|---------|------|------|
| フレームワーク | **Next.js 15 (App Router)** | SSR/ISR、Server Components |
| 言語 | **TypeScript** | 型安全性 |
| スタイリング | **Tailwind CSS v4 + shadcn/ui** | モバイルファースト高速UI |
| DB/Auth/Storage | **Supabase** | PostgreSQL + Auth + RLS + Realtime |
| ビデオ通話 | **Daily.co Prebuilt** | 安定性最優先、数行で動く |
| 決済 | **PayPal** (Phase 2) | PayPal Checkout SDK |
| メール | **Resend** (Phase 2) | トランザクションメール |
| ホスティング | **Vercel** | Next.js親和性 |
| バリデーション | **Zod** | クライアント+サーバー共通 |

---

## 4. 認証設計

### 方針: フリクション最小化
インスタから来たユーザーにパスワード入力させたら離脱率80%超。

**メインフロー（推奨）:**
```
Google or Apple でログイン → ロール選択（学習者 or 講師）→ 即利用可能
  学習者 → 講師一覧ページへ直行
  講師 → プロフィール設定ウィザードへ
```
- プロフィール詳細は**後から入力可能**（離脱防止）
- ロール選択すら初回予約時まで遅延可能（デフォルトは学習者）
- **Apple Sign-In必須**（インスタユーザーの大半がiPhone）

**サブフロー:**
```
メール/パスワード登録 → メール確認 → ロール選択 → 利用開始
```

**講師招待フロー（既存40人の移行用）:**
```
管理者が招待リンク生成 → 講師にメール送信
→ /signup?role=teacher&invite=XXXXX
→ 登録 → 審査ステータスをsubmittedで開始（draftスキップ）
→ プロフィール設定ウィザード → 管理者が承認
```

### 講師審査ステータス
```
draft → submitted → approved → (suspended)
                  → rejected → (再提出 → submitted)
```

---

## 5. 画面一覧（モバイルファースト）

### 5.1 パブリック
| 画面 | パス | モバイル重要度 |
|------|------|-------------|
| LP | `/` | ★★★ インスタ流入先 |
| ログイン | `/login` | ★★★ |
| 新規登録 | `/signup` | ★★★ |
| 講師一覧 | `/teachers` | ★★★ |
| 講師詳細 | `/teachers/[id]` | ★★★ |
| 利用規約 | `/terms` | ★ |
| プライバシー | `/privacy` | ★ |

### 5.2 学習者
| 画面 | パス | 説明 |
|------|------|------|
| ダッシュボード | `/dashboard` | 次回レッスン・おすすめ講師・最近の宿題 |
| 予約確認 | `/booking/confirm` | 日時・講師・（料金）確認 |
| 予約一覧 | `/bookings` | 今後+過去の予約 |
| レッスンルーム | `/room/[id]` | Daily通話 |
| レビュー投稿 | `/bookings/[id]/review` | 完了後レビュー + 次回予約CTA |
| 受講履歴 | `/history` | 過去レッスン・レポート・宿題 |
| お気に入り | `/favorites` | ブックマーク講師 |
| プロフィール | `/settings` | 自己情報編集 |

### 5.3 講師
| 画面 | パス | 説明 |
|------|------|------|
| ダッシュボード | `/teacher/dashboard` | 今日の予定・次の生徒情報・月間実績 |
| プロフィール | `/teacher/profile` | 全情報編集 |
| スケジュール | `/teacher/schedule` | 空き枠登録 |
| 予約一覧 | `/teacher/bookings` | 予約管理 |
| レッスン報告 | `/teacher/bookings/[id]/report` | 要約・宿題・次回推奨 |
| レッスンルーム | `/room/[id]` | Daily通話（共通） |
| 収益 | `/teacher/earnings` | 売上一覧（Phase 2以降実データ） |

### 5.4 管理者
| 画面 | パス | 説明 |
|------|------|------|
| ダッシュボード | `/admin` | 主要KPI |
| 講師審査 | `/admin/teachers` | 承認/却下 |
| ユーザー管理 | `/admin/users` | 一覧・停止 |
| 予約管理 | `/admin/bookings` | 全予約一覧 |

---

## 6. LP設計（★インスタ5万人の命運を握る）

### ファーストビュー（3秒で判断される）
スマホで見たときに**スクロールなしで**以下が見える必要がある:
1. **何ができるか** — 「日本語の先生とマンツーマンレッスン」（一行）
2. **いくらか** — 「$10〜 / 25分から」
3. **すぐ始められるか** — 「Googleで無料登録」ボタン

### セクション構成（上から順に）
1. **ヒーロー**: コピー + CTA + 講師の顔写真3枚（信頼感）
2. **講師カルーセル**: 人気講師5人（顔写真・一行紹介・★評価・最安価格）
3. **3ステップ説明**: ① 先生を探す → ② 予約する → ③ レッスン開始
4. **生徒の声**: レビュー3件（写真+コメント+国旗）
5. **料金の透明性**: 「手数料は講師料金に含まれています。追加費用はありません。」
6. **FAQ**: 5問（初心者OK?/レッスン時間は?/キャンセルは?/必要な機材は?/支払い方法は?）
7. **CTA（最下部）**: 「今すぐ先生を探す」

### Instagram連携
- Instagramの投稿埋め込み（社会的証明）
- 「50,000人のフォロワーと一緒に日本語を学ぼう」
- Instagram→LP→講師一覧の**最短3タップ**導線

---

## 7. 講師プロフィール

### 基本情報
| フィールド | 型 | 必須 | 説明 |
|-----------|---|------|------|
| display_name | text | ○ | 表示名 |
| avatar_url | text | ○ | 顔写真（Supabase Storage） |
| headline | text | ○ | キャッチコピー（80文字） |
| bio | text | ○ | 自己紹介（1000文字） |
| intro_video_url | text | × | YouTube URL（iframe埋め込み） |
| hourly_rate | decimal | ○ | 時給 USD（参考: ≈ ¥表示あり） |
| lesson_duration_options | int[] | ○ | 25分/50分 |
| teaching_style | text | × | 教え方の特徴 |
| certifications | text | × | 資格・経験 |
| categories | text[] | ○ | 日常会話/ビジネス/JLPT等 |
| languages | text[] | ○ | 英語/中国語/韓国語等 |
| levels | text[] | ○ | beginner/n5/n4/n3/n2/n1 |
| trial_enabled | boolean | × | 15分トライアル枠を提供するか |
| trial_price | decimal | × | トライアル価格（0=無料） |

> **Phase 1ではカテゴリ・言語・レベルをtext[]で管理**（別テーブル正規化はPhase 3以降）

### 自動計算フィールド
| フィールド | 説明 | 計算方法 |
|-----------|------|---------|
| avg_rating | 平均評価 | トリガーで自動更新 |
| review_count | レビュー件数 | トリガーで自動更新 |
| total_lessons | 累計レッスン数 | トリガーで自動更新 |
| is_new | 新規講師バッジ | created_at が14日以内 |

> response_time_minutes, continuation_rate はPhase 3でデータ蓄積後に追加

### 新規講師の「冷えスタート」対策
- **NEWバッジ**: 登録14日以内の講師に自動表示
- **新着ブースト**: 最初の14日間はおすすめスコアに+20%ボーナス
- **トライアル枠**: 新規講師は15分無料トライアルをデフォルトON

---

## 8. 講師検索

### フィルター
| 項目 | UI | 説明 |
|------|---|------|
| キーワード | テキスト | 名前・bio全文検索 |
| カテゴリ | チップ選択 | 日常会話/ビジネス/JLPT等 |
| 価格帯 | セレクト | $5-10/$10-20/$20-30/$30+ |
| 対応言語 | セレクト | レッスン補助言語 |
| 対応レベル | セレクト | 学習者のレベル |

### ソート
| 順序 | ロジック |
|------|---------|
| おすすめ順 | `(review_count × avg_rating) + (空き枠数 × 0.5) + (NEWボーナス)` |
| 評価順 | avg_rating DESC |
| 価格安い順 | hourly_rate ASC |
| 新着順 | created_at DESC |

> **Phase 1のスコアはシンプルに**。continuation_rate等のデータがない段階で複雑な計算は意味がない。

### 非アクティブ講師の扱い
- **7日以上スロット未登録** → 一覧から非表示（プロフィールは直リンクで見える）
- → 講師にリマインドメール（Phase 2）

---

## 9. スケジュール管理

### 方針: RRULE不要、シンプルに
Phase 1では**曜日テンプレート → 個別スロット一括生成**で十分。

### フロー
```
1. 講師がテンプレート設定:
   「毎週 月〜金 9:00-12:00, 14:00-17:00 JST」
   休憩バッファ: 5分（設定変更可能）

2. システムが自動でスロット生成（Vercel Cron、毎日実行）:
   → 7日先まで、テンプレートに基づいて25分刻みでスロット自動生成
   → 既にbooked/blockedの枠は上書きしない
   → 講師の手動操作は不要（テンプレート設定のみ）

3. 講師が必要に応じて微調整:
   → 個別スロットのブロック（休み設定）
   → 追加スロットの手動登録（イレギュラー枠）

4. 学習者が予約時:
   → 25分レッスン: 1スロットをhold→book
   → 50分レッスン: 連続2スロットを同時hold→book
   → スロット間に5分バッファがあるため、講師に休憩時間を保証
```

### 25分/50分の共存ルール
```
スロット生成例（9:00-12:00、バッファ5分）:
  9:00-9:25  [open]
  9:30-9:55  [open]   ← 5分バッファ後
  10:00-10:25 [open]
  10:30-10:55 [open]
  11:00-11:25 [open]
  11:30-11:55 [open]

学習者が9:00に50分を予約:
  → 9:00-9:25 + 9:30-9:55 の2スロットを同時hold→book
  → 実質50分レッスン（途中の5分バッファは通話内で継続）
```

### availability_slots
| フィールド | 型 | 説明 |
|-----------|---|------|
| id | uuid | PK |
| teacher_id | uuid | FK |
| start_at | timestamptz | UTC |
| end_at | timestamptz | UTC |
| status | enum | open / held / booked / blocked |
| held_by | uuid | 仮押さえユーザー |
| held_until | timestamptz | 仮押さえ期限 |

### スロットステータス
```
open → held（仮押さえ、10分間）
held → booked（予約確定）
held → open（期限切れ）
open → blocked（講師手動ブロック）
booked → open（キャンセル時）
```

### 仮押さえ自動解放（pg_cron不要の設計）
1. **楽観的チェック**: スロット取得時に `held_until < now()` なら自動的にopenとして扱う
2. **Vercel Cron**: `/api/cron/release-holds` を5分間隔で実行（DBを実際にUPDATE）
3. これにより**pg_cronもEdge Functionsの定期実行も不要**

### タイムゾーン
- DB: 全てUTC（timestamptz）
- 講師UI: 講師のタイムゾーンで表示・入力
- 学習者UI: 学習者のタイムゾーンで表示
- 変換ロジック: `lib/utils.ts` に共通化

---

## 10. 予約フロー

### Phase 1（決済なし）
```
1. 学習者が講師の空き枠を選択
2. 枠を「held」に変更（10分間）
3. 予約確認画面（日時・講師表示。料金は「PayPal統合後に決済」と表示）
4. 「予約を確定」ボタン
5. 枠を「booked」に変更
6. booking レコード作成（status: confirmed）
7. 双方にアプリ内通知
8. レッスン当日 → 入室ボタンで Room オンデマンド生成
```

### Phase 2（PayPal決済あり）
```
1. 学習者が空き枠を選択
2. 枠を「held」に変更（10分間）
3. 予約確認画面（日時・講師・料金表示）
4. PayPal Checkout ボタン表示
5. PayPal決済完了 → Webhook受信
6. 枠を「booked」に変更
7. booking レコード作成（status: confirmed）
8. 双方に通知
```

### 予約ステータス（Phase 1は5つで十分）
```
confirmed ──→ in_session ──→ completed
    │                            │
    ├──→ cancelled               └──→ (次回予約CTA表示)
    │
    └──→ no_show（15分未入室）
```

> pending_payment, room_ready, cancelled_by_learner/teacher, refunded, disputed はPhase 2で追加

### 重要: 二重予約防止
```sql
-- スロット取得時にFOR UPDATEで行ロック
BEGIN;
SELECT * FROM availability_slots
WHERE id = $1 AND status = 'open'
FOR UPDATE;

-- 取得できたら即held
UPDATE availability_slots
SET status = 'held', held_by = $2, held_until = now() + interval '10 minutes'
WHERE id = $1;
COMMIT;
```

---

## 11. ビデオ通話（Daily Prebuilt）

### Room生成方式: オンデマンド（★スケジュール実行不要）
```
入室ボタン押下 → API Route が Room 存在チェック
  → 未生成なら Daily REST API で即時作成
  → 生成済みなら既存Room返却
  → Meeting Token 発行（参加者限定）
  → フロントでDaily Prebuilt描画
```

> 15分前の自動生成（Edge Function/pg_cron）は**不要**。入室時オンデマンド生成が最もシンプルで信頼性が高い。

### 入室体験（★スマホユーザー向け最適化）
| 要件 | 説明 |
|------|------|
| デバイスチェック | 入室前にカメラ/マイク確認。**スマホのブラウザ権限設定の手順も表示** |
| 待機画面 | 「先生を待っています...」+ 相手のプロフィール写真 |
| 遅刻カウント | 開始時刻を過ぎたら「○分遅れています」 |
| タイマー | レッスン残り時間表示 |
| 再接続 | 接続切れ時「再接続中...」自動リトライ3回 |
| 終了導線 | 通話終了 → **レビュー投稿画面へ自動遷移** |
| フォールバック | Daily障害時「接続できません。講師に直接連絡してください」+ 講師メール表示 |

### レッスン完了判定
```
通常終了: scheduled_end_at 到達 → Vercel Cronが自動でstatus='completed'に変更
早期終了: 講師が「レッスンを終了する」ボタン → status='completed'
延長: Daily Roomの有効期限はscheduled_end_at + 10分。自動切断はしない。
  - 「残り5分」「残り1分」「終了時刻です」をタイマーで表示
  - 延長は講師の善意。追加課金なし（Phase 1）
```

### 遅刻時のガイダンス（学習者/講師共通）
```
+0分: 「先生を待っています...」
+5分: 「もう少しお待ちください」
+10分: 「まだ来ていないようです。メッセージを送りますか？」
+15分: 「先生が来ないようです。キャンセルしてよろしいですか？」
  → 「キャンセルする」ボタン → no_show処理
  → 「もう少し待つ」ボタン → 継続待機
```

### セキュリティ
- Daily API Key: サーバーサイドのみ（API Route経由）
- Meeting Token: 参加者ごとに有効期限付き発行（scheduled_end_at + 10分）
- booking当事者のみ入室可能（token発行時にチェック）

---

## 12. レッスン報告（★Phase 1から入れる、継続率の鍵）

### 講師がレッスン完了後に記入（推奨、48時間以内）
| 項目 | 型 | 必須 | 説明 |
|------|---|------|------|
| template | select | × | テンプレート選択（文法練習/会話練習/JLPT対策/フリートーク）→ summaryを自動入力 |
| summary | textarea | × | 今日やったこと（学習者に共有）。テンプレートから自動入力→編集可 |
| homework | textarea | × | 宿題（これがあるだけで次回予約率2倍） |
| next_recommendation | textarea | × | 「次回はこれをやりましょう」 |
| internal_note | textarea | × | 講師メモ（学習者には非公開） |

> **全項目任意**に変更。1日4レッスンの講師が毎回フルで書くのは非現実的。
> テンプレート+クイック入力で30秒で記入できる設計。
> 48時間未記入でアプリ内リマインド。記入率は管理者KPIに表示。

### 学習者への表示
- 受講履歴画面で過去のレッスン報告を一覧表示
- 宿題があれば「宿題あり」バッジ
- 「この先生と次のレッスンを予約」ボタンを報告の直下に配置

### 講師への表示
- 次のレッスンの生徒の**過去レッスン報告**を表示（事前準備に使える）
- internal_note で「前回どこまでやったか」を確認可能

---

## 13. レビュー + 次回予約導線

### フロー（レッスン完了後の黄金導線）
```
通話終了
  → 自動遷移: レビュー投稿画面
  → ★1-5評価 + コメント（任意）
  → 投稿完了
  → 「この先生との次のレッスンを予約しませんか？」+ 空き枠3件表示
  → ワンタップで予約確認画面へ
```

> この「完了→レビュー→次回予約」の導線がリピート率を決める。

---

## 14. 予約後〜レッスンまでの体験

### 課題: 予約から数日間の「空白期間」でユーザーが不安になる
### 解決: 予約確認画面に「準備セクション」を表示

**学習者に表示:**
- 講師のプロフィール（復習）
- 「先生へのメッセージ」入力欄（簡易メモ。Phase 1はbooking.learner_noteカラム）
- 「レッスンまでの準備」ヒント（「自己紹介を考えておきましょう」等）
- 過去のレッスン報告（同じ講師の場合、前回の宿題を表示）

**講師に表示（講師ダッシュボードの「次のレッスン」）:**
- 生徒のプロフィール（名前、レベル、学習目的）
- 過去のレッスン報告（同じ生徒の場合）
- 生徒からのメモ

---

## 15. データベース設計（14テーブル、Phase 1）

### テーブル一覧
```
profiles ─────────────── Supabase Auth と 1:1
user_roles ──────────── ユーザーのロール
teacher_profiles ─────── 講師詳細（カテゴリ・言語・レベルはtext[]）
learner_profiles ─────── 学習者詳細
availability_slots ───── 空き枠（在庫）
schedule_templates ───── 曜日テンプレート（スロット一括生成用）
bookings ────────────── 予約
daily_rooms ─────────── Daily通話ルーム
messages ────────────── 予約メモ/コメント（Phase 1は非リアルタイム）
reviews ─────────────── レビュー
lesson_reports ─────── レッスン報告
favorites ───────────── お気に入り講師
notifications ────────── アプリ内通知
payments ────────────── 決済記録（Phase 2でPayPal統合時に使用開始）
```

### SQL定義

```sql
-- ===========================================
-- ENUMS
-- ===========================================
CREATE TYPE user_role AS ENUM ('learner', 'teacher', 'admin');
CREATE TYPE japanese_level AS ENUM ('none', 'n5', 'n4', 'n3', 'n2', 'n1');
CREATE TYPE teacher_approval_status AS ENUM ('draft', 'submitted', 'approved', 'rejected', 'suspended');
CREATE TYPE slot_status AS ENUM ('open', 'held', 'booked', 'blocked');
CREATE TYPE booking_status AS ENUM ('confirmed', 'in_session', 'completed', 'cancelled', 'no_show');
CREATE TYPE room_status AS ENUM ('not_created', 'ready', 'opened', 'ended');
CREATE TYPE review_status AS ENUM ('published', 'hidden');
CREATE TYPE payment_status AS ENUM ('unpaid', 'paid', 'refunded', 'failed');

-- ===========================================
-- TABLES
-- ===========================================

-- profiles: Supabase Auth と 1:1
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- user_roles: 1ユーザー複数ロール可
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- teacher_profiles: カテゴリ・言語・レベルはtext[]（Phase 1簡素化）
CREATE TABLE teacher_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  headline TEXT,
  bio TEXT,
  intro_video_url TEXT, -- YouTube URL
  hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 15.00,
  lesson_duration_options INTEGER[] NOT NULL DEFAULT '{25, 50}',
  teaching_style TEXT,
  certifications TEXT,
  categories TEXT[] NOT NULL DEFAULT '{}', -- ['daily_conversation','business','jlpt']
  languages TEXT[] NOT NULL DEFAULT '{"en"}', -- ['en','zh','ko']
  levels TEXT[] NOT NULL DEFAULT '{}', -- ['beginner','n5','n4','n3','n2','n1']
  trial_enabled BOOLEAN NOT NULL DEFAULT false,
  trial_price DECIMAL(10,2) DEFAULT 0,
  -- 自動計算
  avg_rating DECIMAL(3,2) NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  total_lessons INTEGER NOT NULL DEFAULT 0,
  -- 審査
  approval_status teacher_approval_status NOT NULL DEFAULT 'draft',
  rejection_reason TEXT,
  approved_at TIMESTAMPTZ,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- learner_profiles
CREATE TABLE learner_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  bio TEXT,
  learning_goals TEXT,
  interests TEXT[],
  native_language TEXT NOT NULL DEFAULT 'en',
  japanese_level japanese_level NOT NULL DEFAULT 'none',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- teacher_invites: 講師招待リンク（既存40人の移行用）
CREATE TABLE teacher_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES profiles(id), -- 管理者
  used_at TIMESTAMPTZ, -- 使用済み
  used_by UUID REFERENCES profiles(id),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- schedule_templates: 曜日ベースのテンプレート
CREATE TABLE schedule_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=日
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  buffer_minutes INTEGER NOT NULL DEFAULT 5, -- レッスン間の休憩
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_template_time CHECK (end_time > start_time)
);

-- availability_slots: 在庫モデル
CREATE TABLE availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES profiles(id),
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  status slot_status NOT NULL DEFAULT 'open',
  held_by UUID REFERENCES profiles(id),
  held_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (end_at > start_at)
);
CREATE INDEX idx_slots_teacher ON availability_slots(teacher_id, status, start_at);
CREATE INDEX idx_slots_held ON availability_slots(status, held_until) WHERE status = 'held';

-- bookings
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NOT NULL REFERENCES profiles(id),
  teacher_id UUID NOT NULL REFERENCES profiles(id),
  slot_id UUID NOT NULL REFERENCES availability_slots(id),
  scheduled_start_at TIMESTAMPTZ NOT NULL,
  scheduled_end_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL,
  status booking_status NOT NULL DEFAULT 'confirmed',
  -- 料金（Phase 2で使用開始）
  price_amount DECIMAL(10,2),
  platform_fee_amount DECIMAL(10,2),
  teacher_amount DECIMAL(10,2),
  -- キャンセル
  cancellation_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES profiles(id),
  -- 生徒メモ（レッスン前に講師に伝えたいこと）
  learner_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_bookings_learner ON bookings(learner_id, scheduled_start_at DESC);
CREATE INDEX idx_bookings_teacher ON bookings(teacher_id, scheduled_start_at DESC);
CREATE INDEX idx_bookings_status ON bookings(status, scheduled_start_at);

-- daily_rooms
CREATE TABLE daily_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id),
  daily_room_name TEXT NOT NULL UNIQUE,
  daily_room_url TEXT NOT NULL,
  status room_status NOT NULL DEFAULT 'ready',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- messages: Phase 1は非リアルタイム（予約に紐づくコメント欄）
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  sender_id UUID NOT NULL REFERENCES profiles(id),
  body TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_messages_booking ON messages(booking_id, created_at);

-- reviews
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id),
  reviewer_id UUID NOT NULL REFERENCES profiles(id),
  reviewee_id UUID NOT NULL REFERENCES profiles(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  status review_status NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_reviews_teacher ON reviews(reviewee_id, created_at DESC);

-- lesson_reports
CREATE TABLE lesson_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id),
  teacher_id UUID NOT NULL REFERENCES profiles(id),
  template_type TEXT, -- 'grammar','conversation','jlpt','free_talk' etc.
  summary TEXT, -- レッスン要約（任意、テンプレートから自動入力可）
  homework TEXT,
  next_recommendation TEXT,
  internal_note TEXT, -- 講師のみ閲覧可
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- favorites
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NOT NULL REFERENCES profiles(id),
  teacher_id UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(learner_id, teacher_id)
);

-- notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- payments（Phase 2でPayPal統合時に使用開始）
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  learner_id UUID NOT NULL REFERENCES profiles(id),
  teacher_id UUID NOT NULL REFERENCES profiles(id),
  amount DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL,
  teacher_payout DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  paypal_order_id TEXT,
  paypal_capture_id TEXT,
  status payment_status NOT NULL DEFAULT 'unpaid',
  refund_amount DECIMAL(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===========================================
-- TRIGGERS
-- ===========================================

-- updated_at 自動更新
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_teacher_profiles_updated BEFORE UPDATE ON teacher_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_bookings_updated BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- レビュー時に講師の統計を自動更新
CREATE OR REPLACE FUNCTION update_teacher_review_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE teacher_profiles SET
    avg_rating = COALESCE((
      SELECT AVG(rating) FROM reviews
      WHERE reviewee_id = NEW.reviewee_id AND status = 'published'
    ), 0),
    review_count = (
      SELECT COUNT(*) FROM reviews
      WHERE reviewee_id = NEW.reviewee_id AND status = 'published'
    )
  WHERE user_id = NEW.reviewee_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_review_stats
  AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_teacher_review_stats();

-- レッスン完了時に講師のtotal_lessons更新
CREATE OR REPLACE FUNCTION update_teacher_lesson_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE teacher_profiles SET
      total_lessons = total_lessons + 1
    WHERE user_id = NEW.teacher_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_lesson_count
  AFTER UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_teacher_lesson_count();

-- 仮押さえ自動解放（Vercel Cronから呼ぶ用）
CREATE OR REPLACE FUNCTION release_expired_holds()
RETURNS INTEGER AS $$
DECLARE
  released_count INTEGER;
BEGIN
  UPDATE availability_slots
  SET status = 'open', held_by = NULL, held_until = NULL, updated_at = now()
  WHERE status = 'held' AND held_until < now();
  GET DIAGNOSTICS released_count = ROW_COUNT;
  RETURN released_count;
END;
$$ LANGUAGE plpgsql;
```

### RLS設計
```
profiles:          SELECT全員 / UPDATE本人のみ
teacher_profiles:  SELECT(approved+is_public→全員, 本人→全件) / INSERT,UPDATE本人のみ
learner_profiles:  SELECT,UPDATE本人のみ
availability_slots: SELECT(open→全員) / INSERT,UPDATE,DELETE講師本人のみ
bookings:          SELECT当事者のみ / INSERT学習者のみ / UPDATE当事者
daily_rooms:       SELECT booking当事者のみ
messages:          SELECT,INSERT booking参加者のみ
reviews:           SELECT(published→全員) / INSERT完了bookingの学習者のみ
lesson_reports:    SELECT booking当事者 / INSERT,UPDATE担当講師のみ
favorites:         SELECT,INSERT,DELETE本人のみ
notifications:     SELECT,UPDATE(is_read)本人のみ
payments:          SELECT当事者のみ / INSERT,UPDATE service_roleのみ
```

---

## 16. API設計

### 認証
| Method | Path | 説明 |
|--------|------|------|
| POST | `/auth/signup` | 新規登録 |
| POST | `/auth/login` | ログイン |
| GET | `/auth/callback` | OAuth コールバック |

### 講師
| Method | Path | 説明 |
|--------|------|------|
| GET | `/api/teachers` | 一覧（フィルター・ソート・ページネーション） |
| GET | `/api/teachers/[id]` | 詳細 |
| GET | `/api/teachers/[id]/schedule` | 空き枠 |
| GET | `/api/teachers/[id]/reviews` | レビュー一覧 |
| PUT | `/api/teachers/profile` | プロフィール更新 |
| POST | `/api/teachers/schedule/generate` | テンプレートからスロット一括生成 |

### 予約
| Method | Path | 説明 |
|--------|------|------|
| POST | `/api/bookings` | 予約作成（仮押さえ→確定） |
| GET | `/api/bookings` | 自分の予約一覧 |
| GET | `/api/bookings/[id]` | 予約詳細 |
| PATCH | `/api/bookings/[id]/cancel` | キャンセル |
| POST | `/api/bookings/[id]/join` | 入室（Room生成+Token発行） |
| POST | `/api/bookings/[id]/complete` | レッスン完了 |

### レビュー・レッスン報告
| Method | Path | 説明 |
|--------|------|------|
| POST | `/api/reviews` | レビュー投稿 |
| POST | `/api/lesson-reports` | レッスン報告作成 |

### その他
| Method | Path | 説明 |
|--------|------|------|
| POST/DELETE | `/api/favorites` | お気に入り追加/削除 |
| GET | `/api/notifications` | 通知一覧 |
| POST | `/api/cron/release-holds` | 仮押さえ自動解放（Vercel Cron） |

### 管理者
| Method | Path | 説明 |
|--------|------|------|
| GET | `/api/admin/stats` | KPI |
| GET | `/api/admin/teachers/pending` | 審査待ち |
| PATCH | `/api/admin/teachers/[id]/approve` | 承認 |
| PATCH | `/api/admin/teachers/[id]/reject` | 却下 |
| GET | `/api/admin/users` | ユーザー一覧 |

---

## 17. 決済設計（Phase 2: PayPal）

### PayPal Checkout SDK
```
学習者が予約確認画面で PayPal ボタンクリック
→ フロントで PayPal Checkout SDK 起動
→ API Route で PayPal Order 作成（createOrder）
→ 学習者が PayPal で承認
→ API Route で PayPal Order キャプチャ（captureOrder）
→ 成功 → booking.status = 'confirmed', payment作成
→ 失敗 → slot.status = 'open' に戻す
```

### 料金構造
```
学習者支払額 = 講師時給 × (レッスン時間/60) × (1 + 手数料率)
例: 講師 $15/h, 50分 → 学習者 $15.00（手数料込み）、講師取り分 $12.50
```

### Phase 1→2の切替
- 環境変数 `PAYMENT_ENABLED=false` で決済スキップ
- trueにするとPayPalボタンが表示され、決済必須に
- コード変更なしで切替可能

---

## 18. 運用ルール

### キャンセルポリシー
| 条件 | 対応 |
|------|------|
| 24時間前まで（学習者） | 全額返金 |
| 24時間以内（学習者） | 返金なし |
| 講師都合 | 全額返金 |
| 講師no-show | 全額返金 |
| 学習者no-show | 返金なし |

### no-show判定
- 開始15分後に未入室 → 自動no_show
- 実装: Vercel Cron `/api/cron/check-no-shows` を5分間隔

### 講師審査基準
- 顔写真必須
- 自己紹介200文字以上
- カテゴリ1つ以上
- 価格 $5-$100/h

---

## 19. フォルダ構成

```
src/
├── app/
│   ├── (public)/              # パブリック
│   │   ├── page.tsx           # LP（モバイルファースト）
│   │   └── teachers/
│   │       ├── page.tsx       # 講師一覧
│   │       └── [id]/page.tsx  # 講師詳細
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── auth/callback/route.ts
│   ├── (learner)/
│   │   ├── dashboard/page.tsx
│   │   ├── bookings/page.tsx
│   │   ├── bookings/[id]/review/page.tsx
│   │   ├── booking/confirm/page.tsx
│   │   ├── history/page.tsx
│   │   ├── favorites/page.tsx
│   │   └── settings/page.tsx
│   ├── (teacher)/
│   │   ├── dashboard/page.tsx
│   │   ├── profile/page.tsx
│   │   ├── schedule/page.tsx
│   │   ├── bookings/page.tsx
│   │   ├── bookings/[id]/report/page.tsx
│   │   └── earnings/page.tsx
│   ├── (admin)/
│   │   ├── page.tsx
│   │   ├── teachers/page.tsx
│   │   ├── users/page.tsx
│   │   └── bookings/page.tsx
│   ├── room/[id]/page.tsx
│   ├── api/
│   │   ├── teachers/...
│   │   ├── bookings/...
│   │   ├── reviews/route.ts
│   │   ├── lesson-reports/route.ts
│   │   ├── favorites/route.ts
│   │   ├── notifications/route.ts
│   │   ├── cron/
│   │   │   ├── release-holds/route.ts
│   │   │   └── check-no-shows/route.ts
│   │   └── admin/...
│   ├── layout.tsx
│   └── not-found.tsx
├── components/
│   ├── ui/           # shadcn/ui
│   ├── layout/       # Header, Footer, MobileNav
│   ├── landing/      # LP専用
│   ├── teachers/     # TeacherCard, TeacherFilter
│   ├── bookings/     # Calendar, TimeSlotPicker
│   ├── video/        # VideoRoom, DeviceCheck, WaitingRoom
│   ├── reviews/      # ReviewForm, ReviewCard
│   └── common/       # Loading, EmptyState, ErrorFallback
├── lib/
│   ├── supabase/     # client.ts, server.ts, middleware.ts
│   ├── daily/        # Room生成・Token発行
│   ├── validations/  # Zodスキーマ
│   └── utils.ts      # タイムゾーン変換、料金計算等
├── hooks/
│   ├── use-user.ts
│   └── use-device-check.ts
├── types/
│   └── database.ts
└── middleware.ts
```

---

## 20. リスクと対策

| リスク | 影響度 | 対策 |
|-------|-------|------|
| インスタ流入がLP離脱 | 致命的 | モバイルファーストLP、3秒で価値伝達、Googleワンタップ登録 |
| 二重予約 | 致命的 | FOR UPDATE行ロック + 仮押さえ10分 |
| 通話繋がらない | 高 | Daily Prebuilt（安定優先）+ オンデマンドRoom生成 + フォールバック表示 |
| 新規講師が選ばれない | 高 | NEWバッジ + 新着ブースト + トライアル枠 |
| 講師が放置して非アクティブ | 高 | 7日未登録→一覧非表示 + リマインド |
| 決済前にサービスを提供してしまう | 中 | Phase 1は明確に「ベータ/無料期間」として運用 |
| タイムゾーンずれ | 中 | UTC保存 + lib/utils.ts共通変換 + 表示時に「あなたの時間」明記 |
| 初回ユーザーの不安 | 中 | トライアル枠 + 予約後の準備セクション + FAQ |
