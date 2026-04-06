# Firestore Security Rules v1.0

## 方針

このアプリでは、Firestore 業務データに対してクライアントSDKから直接アクセスしない。
すべての業務データアクセスは Next.js Route Handlers + Firebase Admin SDK 経由で行う。

したがって、Firestore Security Rules は原則 deny all とする。

この方針は secure-by-design の中核であり、以下を防ぐためのものである。

- 正答データの漏洩
- review 解説データの漏洩
- 他ユーザーの履歴・メモ・進捗の漏洩
- クライアント側実装ミスによる過剰公開

## ルール本体

```js
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // すべてのクライアント直接アクセスを禁止する
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## 実装上の意味

- Firebase client SDK で Firestore を直接 read/write してはならない
- Firestore アクセスはサーバー側の Firebase Admin SDK のみ許可する
- クライアントは /api/* のみを利用する

## 例外

MVPでは例外を設けない。

## 注意

もし Codex が Firestore client SDK を使って以下にアクセスする実装を作った場合、それは要件違反である。

- sessions_catalog
- sessions_learning
- sessions_review
- user_session_attempts
- notes
- saved_progress
- users

## 参考: Storage Rules 方針

Firestore ではなく Storage を使う場合、原則として以下のどちらかを採る。

1. Home 用イラストや公開音声を `public/` で配信する
2. Firebase Storage を使う場合も公開可能アセット専用バケットパスに限定する

機密データを Storage に置かない。
review 専用の保護データを Storage に置かない。
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}