---
status: accepted
date: 2026-11-06
decision-makers: KIM KUNO
---

# 分析結果をLLM出力の原本（JSONB）と正規化テーブルの両方に保存する

## 背景と課題

求人票と職務経歴書をLLMで比較し、要件ごとに「充足 / 一部充足 / 未充足」の判定・根拠・改善提案を出力する。この結果をどの形式で保存するかを決める必要がある。

## 判断基準

* **出力構造の変化への対応**: プロンプトの改善に伴い、LLMの出力構造は今後も変わる可能性が高い。
* **再評価・トレーサビリティ（LLMOps）**: 新しいプロンプトやモデルで過去の結果を再採点したり、誤判定の原因を追跡したりするため、LLMの出力をそのまま残したい。
* **集計機能**: 「これまで分析した求人で、自分が最も多く未充足と判定された要件 TOP5」のように、要件単位で集計したい。

## 検討した選択肢

* A. JSONBにまとめて保存（`analyses.result`）
* B. 正規化テーブルのみ（`requirement_results`）
* C. 両方を保存（原本JSONB + 正規化テーブル）

## 決定

選択肢: **C. 両方を保存**。判断基準の3点をすべて満たす唯一の選択肢のため。用途によって保存方式を分ける。

| 保存先 | 役割 | 位置づけ |
|---|---|---|
| `analyses.result`（JSONB） | LLM出力の原本。監査・再評価・障害調査用 | 正（Source of Truth） |
| `requirement_results` | スキーマ検証済みの判定。画面表示・集計用 | 原本から生成される派生データ |

### 影響

* 良い点: 判定の構造を変更しても、マイグレーション後に原本から再生成するバッチで過去データを移行できる。
* 良い点: `analyses` の `model`、`prompt_version`、トークン数と合わせて、「どのプロンプト・モデルで、どの出力が得られたか」を後から比較できる（P4 LLMOpsの前提）。
* 悪い点: 書き込みが2か所になる。同一トランザクションで保存して整合性を担保する。
* 悪い点: データ量が増えた場合、原本JSONBの保持期間やアーカイブ方針の検討が必要になる。

### 確認方法

* 保存処理の単体テストで、検証成功時は両方に保存され、検証失敗時は原本のみが残ることを確認する。
* 原本から `requirement_results` を再生成するバッチを用意し、再生成結果が既存データと一致することを確認する。

## 各選択肢の長所と短所

### A. JSONBにまとめて保存

* 良い点: 実装が最も簡単。
* 良い点: 出力構造が変わってもマイグレーション不要。
* 悪い点: 要件単位の集計・検索が難しい。
* 悪い点: JSON内部の型や値はDBで保証されない。

### B. 正規化テーブルのみ

* 良い点: 外部キーとCHECK制約で整合性を保証できる。
* 良い点: 集計がSQLで簡単に書ける。
* 悪い点: LLMの出力そのものが残らず、再評価や原因追跡ができない。
* 悪い点: 出力構造の変更のたびにマイグレーションが必要。

### C. 両方を保存

* 良い点: 判断基準の3点をすべて満たす。
* 悪い点: 書き込みが2か所になり、整合性の管理が必要。
* 悪い点: 実装量がAより多い。

## 補足

### テーブル定義（案）

```sql
CREATE TABLE requirement_results (
  id            BIGSERIAL PRIMARY KEY,
  analysis_id   BIGINT NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  category      TEXT   NOT NULL CHECK (category IN ('required', 'preferred')),
  requirement   TEXT   NOT NULL,
  judgment      TEXT   NOT NULL CHECK (judgment IN ('met', 'partial', 'unmet')),
  evidence      TEXT,          -- 判定の根拠となった職務経歴書の記述
  suggestion    TEXT,          -- アピール方法または補強すべき学習内容
  sort_order    INT    NOT NULL
);

CREATE INDEX idx_requirement_results_analysis ON requirement_results (analysis_id);
```

### 保存の流れ

1. LLMの出力を受け取る。
2. スキーマ（Zod）で検証する。
3. 検証成功: 同一トランザクションで `analyses.result` の保存、`requirement_results` の挿入、`status = 'completed'` への更新を行う。
4. 検証失敗: 原本を `analyses.result` に残したまま `status = 'failed'` とし、`requirement_results` には何も入れない。失敗した出力も原本が残るため、後から原因を分析できる。

関連: [データモデル](../data-model.md)
