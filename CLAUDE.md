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

## Schema

### Dividend

## Struktur proyek

```
app/          halaman utama dan layout
components/   komponen UI (Dropzone, FilterBar, RadarTable, SeasonalityChart, WatchlistExport, StatsOverview)
lib/parser/   pembaca CSV, normalisasi tanggal dan angka, data contoh
lib/engine/   deteksi siklus dividen, perkiraan Cum Date, klasifikasi buy window
lib/utils/    format tanggal, angka, dan ekspor CSV
test/         unit test parser dan engine
```

Spesifikasi lengkap ada di [SPEC.md](SPEC.md).
