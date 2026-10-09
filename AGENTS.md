<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Things to avoid

- Do not add speculative features, dashboards, or CMS integrations.
- Do not use generic AI templates or unrelated design systems.
- Do not introduce new page routes without adding them to `app/sitemap.ts`.
- Avoid new heavy animation libraries; use the existing `motion` stack.
- Do not make a commit, let me check all changes manually
- Dont export a variable if not used in another files

## Always

- Write descriptive commit message after task success using `-F`, print full commit script, example:

  ```git
  git commit -F - <<'MSG'
   <type>(<scope>): <concise subject, imperative mood, ≤72 chars>

   <1-3 sentence body: what changed and why>

   Task: <task number from .docs/todo.md>
   MSG
  ```

- Work like L7 senior software developer
- Think Before Coding
- Simplicity First
- Surgical Changes
- Goal-Driven Execution
- Write test -> `*.spec.tsx|ts`
