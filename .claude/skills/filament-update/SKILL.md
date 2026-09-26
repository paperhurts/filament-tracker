---
name: filament-update
description: Update the filament tracker — fetch new prints from Bambu Cloud, take user feedback, record filament orders, decrement spool weights, update data.js, and push to GitHub. Use when the user wants to update prints, log filament purchases, or sync the dashboard.
---

# Filament Tracker Update

Single source of truth: `data.js` (`INVENTORY_DATA`). `index.html` is presentation
only — never edit data into it. Design spec (local-only, `docs/` is gitignored — may not
exist in this checkout): `docs/superpowers/specs/2026-06-06-filament-tracker-agent-design.md`.

## Hard rules

- NEVER guess silently. Ambiguous spool match, unknown filament, odd API data → ask the user.
- NEVER write partial data. If fetch or validation fails, leave `data.js` untouched.
- The user's word overrides API status (API "success" + user says it broke → `failed` + warning note).
- Bambu credentials/token live in `~/.bambu-tracker/` — never read the password, never commit tokens.

## Workflow

### 1. Fetch
Precondition: `git status --short data.js` must be clean. If data.js has uncommitted
changes, stop and ask the user before proceeding (a mid-run revert would destroy them).

Run: `python tools/bambu_fetch.py tasks` (pages through up to 300 tasks — more than a
busy 90-day window).
- Exit 3 → token missing/expired. Tell the user to run `! python tools/bambu_fetch.py login`
  in the prompt (interactive: password or email code), then re-fetch.
- CAPTCHA / Cloudflare message → Bambu is blocking this network. Do NOT retry (retries
  extend the CAPTCHA block); tell the user and STOP.
- Any other failure → show stderr to the user and STOP.

### 2. Diff
New prints = fetched tasks whose `taskId` does not appear in any `printLog` entry's
`taskIds` array (agent entries group multi-plate prints, so one entry may carry many
task ids). Pre-agent entries (no `taskIds`) and the 2026-04 backfill boundary are
already covered — anything older than the newest `taskIds`-bearing entry that doesn't
match is suspect: ask, don't relog.
Sort oldest-first. If the oldest fetched task is more than 1 day newer than the newest
`printLog` date, warn the user that Bambu's ~90-day window may have dropped history.
Skip tasks with `statusName: "printing"` (API status 1 or 4) — they're still running and
their numbers aren't final; the next sync picks them up. Mention them to the user.

### 3. Review with the user
Show new prints as a table: date, title, grams, statusName, filament type/color.
Know what the API can't tell you, and ask:
- `weightG` is the slicer's estimate for the WHOLE job. For `failed_or_cancelled`
  (status 3 — the API can't tell a cancel from a failure) it's the full planned weight,
  not what was used: ask how far it got before decrementing anything.
- Prints started from the printer's touchscreen/SD card or in LAN-only mode never reach
  Bambu Cloud. Ask whether anything was printed that way since the last sync.

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
For each new print, map EACH of its `filaments[]` (`color` = targetColor, what the AMS
actually fed — NOT `sourceColor`, the designer's intent) to a spool id. Multi-color
prints decrement every spool they touched by that filament's own `weightG`:
- Match the task's filament color against spool `rfidColor` first (exact, set from
  real AMS data) then fall back to the display `color` hex and material
  (`PLA-S`→"PLA Silk", `PLA`→"PLA", `PETG`→"PETG", translucent/glow per spool name).
  When a fallback match is confirmed, store the hex as that spool's `rfidColor`.
- `amsId`/`slotId` (when present) say which slot fed it: `amsId` 0 + `slotId` 0-3 → `ams`
  index 0-3, `amsId` 255 → external (index 4). Use it only as a tiebreaker hint — the `ams`
  array is today's loadout, not what was loaded when the print ran.
- Subtract that filament's grams from its spool's `remainingG`.
- AMBIGUOUS (two spools same color, color not in inventory, remainingG would go
  negative) → ask the user. Going negative usually means a refill was loaded:
  confirm, zero out / retire the empty, start decrementing the refill (refill becomes
  spoolType "spool" in use, or per user preference — ask the first time).
- When a unit is fully consumed: decrement `qty`, increment `emptied` (Invested on the
  dashboard counts `qty + emptied`, so lifetime spend never shrinks).
- If a spool that is loaded in the `ams` array is retired, renamed, or swapped, update
  the `ams` array entry to the in-use spool id (or `null` if the slot is now empty).
- Add `taskIds` (array), `materialUsedId` (the spool that fed the most grams),
  `filamentUsedG` (total across all colors) to each new printLog entry, matching the
  existing entry format exactly. Multi-color prints also get
  `filaments: [{ spoolId: "pla-gray-s", g: 671.4 }, { spoolId: "pla-jade-white-s", g: 254.9 }]`
  — one part per spool, summing to `filamentUsedG` (the dashboard's usage chart and
  print-log swatches read it). Single-color prints omit `filaments`. Group multi-plate
  prints of the same design into one entry (plate count in notes); cancelled plates get
  their own `status: "failed"` row.
- Remove a spool's "⚠ Remaining is stale" note once reconciled.

### 6. Update data.js
- Append new printLog entries (keep the file's existing formatting style).
- Update spool `remainingG` / `qty` / notes.
- Set `lastUpdated` to today (YYYY-MM-DD) — get today from the system clock (e.g. run `date`), never guess it.

### 7. Validate (all must pass before commit)
- `node --check data.js` → exit 0.
- `node tools/validate_data.js --today "$(date +%F)"` → exit 0. It checks: every
  `printLog[].materialUsedId` and non-null `ams` entry exists in `spools[].id`; no
  duplicate spool ids; `0 ≤ remainingG ≤ weightG`; `qty`/`emptied` non-negative; status
  is `success|failed|reprint`; dates are YYYY-MM-DD; no task id logged twice; every
  spool has the fields the dashboard reads; `filaments` parts are real spools and sum to
  `filamentUsedG`; `lastUpdated` is today.
- If anything fails: fix or revert `data.js` (`git checkout -- data.js`) — never commit a failing state.

### 8. Ship
Show the user a summary: N prints added (total grams), spool changes (e.g. "Black
spool #1: 87g → empty"), orders recorded, warnings added. On their OK:
```bash
git add data.js
git commit -m "<descriptive: e.g. 'Log 6 prints (412g), reconcile black/white spools'>"
git push
```
Do NOT push without the user's OK. The push runs CI (`.github/workflows/ci.yml`): the
same checks plus a headless render of the dashboard. If it goes red, fix it before
anything else.
