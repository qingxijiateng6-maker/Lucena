# イタリア語学習Webアプリ 要件定義書 v1.1

## 0. 文書の目的

本書は、以下を目的とする。

1. イタリア語学習WebアプリのMVP要件を確定する。  
2. Codexが曖昧さなく実装を完遂できるよう、画面、データ、API、認証、権限、セキュリティ、UI、非機能要件を明文化する。  
3. 特に Googleログインを含むため、ユーザー情報・学習履歴・メモ・回答データ・管理用秘密情報の漏洩防止を最優先で設計する。

---

# 1. システム概要

## 1.1 プロダクト概要

本アプリは、日本人のイタリア語学習者向けに、Reading（Leggere）と Listening（Ascoltare）を中心に鍛えるWebアプリである。

対象ユーザーは、B1入りたて〜B2未満の学習者とし、最終的に C1相当教材にも取り組める実践的な読解・聴解力の育成を目標とする。

本アプリは試験特化ではなく、ニュース・講義・日常会話を自力で理解する実用運用寄りの設計とする。

## 1.2 想定ユーザー

主対象は以下。

- イタリア語専攻の大学生
- イタリア留学準備中の学生
- 文法は一通り学習済みだが、速読・速聴・語彙不足に課題を持つ学習者

## 1.3 学習対象

- 標準イタリア語のみ
- Reading: 事実説明文中心
- Listening: 自然会話と講義・教養解説

## 1.4 教材レベル

- 全教材の難易度は一律で B2〜C1 程度とする
- アプリ内でユーザー向け難易度ラベル表示は行わない
- セッションごとの difficultyLabel は持たない

---

# 2. 開発前提

## 2.1 技術スタック

本MVPでは以下を固定前提とする。

- フロントエンド: Next.js (App Router)
- 言語: TypeScript
- UI実装: React + CSS Utilityベース（Tailwind CSS相当の実装を推奨）
- 認証: Firebase Authentication（Googleログイン）
- データ保存: Firestore
- 音声・画像配信: Firebase Storage または Vercel配信可能な静的アセット
- デプロイ: Vercel
- サーバーサイド認可・機密アクセス: Next.js Route Handlers + Firebase Admin SDK

## 2.2 実装方針

重要な前提を固定する。

- クライアントは Firebase Auth のみを直接扱う
- Firestoreの業務データは、原則クライアントから直接読まない/書かない
- 業務データアクセスは Next.js API Route（Route Handlers）経由に統一する
- Firestoreの機密データ（レビュー用解説・正答・ユーザーデータ）は Firebase Admin SDK を使うサーバー側のみで扱う
- ランタイム中にOpenAI等の外部LLM APIは呼ばない
- AIは教材の事前生成にのみ使用し、本番利用中にユーザーの学習データやメモを外部AIへ送信しない

これは、機密情報漏洩の可能性を最小化するためのセキュア・バイ・デザイン要件である。

---

# 3. セキュア・バイ・デザイン基本方針

以下は実装必須要件であり、省略不可とする。

## SEC-01 最小権限
- クライアントは、正答・詳細解説・他ユーザー情報・管理情報に直接アクセスしてはならない
- サーバーは、必要最小限のレスポンスのみ返す

## SEC-02 データ最小化
保存するユーザー情報は最小限とする。

保存対象:
- Firebase UID
- displayName
- email
- photoURL（任意）
- createdAt
- updatedAt

保存しないもの:
- Google Access Token
- Google Refresh Token
- 不要なGoogleプロフィール情報
- 外部AIへのユーザー行動データ転送

## SEC-03 機密分離
教材データは、少なくとも以下に分離する。

- 公開可能データ  
  一覧表示や学習開始に必要な情報
- 学習用データ  
  本文、問題文、選択肢、音声URLなど、学習時に必要だが正答を含まない情報
- 保護データ  
  正答、根拠、自然訳、構文分解、文法解説、語彙解説、スクリプト、同期情報

学習開始時点では保護データをクライアントに送信しない。

## SEC-04 サーバー集中認可
- 学習履歴、メモ、途中保存、レビュー取得はすべてサーバーAPIで認可する
- Route Handlerは、セッションCookieまたは認証済みサーバーセッションを検証し、本人以外のデータを返してはならない

## SEC-05 トークン保護
- クライアントでログイン後、Firebase ID Token をサーバーに交換し、HttpOnly / Secure / SameSite=Strict のセッションCookieを発行する
- クライアント側の認証状態表示はサーバーセッションを基準にする
- GoogleトークンやFirebase ID Tokenを localStorage に永続保存してはならない

## SEC-06 CSRF / Origin保護
- 認証が必要な書き込み系APIは、Origin 検証を行う
- セッションCookieは SameSite=Strict を設定する
- Content-Type: application/json 以外を拒否する
- クロスサイトPOSTを許可しない

## SEC-07 XSS保護
- メモはプレーンテキストとして扱う
- MarkdownやHTMLは解釈しない
- dangerouslySetInnerHTML を禁止する
- AI生成の教材文も含め、テキストはエスケープ表示する

## SEC-08 外部依存最小化
- Homeカードのイラストは、外部追跡を避けるため、自前配信の静的アセットを使用する
- 外部広告、外部解析タグ、外部トラッキングはMVPでは入れない

## SEC-09 ログ最小化
- サーバーログに、メールアドレス、メモ本文、回答内容、Cookie、Authorizationヘッダを出力しない
- エラー出力はPIIを含まない形で整形する

## SEC-10 機密設定管理
- Firebase Admin秘密鍵、Cookie署名鍵、その他秘密情報はすべて Vercel Environment Variables で管理する
- Gitへ秘密情報をコミットしてはならない
- Admin SDK初期化コードがクライアントバンドルへ混入しないことを必須とする

## SEC-11 問題の正答漏洩防止
- 学習用APIレスポンスには correctChoiceId を含めてはならない
- レビュー用解説は、提出後 または 認可済みレビュー取得時のみ返す

## SEC-12 匿名利用時の制約
- 未ログインユーザーに対して履歴・メモ・途中保存を行わない
- 匿名レビューは短命のレビュー用トークンでのみ可能とし、永続保存しない

---

# 4. スコープ

## 4.1 MVPに含む

- Home画面
- Leggere一覧
- Ascoltare一覧
- Leggere学習画面
- Leggere復習画面
- Ascoltare学習画面
- Ascoltare復習画面
- 学習履歴一覧
- メモ一覧
- 操作説明ページ
- Googleログイン
- ログイン促進モーダル
- Reading / Listening の教材表示
- 採点
- 復習表示
- メモ作成・編集・削除
- 学習進捗保存（ログイン時のみ）
- 履歴保存（ログイン時のみ）

## 4.2 MVPに含まない

- ソーシャル機能
- 掲示板
- 問い合わせ/通報機能
- Speaking / Writing
- 有料化
- ダークモード
- 難易度自動調整
- 推薦エンジン
- 管理画面
- ランタイム中のAI生成

---

# 5. 画面/導線要件

## 5.1 画面一覧

必須画面は以下。

- `/` Home
- `/leggere` Reading一覧
- `/leggere/[sessionNumber]` Reading学習
- `/leggere/[sessionNumber]/review` Reading復習
- `/ascoltare` Listening一覧
- `/ascoltare/[sessionNumber]` Listening学習
- `/ascoltare/[sessionNumber]/review` Listening復習
- `/history` 学習履歴
- `/notes` メモ一覧
- `/help` 操作説明

## 5.2 グローバル導線

- Homeの主導線は Leggere / Ascoltare の2カードのみとする
- Homeカードに補足テキストは付けない
- Home右上にログインボタンを配置する
- ログイン後は右上をプロフィールメニューに置き換え、最低限以下を表示できるようにする  
  - 学習履歴  
  - メモ  
  - ログアウト

学習画面ではヘッダーは最小限とし、主役は本文/音声にする。

---

# 6. UI/UX要件

## UI-01 デザイン方針
- 白基調
- PC優先
- スマホでも利用可能なレスポンシブ
- Notion風の余白感、タイポグラフィ、薄い境界線、静かなカード感
- 過度な装飾禁止

## UI-02 禁止事項
- 強いグラデーション
- AI生成感の強い画像
- 強い角丸
- 派手な装飾
- 情報密度の高すぎるサイドバー
- 読書画面・聴解画面での過剰なナビゲーション

## UI-03 Home画面
- 中央に Leggere と Ascoltare の2枚カード
- カードはイラスト付き
- 補足説明文は付けない
- 下部中央に 操作説明 CTA
- 右上に ログイン CTA

## UI-04 Leggere学習画面
- 本文を主役にする
- 本文は縦スクロール
- 画面下に sticky の 問題を表示 CTA
- CTA押下で下部1/3程度の問題パネルを展開
- 問題は1問ずつ表示
- 左右矢印で問題移動
- 全問回答後、一括採点

## UI-05 Leggere復習画面
- 左に本文
- 右に自然訳または解説ペイン
- 上部に単語語彙アコーディオン
- トグルで 本文のみ / 訳・解説表示 を切り替え
- 文クリックで該当文を #FFFF00 でハイライトし、右ペインを解説表示に切り替える

## UI-06 Ascoltare学習画面
- 上にセッションタイトル
- 中央に音声プレイヤー
- 下に問題領域
- 問題は常時表示
- 問題は1問ずつ表示し、左右矢印で移動

## UI-07 Ascoltare復習画面
- 上部に sticky プレイヤー
- 速度切替は 0.5 / 0.75 / 1.0
- 左にスクリプト
- 右に自然訳/解説
- 文単位同期ハイライト
- 自動スクロールあり

## UI-08 タイポグラフィ
フォントは癖のない一般的なフォントスタックを採用する。  
例としては、システムフォント優先の日本語可読性重視構成とする。

## UI-09 画像/イラスト
- MVPでは Homeカード用イラストのみ必須
- 外部画像URL直参照は避ける
- `public/` 配下のローカル静的アセットで管理する

---

# 7. 機能要件

## 7.1 認証

### FR-AUTH-01 ログイン
- Googleログインを提供する
- 未ログインでも教材一覧閲覧・学習開始は可能
- セッション選択時にログイン促進モーダルを表示する
- モーダルは閉じることができ、未ログインのまま学習続行可能

### FR-AUTH-02 ログイン後セッション
- FirebaseでGoogle認証後、サーバーにセッション確立要求を送る
- サーバーは検証済みセッションCookieを発行する
- クライアントは以後Cookieベースで保護APIにアクセスする

### FR-AUTH-03 ログアウト
- サーバーセッションCookieを削除する
- 以後、履歴・メモ・進捗保存機能は使えない

---

## 7.2 Leggere 一覧

### FR-R-LIST-01
一覧には以下を表示する。

- セッション番号
- イタリア語タイトル
- 学習済み / 未学習

### FR-R-LIST-02
- 並び順は 1 → n 固定
- ログイン時は学習済み状態を反映する
- 未ログイン時は学習済み状態を表示しないか、常に未学習として扱う

---

## 7.3 Leggere 学習

### FR-R-LEARN-01 教材仕様
- 約600語
- 標準イタリア語
- 事実説明文
- テーマは約10種に均等配分
- 教材難易度は B2〜C1 程度で固定

### FR-R-LEARN-02 出題
- 5問4択
- 内訳:
  - 主旨把握 1
  - 内容一致 3
  - 指示語・論理関係 1

### FR-R-LEARN-03 問題表示
- 問題パネルは下部展開式
- 1問ずつ表示
- 前後矢印で移動
- 自動遷移しない
- 全問回答後に一括採点

### FR-R-LEARN-04 採点
- 採点後は正答数と正答率を表示
- 各問題について短い根拠説明を返す
- その後、復習画面へ遷移可能とする

### FR-R-LEARN-05 制約
- 辞書機能なし
- 解答前に詳細解説を見せない
- 正答データをクライアントへ事前配布しない

---

## 7.4 Leggere 復習

### FR-R-REVIEW-01 初期表示
- 左に本文
- 右に自然訳
- 単語語彙アコーディオンは閉状態

### FR-R-REVIEW-02 文クリック
右ペインに以下を表示する。

1. その文の自然訳  
2. 構文分解  
3. 文法解説  
4. 語彙補足  
5. 文単位音声

### FR-R-REVIEW-03 文法解説
- 日本語で丁寧に
- 教師/参考書風
- 接続法の理由説明を重視

### FR-R-REVIEW-04 単語クリック
上部アコーディオンに以下を表示する。

- 原形
- 品詞
- その文での活用形
- 日本語訳
- コロケーション
- コロケーションの日本語補足

### FR-R-REVIEW-05 完了判定
- 復習画面到達時点で学習済みとする

---

## 7.5 Ascoltare 一覧

### FR-L-LIST-01
一覧には以下を表示する。

- セッション番号
- イタリア語タイトル
- 学習済み / 未学習

### FR-L-LIST-02
- 並び順は 1 → n
- 学習済み判定はログイン時のみ反映する

---

## 7.6 Ascoltare 学習

### FR-L-LEARN-01 教材仕様
- 1〜3分
- 標準イタリア語
- 2種別:
  - 会話
  - 講義/教養解説
- 教材難易度は B2〜C1 程度で固定

### FR-L-LEARN-02 問題数
- 会話: 2問
- 講義: 4問

### FR-L-LEARN-03 再生制約
- 再生前は回答不可
- 再生中は回答可
- 再生は1回のみ
- 一時停止不可
- 巻き戻し不可
- 再生終了後の再再生不可

### FR-L-LEARN-04 問題UI
- 問題は常時表示
- 1問ずつ表示
- 左右矢印で前後移動

### FR-L-LEARN-05 採点
- 一括採点
- 短い根拠表示
- 復習画面へ遷移

### FR-L-LEARN-06 制約
- スクリプトを解答前に表示しない
- 解答前に全文訳・詳細解説を見せない

---

## 7.7 Ascoltare 復習

### FR-L-REVIEW-01 プレイヤー
- 画面上部 sticky
- 任意位置再生可
- 速度変更 0.5 / 0.75 / 1.0

### FR-L-REVIEW-02 スクリプト
- 左側に全文表示
- 文単位で同期ハイライト
- 再生位置に応じて自動スクロール

### FR-L-REVIEW-03 解説
- 文クリックで右側に
  - 自然訳
  - 構文分解
  - 文法解説
  - 必要語彙
  を表示する

### FR-L-REVIEW-04 話者表示
- 会話教材は話者名を明示する

---

## 7.8 メモ

### FR-NOTE-01 利用条件
- ログインユーザーのみ利用可
- 未ログイン時に利用しようとしたらログインモーダルを表示する

### FR-NOTE-02 内容
- タイトル
- 本文
- 複数タグ

### FR-NOTE-03 タグ
初期候補:
- 単語
- 文法
- 表現

加えて自由タグ追加を許可する。

### FR-NOTE-04 操作
- 作成
- 編集
- 削除
- セッション別表示
- タグ別絞り込み

### FR-NOTE-05 セッションとの関係
- メモは session 単位に紐づく
- 同じ教材を複数回解いても、メモは同一sessionに蓄積する

---

## 7.9 学習履歴

### FR-HIST-01 利用条件
- ログインユーザーのみ

### FR-HIST-02 表示項目
- タイトル
- Leggere / Ascoltare
- 学習日
- 正答率
- 状態（完了 / 途中）

### FR-HIST-03 遷移
- 履歴からのCTAは 復習する のみ
- 履歴からは常に復習画面へ遷移する
- 問題の解き直しは一覧画面からのみ行う

### FR-HIST-04 同一教材再受講
- 再受講時は別attemptとして履歴追加
- 学習済み判定は completed attempt が1つでもあれば true

---

## 7.10 途中保存

### FR-PROG-01 保存対象
ログイン時のみ以下を保存する。

- 回答状況
- 現在の問題番号
- 学習UI状態
- メモ下書き

### FR-PROG-02 保存タイミング
- 回答変更時
- 問題移動時
- メモ編集中の一定間隔 autosave
- ページ離脱前

### FR-PROG-03 破棄
- 学習完了後、対応する saved progress は削除または completed 状態へ反映して不要化する

---

# 8. ルーティング要件

以下のURL構成を固定する。

- `/`
- `/leggere`
- `/leggere/[sessionNumber]`
- `/leggere/[sessionNumber]/review`
- `/ascoltare`
- `/ascoltare/[sessionNumber]`
- `/ascoltare/[sessionNumber]/review`
- `/history`
- `/notes`
- `/help`

レビュー画面は以下のどちらかで開く。

- ログイン済み: `attemptId` クエリ
- 未ログイン: `reviewToken` クエリ

例:
- `/leggere/12/review?attemptId=...`
- `/ascoltare/3/review?reviewToken=...`

---

# 9. データ設計要件

セキュア・バイ・デザインのため、教材データは3層に分ける。

## 9.1 コレクション一覧

- `users`
- `sessions_catalog`
- `sessions_learning`
- `sessions_review`
- `user_session_attempts`
- `notes`
- `saved_progress`

## 9.2 `users`

```ts
type UserDoc = {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
```

## 9.3 `sessions_catalog`

一覧用の公開メタデータ。  
内部IDは `reading-0001` / `listening-0001` のような形式を推奨する。

```ts
type SessionCatalogDoc = {
  sessionId: string;
  sessionType: "reading" | "listening";
  sessionNumber: number;
  titleIt: string;
  titleJa: string | null;
  theme: string;
  heroIllustrationPath: string | null;
  isPublished: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
```

## 9.4 `sessions_learning`

学習開始時に必要だが、正答や詳細解説を含まないデータ。

### Reading learning payload

```ts
type ReadingLearningDoc = {
  sessionId: string;
  body: {
    paragraphs: Array<{
      paragraphIndex: number;
      sentences: Array<{
        sentenceId: string;
        text: string;
      }>;
    }>;
    wordCount: number;
  };
  questions: Array<{
    questionId: string;
    type: "main_idea" | "detail" | "reference_logic";
    prompt: string;
    choices: Array<{
      choiceId: "A" | "B" | "C" | "D";
      text: string;
    }>;
  }>;
};
```

### Listening learning payload

```ts
type ListeningLearningDoc = {
  sessionId: string;
  audio: {
    audioUrl: string;
    durationSec: number;
    kind: "conversation" | "lecture";
  };
  questions: Array<{
    questionId: string;
    type: "detail" | "gist" | "speaker_intent" | "number_info";
    prompt: string;
    choices: Array<{
      choiceId: "A" | "B" | "C" | "D";
      text: string;
    }>;
  }>;
};
```

## 9.5 `sessions_review`

クライアントへ直接公開してはならないレビュー用データ。

### Reading review payload

```ts
type ReadingReviewDoc = {
  sessionId: string;
  answerKey: Array<{
    questionId: string;
    correctChoiceId: "A" | "B" | "C" | "D";
    shortRationaleJa: string;
  }>;
  reviewBody: {
    paragraphs: Array<{
      paragraphIndex: number;
      sentences: Array<{
        sentenceId: string;
        text: string;
        translation: string;
        analysis: {
          structure: string;
          grammarPoints: Array<{
            label: string;
            explanationJa: string;
          }>;
          vocabNotes: Array<{
            label: string;
            explanationJa: string;
          }>;
        };
        ttsText: string;
      }>;
    }>;
  };
  wordGlossary: Array<{
    lemma: string;
    surfaceForms: string[];
    pos: string;
    morphology: string;
    meaningJa: string;
    collocations: Array<{
      it: string;
      ja: string;
    }>;
  }>;
};
```

### Listening review payload

```ts
type ListeningReviewDoc = {
  sessionId: string;
  answerKey: Array<{
    questionId: string;
    correctChoiceId: "A" | "B" | "C" | "D";
    shortRationaleJa: string;
  }>;
  transcript: {
    segments: Array<{
      segmentId: string;
      sentenceId: string;
      speakerId: string;
      speakerName: string;
      startSec: number;
      endSec: number;
      text: string;
      translation: string;
      analysis: {
        structure: string;
        grammarPoints: Array<{
          label: string;
          explanationJa: string;
        }>;
        vocabNotes: Array<{
          label: string;
          explanationJa: string;
        }>;
      };
    }>;
  };
  wordGlossary: Array<{
    lemma: string;
    surfaceForms: string[];
    pos: string;
    morphology: string;
    meaningJa: string;
    collocations: Array<{
      it: string;
      ja: string;
    }>;
  }>;
};
```

## 9.6 `user_session_attempts`

```ts
type AttemptDoc = {
  attemptId: string;
  uid: string;
  sessionId: string;
  sessionType: "reading" | "listening";
  sessionNumber: number;
  startedAt: Timestamp;
  completedAt: Timestamp | null;
  status: "in_progress" | "completed";
  score: number | null;
  correctCount: number | null;
  questionCount: number;
  answers: Array<{
    questionId: string;
    selectedChoiceId: "A" | "B" | "C" | "D" | null;
    isCorrect: boolean | null;
  }>;
};
```

## 9.7 `notes`

```ts
type NoteDoc = {
  noteId: string;
  uid: string;
  sessionId: string;
  sessionType: "reading" | "listening";
  title: string;
  body: string;
  tags: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
```

## 9.8 `saved_progress`

```ts
type SavedProgressDoc = {
  uid: string;
  sessionId: string;
  sessionType: "reading" | "listening";
  currentQuestionIndex: number;
  selectedAnswers: Record<string, "A" | "B" | "C" | "D">;
  uiState: {
    readingQuestionPanelOpen?: boolean;
    listeningPlaybackStarted?: boolean;
  };
  draftMemoState: Array<{
    title: string;
    body: string;
    tags: string[];
  }>;
  updatedAt: Timestamp;
};
```

---

# 10. API要件

すべて Next.js Route Handlers で実装する。  
機密データは Route Handler からのみ返す。  
クライアントが Firestore に直接アクセスしてはならない。

## 10.1 認証API

### `POST /api/auth/session`
Firebaseログイン直後に呼ぶ。

入力:
```json
{ "idToken": "string" }
```

出力:
- `204 No Content`
- HttpOnly session cookie を設定

要件:
- ID token をFirebase Admin SDKで検証
- `users` に初回ユーザーを upsert
- session cookie を発行
- Cookie属性:
  - HttpOnly
  - Secure
  - SameSite=Strict
  - Path=/
  - 有効期限は短〜中期（例: 7日以内）

### `GET /api/auth/me`
出力:
```json
{
  "authenticated": true,
  "user": {
    "uid": "string",
    "displayName": "string",
    "email": "string",
    "photoURL": "string | null"
  }
}
```

未認証:
```json
{ "authenticated": false }
```

### `POST /api/auth/logout`
- セッションCookie削除
- `204 No Content`

---

## 10.2 セッション一覧API

### `GET /api/sessions?type=reading|listening`

出力:
```json
{
  "items": [
    {
      "sessionId": "reading-0001",
      "sessionNumber": 1,
      "titleIt": "string",
      "heroIllustrationPath": "/illustrations/reading-1.svg",
      "isLearned": true
    }
  ]
}
```

要件:
- `sessions_catalog` の `isPublished=true` のみ返す
- ログイン中は `isLearned` をサーバーで付与する
- 未ログイン時は `isLearned=false` または省略

---

## 10.3 学習開始API

### `GET /api/reading/[sessionNumber]/learning`
### `GET /api/listening/[sessionNumber]/learning`

出力: 学習に必要な公開データのみ。  
`correctChoiceId / translation / explanation / transcript` は含めない。

---

## 10.4 提出API

### `POST /api/reading/[sessionNumber]/submit`
### `POST /api/listening/[sessionNumber]/submit`

入力:
```json
{
  "answers": {
    "q1": "A",
    "q2": "C"
  }
}
```

出力（ログイン済み）:
```json
{
  "attemptId": "string",
  "score": 80,
  "correctCount": 4,
  "questionCount": 5,
  "rationales": [
    { "questionId": "q1", "shortRationaleJa": "..." }
  ],
  "reviewUrl": "/leggere/12/review?attemptId=..."
}
```

出力（未ログイン）:
```json
{
  "reviewToken": "string",
  "score": 80,
  "correctCount": 4,
  "questionCount": 5,
  "rationales": [
    { "questionId": "q1", "shortRationaleJa": "..." }
  ],
  "reviewUrl": "/leggere/12/review?reviewToken=..."
}
```

要件:
- サーバー側で正答照合
- ログイン済みなら attempt 保存
- 未ログインなら保存しない
- 未ログイン用 `reviewToken` は署名付き短命トークンとする
- 提出前の正答取得APIは存在してはならない

---

## 10.5 レビュー取得API

### `GET /api/reading/[sessionNumber]/review?attemptId=...`
### `GET /api/reading/[sessionNumber]/review?reviewToken=...`
### `GET /api/listening/[sessionNumber]/review?attemptId=...`
### `GET /api/listening/[sessionNumber]/review?reviewToken=...`

要件:
- `attemptId` の場合は、ログイン中ユーザー本人のattemptのみ許可
- `reviewToken` の場合は、署名・有効期限・session整合性を検証
- 条件を満たした場合のみ `sessions_review` を返す
- 条件を満たさなければ `403`

---

## 10.6 履歴API

### `GET /api/history`

要件:
- 認証必須
- 本人の `user_session_attempts` のみ返す
- 並び順は `startedAt desc`

出力例:
```json
{
  "items": [
    {
      "attemptId": "string",
      "sessionType": "reading",
      "sessionNumber": 12,
      "titleIt": "string",
      "startedAt": "ISO",
      "status": "completed",
      "score": 80
    }
  ]
}
```

---

## 10.7 メモAPI

### `GET /api/notes`
クエリ:
- `sessionId`
- `tag`

### `POST /api/notes`
入力:
```json
{
  "sessionId": "reading-0001",
  "sessionType": "reading",
  "title": "string",
  "body": "string",
  "tags": ["文法", "接続法"]
}
```

### `PATCH /api/notes/[noteId]`
### `DELETE /api/notes/[noteId]`

要件:
- 認証必須
- 本人所有ノートのみ読書き可能
- body はプレーンテキストのみ
- 長さ制限を設けること

推奨長さ制限:
- title: 1〜80文字
- body: 1〜2000文字
- tags: 1件20文字以内、最大10件

---

## 10.8 進捗API

### `GET /api/progress/[sessionId]`
### `PUT /api/progress/[sessionId]`

要件:
- 認証必須
- 本人の sessionId に対する progress のみ扱う
- 学習完了後は不要データを削除または無効化する
```