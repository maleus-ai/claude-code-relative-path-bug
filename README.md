# Claude Code `path.relative()` Bug Reproduction

This repository reproduces a bug where Claude Code rejects valid file paths during Read/Write/Edit operations with errors like:

```
Error: path should be a `path.relative()`d string, but got "../README.md"
```

```
Updated plan
  ⎿  Error: path should be a `path.relative()`d string, but got "../../.claude/plans/silly-stirring-floyd.md"
```

This affects both editing files in the project directory and creating/updating plans in `~/.claude/plans`.

## Setup

This repository contains 3 nearly identical scenarios, each in its own directory:

| Scenario | Has Custom Skill | Skill has `paths` | Bug? |
|---|---|---|---|
| `no-skills/` | No | N/A | No |
| `skill-no-path/` | Yes | No | No |
| `skill-with-path/` | Yes | Yes | **Yes** |

The only difference between `skill-no-path` and `skill-with-path` is a single line in the skill definition:

```diff
  # skill-with-path/.claude/skills/char-counter/SKILL.md
  ---
  name: char-counter
+ paths: "**/*.txt"
  alwaysApply: false
  ---
```

## Reproducing the Bug

### Scenario 1 — File editing after a `cd`

Run Claude Code in each of the 3 scenario directories with this prompt:

```
Update the README.md "Project Description" section at the root of the project
containing with generated lorem-ipsum thanks to the ./lorem-ipsum package
using "npm run lorem-ipsum <length>"

Do not use the "--prefix" flag of npm
```

This forces Claude Code to `cd` into the `lorem-ipsum/` subdirectory to run the npm script, then attempt to edit `README.md` back at the project root. In `skill-with-path/`, the edit fails because the path resolves to `../README.md`.

### Scenario 2 — Plan creation

Run a **new** Claude Code instance in each directory with:

```
Plan a proper readme for this project
```

In `skill-with-path/`, plan creation fails because the path to `~/.claude/plans/<file>` resolves to something like `../../.claude/plans/silly-stirring-floyd.md`.

> This scenario does not depend on Scenario 1.

## Root Cause Analysis

The bug appears to stem from Claude Code using the **bash process CWD** instead of the **original startup directory** when computing relative paths for file operations.

Here is the chain of events:

1. Claude Code starts in `/project/skill-with-path/`.
2. It runs `cd ./lorem-ipsum && npm run lorem-ipsum 3`, which changes the bash CWD to `/project/skill-with-path/lorem-ipsum/`.
3. It then tries to edit `/project/skill-with-path/README.md`.
4. Internally, it computes `path.relative(bash.cwd, filePath)`, which yields `../README.md`.
5. A validation check (via `node-ignore`) rejects paths that start with `..`, so the edit fails.

### Trigger conditions

This validation only runs when **at least one custom skill has a `paths` field** and is in a "pending" state (i.e., no file matching its pattern has been operated on yet). Without such a skill, the path check is skipped entirely — which is why `no-skills/` and `skill-no-path/` work fine.

### Additional effects

- **Plans**: The same issue prevents Claude Code from reading/writing files in `~/.claude/plans/`, since `path.relative(bash.cwd, "~/.claude/plans/...")` produces paths like `../../.claude/plans/...`. Claude Code then resorts to workarounds like `echo`, `cat`, or even symlinks to bypass the restriction.
- **Rules with `paths`**: The bug also appears with Rules that specify `paths`, though it may require different triggers (e.g., IDE or memory triggers).
