# CLAUDE.md — dividen

## Constraints

- No speculative features, dashboards, or CMS integrations.
- Only export a symbol if another file imports it.
- Do not create files unrelated to the current task.
- Do not post duplicate comments on GitHub issues; check existing comments first.
- Never run `git commit`. I review all changes manually.

## Always

- Think before coding: state assumptions, and ask when the request is ambiguous.
- Simplicity first: write the minimum code that solves the problem.
- Surgical changes: touch only what the task requires and match the existing style.
- Goal-driven execution: define how success is verified, then loop until it passes.
- Add or update tests next to the code as `*.spec.ts` or `*.spec.tsx`.
- When a task succeeds, do not commit. Print the full commit command with a descriptive message instead, using this format:

```bash
  git commit -F - <<'MSG'
  <type>(<scope>): <concise subject, imperative mood, ≤72 chars>

  <1-3 sentence body: what changed and why>

  Task: <gh issue link>
  MSG
```

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
