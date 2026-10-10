---
description: Break work into small verifiable tasks with acceptance criteria and dependency ordering
---

Invoke the planning-and-task-breakdown skill.

Read the existing spec (SPEC.md or equivalent) and the relevant codebase sections. Then:

1. Enter plan mode — read only, no code changes
2. Identify the dependency graph between components
3. Slice work vertically (one complete path per task, not horizontal layers)
4. Write tasks with acceptance criteria and verification steps
5. Add checkpoints between phases
6. Present the plan for human review in the conversation, and wait for approval
7. After approval, publish the plan to GitHub issues in the current repo with the gh CLI

Publishing rules:

- Do not create todo.md, plan.md, or any other local plan file. GitHub issues are the only output.
- Before anything else, run `gh auth status` and `gh repo view --json nameWithOwner`. If either fails, stop and report the error instead of working around it.
- Run `gh issue list --search "phase(<n>): <plan title>" --state all` first. If a plan issue already exists, update it instead of creating a duplicate.
- Make sure the labels `plan` or `task` exist (`gh label create ... --force`).
- Create one task issue per task, in dependency order, so blockers already have issue numbers. Each body contains: context, acceptance criteria as a checklist, verification steps, "Blocked by #N" lines, and the phase. Pass bodies via `--body-file -` (stdin), not temp files.
- Create one parent issue labeled `plan` containing: goal, dependency graph, phases with checkpoints, and a task list per phase using `- [ ] #N` so GitHub tracks progress.
- Add a checkpoint issue (label `checkpoint`) at the end of each phase, blocked by that phase's tasks, with the review criteria for moving on.
- Finish by printing the parent issue URL and a table of issue number, title, phase, and blockers.
