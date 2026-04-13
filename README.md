# skilltune

A CLI tool that optimizes Claude Code skill `description` fields to improve trigger accuracy.

## Overview

Claude Code skills are invoked based on their `description` field. `skilltune` automatically improves descriptions through the following loop:

```
Generate queries → Evaluate (measure trigger rate) → Propose new description → Repeat
```

## Installation

```bash
npm install -g skilltune
```

## Requirements

- [Claude Code](https://claude.ai/code) (`CLAUDE_CODE_OAUTH_TOKEN` environment variable must be set)
- Node.js 18+

## Usage

### Optimize a skill directory (recommended)

Pass a skill directory path directly to run the full pipeline — query generation through optimization — in one shot. An error is raised if `SKILL.md` does not exist in the specified directory.

```bash
skilltune .claude/skills/git-commit
skilltune /absolute/path/to/my-skill
```

### Generate queries

Automatically generate evaluation queries from a skill using Claude.

```bash
skilltune generate-queries --skill .claude/skills/git-commit --output queries.json
# or use a short name (resolves to .claude/skills/<name>)
skilltune generate-queries --skill git-commit --output queries.json
```

| Option | Default | Description |
|--------|---------|-------------|
| `--skill` | (required) | Path to the skill directory, or a skill name (resolves to `.claude/skills/<name>`) |
| `--count` | `20` | Number of queries to generate (half `should_trigger:true`, half `false`) |
| `--output` | `queries.json` | Output file path |

### Evaluate only

Measure trigger rates against an existing query file.

```bash
skilltune eval --skill .claude/skills/git-commit --queries queries.json
```

Outputs:

- **Positive rate**: fraction of `should_trigger: true` queries that actually triggered
- **Misuse rate**: fraction of `should_trigger: false` queries that incorrectly triggered
- **Failed indices**: query indices where the result did not match expectations

| Option | Default | Description |
|--------|---------|-------------|
| `--skill` | (required) | Path to the skill directory, or a skill name |
| `--queries` | `queries.json` | Path to the query file |
| `--runs` | `3` | Number of runs per query |

### Optimization loop

Iterates evaluate → propose description → evaluate, writing the best description back to the skill file.

```bash
# Auto-generate queries and optimize
skilltune optimize --skill .claude/skills/git-commit

# Use an existing query file
skilltune optimize --skill .claude/skills/git-commit --queries queries.json
```

| Option | Default | Description |
|--------|---------|-------------|
| `--skill` | (required) | Path to the skill directory, or a skill name |
| `--queries` | (optional) | Query file path; auto-generated if omitted |
| `--runs` | `3` | Number of runs per query |
| `--max-iterations` | `5` | Maximum number of optimization iterations |
| `--train-ratio` | `0.6` | Train/validation split ratio |
| `--count` | `20` | Number of queries to generate when `--queries` is omitted |
| `--patience` | `3` | Early stopping: halt if validation does not improve for this many iterations |

## Query file format

```json
[
  { "query": "A prompt that should trigger the skill", "should_trigger": true },
  { "query": "A prompt that should not trigger the skill", "should_trigger": false }
]
```

## Architecture

Structured following Feature-Sliced Design (FSD).

```
src/
  app/                        # Entry point (gunshi CLI)
  features/
    evaluate/                 # Trigger rate evaluation
    generate-queries/         # Automated query generation via Claude Agent SDK
    optimize/                 # Description optimization loop
  entities/
    query/                    # Query type + train/validation split
    result/                   # QueryResult type + aggregation
    skill/                    # Skill file read/write, parsing, and path resolution
  shared/
    claude/                   # Claude Agent SDK wrapper
    lib/                      # General utilities
```
