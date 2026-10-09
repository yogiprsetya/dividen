---
name: cmd-build
description: Implement tasks incrementally — build, test, verify, write commit message.
---

Skills: incremental-implementation + test-driven-development (always).
Conditional: anti-slop (frontend) | api-and-interface-design (backend) | swr (API integration) — load only if task matches.
On any step failure: switch to debugging-and-error-recovery, then resume.
On full success: run code-simplification before finishing.

Source: .docs/plan.md, .docs/todo.md.

Workflow — Implement the next pending task, then stop (careful, one slice at a time).

1. Print task number + acceptance criteria + rename session
2. Load relevant context (existing code, patterns, types)
3. RED: write failing test for expected behavior
4. GREEN: implement minimum code to pass
5. Run full test suite — check regressions
6. Run build — verify compilation
7. Write a descriptive commit message with `-F`
8. Mark task complete

Do not stop or ask for confirmation between steps. Only pause on unrecoverable error after debugging-and-error-recovery is exhausted.
