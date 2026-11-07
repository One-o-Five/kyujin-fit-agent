# 設計判断の記録（ADR）

本プロジェクトの重要な技術的判断を、1件1ファイルで記録する。

## 形式

[MADR（Markdown Architectural Decision Records）](https://github.com/adr/madr) のテンプレートに準拠する。見出しは日本語で記載し、次のとおり対応させる。

| 本プロジェクト | MADR |
|---|---|
| 背景と課題 | Context and Problem Statement |
| 判断基準 | Decision Drivers |
| 検討した選択肢 | Considered Options |
| 決定 | Decision Outcome |
| 影響 | Consequences |
| 確認方法 | Confirmation |
| 各選択肢の長所と短所 | Pros and Cons of the Options |
| 補足 | More Information |

## 運用ルール

* ファイル名は `nnnn-タイトル.md`（4桁の連番）とする。新規作成時は [template.md](template.md) をコピーする。
* 採用済みのADRは書き換えない。判断を変える場合は新しいADRを作成し、旧ADRの `status` を `superseded by ADR-nnnn` に変更する。
* 実装・コスト比較など、判断の根拠が揃った時点で作成する。

## 一覧

| No. | タイトル | ステータス |
|---|---|---|
| [0001](0001-analysis-result-storage.md) | 分析結果をLLM出力の原本（JSONB）と正規化テーブルの両方に保存する | accepted |
| [0002](0002-backend-language-framework.md) | バックエンドを TypeScript + Hono で実装し、評価スクリプトのみ Python を許可する | accepted |
| [0003](0003-authentication.md) | 認証にサーバーセッションと HttpOnly Cookie を使う | accepted |
| [0004](0004-frontend-spa.md) | フロントエンドを SPA（React + Vite）で構成し、静的ホスティングで配信する | accepted |

### 今後作成予定（P2）

* 外部通信の経路（NAT Gateway / パブリックサブネット）
* DB（RDS / Aurora Serverless）
* 分析ワーカーの実行基盤（ECS / Lambda）
* IaC（AWS CDK / Terraform）
