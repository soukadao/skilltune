# skilltune

Claude Code のスキル `description` を最適化し、トリガー精度を向上させる CLI ツールです。

`jq` 不要、TypeScript ネイティブで動作します。

## 概要

Claude Code のスキルは `SKILL.md` の `description` フィールドを元に呼び出しの判断が行われます。`skilltune` は以下のループでこの description を自動改善します。

```
クエリ生成 → 評価（trigger rate 計測） → description 改善提案 → 繰り返し
```

## インストール

```bash
npm install -g skilltune
```

## 使い方

### クエリ生成

SKILL.md の内容を元に、評価用クエリを Claude が自動生成します。

```bash
skilltune generate-queries --skill-file SKILL.md --output queries.json
```

| オプション | デフォルト | 説明 |
|-----------|-----------|------|
| `--skill-file` | `SKILL.md` | SKILL.md のパス |
| `--count` | `20` | 生成するクエリ数（半数が should_trigger:true、半数が false） |
| `--output` | `queries.json` | 出力先ファイル |

### 評価のみ

既存のクエリファイルで trigger rate を測定します。

```bash
skilltune eval --queries queries.json --skill my-skill
```

| オプション | デフォルト | 説明 |
|-----------|-----------|------|
| `--queries` | `queries.json` | クエリファイルのパス |
| `--skill` | `my-skill` | チェック対象のスキル名 |
| `--runs` | `3` | 1クエリあたりの実行回数 |
| `--threshold` | `0.5` | pass と判定する trigger rate の閾値 |

### 最適化ループ

評価 → description 改善 → 評価を繰り返し、最良の description を SKILL.md に書き戻します。

```bash
# クエリを自動生成して最適化
skilltune optimize --skill-file SKILL.md --skill my-skill

# 既存クエリファイルを使って最適化
skilltune optimize --skill-file SKILL.md --skill my-skill --queries queries.json
```

| オプション | デフォルト | 説明 |
|-----------|-----------|------|
| `--skill-file` | `SKILL.md` | SKILL.md のパス |
| `--skill` | `my-skill` | チェック対象のスキル名 |
| `--queries` | （省略可） | クエリファイル。省略時は自動生成 |
| `--runs` | `3` | 1クエリあたりの実行回数 |
| `--max-iterations` | `5` | 最大イテレーション数 |
| `--threshold` | `0.5` | pass 判定の閾値 |
| `--train-ratio` | `0.6` | train/validation の分割比率 |
| `--count` | `20` | クエリ自動生成時の生成数 |

## クエリファイルの形式

```json
[
  { "query": "スキルが呼ばれるべきプロンプト", "should_trigger": true },
  { "query": "スキルが呼ばれるべきでないプロンプト", "should_trigger": false }
]
```

## アーキテクチャ

Feature-Sliced Design（FSD）に基づいた構成です。

```
src/
  app/                        # エントリポイント（gunshi CLI）
  features/
    evaluate/                 # trigger rate 評価
    generate-queries/         # Claude によるクエリ自動生成
    optimize/                 # description 最適化ループ
  entities/
    query/                    # Query 型 + train/validation 分割
    result/                   # QueryResult 型 + 集計
    skill/                    # SKILL.md の読み書き・パース
  shared/
    claude/                   # claude -p 実行・出力パース
    lib/                      # 汎用ユーティリティ
```

## 動作要件

- [Claude Code](https://claude.ai/code)（`claude` コマンドが PATH に存在すること）
- [Bun](https://bun.sh)
