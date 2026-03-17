# Claude Code path.relative() bug reproduction

This repository reproduces a bug with Claude Code producing the following relative path error during Read/Write/Edit operation whether it's to update files in the Claude Code current working directory or plans inside `~/.claude/plans`
```
Error: path should be a `path.relative()`d string, but got "../README.md"
```
or
```
Updated plan
  ⎿  Error: path should be a `path.relative()`d string, but got "../../.claude/plans/silly-stirring-floyd.md"
```

## Reproducing the Bug

This repository contains 3 nearly identicals scenarios:
- no-skills **(no bug)**
- skill-no-path **(no bug)**
- skill-with-path **(path.relative() bug)**

The difference between **skill-no-path** and **skill-with-path**
```diff
skill-with-path/.claude/skills/char-counter/SKILL.md
---
name: char-counter
+ paths: "**/*.txt"
alwaysApply: false
---
...
```

**Scenario 1 - File edition in the same directory**

Running a Claude Code instance in each folder with the following prompt gives different results 
```
Update the README.md "Project Description" section at the root of the project containing with generated lorem-ipsum thanks to the ./lorem-ipsum package using "npm run lorem-ipsum <length>"

Do not use the "--prefix" flag of npm
```

This prompt is meant to force Claude Code to execute the `npm run lorem-ipsum` command from within the `./lorem-ipsum` directory using `cd` to have something like this `cd ./lorem-ipsup && npm run lorem-ipsum 3` and then try to update the README.md that was at root of where the CLI was first started, causing the path to relative contain `../.md` triggering the relative path rejection.

**Scenario 2 - Plan creation**

(Note: This scenario doesn't require having run Scenario 1 in order to be reproduced)

Running a new Claude Code instance in each folder with the following prompt gives different results 
```
Plan a proper readme for this project
```

## Potential root cause

It seems like the bug is caused by the `path.relative()` function being feeded the Claude Code's bash CWD instead of the path where Claude Code was first run.
When Claude Code does move directory to execute commands using `cd` it causes the Bash CWD to change, which makes operation on files compute the relative path
from the cwd `path.relative(bash.cwd, <file path>)`, since the `cd` has changed the directory to a subdirectory, updating files at the root of where Claude Code was run in the first place causes the path relative to output `../README.md` which triggers a check against `node-ignore` to prevent escaping the Root directory.

This `path.relative` check seems only triggered when there are custom skills defined with `paths` inside of them which put them in a kind of `pending` state, skills seems to become active if the file path that operated on with Read/Write/Edit is matched by the skill's path pattern, and the condition to trigger it seems to have at least 1 skill that is still `pending`.

It looks like the bug also happens with `Rules` that specify `paths` but only on some different triggering condition like IDE/Memory triggers

This also affect Claude Code's ability to Read/Write/Edit inside the `~/.claude/plans` because it evaluates the path with `path.relative(bash.cwd, "~/.claude/plans/<file>")` as something like `../../.claude/plans/silly-stirring-floyd.md` triggering the path rejection too forcing it to try to bypass this restriction by using bash commands like `echo`, `cat`, etc, even creating `symlinks`