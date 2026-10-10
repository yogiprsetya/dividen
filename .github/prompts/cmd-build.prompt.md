---
name: cmd-build
description: Implement tasks incrementally — build, test, verify, write commit message.
---

Skills: incremental-implementation + test-driven-development (always).
Conditional: anti-slop (frontend) | api-and-interface-design (backend) | swr (API integration) — load only if task matches.
On any step failure: switch to debugging-and-error-recovery, then resume.
On full success: run code-simplification before finishing.

Source: GitHub issues in the current repo (via gh CLI). The parent issue labeled `plan` holds the overview and phase checklist; each issue labeled `task` is one slice. Do not read or write .docs/plan.md or .docs/todo.md.

Status model (labels only, the agent never closes issues):

- `task` = pending, to be implemented
- `verify` = implemented by the agent, waiting for human verification (issue stays open)
- closed = verified by a human

Workflow — Implement the next pending task, then stop (careful, one slice at a time).

0. Pick the task:
   - Run `gh auth status`; stop and report if it fails.
   - Run `gh label create verify --force` so the label exists.
   - Run `gh issue list --label task --state open --json number,title,labels,body --limit 100`.
   - Next pending = lowest phase, then lowest number, whose every "Blocked by #N" issue is either closed or labeled `verify` (check with `gh issue view N --json state,labels`). If the user named an issue number, use that one instead.
   - If nothing is unblocked, report what is blocking and stop.
1. Print issue number + title + acceptance criteria (from the issue body) + rename session. Also read `gh issue view N --comments`: if the task was sent back from review, the feedback there is part of the requirements.
2. Load relevant context (existing code, patterns, types, parent plan issue)
3. RED: write failing test for expected behavior
4. GREEN: implement minimum code to pass
5. Run full test suite — check regressions
6. Run build — verify compilation
7. Write a descriptive commit message with `-F`, referencing the issue (`Refs #N`)
8. Hand over for verification (do NOT close the issue):
   - `gh issue edit N --remove-label task --add-label verify`
   - `gh issue comment N --body "<what changed, commit hash, tests run, and manual steps for a human to verify each acceptance criterion>"`
   - If this was the last `task` of its phase, say so and point to that phase's checkpoint issue; do not start the next phase.

Do not stop or ask for confirmation between steps. Only pause on unrecoverable error after debugging-and-error-recovery is exhausted. On such a pause, comment the blocker on the issue (`gh issue comment N`) and leave the `task` label in place.
