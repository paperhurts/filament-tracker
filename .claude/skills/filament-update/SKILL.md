---
name: filament-update
description: Update the filament tracker — fetch new prints from Bambu Cloud, take user feedback, record filament orders, decrement spool weights, update data.js, and push to GitHub. Use when the user wants to update prints, log filament purchases, or sync the dashboard.
---

# Filament Tracker Update

Single source of truth: `data.js` (`INVENTORY_DATA`). `index.html` is presentation
only — never edit data into it. Spec: `docs/superpowers/specs/2026-06-06-filament-tracker-agent-design.md`.

## Hard rules

- NEVER guess silently. Ambiguous spool match, unknown filament, odd API data → ask the user.
- NEVER write partial data. If fetch or validation fails, leave `data.js` untouched.
- The user's word overrides API status (API "success" + user says it broke → `failed` + warning note).
- Bambu credentials/token live in `~/.bambu-tracker/` — never read the password, never commit tokens.

## Workflow

### 1. Fetch
Run: `python tools/bambu_fetch.py tasks`
- Exit 3 → token missing/expired. Tell the user to run `! python tools/bambu_fetch.py login`
  in the prompt (interactive: password + email code), then re-fetch.
- Any other failure → show stderr to the user and STOP.

### 2. Diff
New prints = fetched tasks whose `taskId` does not appear in any `printLog` entry's
`taskId` field. (Pre-agent entries have no `taskId`; additionally skip any task whose
date+title matches an existing entry, to avoid double-logging the backfill boundary.)
Sort oldest-first. If the oldest fetched task is more than 1 day newer than the newest
`printLog` date, warn the user that Bambu's ~90-day window may have dropped history.

### 3. Review with the user
Show new prints as a table: date, title, grams, statusName, filament type/color.
Then ask (one batch, not one-by-one unless the user engages): any feedback per print?
- notes (lessons learned, who it was for)
- status override (`success` | `failed` | `reprint`)
- warnings (e.g. "Do NOT print with PLA Silk") — preserve the existing warning style
- MakerWorld URL if `designId` > 0 (construct only if confident; else leave `url: ""`)

### 4. Orders
If the user mentions buying filament (or pastes an order email/screenshot), update
`spools`: increment `qty` on an existing matching entry (same SKU + spoolType), or add
a new entry following existing conventions — id like `pla-<color>-r` (refill) /
`pla-<color>-s` (spool), `notes` recording the order number, real `costPerSpool`.

### 5. Spool math
For each new print, map its filament (color hex + material type) to a spool id:
- Compare the task's filament color to spool `color` hex values and material
  (`PLA-S`→"PLA Silk", `PLA`→"PLA", `PETG`→"PETG", translucent/glow per spool name).
- Subtract the print's grams from that spool's `remainingG`.
- AMBIGUOUS (two spools same color, color not in inventory, remainingG would go
  negative) → ask the user. Going negative usually means a refill was loaded:
  confirm, zero out / retire the empty, start decrementing the refill (refill becomes
  spoolType "spool" in use, or per user preference — ask the first time).
- Add `taskId`, `materialUsedId`, `filamentUsedG` to each new printLog entry,
  matching the existing entry format exactly.
- Remove a spool's "⚠ Remaining is stale" note once reconciled.

### 6. Update data.js
- Append new printLog entries (keep the file's existing formatting style).
- Update spool `remainingG` / `qty` / notes.
- Set `lastUpdated` to today (YYYY-MM-DD).

### 7. Validate (all must pass before commit)
- `node --check data.js` → exit 0.
- Sanity script (note: `new Function`, not `eval` — `const` declarations inside
  `eval()` don't leak to the outer scope in modern Node):
  every `printLog[].materialUsedId` exists in `spools[].id`; no `remainingG < 0`;
  no duplicate `taskId`; `lastUpdated` is today.
  Run:
  `node -e "const src=require('fs').readFileSync('data.js','utf8'); const d=new Function(src+'; return INVENTORY_DATA;')(); const ids=new Set(d.spools.map(s=>s.id)); const bad=d.printLog.filter(p=>p.materialUsedId&&!ids.has(p.materialUsedId)); const neg=d.spools.filter(s=>s.remainingG<0); const tids=d.printLog.map(p=>p.taskId).filter(Boolean); const dup=tids.length!==new Set(tids).size; if(bad.length||neg.length||dup){console.error('FAIL',{bad:bad.map(p=>p.name),neg:neg.map(s=>s.id),dup});process.exit(1)} console.log('data.js OK')"`
- If anything fails: fix or revert `data.js` (`git checkout -- data.js`) — never commit a failing state.

### 8. Ship
Show the user a summary: N prints added (total grams), spool changes (e.g. "Black
spool #1: 87g → empty"), orders recorded, warnings added. On their OK:
```bash
git add data.js
git commit -m "<descriptive: e.g. 'Log 6 prints (412g), reconcile black/white spools'>"
git push
```
Do NOT push without the user's OK.
