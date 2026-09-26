#!/usr/bin/env node
// Sanity-check data.js before committing. Exit 0 = OK, 1 = problems found.
//
//   node tools/validate_data.js                   # structural checks only
//   node tools/validate_data.js --today "$(date +%F)"   # also require lastUpdated == today
//
// Loaded via `new Function`, not `eval` — `const` declarations inside eval()
// don't leak to the outer scope in modern Node.
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const todayIdx = args.indexOf('--today');
const today = todayIdx >= 0 ? args[todayIdx + 1] : null;
const file = path.join(__dirname, '..', 'data.js');

const src = fs.readFileSync(file, 'utf8');
const d = new Function(src + '; return INVENTORY_DATA;')();

const problems = [];
const ids = new Set(d.spools.map(s => s.id));

if (ids.size !== d.spools.length) problems.push('duplicate spool ids');

for (const p of d.printLog) {
  if (p.materialUsedId && !ids.has(p.materialUsedId))
    problems.push(`printLog "${p.name}" → unknown spool ${p.materialUsedId}`);
  if (!['success', 'failed', 'reprint'].includes(p.status))
    problems.push(`printLog "${p.name}" has unknown status "${p.status}"`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.date))
    problems.push(`printLog "${p.name}" has malformed date "${p.date}"`);
  if (p.filaments) checkFilaments(p);
}

// Multi-color split: every part is a real spool, parts add up to the total,
// and materialUsedId is the part that fed the most grams.
function checkFilaments(p) {
  const where = `printLog "${p.name}" (${p.date})`;
  if (!Array.isArray(p.filaments) || p.filaments.length === 0) {
    problems.push(`${where}: filaments must be a non-empty array`);
    return;
  }
  for (const f of p.filaments) {
    if (!ids.has(f.spoolId)) problems.push(`${where}: filaments → unknown spool ${f.spoolId}`);
    if (!(f.g > 0)) problems.push(`${where}: filaments ${f.spoolId} has g ${f.g}`);
  }
  const sum = p.filaments.reduce((a, f) => a + f.g, 0);
  if (Math.abs(sum - p.filamentUsedG) > 1)
    problems.push(`${where}: filaments sum ${sum.toFixed(2)}g ≠ filamentUsedG ${p.filamentUsedG}g`);
  const max = Math.max(...p.filaments.map(f => f.g));
  const main = p.filaments.find(f => f.spoolId === p.materialUsedId);
  if (!main || main.g !== max) // ties are fine: either can be the main spool
    problems.push(`${where}: materialUsedId ${p.materialUsedId} isn't the largest part`);
}

for (const a of d.ams || []) {
  if (a && !ids.has(a)) problems.push(`ams → unknown spool ${a}`);
}

// The dashboard reads these on every spool; one missing field blanks the page.
const SPOOL_FIELDS = { id: 'string', name: 'string', material: 'string', color: 'string',
  spoolType: 'string', weightG: 'number', remainingG: 'number', costPerSpool: 'number', qty: 'number' };

for (const s of d.spools) {
  for (const [k, type] of Object.entries(SPOOL_FIELDS))
    if (typeof s[k] !== type) problems.push(`${s.id || s.name}: ${k} should be a ${type}`);
  if (s.remainingG < 0) problems.push(`${s.id}: remainingG ${s.remainingG} < 0`);
  if (s.remainingG > s.weightG) problems.push(`${s.id}: remainingG ${s.remainingG} > weightG ${s.weightG}`);
  if (s.qty < 0) problems.push(`${s.id}: qty ${s.qty} < 0`);
  if ((s.emptied || 0) < 0) problems.push(`${s.id}: emptied ${s.emptied} < 0`);
}

const tids = d.printLog.flatMap(p => p.taskIds || []);
const seen = new Set();
for (const t of tids) {
  if (seen.has(t)) problems.push(`task id ${t} logged more than once`);
  seen.add(t);
}

if (today && d.lastUpdated !== today)
  problems.push(`lastUpdated is ${d.lastUpdated}, expected ${today}`);

if (problems.length) {
  console.error('FAIL\n  ' + problems.join('\n  '));
  process.exit(1);
}
console.log(`data.js OK (${d.printLog.length} prints, ${d.spools.length} spools)`);
