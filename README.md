# skilltune

Claude Code のスキル `description` を最適化し、トリガー精度を向上させる CLI ツールです。

## 概要

Claude Code のスキルは `description` フィールドを元に呼び出しの判断が行われます。`skilltune` は以下のループでこの description を自動改善します。

```
クエリ生成 → 評価（trigger rate 計測） → description 改善提案 → 繰り返し
```

`--skill` にスキル名を指定すると、プロジェクトルートの `.claude/skills/<name>` を自動参照します。

## インストール

```bash
npm install -g skilltune
```

## 使い方

### クエリ生成

スキルの内容を元に、評価用クエリを Claude が自動生成します。

```bash
skilltune generate-queries --skill my-skill --output queries.json
```

| オプション | デフォルト | 説明 |
|-----------|-----------|------|
| `--skill` | （必須） | スキル名（`.claude/skills/<name>` を参照） |
| `--count` | `20` | 生成するクエリ数（半数が should_trigger:true、半数が false） |
| `--output` | `queries.json` | 出力先ファイル |

### 評価のみ

既存のクエリファイルでトリガー率を測定します。

```bash
skilltune eval --skill my-skill --queries queries.json
```

結果として以下が出力されます。

- **Positive rate**: `should_trigger: true` のクエリが実際に発火した割合
- **Misuse rate**: `should_trigger: false` のクエリが誤って発火した割合
- **Failed indices**: 期待と一致しなかったクエリの番号

| オプション | デフォルト | 説明 |
|-----------|-----------|------|
| `--skill` | （必須） | スキル名（`.claude/skills/<name>` を参照） |
| `--queries` | `queries.json` | クエリファイルのパス |
| `--runs` | `3` | 1クエリあたりの実行回数 |

### 最適化ループ

評価 → description 改善 → 評価を繰り返し、最良の description をスキルファイルに書き戻します。

```bash
# クエリを自動生成して最適化
skilltune optimize --skill my-skill

# 既存クエリファイルを使って最適化
skilltune optimize --skill my-skill --queries queries.json
```

| オプション | デフォルト | 説明 |
|-----------|-----------|------|
| `--skill` | （必須） | スキル名（`.claude/skills/<name>` を参照） |
| `--queries` | （省略可） | クエリファイル。省略時は自動生成 |
| `--runs` | `3` | 1クエリあたりの実行回数 |
| `--max-iterations` | `5` | 最大イテレーション数 |
| `--train-ratio` | `0.6` | train/validation の分割比率 |
| `--count` | `20` | クエリ自動生成時の生成数 |
| `--patience` | `3` | validation が改善しない場合の早期停止イテレーション数 |

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
    skill/                    # スキルファイルの読み書き・パース・パス解決
  shared/
    claude/                   # claude -p 実行・出力パース
    lib/                      # 汎用ユーティリティ
```

## 動作要件

- [Claude Code](https://claude.ai/code)（`claude` コマンドが PATH に存在すること）
- Node.js
