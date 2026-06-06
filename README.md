# Filament Tracker

A self-contained, single-page dashboard for tracking 3D-printer filament inventory,
print history, and usage — plus an AI-agent workflow that keeps it updated
**directly from the Bambu Lab cloud**, so you never transcribe print jobs by hand
(or take screenshots of Bambu Studio) again.

Built for a Bambu Lab P2S + AMS, but the dashboard works for any printer and the
fetcher works for any Bambu Lab cloud account.

## What's in here

| File | What it is |
|---|---|
| `index.html` | The dashboard — open it in a browser, no build step, no server. Charts (Chart.js via CDN), spool inventory, AMS loadout, print log. |
| `data.js` | **The single source of truth.** All spools, AMS slots, and print history live in one `INVENTORY_DATA` object. Edit this (or let the agent do it); never edit data into `index.html`. |
| `tools/bambu_fetch.py` | Dependency-free Python 3 CLI that logs into the Bambu Lab cloud and dumps your print task history as clean JSON. Works standalone — no AI required. |
| `.claude/skills/filament-update/` | A [Claude Code](https://claude.com/claude-code) skill: the playbook an AI agent follows to sync prints, take your feedback, record filament orders, decrement spool weights, validate, and push. |

## Viewing the dashboard

Open `index.html` — double-click it locally or serve it from GitHub Pages. That's it.

## Updating the tracker

### With Claude Code (the nice way)

Open the repo in Claude Code and run:

```
/filament-update
```

The agent fetches new prints from the Bambu cloud, shows you what's new, asks for
feedback (the API only knows a print *finished* — it can't know the articulated
joints snapped during assembly), records any filament purchases you mention,
subtracts grams from the right spools (asking when ambiguous), validates the data,
and pushes to GitHub after you approve a summary.

### Without Claude (standalone fetcher)

```bash
# one-time login (~every 3 months). Leave password blank if you use Google/Apple SSO —
# it falls back to an email verification code.
python tools/bambu_fetch.py login

# dump normalized print history as JSON
python tools/bambu_fetch.py tasks --limit 100
```

Each task includes: Bambu task id, design title, date, grams used, status, and
per-filament detail (material type + the color hex the AMS **actually fed**).
Pipe it wherever you like and edit `data.js` by hand.

## Data model notes (learned the hard way)

- **`targetColor`, not `sourceColor`.** Downloaded print profiles carry the
  *designer's* color choices; `targetColor` is what your AMS actually fed. Matching
  on the wrong one surfaces filament you don't own.
- **`rfidColor`** on each spool stores the exact hex Bambu's RFID reports, so future
  syncs match spools exactly (display `color` can stay human-pretty).
- **`taskIds`** on print-log entries are the dedup key — re-running a sync never
  double-logs.
- **`emptied`** counts fully-consumed spools so the "Invested" stat reflects lifetime
  spend, not just inventory on hand.
- Task status from the API: `2` = finished, `3` = cancelled. "Finished" ≠ "good" —
  that's what the feedback step is for.

## Security

- Your Bambu **password is never stored** — the login script prompts at runtime (or
  skips passwords entirely via the email-code flow for SSO accounts).
- The access token is cached at `~/.bambu-tracker/token.json`, **outside the repo**,
  created with owner-only permissions. Nothing credential-shaped is ever committed.
- This repo contains only your inventory and print history.

## Caveats

- The Bambu cloud API is **unofficial** (community-documented). It can change without
  notice; if login breaks, see
  [coelacant1/Bambu-Lab-Cloud-API](https://github.com/coelacant1/Bambu-Lab-Cloud-API)
  for the current state of the art. The fetcher fails loudly rather than guessing.
- Bambu's task history appears limited to **~90 days** — sync at least monthly or
  prints fall off the end.

## Using this for your own filament

1. Fork/clone, then gut `data.js`: empty the `printLog`, replace `spools` with your
   own inventory, set your `ams` slots (or all `null`), update `printer`.
2. `python tools/bambu_fetch.py login`
3. Sync via `/filament-update` (Claude Code) or `tasks` + hand-editing.

Design docs for the whole system live in `docs/superpowers/`.
