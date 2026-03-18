# NihonGo 本番 — Japanese Lesson Marketplace

## Overview
インスタ5万人 × 講師40人超。日本語レッスンマーケットプレイス。
Phase 1は決済なしで全フロー動作させる。PayPalはPhase 2。

## Design Principles
1. **モバイルファースト** — インスタ流入は90%スマホ
2. **まず動く** — 決済なしで予約→通話→レビュー→次回予約が動く
3. **シンプル** — 14テーブル、5ステータス。複雑化は後
4. **継続率が全て** — レッスン報告・宿題・次回予約CTAはPhase 1から

## Tech Stack
- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS v4 + shadcn/ui**
- **Supabase** (PostgreSQL, Auth, Storage, Realtime)
- **Daily.co Prebuilt** (WebRTC)
- **PayPal** (Phase 2)
- **Resend** (Phase 2)
- **Vercel**
- **Zod** (validation)

## Key Architecture Decisions
1. **Google OAuth メイン** — パスワード入力はフリクション。ロール選択は後でOK
2. **カテゴリ・言語・レベルはtext[]** — 別テーブル正規化はPhase 3以降
3. **空き枠は在庫モデル** — availability_slots: open/held/booked/blocked
4. **仮押さえ解放はVercel Cron** — pg_cron/Edge Functions不要
5. **Room生成はオンデマンド** — 入室ボタン押下時にAPI Routeで即時生成
6. **決済切替フラグ** — PAYMENT_ENABLED=false/true で切替
7. **レッスン報告Phase 1** — 宿題→次回予約率2倍

## DB: 15 Tables
profiles, user_roles, teacher_profiles, learner_profiles,
teacher_invites, schedule_templates, availability_slots, bookings,
daily_rooms, messages, reviews, lesson_reports, favorites,
notifications, payments

## Booking Status (Phase 1: 5 only)
confirmed → in_session → completed
confirmed → cancelled
confirmed → no_show

## Commands
- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run lint` — ESLint
