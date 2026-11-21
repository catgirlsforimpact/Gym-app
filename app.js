'use strict';

/* ---------- State & storage ---------- */
const STORE_KEY = 'liftlog.v1';
// Safety copies: never let a failed load or an update overwrite your only copy.
const RESCUE_KEY = 'liftlog.v1.rescue';         // raw data that could not be read
const BEFORE_UPDATE_KEY = 'liftlog.v1.before-update'; // raw data just before an app update changed it

function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); }

function defaultState() {
  return {
    unit: 'kg',
    tipsVersion: TIPS_VERSION,
    theme: 'auto',
    exercises: DEFAULT_EXERCISES.map(e => ({ ...e, tips: [...e.tips], note: '', custom: false })),
    workouts: [],   // { id, date, title, note, duration, entries: [{ exerciseId, sets: [{ w, r }] }] }
    active: null,   // in-progress workout
    notes: [],      // { id, date, text }
    plan: {},       // week planner: { 'y-m-d': { text, templateId } }
    templates: [],  // { id, name, entries: [{ exerciseId, sets: n }] }
    bodyweight: [], // { id, date, w }
    restSeconds: 90,
    autoRest: true, // start rest timer when a set's reps are entered
    restEnd: null,  // timestamp (ms) when current rest ends
    stretchStart: null, // timestamp (ms) when the cooldown stretch stopwatch started
    motivation: true, // show motivational phrases
    repRange: [8, 13], // app-wide rep range for progression suggestions
    goals: { month: null, year: null }, // workout goals (counts)
  };
}

// Store a safety copy, but never replace a copy that holds more of your data.
function keepCopy(key, raw) {
  try {
    const size = r => { try { const d = JSON.parse(r); return (d.workouts?.length || 0) + (d.templates?.length || 0) + (d.notes?.length || 0); } catch { return -1; } };
    const old = localStorage.getItem(key);
    if (!old || size(raw) >= size(old)) localStorage.setItem(key, raw);
  } catch {}
}

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaultState();
    let saved;
    try { saved = JSON.parse(raw); } catch (err) {
      // Unreadable data: keep it aside instead of saving an empty app over it.
      keepCopy(RESCUE_KEY, raw);
      console.error(err);
      return defaultState();
    }
    if ((saved.tipsVersion || 1) < TIPS_VERSION) {
      keepCopy(BEFORE_UPDATE_KEY, raw);
    }
    const s = { ...defaultState(), ...saved };
    s.unit = 'kg'; // the app uses kilograms only
    if (s.theme === 'blue') s.theme = 'crimson'; // Blue was replaced by Crimson
    // Tolerate missing or damaged pieces instead of failing the whole load.
    const def = defaultState();
    ['exercises', 'workouts', 'templates', 'notes', 'bodyweight'].forEach(k => { if (!Array.isArray(s[k])) s[k] = def[k]; });
    if (!s.plan || typeof s.plan !== 'object') s.plan = {};
    // Muscle groups: exercises now list several (e.g. Hamstrings + Glutes) and "Legs" is split up.
    if (s.exercises.some(ex => !Array.isArray(ex.groups))) {
      keepCopy(BEFORE_UPDATE_KEY, raw);
      s.exercises.forEach(ex => {
        if (Array.isArray(ex.groups)) return;
        const def = !ex.custom && DEFAULT_EXERCISES.find(d => d.id === ex.id);
        ex.groups = def ? [...def.groups] : [ex.group || 'Other'];
        delete ex.group;
      });
    }
    // "Arms" is split into Biceps and Triceps (built-in exercises; your own keep what you chose).
    if (s.exercises.some(ex => !ex.custom && ex.groups.includes('Arms'))) {
      keepCopy(BEFORE_UPDATE_KEY, raw);
      s.exercises.forEach(ex => {
        const def = !ex.custom && DEFAULT_EXERCISES.find(d => d.id === ex.id);
        if (!def || !ex.groups.includes('Arms')) return;
        const arms = def.groups.filter(g => g === 'Biceps' || g === 'Triceps');
        ex.groups = [...new Set(ex.groups.flatMap(g => g === 'Arms' ? arms : [g]))];
        if (!ex.groups.length) ex.groups = [...def.groups];
      });
    }
    // Add any new built-in exercises shipped after first launch.
    const have = new Set(s.exercises.map(e => e.id));
    DEFAULT_EXERCISES.forEach(e => { if (!have.has(e.id)) s.exercises.push({ ...e, tips: [...e.tips], note: '', custom: false }); });
    // Built-in tips were rewritten: use the new ones, and keep any tips you wrote yourself
    // (anything that was never a built-in tip) after them.
    if ((saved.tipsVersion || 1) < TIPS_VERSION) {
      const legacy = typeof LEGACY_TIPS === 'object' ? LEGACY_TIPS : {};
      s.exercises.forEach(ex => {
        const def = !ex.custom && DEFAULT_EXERCISES.find(d => d.id === ex.id);
        if (!def) return;
        const builtIn = new Set([...(legacy[ex.id] || []), ...def.tips]);
        const own = (ex.tips || []).filter(t => !builtIn.has(t));
        ex.tips = [...def.tips, ...own];
      });
      s.tipsVersion = TIPS_VERSION;
    }
    return s;
  } catch (err) {
    // Something went wrong while updating saved data: keep a copy before starting fresh.
    try { const raw = localStorage.getItem(STORE_KEY); if (raw) keepCopy(RESCUE_KEY, raw); } catch {}
    console.error(err);
    return defaultState();
  }
}

// A saved copy that can be restored from Settings, if one exists and holds anything.
function recoverableCopy() {
  for (const key of [RESCUE_KEY, BEFORE_UPDATE_KEY]) {
    try {
      const raw = localStorage.getItem(key); if (!raw) continue;
      const d = JSON.parse(raw);
      const n = (d.workouts?.length || 0) + (d.templates?.length || 0) + (d.notes?.length || 0);
      if (n) return { key, raw, workouts: d.workouts?.length || 0, templates: d.templates?.length || 0, notes: d.notes?.length || 0 };
    } catch {}
  }
  return null;
}

let state = load();
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
  catch (err) { toast('Could not save — storage unavailable'); }
}

/* ---------- Helpers ---------- */
// An exercise's muscle groups, main one first.
const exGroups = ex => (Array.isArray(ex?.groups) && ex.groups.length) ? ex.groups : [ex?.group || 'Other'];
// All groups in use: the standard order first, then any of your own.
function allGroups() {
  const used = new Set(state.exercises.flatMap(exGroups));
  return [...MUSCLE_GROUPS.filter(g => used.has(g)), ...[...used].filter(g => !MUSCLE_GROUPS.includes(g)).sort()];
}
const $ = (sel, root = document) => root.querySelector(sel);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const exById = id => state.exercises.find(e => e.id === id);
const num = v => { const n = parseFloat(String(v).replace(',', '.')); return isFinite(n) ? n : 0; };
const fmt = n => (Math.round(n * 10) / 10).toLocaleString();
const e1rm = (w, r) => (r <= 0 || w <= 0) ? 0 : (r === 1 ? w : w * (1 + r / 30)); // Epley

function fmtDate(iso, opts = { month: 'short', day: 'numeric' }) {
  const d = new Date(iso);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString(undefined, sameYear ? opts : { ...opts, year: 'numeric' });
}
function relDay(iso) {
  const d = new Date(iso); d.setHours(0, 0, 0, 0);
  const t = new Date(); t.setHours(0, 0, 0, 0);
  const diff = Math.round((t - d) / 864e5);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return d.toLocaleDateString(undefined, { weekday: 'long' });
  return fmtDate(iso);
}
// Clock times, e.g. "18:05", and helpers for time inputs.
const clock = d => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const timeValue = d => { const x = new Date(d); return `${String(x.getHours()).padStart(2, '0')}:${String(x.getMinutes()).padStart(2, '0')}`; };
function atTime(day, hhmm) {
  const [h, m] = String(hhmm || '').split(':').map(Number);
  if (!(h >= 0 && h < 24 && m >= 0 && m < 60)) return null;
  const d = new Date(day); d.setHours(h, m, 0, 0); return d;
}

function fmtDuration(ms) {
  const m = Math.floor(ms / 60000), h = Math.floor(m / 60);
  return h ? `${h}h ${m % 60}m` : `${m}m`;
}
function fmtClock(sec) {
  sec = Math.max(0, Math.round(sec));
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}
function todayKey(d = new Date()) {
  const x = new Date(d);
  return `${x.getFullYear()}-${x.getMonth() + 1}-${x.getDate()}`;
}
// Workouts in the current calendar month / year / week (local time).
function workoutCounts(now = new Date()) {
  const wk = weekStart(now);
  let week = 0, month = 0, year = 0;
  state.workouts.forEach(w => {
    const d = new Date(w.date);
    if (d.getFullYear() !== now.getFullYear()) return;
    year++;
    if (d.getMonth() === now.getMonth()) month++;
    if (d >= wk) week++;
  });
  return { week, month, year, total: state.workouts.length };
}
function workoutsOn(key) { return state.workouts.filter(w => todayKey(w.date) === key); }

function weekStart(date) {
  const d = new Date(date); d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Monday
  return d;
}

function workoutVolume(w) {
  return w.entries.reduce((t, en) => t + en.sets.reduce((s, x) => s + num(x.w) * num(x.r), 0), 0);
}
function completedSets(en) { return en.sets.filter(s => num(s.r) > 0); }

// History for a single exercise: [{ date, best1rm, topW, topR, sets }]
function exerciseHistory(id) {
  return state.workouts
    .filter(w => w.entries.some(en => en.exerciseId === id))
    .map(w => {
      const sets = w.entries.filter(en => en.exerciseId === id).flatMap(completedSets);
      let best = 0, top = { w: 0, r: 0 };
      sets.forEach(s => {
        const v = e1rm(num(s.w), num(s.r));
        if (v > best || (v === best && num(s.r) > top.r)) { best = v; top = { w: num(s.w), r: num(s.r) }; }
      });
      return { date: w.date, best1rm: best, topW: top.w, topR: top.r, sets, workoutId: w.id };
    })
    .filter(h => h.sets.length)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

function toast(msg, ms = 1800, cls = '') {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const el = document.createElement('div');
  el.className = `toast ${cls}`; el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), ms);
}

/* ---------- Confirm screen ----------
   The app's own "Are you sure?" dialog. Browser pop-up dialogs are blocked in
   some places, such as inside claude.ai, where they silently answer "no". */
function askConfirm({ title, body = '', confirmLabel = 'OK', danger = false, html = '' }) {
  return new Promise(resolve => {
    document.getElementById('confirm-layer')?.remove();
    const layer = document.createElement('div');
    layer.id = 'confirm-layer'; layer.className = 'confirm-layer';
    layer.innerHTML = `<div class="confirm-card" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
        <div class="confirm-title" id="confirm-title">${esc(title)}</div>
        ${body ? `<div class="confirm-body">${esc(body)}</div>` : ''}${html}
        <div class="confirm-actions">
          <button class="btn ghost" data-confirm="no">Cancel</button>
          <button class="btn ${danger ? 'confirm-danger' : ''}" data-confirm="yes">${esc(confirmLabel)}</button>
        </div>
      </div>`;
    const done = ok => { layer.remove(); document.removeEventListener('keydown', onKey, true); resolve(ok); };
    const onKey = e => { if (e.key === 'Escape') { e.stopPropagation(); done(false); } };
    layer.addEventListener('click', e => {
      e.stopPropagation();
      const b = e.target.closest('[data-confirm]');
      if (b) done(b.dataset.confirm === 'yes'); else if (e.target === layer) done(false);
    });
    document.addEventListener('keydown', onKey, true);
    document.body.appendChild(layer);
    layer.querySelector('[data-confirm="yes"]').focus();
  });
}

/* ---------- Backups ---------- */
// What a backup holds, in plain words, so you can check before restoring.
function summarizeBackup(d) {
  const n = (x, one, many) => `${x} ${x === 1 ? one : many}`;
  const goals = d.goals || {};
  const lines = [
    n(d.workouts?.length || 0, 'workout', 'workouts'),
    n(d.templates?.length || 0, 'template', 'templates'),
    goals.month || goals.year ? `Goals: ${[goals.month && `${goals.month} a month`, goals.year && `${goals.year} a year`].filter(Boolean).join(', ')}` : 'No goals set',
    n(d.bodyweight?.length || 0, 'body weight entry', 'body weight entries'),
    n(d.notes?.length || 0, 'note', 'notes'),
    n(Object.keys(d.plan || {}).length, 'planned day', 'planned days'),
    n((d.exercises || []).filter(e => e.custom).length, 'custom exercise', 'custom exercises'),
    n((d.exercises || []).filter(e => e.note?.trim()).length, 'exercise note', 'exercise notes'),
  ];
  if (d.active) lines.push('A workout in progress');
  if (d.templateDraft) lines.push('An unfinished template');
  return lines;
}

async function exportBackup() {
  const data = JSON.stringify({ ...state, exportedAt: new Date().toISOString(), app: 'Lift Log' }, null, 2);
  const filename = `liftlog-backup-${todayKey().split('-').map(x => x.padStart(2, '0')).join('-')}.json`;
  const summary = summarizeBackup(state).slice(0, 3).join(' · ');
  // Inside claude.ai the page can't download files itself; it asks claude.ai to save it.
  const dl = window.claude?.use ? await window.claude.use('downloads').catch(() => null) : null;
  if (dl) {
    try { await dl.save({ filename, data }); toast(`Backup saved · ${summary}`, 3500); return; }
    catch (e) { if (e?.code === 'declined') { toast('Backup not saved'); return; } }
  }
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
  link.download = filename; document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  toast(`Backup downloaded · ${summary}`, 3500);
}

async function importBackup(file) {
  let data;
  try { data = JSON.parse(await file.text()); } catch { toast('That file doesn’t look like a Lift Log backup'); return; }
  if (!data || !Array.isArray(data.workouts) || !Array.isArray(data.exercises)) { toast('That file doesn’t look like a Lift Log backup'); return; }
  const ok = await askConfirm({
    title: 'Restore this backup?',
    html: `<ul class="confirm-list">${summarizeBackup(data).map(l => `<li>${esc(l)}</li>`).join('')}</ul>
      <div class="confirm-body">It replaces everything in the app now. Your current data is kept as a safety copy.</div>`,
    confirmLabel: 'Restore',
  });
  if (!ok) return;
  try {
    localStorage.setItem(STORE_KEY + '.replaced', JSON.stringify(state)); // safety copy of what was here
    localStorage.setItem(STORE_KEY, JSON.stringify(data));
    state = load();               // runs the same updates as a normal start, so older backups work too
    templateDraft = state.templateDraft || null;
    save(); applyTheme(); closeSheet(); render();
    toast(`Restored · ${summarizeBackup(state).slice(0, 3).join(' · ')}`, 4000);
  } catch { toast('Could not restore the backup'); }
}

/* ---------- Motivation ---------- */
const lastPhrase = {};
// Lower body = any leg, glute or hip group (built-in or your own, e.g. "Quads", "Hamstrings"),
// plus deadlifts, which sit under Back but mostly train glutes and hamstrings.
const LOWER_BODY_GROUP = /leg|glute|quad|hamstring|calf|calves|hip|adduct|abduct|lower body/i;
const LOWER_BODY_IDS = ['deadlift', 'sumo-deadlift', 'rdl', 'single-leg-rdl', 'good-morning'];
const isLowerBody = exerciseId => {
  const ex = exById(exerciseId);
  return !!ex && (LOWER_BODY_IDS.includes(ex.id) || exGroups(ex).some(g => LOWER_BODY_GROUP.test(g)));
};

// Random phrase from a pool, never the same one twice in a row.
// For lower-body work, half the time it picks from the matching "...Legs" pool instead.
function phrase(kind, vars = {}, lowerBody = false) {
  const legsKey = kind + 'Legs';
  const key = lowerBody && PHRASES[legsKey]?.length && Math.random() < 0.5 ? legsKey : kind;
  const pool = PHRASES[key] || [];
  if (!pool.length) return '';
  let i = Math.floor(Math.random() * pool.length);
  if (pool.length > 1 && i === lastPhrase[key]) i = (i + 1) % pool.length;
  lastPhrase[key] = i;
  return pool[i].replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m);
}

// Which milestone each exercise last celebrated, so editing a set doesn't repeat it.
const celebrated = {};
function checkExerciseMilestone(i) {
  const a = state.active; if (!a || !state.motivation) return;
  const en = a.entries[i]; if (!en) return;
  const total = en.sets.length;
  const done = en.sets.filter(s => num(s.r) > 0).length;
  let kind = null;
  if (done === total) kind = 'exerciseDone';
  else if (total >= 2 && done === total - 1) kind = 'oneSetLeft';
  en.key ||= uid(); // stays with the exercise when it is moved
  const key = `${a.id}:${en.key}`;
  const status = kind && `${kind}:${total}`;
  if (!kind || celebrated[key] === status) return;
  celebrated[key] = status;
  toast(phrase(kind, { exercise: exById(en.exerciseId)?.name || 'that' }, isLowerBody(en.exerciseId)), 6500, 'motivate');
}

/* ---------- Charts (tiny SVG, no deps) ---------- */
function lineChart(points, { height = 170, unit = '', emptyText = null } = {}) {
  if (points.length < 2) {
    return `<div class="empty small">${emptyText || `Log this exercise ${points.length ? 'once more' : 'a couple of times'} to see a trend.`}</div>`;
  }
  const W = 360, H = height, pl = 30, pr = 10, pt = 12, pb = 22;
  const ys = points.map(p => p.y);
  let min = Math.min(...ys), max = Math.max(...ys);
  if (min === max) { min -= 1; max += 1; }
  const pad = (max - min) * 0.12; min -= pad; max += pad;
  const x = i => pl + (i / (points.length - 1)) * (W - pl - pr);
  const y = v => pt + (1 - (v - min) / (max - min)) * (H - pt - pb);
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.y).toFixed(1)}`).join(' ');
  const area = `${path} L${x(points.length - 1)},${H - pb} L${x(0)},${H - pb} Z`;
  const ticks = [max - pad, (max + min) / 2, min + pad];
  const showEvery = Math.ceil(points.length / 6);
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Progress chart">
    ${ticks.map(t => `<line class="axis" x1="${pl}" x2="${W - pr}" y1="${y(t)}" y2="${y(t)}" stroke-dasharray="2 4"/>
      <text class="lbl" x="${pl - 6}" y="${y(t) + 3}" text-anchor="end">${(max - min) < 10 ? t.toFixed(1) : Math.round(t)}</text>`).join('')}
    <path class="area" d="${area}"/>
    <path class="ln" d="${path}"/>
    ${points.map((p, i) => `<circle class="pt" cx="${x(i)}" cy="${y(p.y)}" r="3.5"><title>${esc(p.label)}: ${fmt(p.y)} ${unit}</title></circle>`).join('')}
    ${points.map((p, i) => (i % showEvery === 0 || i === points.length - 1)
      ? `<text class="lbl" x="${x(i)}" y="${H - 6}" text-anchor="middle">${esc(p.label)}</text>` : '').join('')}
  </svg>`;
}

function barChart(bars, { height = 120, label = 'Workouts per week', format = v => v } = {}) {
  const W = 360, H = height, pb = 20, pt = 8;
  const max = Math.max(1, ...bars.map(b => b.v));
  const bw = W / bars.length;
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">
    <defs><linearGradient id="crimsonBars" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ef5a70"/><stop offset="1" stop-color="#9e132b"/></linearGradient></defs>
    ${bars.map((b, i) => {
      const h = b.v ? Math.max(4, (b.v / max) * (H - pb - pt)) : 3;
      return `<rect class="bar ${b.v ? '' : 'zero'}" x="${i * bw + bw * 0.2}" y="${H - pb - h}" width="${bw * 0.6}" height="${h}" rx="3"><title>${esc(b.label)}: ${esc(format(b.v))}</title></rect>
        ${i % 2 === bars.length % 2 ? '' : `<text class="lbl" x="${i * bw + bw / 2}" y="${H - 5}" text-anchor="middle">${esc(b.label)}</text>`}`;
    }).join('')}
  </svg>`;
}

/* ---------- Progress statistics ---------- */
const DAY = 864e5;
const daysAgo = n => new Date(Date.now() - n * DAY);
const byDate = (a, b) => new Date(a.date) - new Date(b.date);

// Sets per muscle in the last 7 days. The main muscle counts a full set,
// helper muscles half a set (a common way to count weekly volume).
function setsPerMuscle(days = 7) {
  const since = daysAgo(days), out = {};
  state.workouts.filter(w => new Date(w.date) >= since).forEach(w => w.entries.forEach(en => {
    const ex = exById(en.exerciseId); if (!ex) return;
    const n = en.sets.length;
    exGroups(ex).forEach((g, i) => { out[g] = (out[g] || 0) + (i === 0 ? n : n / 2); });
  }));
  return out;
}

// Personal records over time: a session beats your previous best for that exercise.
// Weighted lifts compare estimated 1-rep max; bodyweight and timed work compare reps/seconds.
function personalRecords() {
  const best = {}, prs = [];
  [...state.workouts].sort(byDate).forEach(w => w.entries.forEach(en => {
    const sets = en.sets.filter(x => num(x.r) > 0);
    if (!sets.length) return;
    const weighted = sets.some(x => num(x.w) > 0);
    let top = null, score = 0;
    sets.forEach(x => {
      const v = weighted ? e1rm(num(x.w), num(x.r)) : num(x.r);
      if (v > score) { score = v; top = x; }
    });
    const key = en.exerciseId + (weighted ? '' : ':bw');
    const prev = best[key];
    if (prev !== undefined && score > prev + 1e-9) prs.push({ exerciseId: en.exerciseId, date: w.date, w: num(top.w), r: num(top.r), weighted, gain: score - prev });
    if (prev === undefined || score > prev) best[key] = score;
  }));
  return prs.sort((a, b) => new Date(b.date) - new Date(a.date));
}

// Biggest strength gains over the last 8 weeks: first session vs your best session since
// (estimated 1-rep max, weighted lifts). Using the best avoids a light day hiding progress.
function mostImproved(limit = 3) {
  const since = daysAgo(56);
  return state.exercises.map(ex => {
    const h = exerciseHistory(ex.id).filter(x => new Date(x.date) >= since && x.best1rm > 0);
    if (h.length < 2) return null;
    const first = h[0].best1rm, top = Math.max(...h.slice(1).map(x => x.best1rm));
    const pct = (top - first) / first * 100;
    return pct > 0.5 ? { ex, pct, from: first, to: top, sessions: h.length } : null;
  }).filter(Boolean).sort((a, b) => b.pct - a.pct).slice(0, limit);
}

// Average workouts per week and workout length over the last 8 weeks.
function consistency() {
  const since = daysAgo(56);
  const recent = state.workouts.filter(w => new Date(w.date) >= since);
  const firstEver = state.workouts.length ? Math.min(...state.workouts.map(w => +new Date(w.date))) : Date.now();
  const weeks = Math.max(1, Math.min(8, (Date.now() - Math.max(+since, firstEver)) / (7 * DAY)));
  const durations = recent.map(w => w.duration).filter(d => d > 60e3 && d < 5 * 3600e3);
  const last = state.workouts.length ? Math.max(...state.workouts.map(w => +new Date(w.date))) : null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const lastDay = last ? new Date(last) : null; lastDay?.setHours(0, 0, 0, 0);
  return {
    perWeek: Math.round(recent.length / weeks * 10) / 10,
    avgMin: durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length / 60e3) : null,
    daysSince: lastDay ? Math.round((today - lastDay) / DAY) : null,
  };
}

/* ---------- Navigation ---------- */
let tab = 'train';
const titles = { train: 'Train', plan: 'Plan', exercises: 'Exercises', progress: 'Progress', notes: 'Notes' };
const views = {};

function go(t) {
  tab = t;
  document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === t));
  render();
  window.scrollTo(0, 0);
}
function render() {
  $('#title').textContent = titles[tab];
  $('#view').innerHTML = views[tab]();
  afterRender[tab]?.();
}
const afterRender = {};

document.querySelector('.tabs').addEventListener('click', e => {
  const b = e.target.closest('button[data-tab]');
  if (b) go(b.dataset.tab);
});

/* ---------- Train ---------- */
let timerHandle = null;

views.train = () => {
  const a = state.active;
  if (!a) {
    const recent = [...state.workouts].sort((x, y) => new Date(y.date) - new Date(x.date)).slice(0, 5);
    const c = workoutCounts();
    return `
      ${todayPlanCard()}
      <button class="btn block" data-act="start">Start workout</button>
      <div class="count-line">${c.month}${goalValue('month') ? ` of ${goalValue('month')}` : ''} workout${(goalValue('month') || c.month) === 1 ? '' : 's'} this month · ${c.year}${goalValue('year') ? ` of ${goalValue('year')}` : ''} this year</div>
      ${state.workouts.length ? `<button class="btn ghost block" style="margin-top:10px" data-act="repeat">Repeat last workout</button>` : ''}
      ${draftUnsaved() ? (d => `<div class="card draft-card">
        <div style="min-width:0">
          <div class="title">Unfinished template</div>
          <div class="sub">${esc(d.name?.trim() || 'Untitled')} · ${d.entries.length} exercise${d.entries.length === 1 ? '' : 's'}</div>
        </div>
        <div class="row" style="gap:12px;flex-shrink:0">
          <button class="link" data-act="draft-discard">Discard</button>
          <button class="btn sm" data-act="draft-continue">Continue</button>
        </div>
      </div>`)(state.templateDraft) : ''}
      <div class="row between"><div class="label">Templates</div><button class="link" style="margin-top:18px" data-act="new-template">+ New</button></div>
      ${state.templates.length ? `<div class="list">${state.templates.map(t => `
        <div class="list-item">
          <button style="flex:1;text-align:left" data-act="edit-template" data-id="${t.id}">
            <div class="title">${esc(t.name)}</div>
            <div class="sub">${t.entries.map(en => esc(exById(en.exerciseId)?.name || '?')).slice(0, 3).join(', ')}${t.entries.length > 3 ? ` +${t.entries.length - 3}` : ''}</div>
          </button>
          <button class="btn sm" data-act="start-template" data-id="${t.id}">Start</button>
        </div>`).join('')}</div>`
        : `<div class="muted small">Save a routine you repeat, like "Push day", and start it with one tap.</div>`}
      <div class="label">Recent</div>
      ${recent.length ? `<div class="list">${recent.map(workoutRow).join('')}</div>`
        : `<div class="empty">No workouts yet.<br>Start one and log your first sets.</div>`}
    `;
  }
  return `
    <div class="workout-head">
      <div class="row between">
        <input class="title-input" data-field="title" value="${esc(a.title)}" aria-label="Workout name" />
        <button class="timer-btn" data-act="edit-start" aria-label="Change start time"><span class="timer" id="timer"></span><span class="started">Started ${clock(a.date)}</span></button>
      </div>
      <div class="muted small">${fmtDate(a.date, { weekday: 'long', month: 'long', day: 'numeric' })}</div>
    </div>

    ${a.entries.map((en, i) => entryBlock(en, i, a.entries.length)).join('') || `<div class="empty">Add your first exercise.</div>`}

    <button class="btn ghost block" style="margin-top:18px" data-act="add-exercise">+ Add exercise</button>
    <div class="row" style="margin-top:10px">
      <button class="btn ghost" style="flex:1" data-act="rest-start">Rest ${fmtClock(state.restSeconds)}</button>
      <button class="btn ghost" style="flex:1" data-act="stretch-start">Stretch</button>
    </div>
    ${a.entries.length ? `<button class="link" style="margin-top:12px" data-act="save-template">Save as template</button>` : ''}

    ${(prev => prev.length ? `
      <div class="label">Earlier notes · ${esc(templateById(a.templateId)?.name || a.title || 'this workout')}</div>
      <div class="prev-notes">${prev.map(w => `
        <div class="prev-note">
          <div class="meta">${esc(relDay(w.date))}${relDay(w.date) === fmtDate(w.date) ? '' : ` · ${esc(fmtDate(w.date))}`}</div>
          <div class="body">${esc(w.note)}</div>
        </div>`).join('')}
      </div>` : '')(previousNotes(a))}
    <div class="label">Workout notes</div>
    <textarea data-field="note" placeholder="How did it feel? Energy, sleep, anything to remember…">${esc(a.note)}</textarea>

    <div class="row" style="margin-top:20px">
      <button class="btn danger" data-act="discard">Discard</button>
      <button class="btn" style="flex:1" data-act="finish">Finish workout</button>
    </div>
  `;
};

/* ---------- Progression (double progression) ----------
   Work in a rep range. Add one rep each session at the same weight; once every
   working set reaches the top of the range, add weight and go back to the bottom. */
// The app-wide rep range from Settings (default 8–13), used for every exercise.
function repRange() {
  const [lo, hi] = Array.isArray(state.repRange) ? state.repRange.map(Number) : [];
  return lo >= 1 && hi > lo && hi <= 50 ? [lo, hi] : [8, 13];
}
const libraryEntry = ex => DEFAULT_EXERCISES.find(d => d.id === ex?.id);
function weightStep(ex) {
  // small isolation moves (curls, flyes, raises, kickbacks) go up 1 kg; everything else 2.5 kg
  const lib = libraryEntry(ex);
  if (lib?.step) return lib.step;
  const g = exGroups(ex);
  return g.length === 1 && ['Biceps', 'Triceps', 'Shoulders', 'Core'].includes(g[0]) ? 1 : 2.5;
}
const isTimed = ex => !!libraryEntry(ex)?.time;
const roundW = w => Math.round(w * 4) / 4;

// Suggestion for the next session of an exercise, based on its last session.
function suggestNext(exerciseId) {
  const ex = exById(exerciseId); if (!ex) return null;
  const hist = exerciseHistory(exerciseId);
  const last = hist[hist.length - 1]; if (!last) return null;
  const sets = last.sets.map(x => ({ w: num(x.w), r: num(x.r) }));
  const topW = Math.max(...sets.map(x => x.w));
  const working = sets.filter(x => x.w === topW);
  const minR = Math.min(...working.map(x => x.r));
  const count = sets.length;
  if (isTimed(ex)) return { kind: 'time', w: 0, r: minR + 5, count, label: '+5 seconds', last };
  if (topW <= 0) return { kind: 'reps', w: 0, r: minR + 1, count, label: '+1 rep', last };
  const [lo, hi] = repRange();
  if (minR >= hi) {
    const step = weightStep(ex);
    return { kind: 'weight', w: roundW(topW + step), r: lo, count, label: `+${fmt(step)} kg`, last };
  }
  return { kind: 'reps', w: topW, r: minR + 1, count, label: '+1 rep', last };
}
function suggestText(sg) {
  if (sg.kind === 'time') return `${sg.r} seconds`;
  return sg.w > 0 ? `${fmt(sg.w)} ${state.unit} × ${sg.r}` : `${sg.r} reps`;
}

// Earlier workouts of the same template that have notes, newest first.
// Older workouts didn't record their template, so they match by name.
function previousNotes(a, limit = 3) {
  if (!a?.templateId) return [];
  const t = templateById(a.templateId);
  return state.workouts
    .filter(w => w.id !== a.id && w.note?.trim() && (w.templateId === a.templateId || (!w.templateId && t && w.title === t.name)))
    .sort((x, y) => new Date(y.date) - new Date(x.date))
    .slice(0, limit);
}

function entryBlock(en, i, n = 1) {
  const ex = exById(en.exerciseId) || { name: 'Unknown exercise' };
  const hist = exerciseHistory(en.exerciseId);
  const last = hist[hist.length - 1];
  const sg = suggestNext(en.exerciseId);
  // hints: the suggested target, falling back to last session's matching set
  const hintW = j => sg ? (sg.w || 0) : (last?.sets[j] ? num(last.sets[j].w) : (last?.topW ?? 0));
  const hintR = j => sg ? sg.r : (last?.sets[j] ? num(last.sets[j].r) : (last?.topR ?? 0));
  const weightsMissing = sg && sg.w > 0 && (en.sets.length < sg.count || en.sets.some(x => String(x.w) !== String(sg.w)));
  return `
    <div class="card entry" data-entry="${i}">
      <div class="entry-head">
        <button class="entry-name" data-act="show-ex" data-id="${esc(en.exerciseId)}">${esc(ex.name)}</button>
        <div class="entry-tools">
          ${n > 1 ? `<div class="entry-order">
            <button data-act="move-entry" data-i="${i}" data-v="-1" aria-label="Move ${esc(ex.name)} up" ${i === 0 ? 'disabled' : ''}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6"/></svg></button>
            <button data-act="move-entry" data-i="${i}" data-v="1" aria-label="Move ${esc(ex.name)} down" ${i === n - 1 ? 'disabled' : ''}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></button>
          </div>` : ''}
          <button class="link" data-act="remove-entry" data-i="${i}">Remove</button>
        </div>
      </div>
      <div class="sets-grid">
        <span class="h">Set</span><span class="h" style="text-align:center">${state.unit}</span><span class="h" style="text-align:center">Reps</span><span></span>
        ${en.sets.map((s, j) => `
          <span class="n">${j + 1}</span>
          <input inputmode="decimal" data-set="${i}:${j}:w" value="${esc(s.w)}" placeholder="${fmt(hintW(j))}" aria-label="Weight set ${j + 1}" />
          <input inputmode="numeric" data-set="${i}:${j}:r" value="${esc(s.r)}" placeholder="${hintR(j)}" aria-label="Reps set ${j + 1}" />
          <button class="x" data-act="remove-set" data-i="${i}" data-j="${j}" aria-label="Remove set">×</button>
        `).join('')}
      </div>
      ${sg ? `<div class="suggest">
        <div class="suggest-text"><span class="suggest-label">Suggested</span> ${esc(suggestText(sg))}${sg.count > 1 ? ` · ${sg.count} sets` : ''} <span class="suggest-tag ${sg.kind}">${esc(sg.label)}</span></div>
        ${weightsMissing ? `<button class="link" data-act="apply-suggest" data-i="${i}">Use</button>` : ''}
      </div>` : ''}
      <div class="row between" style="margin-top:10px">
        <span class="prev">${last ? `Last (${relDay(last.date)}): ${last.sets.map(s => `${fmt(num(s.w))}×${num(s.r)}`).join(', ')}` : 'First time, have fun'}</span>
        <button class="btn ghost sm" data-act="add-set" data-i="${i}">+ Set</button>
      </div>
    </div>`;
}

function workoutRow(w) {
  const names = w.entries.map(en => exById(en.exerciseId)?.name).filter(Boolean);
  return `<button class="list-item" data-act="open-workout" data-id="${w.id}">
    <div>
      <div class="title">${esc(w.title || 'Workout')}</div>
      <div class="sub">${relDay(w.date)} · ${names.slice(0, 3).map(esc).join(', ')}${names.length > 3 ? ` +${names.length - 3}` : ''}</div>
    </div>
    <span class="chev">›</span>
  </button>`;
}

afterRender.train = () => {
  clearInterval(timerHandle);
  if (!state.active) return;
  const tick = () => { const el = $('#timer'); if (el) el.textContent = fmtDuration(Date.now() - new Date(state.active.date)); };
  tick(); timerHandle = setInterval(tick, 15000);
};

function startWorkout(entries = []) {
  const h = new Date().getHours();
  const part = h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening';
  state.active = { id: uid(), date: new Date().toISOString(), title: `${part} workout`, note: '', entries };
  save(); render();
}

function finishWorkout() {
  const a = state.active;
  a.entries = a.entries.map(({ key, ...en }) => ({ ...en, sets: en.sets.filter(s => num(s.r) > 0).map(s => ({ w: num(s.w), r: num(s.r) })) }))
    .filter(en => en.sets.length);
  if (!a.entries.length) { toast('Log at least one set first'); return; }
  // Detect PRs before saving
  const prs = a.entries.filter(en => {
    const prev = Math.max(0, ...exerciseHistory(en.exerciseId).map(h => h.best1rm));
    const now = Math.max(...en.sets.map(s => e1rm(s.w, s.r)));
    return prev > 0 && now > prev;
  }).map(en => exById(en.exerciseId)?.name);
  if (state.stretchStart) stopStretch({ quiet: true });
  a.duration = Date.now() - new Date(a.date);
  state.workouts.push(a);
  state.active = null;
  state.restEnd = null; renderRest();
  save(); render();
  showWorkoutComplete(a, prs);
}

function showWorkoutComplete(w, prs) {
  document.querySelectorAll('.toast').forEach(t => t.remove()); // the finish screen takes over
  const sets = w.entries.reduce((t, en) => t + en.sets.length, 0);
  const vol = workoutVolume(w);
  openSheet(`
    <div class="celebrate">
      <div class="label" style="margin-top:4px">Workout complete</div>
      ${state.motivation ? `<p class="celebrate-phrase">${esc(phrase('workoutDone', {}, w.entries.some(en => isLowerBody(en.exerciseId))))}</p>` : `<p class="celebrate-phrase">Nice work.</p>`}
      <div class="stats" style="grid-template-columns:repeat(3,1fr)">
        <div class="stat"><div class="v">${fmtDuration(w.duration)}</div><div class="k">Time</div></div>
        <div class="stat"><div class="v">${sets}</div><div class="k">Sets</div></div>
        <div class="stat"><div class="v">${vol >= 10000 ? fmt(vol / 1000) + 'k' : fmt(vol)}</div><div class="k">${state.unit} lifted</div></div>
      </div>
      ${w.stretch ? `<div class="small muted" style="margin-top:10px">Including ${fmtDuration(w.stretch)} of cooldown stretching</div>` : ''}
      ${prs.length ? `<div class="card pr-card">🏆 New personal record${prs.length > 1 ? 's' : ''}: <strong>${prs.map(esc).join(', ')}</strong></div>` : ''}
      <button class="btn block" style="margin-top:20px" data-act="close-sheet">Done</button>
    </div>
  `);
}

/* ---------- Rest timer ---------- */
let restHandle = null;

function startRest(seconds = state.restSeconds) {
  if (state.stretchStart) stopStretch();
  state.restEnd = Date.now() + seconds * 1000; save();
  renderRest();
}
function stopRest() { state.restEnd = null; save(); renderRest(); }
function adjustRest(delta) {
  if (!state.restEnd) return;
  state.restEnd = Math.max(Date.now() + 1000, state.restEnd + delta * 1000); save(); renderRest();
}

/* ---------- Cooldown stretch stopwatch ----------
   Counts up from 0:00 until you stop it. The time is added to the workout. */
let stretchHandle = null;
const stretchClock = ms => {
  const t = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(t / 3600), m = Math.floor(t / 60) % 60, sec = String(t % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
};
function startStretch() {
  if (state.stretchStart) return;
  if (state.restEnd) { state.restEnd = null; renderRest(); }
  state.stretchStart = Date.now(); save(); renderStretch();
}
// Stops the stopwatch and returns how long it ran. With keep, the time is added to the workout.
function stopStretch({ keep = true, quiet = false } = {}) {
  if (!state.stretchStart) return 0;
  const ms = Date.now() - state.stretchStart;
  state.stretchStart = null;
  if (keep && state.active && ms >= 1000) state.active.stretch = (state.active.stretch || 0) + ms;
  save(); renderStretch();
  if (keep && !quiet && ms >= 1000) toast(`Stretching saved · ${stretchClock(ms)}`);
  return ms;
}
function renderStretch() {
  clearInterval(stretchHandle);
  let bar = $('#stretch-bar');
  document.body.classList.toggle('resting', !!state.restEnd || !!state.stretchStart);
  if (!state.stretchStart) { bar?.remove(); return; }
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'stretch-bar'; bar.className = 'rest-bar stretch-bar';
    bar.innerHTML = `
      <span class="rest-label">Stretching</span>
      <span class="rest-time" id="stretch-time">0:00</span>
      <button data-act="stretch-stop">Stop</button>`;
    document.body.appendChild(bar);
  }
  const tick = () => { const el = $('#stretch-time'); if (el && state.stretchStart) el.textContent = stretchClock(Date.now() - state.stretchStart); };
  tick(); stretchHandle = setInterval(tick, 250);
}

function renderRest() {
  clearInterval(restHandle);
  let bar = $('#rest-bar');
  document.body.classList.toggle('resting', !!state.restEnd || !!state.stretchStart);
  if (!state.restEnd) { bar?.remove(); return; }
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'rest-bar'; bar.className = 'rest-bar';
    bar.innerHTML = `
      <div class="rest-fill" id="rest-fill"></div>
      <span class="rest-label">Rest</span>
      <span class="rest-time" id="rest-time"></span>
      <button data-act="rest-adj" data-v="-15" aria-label="Subtract 15 seconds">−15</button>
      <button data-act="rest-adj" data-v="15" aria-label="Add 15 seconds">+15</button>
      <button data-act="rest-stop">Skip</button>`;
    document.body.appendChild(bar);
  }
  const total = Math.max(1, state.restSeconds);
  const tick = () => {
    const left = (state.restEnd - Date.now()) / 1000;
    if (left <= 0) { restDone(); return; }
    $('#rest-time').textContent = fmtClock(Math.ceil(left));
    $('#rest-fill').style.transform = `scaleX(${Math.min(1, left / total)})`;
  };
  tick(); restHandle = setInterval(tick, 250);
}

function restDone() {
  state.restEnd = null; save(); renderRest();
  navigator.vibrate?.([200, 100, 200]);
  toast('Rest over — next set');
}

// Catch up if the app was in the background when the rest ended.
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && state.restEnd) renderRest();
});

/* ---------- Templates ---------- */
// The template being edited. It's saved with your data as you go, so closing the
// editor by accident (a tap outside, a swipe) never loses it.
let templateDraft = state.templateDraft || null;
function setDraft(d) { templateDraft = d; state.templateDraft = d; save(); }
// True when there is an unfinished template worth keeping.
function draftUnsaved() {
  const d = state.templateDraft;
  if (!d) return false;
  const saved = state.templates.find(t => t.id === d.id);
  if (saved) return JSON.stringify([saved.name, saved.entries]) !== JSON.stringify([d.name, d.entries]);
  return !!(d.name?.trim() || d.entries?.length);
}

// Last weights used for an exercise, so a new workout is pre-filled.
function lastSetsFor(id) {
  const h = exerciseHistory(id);
  return h.length ? h[h.length - 1].sets : [];
}

function startFromTemplate(t) {
  startWorkout(t.entries.filter(en => exById(en.exerciseId)).map(en => {
    const prev = lastSetsFor(en.exerciseId);
    return {
      exerciseId: en.exerciseId,
      sets: Array.from({ length: Math.max(1, en.sets) }, (_, i) => ({ w: prev[i]?.w ?? prev[prev.length - 1]?.w ?? '', r: '' })),
    };
  }));
  state.active.title = t.name; state.active.templateId = t.id; save(); render();
}

function templateFromWorkout(w) {
  return { id: uid(), name: w.title || 'My routine', entries: w.entries.map(en => ({ exerciseId: en.exerciseId, sets: Math.max(1, en.sets.length) })) };
}

function editTemplate(draft, { keepScroll = false, moved = -1 } = {}) {
  setDraft(draft);
  const isNew = !state.templates.some(t => t.id === draft.id);
  const scroll = keepScroll ? $('#sheet').scrollTop : 0;
  const n = draft.entries.length;
  openSheet(`
    <h2>${isNew ? 'New template' : 'Edit template'}</h2>
    <input id="t-name" placeholder="Name, e.g. Push day" value="${esc(draft.name)}" style="margin-top:16px" />
    <div class="label">Exercises</div>
    ${draft.entries.length ? `<div class="list">${draft.entries.map((en, i) => `
      <div class="list-item t-row ${i === moved ? 'moved' : ''}">
        ${n > 1 ? `<div class="t-order">
          <button data-act="t-move" data-i="${i}" data-v="-1" aria-label="Move ${esc(exById(en.exerciseId)?.name || 'exercise')} up" ${i === 0 ? 'disabled' : ''}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6"/></svg></button>
          <button data-act="t-move" data-i="${i}" data-v="1" aria-label="Move ${esc(exById(en.exerciseId)?.name || 'exercise')} down" ${i === n - 1 ? 'disabled' : ''}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></button>
        </div>` : ''}
        <div class="t-main">
          <span class="title">${esc(exById(en.exerciseId)?.name || 'Unknown')}</span>
          <div class="stepper">
            <button data-act="t-sets" data-i="${i}" data-v="-1" aria-label="Fewer sets">−</button>
            <span>${en.sets} set${en.sets > 1 ? 's' : ''}</span>
            <button data-act="t-sets" data-i="${i}" data-v="1" aria-label="More sets">+</button>
          </div>
        </div>
        <button class="x" data-act="t-remove" data-i="${i}" aria-label="Remove">×</button>
      </div>`).join('')}</div>` : `<div class="muted small">No exercises yet.</div>`}
    <button class="btn ghost block" style="margin-top:14px" data-act="t-add">+ Add exercise</button>
    <button class="btn block" style="margin-top:10px" data-act="t-save">Save template</button>
    ${!isNew ? `<button class="btn danger block" style="margin-top:6px" data-act="t-delete">Delete template</button>` : ''}
  `, sheet => {
    sheetKind = 'template';
    sheet.scrollTop = scroll;
    $('#t-name', sheet).addEventListener('input', e => { templateDraft.name = e.target.value; state.templateDraft = templateDraft; save(); });
  });
}

/* ---------- Body weight ---------- */
function bodyweightSorted() { return [...state.bodyweight].sort((a, b) => new Date(a.date) - new Date(b.date)); }

function logBodyweight(value) {
  const w = num(value);
  if (w <= 0) { toast('Enter your weight'); return false; }
  const key = todayKey();
  const existing = state.bodyweight.find(b => todayKey(b.date) === key);
  if (existing) { existing.w = w; existing.date = new Date().toISOString(); }
  else state.bodyweight.push({ id: uid(), date: new Date().toISOString(), w });
  save(); return true;
}

function bodyweightSection() {
  const bw = bodyweightSorted();
  const last = bw[bw.length - 1];
  const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 30);
  const base = bw.find(b => new Date(b.date) >= monthAgo) || bw[0];
  const change = last && base && last !== base ? last.w - base.w : null;
  return `
    <div class="label">Body weight</div>
    <div class="card">
      <div class="row between" style="margin-bottom:${bw.length ? 10 : 0}px">
        <div>
          <div class="bw-now">${last ? `${fmt(last.w)} <span class="muted small">${state.unit}</span>` : '<span class="muted small">Not logged yet</span>'}</div>
          ${change !== null ? `<div class="small muted">${change > 0 ? '+' : ''}${fmt(change)} ${state.unit} in 30 days</div>` : ''}
        </div>
        <div class="row" style="gap:6px">
          <input id="bw-input" inputmode="decimal" placeholder="${last ? fmt(last.w) : state.unit}" style="width:84px;text-align:center" aria-label="Body weight" />
          <button class="btn sm" data-act="bw-log">Log</button>
        </div>
      </div>
      ${bw.length ? lineChart(bw.slice(-30).map(b => ({ y: b.w, label: fmtDate(b.date, { month: 'numeric', day: 'numeric' }) })), { height: 140, unit: state.unit, emptyText: 'Log your weight on another day to see how it changes over time.' }) : ''}
      ${bw.length ? `<button class="link" style="margin-top:8px" data-act="bw-history">All entries</button>` : ''}
    </div>`;
}

function showBodyweightHistory() {
  const bw = bodyweightSorted().reverse();
  openSheet(`
    <h2>Body weight</h2>
    <div class="list" style="margin-top:16px">
      ${bw.map(b => `<div class="list-item"><span>${fmtDate(b.date, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
        <span class="row"><span>${fmt(b.w)} ${state.unit}</span><button class="x" data-act="bw-del" data-id="${b.id}" aria-label="Delete entry">×</button></span></div>`).join('')
        || `<div class="empty">No entries.</div>`}
    </div>`);
}

/* ---------- Workout goals ---------- */
function goalValue(k) { const n = parseInt(state.goals?.[k], 10); return n > 0 ? n : null; }

function goalRow(label, done, goal, left, unit) {
  const pct = Math.min(100, Math.round(done / goal * 100));
  const reached = done >= goal;
  const remaining = goal - done;
  // workouts per week still needed to get there
  const weeks = Math.max(left.days / 7, 1);
  const perWeek = Math.round(remaining / weeks * 10) / 10;
  const pace = reached ? 'Goal reached' : `About ${perWeek} a week gets you there`;
  return `<div class="goal">
    <div class="row between goal-top">
      <span class="goal-name">${label}</span>
      <span class="goal-count"><b>${done}</b> / ${goal}</span>
    </div>
    <div class="goal-bar ${reached ? 'reached' : ''}" role="progressbar" aria-valuemin="0" aria-valuemax="${goal}" aria-valuenow="${done}"><span style="width:${pct}%"></span></div>
    <div class="row between small muted goal-foot">
      <span>${reached ? (done > goal ? `${done - goal} over your goal` : 'You hit it') : `${remaining} to go · ${left.n} ${unit}${left.n === 1 ? '' : 's'} left`}</span>
      <span class="${reached ? 'goal-ok' : ''}">${pace}</span>
    </div>
  </div>`;
}

function goalsSection() {
  const now = new Date();
  const c = workoutCounts(now);
  const gm = goalValue('month'), gy = goalValue('year');
  if (!gm && !gy) {
    return `<div class="card goals-empty">
      <div style="font-weight:600">Set a workout goal</div>
      <div class="small muted" style="margin:4px 0 12px">Pick how many workouts you want this month and this year, and track how close you are.</div>
      <button class="btn sm" data-act="edit-goals">Set goals</button>
    </div>`;
  }
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeftM = daysInMonth - now.getDate() + 1;
  const startY = new Date(now.getFullYear(), 0, 1), endY = new Date(now.getFullYear() + 1, 0, 1);
  const daysInYear = Math.round((endY - startY) / 864e5);
  const dayOfYear = Math.floor((new Date(now.getFullYear(), now.getMonth(), now.getDate()) - startY) / 864e5) + 1;
  const weeksLeftY = Math.max(1, Math.ceil((daysInYear - dayOfYear + 1) / 7));
  return `<div class="card goals">
    <div class="row between" style="margin-bottom:4px">
      <span class="small muted">Goals</span>
      <button class="link" data-act="edit-goals">Edit</button>
    </div>
    ${gm ? goalRow(now.toLocaleDateString(undefined, { month: 'long' }), c.month, gm, { n: daysLeftM, days: daysLeftM }, 'day') : ''}
    ${gy ? goalRow(String(now.getFullYear()), c.year, gy, { n: weeksLeftY, days: daysInYear - dayOfYear + 1 }, 'week') : ''}
  </div>`;
}

function editGoals() {
  openSheet(`
    <h2>Workout goals</h2>
    <p class="small muted" style="margin:6px 0 0">How many workouts do you want to do? Leave a box empty for no goal.</p>
    <div class="goal-inputs">
      <label class="goal-input"><span>Per month</span><input id="goal-month" inputmode="numeric" placeholder="e.g. 12" value="${goalValue('month') ?? ''}" /></label>
      <label class="goal-input"><span>Per year</span><input id="goal-year" inputmode="numeric" placeholder="e.g. 150" value="${goalValue('year') ?? ''}" /></label>
    </div>
    <div class="small muted" id="goal-hint" style="margin-top:8px"></div>
    <button class="btn block" style="margin-top:18px" data-act="save-goals">Save</button>
  `, sheet => {
    const m = $('#goal-month', sheet), y = $('#goal-year', sheet), hint = $('#goal-hint', sheet);
    const update = () => {
      const mv = parseInt(m.value, 10), yv = parseInt(y.value, 10);
      hint.textContent = mv > 0 ? `${mv} a month is about ${Math.round(mv * 12 / 52 * 10) / 10} a week${!(yv > 0) ? `, or ${mv * 12} a year` : ''}.` : yv > 0 ? `${yv} a year is about ${Math.round(yv / 52 * 10) / 10} a week.` : '';
    };
    m.addEventListener('input', update); y.addEventListener('input', update); update();
    [m, y].forEach(i => i.addEventListener('keydown', e => { if (e.key === 'Enter') $('[data-act="save-goals"]', sheet).click(); }));
  });
}

/* ---------- Week planner ---------- */
let planWeekOffset = 0;   // 0 = this week, 1 = next week, ...
let planDraft = null;     // day being edited: { key, text, templateId }

const templateById = id => state.templates.find(t => t.id === id);
const isRestText = t => /^rest( day)?$/i.test((t || '').trim());

// Short label for a planned day, e.g. "Leg day · Glutes focus" or "Rest day".
function planLabel(p) {
  if (!p) return '';
  const t = p.templateId && templateById(p.templateId);
  if (isRestText(p.text) && !t) return 'Rest day';
  return [t?.name, p.text?.trim()].filter(Boolean).join(' · ');
}

function todayPlanCard() {
  const key = todayKey();
  const p = state.plan?.[key];
  if (!p) return '';
  const t = p.templateId && templateById(p.templateId);
  const done = workoutsOn(key).length > 0;
  const rest = isRestText(p.text) && !t;
  return `<div class="card today-plan">
    <div class="small muted">Today's plan</div>
    <div class="row between" style="margin-top:2px">
      <div class="today-plan-title">${esc(planLabel(p))}</div>
      ${done ? '<span class="pill done">Done</span>'
        : t ? `<button class="btn sm" data-act="start-plan" data-key="${key}">Start</button>` : ''}
    </div>
    ${rest && !done ? '<div class="small muted" style="margin-top:4px">Recovery is part of the work.</div>' : ''}
  </div>`;
}

views.plan = () => {
  const start = weekStart(new Date());
  start.setDate(start.getDate() + planWeekOffset * 7);
  const end = new Date(start); end.setDate(end.getDate() + 6);
  const today = todayKey();
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(d.getDate() + i); return d; });
  const planned = days.filter(d => { const p = state.plan?.[todayKey(d)]; return p && !(isRestText(p.text) && !p.templateId); }).length;
  const doneN = days.filter(d => workoutsOn(todayKey(d)).length).length;
  const range = `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString(undefined, { month: start.getMonth() === end.getMonth() ? undefined : 'short', day: 'numeric' })}`;
  const name = planWeekOffset === 0 ? 'This week' : planWeekOffset === 1 ? 'Next week' : planWeekOffset === -1 ? 'Last week' : range;

  return `
    <div class="row between plan-head">
      <button class="icon-btn" data-act="plan-week" data-v="-1" aria-label="Previous week">‹</button>
      <div style="text-align:center">
        <div class="plan-week-name">${esc(name)}</div>
        <div class="small muted">${esc(range)}</div>
      </div>
      <button class="icon-btn" data-act="plan-week" data-v="1" aria-label="Next week">›</button>
    </div>
    <div class="seg" style="display:flex;margin-top:10px">
      <button style="flex:1" class="${planWeekOffset === 0 ? 'active' : ''}" data-act="plan-week-set" data-v="0">This week</button>
      <button style="flex:1" class="${planWeekOffset === 1 ? 'active' : ''}" data-act="plan-week-set" data-v="1">Next week</button>
    </div>

    <div class="list" style="margin-top:14px">
      ${days.map(d => {
        const key = todayKey(d);
        const p = state.plan?.[key];
        const done = workoutsOn(key).length > 0;
        const t = p?.templateId && templateById(p.templateId);
        const past = key !== today && d < new Date();
        const label = planLabel(p);
        return `<div class="plan-day ${key === today ? 'today' : ''} ${past ? 'past' : ''}">
          <button class="plan-day-main" data-act="plan-day" data-key="${key}">
            <span class="plan-date"><span class="dow">${d.toLocaleDateString(undefined, { weekday: 'short' })}</span><span class="dom">${d.getDate()}</span></span>
            <span class="plan-text ${label ? '' : 'unplanned'} ${label === 'Rest day' ? 'rest' : ''}">${label ? esc(label) : (past ? '—' : 'Tap to plan')}</span>
          </button>
          ${done ? '<span class="pill done">Done</span>'
            : key === today && t ? `<button class="btn sm" data-act="start-plan" data-key="${key}">Start</button>` : ''}
        </div>`;
      }).join('')}
    </div>

    <div class="row between small muted" style="margin-top:12px">
      <span>${planned} workout${planned === 1 ? '' : 's'} planned${doneN ? ` · ${doneN} done` : ''}</span>
      <button class="link" data-act="plan-copy">Copy last week</button>
    </div>
  `;
};

function editPlanDay(key) {
  const p = state.plan?.[key] || {};
  planDraft = { key, text: p.text || '', templateId: p.templateId || null };
  const [y, m, dd] = key.split('-').map(Number);
  const d = new Date(y, m - 1, dd);
  const logged = workoutsOn(key);
  openSheet(`
    <h2>${d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</h2>
    <div class="label">Workout</div>
    <div class="chips wrap" id="plan-chips">
      ${state.templates.map(t => `<button class="chip ${planDraft.templateId === t.id ? 'active' : ''}" data-act="plan-pick" data-id="${t.id}">${esc(t.name)}</button>`).join('')}
      <button class="chip ${isRestText(planDraft.text) && !planDraft.templateId ? 'active' : ''}" data-act="plan-rest">Rest day</button>
    </div>
    ${state.templates.length ? '' : '<div class="small muted" style="margin-top:6px">Tip: save templates on the Train tab to pick them here.</div>'}
    <div class="label">Note</div>
    <input id="plan-text" placeholder="e.g. Glutes + hamstrings, 45 min" value="${esc(isRestText(planDraft.text) ? '' : planDraft.text)}" maxlength="80" />
    ${logged.length ? `<div class="label">Logged</div><div class="list">${logged.map(workoutRow).join('')}</div>` : ''}
    <div class="row" style="margin-top:18px">
      <button class="btn danger" data-act="plan-clear">Clear</button>
      <button class="btn" style="flex:1" data-act="plan-save">Save</button>
    </div>
  `, sheet => {
    const input = $('#plan-text', sheet);
    input.addEventListener('input', () => {
      planDraft.text = input.value;
      if (input.value.trim()) $('[data-act="plan-rest"]', sheet)?.classList.remove('active');
    });
    input.addEventListener('keydown', e => { if (e.key === 'Enter') $('[data-act="plan-save"]', sheet).click(); });
  });
}

/* ---------- Exercises ---------- */
let exFilter = 'All', exQuery = '';

views.exercises = () => {
  const groups = ['All', ...allGroups()];
  return `
    <input type="search" id="ex-search" placeholder="Search exercises" value="${esc(exQuery)}" />
    <div class="chips" style="margin-top:12px">
      ${groups.map(g => `<button class="chip ${g === exFilter ? 'active' : ''}" data-act="ex-filter" data-g="${esc(g)}">${esc(g)}</button>`).join('')}
    </div>
    <div class="list" id="ex-list" style="margin-top:12px">${exerciseListHtml()}</div>
    <button class="btn ghost block" style="margin-top:18px" data-act="new-ex">+ New exercise</button>
  `;
};

// Best matches first: exact name, name starts with it, a word starts with it, contains it, muscle group.
function searchRank(e, q) {
  const n = e.name.toLowerCase();
  if (n === q) return 0;
  if (n.startsWith(q)) return 1;
  if (n.split(/[\s-]+/).some(w => w.startsWith(q))) return 2;
  if (n.includes(q)) return 3;
  return 4;
}

function exerciseListHtml(act = 'show-ex') {
  const q = exQuery.trim().toLowerCase();
  const list = state.exercises
    .filter(e => (exFilter === 'All' || exGroups(e).includes(exFilter)) && (!q || e.name.toLowerCase().includes(q) || exGroups(e).some(g => g.toLowerCase().includes(q))))
    .sort((a, b) => (q ? searchRank(a, q) - searchRank(b, q) : 0) || a.name.localeCompare(b.name));
  if (!list.length) return `<div class="empty">Nothing found.</div>`;
  return list.map(e => {
    const h = exerciseHistory(e.id);
    const best = Math.max(0, ...h.map(x => x.best1rm));
    return `<button class="list-item" data-act="${act}" data-id="${esc(e.id)}">
      <div><div class="title">${esc(e.name)}</div><div class="sub">${esc(exGroups(e).join(' · '))}${h.length ? ` · ${h.length} session${h.length > 1 ? 's' : ''}` : ''}</div></div>
      <span class="sub">${best ? `${fmt(best)} ${state.unit}` : ''} <span class="chev">›</span></span>
    </button>`;
  }).join('');
}

afterRender.exercises = () => {
  $('#ex-search')?.addEventListener('input', e => { exQuery = e.target.value; $('#ex-list').innerHTML = exerciseListHtml(); });
};

/* ---------- Progress ---------- */
let progressEx = null;
let progressChart = 'workouts'; // weekly chart: workouts | sets | volume

function muscleSection() {
  const sets = setsPerMuscle(7);
  const groups = allGroups().filter(g => sets[g] > 0).sort((a, b) => sets[b] - sets[a]);
  const lower = ['Glutes', 'Quads', 'Hamstrings', 'Calves', 'Adductors'];
  const rows = groups.map(g => {
    const v = Math.round(sets[g] * 2) / 2;
    const pct = Math.min(100, v / 20 * 100);
    const zone = v >= 20 ? 'high' : v >= 10 ? 'good' : 'low';
    return `<div class="mrow">
      <span class="mname">${esc(g)}${lower.includes(g) ? '' : ''}</span>
      <span class="mbar"><span class="mfill ${zone}" style="width:${pct}%"></span></span>
      <span class="mval">${fmt(v)}</span>
    </div>`;
  }).join('');
  return `<div class="label">Sets per muscle · last 7 days</div>
    <div class="card">
      ${rows || '<div class="muted small">No sets in the last 7 days yet.</div>'}
      <div class="small muted" style="margin-top:10px">A full bar is 20 sets. Around 10–20 sets a week per muscle is a common target for growth. The main muscle of an exercise counts a full set, helper muscles half.</div>
    </div>`;
}

function prSection() {
  const prs = personalRecords();
  const month = prs.filter(p => new Date(p.date) >= daysAgo(30)).length;
  const recent = prs.slice(0, 5);
  return `<div class="label">Personal records</div>
    <div class="card">
      <div class="row between" style="margin-bottom:${recent.length ? 6 : 0}px">
        <span><b class="pr-count">${month}</b> <span class="muted small">in the last 30 days</span></span>
        <span class="muted small">${prs.length} in total</span>
      </div>
      ${recent.length ? `<div class="list">${recent.map(p => `
        <button class="list-item" data-act="show-ex" data-id="${esc(p.exerciseId)}">
          <div style="min-width:0"><div class="title">${esc(exById(p.exerciseId)?.name || 'Exercise')}</div>
            <div class="sub">${p.weighted ? `${fmt(p.w)} ${state.unit} × ${p.r}` : isTimed(exById(p.exerciseId)) ? `${p.r} seconds` : `${p.r} reps`} · ${esc(relDay(p.date))}</div></div>
          <span class="pr-gain">+${p.weighted ? fmt(p.gain) + ' ' + state.unit : fmt(p.gain) + (isTimed(exById(p.exerciseId)) ? ' s' : ' reps')}</span>
        </button>`).join('')}</div>`
        : '<div class="muted small" style="margin-top:6px">Beat your best on any exercise and it shows up here.</div>'}
    </div>`;
}

function improvedSection() {
  const top = mostImproved(3);
  if (!top.length) return '';
  return `<div class="label">Most improved · last 8 weeks</div>
    <div class="card"><div class="list">${top.map(t => `
      <button class="list-item" data-act="show-ex" data-id="${esc(t.ex.id)}">
        <div style="min-width:0"><div class="title">${esc(t.ex.name)}</div>
          <div class="sub">Estimated 1-rep max ${fmt(t.from)} → best ${fmt(t.to)} ${state.unit}</div></div>
        <span class="pr-gain">+${Math.round(t.pct)}%</span>
      </button>`).join('')}</div></div>`;
}

views.progress = () => {
  const ws = state.workouts;
  if (!ws.length) return `${goalsSection()}<div class="empty">Your workout stats will show up here after your first workout.</div>${bodyweightSection()}`;

  const now = new Date();
  const thisWeek = weekStart(now);
  const weeks = [];
  for (let i = 11; i >= 0; i--) { const d = new Date(thisWeek); d.setDate(d.getDate() - i * 7); weeks.push(d); }
  const inWeek = w => { const end = new Date(w); end.setDate(end.getDate() + 7); return ws.filter(x => { const d = new Date(x.date); return d >= w && d < end; }); };
  const weekLabel = w => w.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' });
  const perWeek = weeks.map(w => ({ label: weekLabel(w), v: inWeek(w).length }));
  const setsWeek = weeks.map(w => ({ label: weekLabel(w), v: inWeek(w).reduce((t, x) => t + x.entries.reduce((a, en) => a + en.sets.length, 0), 0) }));
  const volWeek = weeks.map(w => ({ label: weekLabel(w), v: Math.round(inWeek(w).reduce((t, x) => t + workoutVolume(x), 0)) }));
  // Streak = consecutive weeks (ending this or last week) with ≥1 workout
  let streak = 0;
  for (let i = perWeek.length - 1; i >= 0; i--) {
    if (perWeek[i].v) streak++;
    else if (i === perWeek.length - 1) continue; // current week may not have one yet
    else break;
  }
  const cons = consistency();
  const kfmt = v => v >= 10000 ? fmt(v / 1000) + 'k' : fmt(v);
  const chart = { workouts: { bars: perWeek, unit: 'workouts', f: v => v }, sets: { bars: setsWeek, unit: 'sets', f: v => v }, volume: { bars: volWeek, unit: state.unit, f: kfmt } }[progressChart] || { bars: perWeek, unit: 'workouts', f: v => v };
  const firstWorkout = Math.min(...ws.map(w => +new Date(w.date)));
  const activeWeeks = Math.max(1, weeks.filter(w => +w + 7 * DAY > firstWorkout).length);
  const avg12 = chart.bars.slice(-activeWeeks).reduce((t, b) => t + b.v, 0) / activeWeeks;

  const logged = state.exercises.filter(e => exerciseHistory(e.id).length);
  if (!progressEx || !logged.some(e => e.id === progressEx)) {
    // default: most frequently logged
    progressEx = logged.map(e => [e.id, exerciseHistory(e.id).length]).sort((a, b) => b[1] - a[1])[0]?.[0];
  }
  const hist = progressEx ? exerciseHistory(progressEx) : [];
  const best = hist.reduce((b, h) => h.best1rm > b.best1rm ? h : b, { best1rm: 0 });
  const first = hist[0], last = hist[hist.length - 1];
  const change = first && last && first !== last ? last.best1rm - first.best1rm : 0;

  const sorted = [...ws].sort((a, b) => new Date(b.date) - new Date(a.date));

  return `
    ${goalsSection()}
    ${(c => `<div class="stats">
      <div class="stat"><div class="v">${c.week}</div><div class="k">This week</div></div>
      <div class="stat"><div class="v">${c.month}</div><div class="k">This month</div></div>
      <div class="stat"><div class="v">${c.year}</div><div class="k">This year</div></div>
      <div class="stat"><div class="v">${streak}</div><div class="k">Week streak</div></div>
      <div class="stat"><div class="v">${fmt(cons.perWeek)}</div><div class="k">Per week · last 8 wks</div></div>
      <div class="stat"><div class="v">${cons.avgMin != null ? cons.avgMin + '<small> min</small>' : '–'}</div><div class="k">Average workout</div></div>
    </div>
    <div class="small muted stats-foot">${c.total} workout${c.total === 1 ? '' : 's'} in total · last one ${cons.daysSince === 0 ? 'today' : cons.daysSince === 1 ? 'yesterday' : cons.daysSince + ' days ago'}</div>`)(workoutCounts(now))}

    <div class="label">Every week</div>
    <div class="seg" style="display:flex">
      ${[['workouts', 'Workouts'], ['sets', 'Sets'], ['volume', 'Weight lifted']].map(([k, l]) => `<button style="flex:1" class="${progressChart === k ? 'active' : ''}" data-act="progress-chart" data-v="${k}">${l}</button>`).join('')}
    </div>
    <div class="card" style="margin-top:10px">
      <div class="row between small" style="margin-bottom:6px">
        <span class="muted">This week: <b class="ink">${chart.f(chart.bars[chart.bars.length - 1].v)}</b> ${chart.unit}</span>
        <span class="muted">${activeWeeks < 12 ? `${activeWeeks}-week` : '12-week'} average: ${chart.f(Math.round(avg12 * 10) / 10)}</span>
      </div>
      ${barChart(chart.bars, { label: `${chart.unit} per week`, format: v => `${chart.f(v)} ${chart.unit}` })}
    </div>

    ${muscleSection()}
    ${prSection()}
    ${improvedSection()}

    <div class="label">Strength trend</div>
    <select id="progress-ex">
      ${logged.sort((a, b) => a.name.localeCompare(b.name)).map(e => `<option value="${esc(e.id)}" ${e.id === progressEx ? 'selected' : ''}>${esc(e.name)}</option>`).join('')}
    </select>
    <div class="card" style="margin-top:10px">
      <div class="row between small" style="margin-bottom:8px">
        <span class="muted">Estimated 1-rep max</span>
        ${change ? `<span>${change > 0 ? '+' : ''}${fmt(change)} ${state.unit}</span>` : ''}
      </div>
      ${lineChart(hist.map(h => ({ y: h.best1rm, label: fmtDate(h.date, { month: 'numeric', day: 'numeric' }) })), { unit: state.unit })}
      ${best.best1rm ? `<div class="small muted" style="margin-top:8px">Best set: ${fmt(best.topW)} ${state.unit} × ${best.topR} · ${fmtDate(best.date)}</div>` : ''}
    </div>

    ${bodyweightSection()}

    <div class="label">History</div>
    <div class="list">${sorted.map(workoutRow).join('')}</div>
  `;
};

afterRender.progress = () => {
  $('#progress-ex')?.addEventListener('change', e => { progressEx = e.target.value; render(); });
};

/* ---------- Notes ---------- */
views.notes = () => {
  const workoutNotes = state.workouts.filter(w => w.note?.trim()).map(w => ({ id: w.id, date: w.date, text: w.note, workout: w }));
  const exNotes = state.exercises.filter(e => e.note?.trim());
  const all = [...state.notes.map(n => ({ ...n, kind: 'note' })), ...workoutNotes.map(n => ({ ...n, kind: 'workout' }))]
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  return `
    <textarea id="note-input" placeholder="Write a note — goals, how you feel, ideas for next session…"></textarea>
    <div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn sm" data-act="add-note">Save note</button></div>

    ${exNotes.length ? `<div class="label">Exercise notes</div><div class="list">
      ${exNotes.map(e => `<button class="list-item" data-act="show-ex" data-id="${esc(e.id)}">
        <div><div class="title">${esc(e.name)}</div><div class="sub">${esc(e.note.slice(0, 80))}${e.note.length > 80 ? '…' : ''}</div></div><span class="chev">›</span></button>`).join('')}
    </div>` : ''}

    <div class="label">Journal</div>
    ${all.length ? all.map(n => `
      <div class="note">
        <div class="meta">
          <span>${fmtDate(n.date, { weekday: 'short', month: 'short', day: 'numeric' })}${n.kind === 'workout' ? ` · <span class="tag">${esc(n.workout.title || 'Workout')}</span>` : ''}</span>
          ${n.kind === 'note' ? `<button class="link" data-act="del-note" data-id="${n.id}">Delete</button>`
            : `<button class="link" data-act="open-workout" data-id="${n.id}">View</button>`}
        </div>
        <div class="body">${esc(n.text)}</div>
      </div>`).join('') : `<div class="empty">No notes yet.</div>`}
  `;
};

/* ---------- Bottom sheet ---------- */
let sheetCloseTimer = null;
let sheetKind = null; // what the open sheet is, e.g. 'template'

function openSheet(html, after) {
  const sheet = $('#sheet');
  clearTimeout(sheetCloseTimer);
  sheet.classList.remove('closing');
  sheet.style.transform = ''; $('#backdrop').style.opacity = '';
  sheet.innerHTML = `<button class="sheet-handle" data-act="close-sheet" aria-label="Close"></button>${html}`;
  sheet.hidden = false; $('#backdrop').hidden = false;
  document.body.style.overflow = 'hidden';
  sheet.scrollTop = 0;
  sheetKind = null;
  after?.(sheet);
}
function closeSheet() {
  const sheet = $('#sheet');
  if (sheet.hidden) return;
  document.body.style.overflow = '';
  if (sheetKind === 'template' && draftUnsaved()) {
    toast('Template kept. Tap Continue to finish it.', 2600);
    if (tab === 'train') setTimeout(render, 230);
  }
  sheetKind = null;
  // Slide down, then hide.
  sheet.classList.add('closing');
  sheet.style.transform = 'translateY(100%)';
  $('#backdrop').style.opacity = '0';
  clearTimeout(sheetCloseTimer);
  sheetCloseTimer = setTimeout(() => {
    sheet.hidden = true; $('#backdrop').hidden = true;
    sheet.classList.remove('closing');
    sheet.style.transform = ''; $('#backdrop').style.opacity = '';
  }, 220);
}
$('#backdrop').addEventListener('click', closeSheet);

/* Drag the sheet down to close it.
   Works from anywhere in the sheet when it is scrolled to the top, so normal
   scrolling inside a long sheet still works. */
(function sheetDrag() {
  const sheet = $('#sheet'), backdrop = $('#backdrop');
  let startY = 0, lastY = 0, lastT = 0, velocity = 0, dragging = false, armed = false;

  const begin = (y, target) => {
    // Don't hijack drags that start in text fields (text selection / their own scrolling).
    // On a long, scrollable sheet only the top strip (grab bar and title) closes it,
    // so scrolling a list can't close it by accident. Short sheets drag from anywhere.
    const top = sheet.getBoundingClientRect().top;
    const scrollable = sheet.scrollHeight > sheet.clientHeight + 4;
    const inTopStrip = y - top < 76 || !!target.closest('.sheet-handle');
    armed = sheet.scrollTop <= 0 && !target.closest('input, textarea, select') && (!scrollable || inTopStrip);
    dragging = false; startY = lastY = y; lastT = performance.now(); velocity = 0;
  };
  const move = (y, e) => {
    // A short sheet has nothing to scroll: stop the page behind it from scrolling (iOS).
    if (sheet.scrollHeight <= sheet.clientHeight && e.cancelable && !e.target.closest('textarea')) e.preventDefault();
    if (!armed) return;
    const dy = y - startY;
    if (!dragging) {
      if (dy > 6 && sheet.scrollTop <= 0) { dragging = true; sheet.classList.add('dragging'); }
      else if (dy < -6) { armed = false; return; } // scrolling up: let the sheet scroll
      else return;
    }
    if (e.cancelable) e.preventDefault();
    const now = performance.now();
    velocity = (y - lastY) / Math.max(1, now - lastT); lastY = y; lastT = now;
    const offset = Math.max(0, dy);
    sheet.style.transform = `translateY(${offset}px)`;
    backdrop.style.opacity = String(Math.max(0, 1 - offset / (sheet.offsetHeight || 1)));
  };
  const end = () => {
    if (!dragging) { armed = false; return; }
    dragging = armed = false;
    sheet.classList.remove('dragging');
    // Swallow the click that follows a drag on the handle.
    sheet.dataset.dragged = '1'; setTimeout(() => delete sheet.dataset.dragged, 60);
    const offset = lastY - startY;
    if (offset > Math.min(120, sheet.offsetHeight * 0.25) || velocity > 0.5) closeSheet();
    else { sheet.style.transform = ''; backdrop.style.opacity = ''; }
  };

  backdrop.addEventListener('touchmove', e => e.preventDefault(), { passive: false });

  // Touch (phones)
  sheet.addEventListener('touchstart', e => begin(e.touches[0].clientY, e.target), { passive: true });
  sheet.addEventListener('touchmove', e => move(e.touches[0].clientY, e), { passive: false });
  sheet.addEventListener('touchend', end);
  sheet.addEventListener('touchcancel', end);

  // Mouse (desktop): drag from the handle bar
  sheet.addEventListener('mousedown', e => {
    if (!e.target.closest('.sheet-handle')) return;
    e.preventDefault(); begin(e.clientY, e.target);
    const mm = ev => move(ev.clientY, ev);
    const mu = () => { window.removeEventListener('mousemove', mm); window.removeEventListener('mouseup', mu); end(); };
    window.addEventListener('mousemove', mm); window.addEventListener('mouseup', mu);
  });
})();

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });

function showExercise(id) {
  const ex = exById(id); if (!ex) return;
  const hist = exerciseHistory(id);
  const best = hist.reduce((b, h) => h.best1rm > b.best1rm ? h : b, { best1rm: 0 });
  openSheet(`
    <div class="row between">
      <div><h2>${esc(ex.name)}</h2><div class="muted small">${esc(exGroups(ex).join(' · '))}</div></div>
      <button class="link" data-act="edit-ex" data-id="${esc(id)}">Edit</button>
    </div>

    ${hist.length ? `
      <div class="stats" style="margin-top:16px">
        <div class="stat"><div class="v">${fmt(best.best1rm)}</div><div class="k">Est. 1RM (${state.unit})</div></div>
        <div class="stat"><div class="v">${fmt(best.topW)}×${best.topR}</div><div class="k">Best set</div></div>
      </div>
      <div class="card" style="margin-top:10px">${lineChart(hist.map(h => ({ y: h.best1rm, label: fmtDate(h.date, { month: 'numeric', day: 'numeric' }) })), { height: 140, unit: state.unit })}</div>
    ` : ''}

    ${(sg => sg ? `<div class="suggest" style="margin-top:12px"><div class="suggest-text"><span class="suggest-label">Next time</span> ${esc(suggestText(sg))}${sg.count > 1 ? ` · ${sg.count} sets` : ''} <span class="suggest-tag ${sg.kind}">${esc(sg.label)}</span></div></div>` : '')(suggestNext(id))}
    <div class="label">Form tips</div>
    ${ex.tips.length ? `<ol class="tips">${ex.tips.map(t => `<li>${esc(t)}</li>`).join('')}</ol>` : `<div class="muted small">No tips yet — add some with Edit.</div>`}

    <div class="label">My notes</div>
    <textarea id="ex-note" placeholder="Cues that work for you, seat settings, grip width…">${esc(ex.note)}</textarea>

    ${hist.length ? `<div class="label">Recent sessions</div><div class="list">
      ${[...hist].reverse().slice(0, 8).map(h => `<div class="list-item"><span>${fmtDate(h.date)}</span><span class="sub">${h.sets.map(s => `${fmt(num(s.w))}×${num(s.r)}`).join('  ')}</span></div>`).join('')}
    </div>` : ''}

    ${state.active && !state.active.entries.some(e => e.exerciseId === id)
      ? `<button class="btn block" style="margin-top:20px" data-act="pick-ex" data-id="${esc(id)}">Add to current workout</button>` : ''}
  `, sheet => {
    $('#ex-note', sheet).addEventListener('input', e => { ex.note = e.target.value; save(); });
  });
}

function editExercise(id) {
  const ex = id ? exById(id) : { name: '', groups: [], tips: [], custom: true };
  const chosen = id ? exGroups(ex) : [];
  const groups = [...new Set([...MUSCLE_GROUPS, ...allGroups()])];
  openSheet(`
    <h2>${id ? 'Edit exercise' : 'New exercise'}</h2>
    <div class="stack" style="margin-top:16px">
      <input id="f-name" placeholder="Name" value="${esc(ex.name)}" />
      <div class="label" style="margin-top:18px">Muscle groups · tap all that it trains</div>
      <div class="chips wrap" id="f-groups">
        ${groups.map(g => `<button class="chip ${chosen.includes(g) ? 'active' : ''}" data-act="toggle-group" data-g="${esc(g)}">${esc(g)}</button>`).join('')}
      </div>
      <input id="f-group-new" placeholder="Another group? Type it here" />
      <div class="label" style="margin-top:18px">Form tips · one per line</div>
      <textarea id="f-tips" rows="6" placeholder="Brace your core&#10;Keep elbows tucked">${esc(ex.tips.join('\n'))}</textarea>
    </div>
    <button class="btn block" style="margin-top:18px" data-act="save-ex" data-id="${esc(id || '')}">Save</button>
    ${id && ex.custom ? `<button class="btn danger block" style="margin-top:6px" data-act="delete-ex" data-id="${esc(id)}">Delete exercise</button>` : ''}
  `, sheet => $('#f-name', sheet).focus());
}

// act: 'pick-ex' adds to the active workout, 't-pick' adds to the template being edited.
function pickExercise(act = 'pick-ex') {
  exQuery = ''; exFilter = 'All';
  openSheet(`
    <h2>Add exercise</h2>
    <input type="search" id="pick-search" placeholder="Search" style="margin-top:14px" />
    <div class="list" id="pick-list" style="margin-top:10px">${exerciseListHtml(act)}</div>
    ${act === 'pick-ex' ? `<button class="btn ghost block" style="margin-top:14px" data-act="new-ex">+ Create new exercise</button>`
      : `<button class="btn ghost block" style="margin-top:14px" data-act="t-back">Back</button>`}
  `, sheet => {
    if (act === 't-pick') sheetKind = 'template';
    const s = $('#pick-search', sheet);
    s.addEventListener('input', () => { exQuery = s.value; $('#pick-list').innerHTML = exerciseListHtml(act); });
  });
}

function openWorkout(id) {
  const w = state.workouts.find(x => x.id === id); if (!w) return;
  openSheet(`
    <h2>${esc(w.title || 'Workout')}</h2>
    <div class="muted small">${fmtDate(w.date, { weekday: 'long', month: 'long', day: 'numeric' })} · ${fmt(workoutVolume(w))} ${state.unit}</div>
    <div class="row between small" style="margin-top:4px">
      <span>${clock(w.date)}${w.duration ? `–${clock(+new Date(w.date) + w.duration)} · <b>${fmtDuration(w.duration)}</b>` : ''}${w.stretch ? ` · stretched ${fmtDuration(w.stretch)}` : ''}</span>
      <button class="link" data-act="edit-wtime" data-id="${w.id}">Edit time</button>
    </div>
    ${w.entries.map(en => `
      <div class="label">${esc(exById(en.exerciseId)?.name || 'Unknown')}</div>
      <div class="small">${en.sets.map((s, i) => `<div class="row between" style="padding:4px 0"><span class="muted">Set ${i + 1}</span><span>${fmt(s.w)} ${state.unit} × ${s.r}</span></div>`).join('')}</div>
    `).join('')}
    <div class="label">Notes</div>
    <textarea id="w-note" placeholder="Add a note to this workout">${esc(w.note)}</textarea>
    <div class="row" style="margin-top:18px">
      <button class="btn danger" data-act="delete-workout" data-id="${w.id}">Delete</button>
      <button class="btn ghost" style="flex:1" data-act="repeat" data-id="${w.id}">Do this again</button>
    </div>
    <button class="link" style="margin-top:14px" data-act="save-template" data-id="${w.id}">Save as template</button>
  `, sheet => {
    $('#w-note', sheet).addEventListener('input', e => { w.note = e.target.value; save(); });
  });
}

function openSettings() {
  openSheet(`
    <h2>Settings</h2>
    <div class="label">Rest timer</div>
    <div class="seg">${[60, 90, 120, 180].map(s => `<button class="${state.restSeconds === s ? 'active' : ''}" data-act="rest-len" data-v="${s}">${fmtClock(s)}</button>`).join('')}</div>
    <label class="row small" style="margin-top:12px;cursor:pointer">
      <input type="checkbox" id="auto-rest" ${state.autoRest ? 'checked' : ''} style="width:auto;margin:0" />
      Start automatically after logging a set
    </label>
    <div class="label">Rep range for suggestions</div>
    <div class="row" style="gap:8px">
      <input id="rep-lo" inputmode="numeric" value="${repRange()[0]}" style="width:72px;text-align:center" aria-label="Lowest reps" />
      <span class="muted">to</span>
      <input id="rep-hi" inputmode="numeric" value="${repRange()[1]}" style="width:72px;text-align:center" aria-label="Highest reps" />
      <span class="muted small">reps</span>
    </div>
    <div class="small muted" style="margin-top:6px">Add a rep each time. When every set reaches the top, the app suggests more weight. It's only a suggestion; log whatever you actually do.</div>
    <div class="label">Motivation</div>
    <label class="row small" style="cursor:pointer">
      <input type="checkbox" id="motivation" ${state.motivation ? 'checked' : ''} style="width:auto;margin:0" />
      Show motivational messages
    </label>
    <div class="label">Appearance</div>
    <div class="theme-grid">${THEMES.map(t => `<button class="theme-opt ${state.theme === t.id ? 'active' : ''}" data-act="theme" data-v="${t.id}" aria-pressed="${state.theme === t.id}">
      <span class="swatch" style="background:${t.bg};--sw-accent:${t.accent}"></span>${t.name}</button>`).join('')}</div>
    ${(rc => rc && (rc.workouts > state.workouts.length || rc.templates > state.templates.length || rc.notes > state.notes.length) ? `
      <div class="card recover-card">
        <div style="font-weight:600">A saved copy of your data was found</div>
        <div class="small muted" style="margin:4px 0 10px">${rc.workouts} workout${rc.workouts === 1 ? '' : 's'} · ${rc.templates} template${rc.templates === 1 ? '' : 's'} · ${rc.notes} note${rc.notes === 1 ? '' : 's'}</div>
        <button class="btn sm" data-act="recover-data">Restore it</button>
      </div>` : '')(recoverableCopy())}
    <div class="label">Your data</div>
    <p class="small muted" style="margin-top:0">Everything is stored on this device. Export a backup now and then.</p>
    <div class="row">
      <button class="btn ghost" style="flex:1" data-act="export">Export backup</button>
      <label class="btn ghost" style="flex:1">Import<input type="file" id="import-file" accept="application/json" hidden /></label>
    </div>
  `, sheet => {
    $('#auto-rest', sheet).addEventListener('change', e => { state.autoRest = e.target.checked; save(); });
    $('#motivation', sheet).addEventListener('change', e => { state.motivation = e.target.checked; save(); });
    const saveRange = () => {
      const lo = parseInt($('#rep-lo', sheet).value, 10), hi = parseInt($('#rep-hi', sheet).value, 10);
      if (lo >= 1 && hi > lo && hi <= 50) { state.repRange = [lo, hi]; save(); if (tab === 'train') render(); }
      else { toast('Use a range like 8 to 13'); $('#rep-lo', sheet).value = repRange()[0]; $('#rep-hi', sheet).value = repRange()[1]; }
    };
    $('#rep-lo', sheet).addEventListener('change', saveRange);
    $('#rep-hi', sheet).addEventListener('change', saveRange);
    $('#import-file', sheet).addEventListener('change', e => {
      const file = e.target.files[0]; e.target.value = ''; // lets you pick the same file again
      if (file) importBackup(file);
    });
  });
}

// Themes in the picker: background and accent colors for the swatches.
const THEMES = [
  { id: 'auto', name: 'Auto', bg: 'linear-gradient(135deg, #fafaf9 50%, #111111 50%)', accent: '#8a8a85' },
  { id: 'light', name: 'Light', bg: '#fafaf9', accent: '#1c1c1c' },
  { id: 'dark', name: 'Dark', bg: '#111111', accent: '#ececea' },
  { id: 'pink', name: 'Pink', bg: '#ffedf4', accent: '#f07fa8' },
  { id: 'green', name: 'Green', bg: '#f1f8f3', accent: '#2c7a52' },
  { id: 'sunset', name: 'Sunset', bg: '#fff4ec', accent: '#c94e33' },
  { id: 'plum', name: 'Plum', bg: '#171021', accent: '#c9a6ff' },
  { id: 'crimson', name: 'Crimson', bg: '#150a0c', accent: '#e8475f' },
];

function applyTheme() {
  if (state.theme === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.dataset.theme = state.theme;
  // Match the phone's status bar to the theme background.
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
  document.querySelectorAll('meta[name="theme-color"]').forEach(m => {
    m.dataset.orig ??= m.getAttribute('content');
    m.setAttribute('content', state.theme === 'auto' ? m.dataset.orig : bg);
  });
}

/* ---------- Global event handling ---------- */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const { act, id } = el.dataset;
  const a = state.active;
  switch (act) {
    case 'close-sheet': if (!$('#sheet').dataset.dragged) closeSheet(); break;
    case 'start': startWorkout(); break;
    case 'edit-goals': editGoals(); break;
    case 'progress-chart': progressChart = el.dataset.v; render(); break;
    case 'save-goals': {
      const read = sel => { const v = $(sel).value.trim(); if (!v) return null; const n = parseInt(v, 10); return n > 0 && n < 10000 ? n : NaN; };
      const month = read('#goal-month'), year = read('#goal-year');
      if (Number.isNaN(month) || Number.isNaN(year)) { toast('Use whole numbers, like 12'); break; }
      state.goals = { month, year }; save(); closeSheet(); render();
      toast(month || year ? 'Goals saved' : 'Goals cleared');
      break;
    }
    // Week planner
    case 'plan-week': planWeekOffset = Math.max(-8, Math.min(12, planWeekOffset + +el.dataset.v)); render(); break;
    case 'plan-week-set': planWeekOffset = +el.dataset.v; render(); break;
    case 'plan-day': editPlanDay(el.dataset.key); break;
    case 'plan-pick': {
      planDraft.templateId = planDraft.templateId === id ? null : id;
      if (isRestText(planDraft.text)) planDraft.text = '';
      document.querySelectorAll('#plan-chips .chip').forEach(c => c.classList.toggle('active', c.dataset.id === planDraft.templateId && !!planDraft.templateId));
      break;
    }
    case 'plan-rest': {
      const on = !el.classList.contains('active');
      planDraft.templateId = null;
      planDraft.text = on ? 'Rest' : '';
      $('#plan-text').value = '';
      document.querySelectorAll('#plan-chips .chip').forEach(c => c.classList.toggle('active', on && c === el));
      break;
    }
    case 'plan-save': {
      const { key, templateId } = planDraft;
      const text = isRestText(planDraft.text) ? 'Rest' : planDraft.text.trim();
      state.plan ||= {};
      if (!text && !templateId) delete state.plan[key]; else state.plan[key] = { text, templateId };
      save(); closeSheet(); render();
      break;
    }
    case 'plan-clear': delete state.plan?.[planDraft.key]; save(); closeSheet(); render(); break;
    case 'plan-copy': {
      const start = weekStart(new Date()); start.setDate(start.getDate() + planWeekOffset * 7);
      let n = 0;
      for (let i = 0; i < 7; i++) {
        const d = new Date(start); d.setDate(d.getDate() + i);
        const prev = new Date(d); prev.setDate(prev.getDate() - 7);
        const src = state.plan?.[todayKey(prev)], key = todayKey(d);
        if (src && !state.plan[key]) { state.plan[key] = { ...src }; n++; }
      }
      save(); render();
      toast(n ? `Copied ${n} day${n === 1 ? '' : 's'} from last week` : 'Nothing new to copy');
      break;
    }
    case 'start-plan': {
      const t = templateById(state.plan?.[el.dataset.key]?.templateId);
      if (!t) break;
      if (state.active) { toast('Finish or discard your current workout first'); go('train'); break; }
      startFromTemplate(t); if (tab !== 'train') go('train');
      break;
    }
    case 'repeat': {
      const src = id ? state.workouts.find(w => w.id === id)
        : [...state.workouts].sort((x, y) => new Date(y.date) - new Date(x.date))[0];
      const go2 = () => {
        closeSheet(); tab = 'train'; go('train');
        startWorkout(src.entries.map(en => ({ exerciseId: en.exerciseId, sets: en.sets.map(s => ({ w: s.w, r: '' })) })));
        state.active.title = src.title; if (src.templateId) state.active.templateId = src.templateId; save(); render();
      };
      if (state.active) askConfirm({ title: 'Replace your current workout?', body: 'You have a workout in progress. Starting this one discards it.', confirmLabel: 'Replace', danger: true }).then(ok => ok && go2());
      else go2();
      break;
    }
    case 'add-exercise': pickExercise(); break;
    case 'apply-suggest': {
      const en = a.entries[+el.dataset.i];
      const sg = suggestNext(en.exerciseId); if (!sg) break;
      while (en.sets.length < sg.count) en.sets.push({ w: '', r: '' });
      en.sets.forEach(x => { if (num(x.r) === 0) x.w = sg.w > 0 ? String(sg.w) : x.w; });
      save(); render();
      break;
    }
    case 'pick-ex':
      if (!a) break;
      a.entries.push({ exerciseId: id, sets: [{ w: '', r: '' }] });
      save(); closeSheet(); if (tab !== 'train') go('train'); else render();
      setTimeout(() => document.querySelector(`[data-entry="${a.entries.length - 1}"] input`)?.focus(), 50);
      break;
    case 'add-set': {
      const en = a.entries[+el.dataset.i];
      const prev = en.sets[en.sets.length - 1];
      en.sets.push({ w: prev?.w ?? '', r: '' }); save(); render();
      setTimeout(() => document.querySelector(`[data-set="${el.dataset.i}:${en.sets.length - 1}:r"]`)?.focus(), 30);
      break;
    }
    case 'remove-set': a.entries[+el.dataset.i].sets.splice(+el.dataset.j, 1); save(); render(); break;
    case 'move-entry': {
      const i = +el.dataset.i, j = i + +el.dataset.v;
      if (j < 0 || j >= a.entries.length) break;
      a.entries.forEach(en => { en.key ||= uid(); });
      [a.entries[i], a.entries[j]] = [a.entries[j], a.entries[i]];
      save(); render();
      const card = document.querySelector(`[data-entry="${j}"]`);
      if (card) { card.classList.add('moved'); card.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
      break;
    }
    case 'remove-entry': a.entries.splice(+el.dataset.i, 1); save(); render(); break;
    case 'discard':
      askConfirm({ title: 'Discard this workout?', body: 'The sets you logged in it won’t be saved.', confirmLabel: 'Discard', danger: true })
        .then(ok => { if (ok && state.active) { stopStretch({ keep: false }); state.active = null; state.restEnd = null; renderRest(); save(); render(); } });
      break;
    case 'finish': finishWorkout(); break;
    case 'show-ex': showExercise(id); break;
    case 'edit-ex': editExercise(id); break;
    case 'new-ex': editExercise(null); break;
    case 'save-ex': {
      const name = $('#f-name').value.trim();
      if (!name) { toast('Give it a name'); break; }
      const active = [...document.querySelectorAll('#f-groups .chip.active')].map(c => c.dataset.g);
      // keep the existing order (main group first), then add newly ticked ones
      const before = id ? exGroups(exById(id)) : [];
      const picked = [...before.filter(g => active.includes(g)), ...active.filter(g => !before.includes(g))];
      const typed = $('#f-group-new').value.split(',').map(g => g.trim()).filter(Boolean)
        .map(g => g[0].toUpperCase() + g.slice(1));
      const groups = [...new Set([...picked, ...typed])];
      if (!groups.length) groups.push('Other');
      const tips = $('#f-tips').value.split('\n').map(s => s.trim()).filter(Boolean);
      if (id) { const ex = exById(id); Object.assign(ex, { name, groups, tips }); delete ex.group; }
      else state.exercises.push({ id: uid(), name, groups, tips, note: '', custom: true });
      save(); closeSheet(); render(); toast('Saved');
      break;
    }
    case 'delete-ex':
      if (state.workouts.some(w => w.entries.some(en => en.exerciseId === id))) { toast('It’s used in past workouts — can’t delete'); break; }
      askConfirm({ title: 'Delete this exercise?', confirmLabel: 'Delete', danger: true })
        .then(ok => { if (ok) { state.exercises = state.exercises.filter(x => x.id !== id); save(); closeSheet(); render(); } });
      break;
    case 'ex-filter': exFilter = el.dataset.g; render(); break;
    case 'toggle-group': el.classList.toggle('active'); break;
    case 'open-workout': openWorkout(id); break;
    case 'delete-workout':
      askConfirm({ title: 'Delete this workout?', body: 'It’s removed from your history and stats for good.', confirmLabel: 'Delete', danger: true })
        .then(ok => { if (ok) { state.workouts = state.workouts.filter(w => w.id !== id); save(); closeSheet(); render(); } });
      break;
    case 'add-note': {
      const t = $('#note-input').value.trim(); if (!t) break;
      state.notes.push({ id: uid(), date: new Date().toISOString(), text: t }); save(); render();
      break;
    }
    case 'del-note':
      askConfirm({ title: 'Delete this note?', confirmLabel: 'Delete', danger: true })
        .then(ok => { if (ok) { state.notes = state.notes.filter(n => n.id !== id); save(); render(); } });
      break;
    case 'theme':
      state.theme = el.dataset.v; save(); applyTheme();
      document.querySelectorAll('.theme-opt').forEach(b => { const on = b.dataset.v === state.theme; b.classList.toggle('active', on); b.setAttribute('aria-pressed', on); });
      break;
    // Rest timer
    case 'rest-start': startRest(); break;
    case 'stretch-start': startStretch(); break;
    case 'stretch-stop': stopStretch(); break;
    case 'rest-stop': stopRest(); break;
    case 'rest-adj': adjustRest(+el.dataset.v); break;
    case 'rest-len': state.restSeconds = +el.dataset.v; save(); openSettings(); if (tab === 'train') render(); break;
    // Templates
    case 'new-template': {
      const d = state.templateDraft;
      if (draftUnsaved() && !state.templates.some(t => t.id === d.id)) { editTemplate(d); toast('Picking up where you left off'); }
      else editTemplate({ id: uid(), name: '', entries: [] });
      break;
    }
    case 'draft-continue': if (state.templateDraft) editTemplate(state.templateDraft); break;
    case 'draft-discard': setDraft(null); render(); toast('Draft discarded'); break;
    case 'edit-template': {
      const t = state.templates.find(x => x.id === id);
      if (state.templateDraft?.id === id && draftUnsaved()) { editTemplate(state.templateDraft); toast('Your unsaved changes are back'); }
      else if (t) editTemplate(JSON.parse(JSON.stringify(t)));
      break;
    }
    case 'start-template': {
      const t = state.templates.find(x => x.id === id); if (!t) break;
      if (state.active) askConfirm({ title: 'Replace your current workout?', body: 'You have a workout in progress. Starting this one discards it.', confirmLabel: 'Replace', danger: true }).then(ok => ok && startFromTemplate(t));
      else startFromTemplate(t);
      break;
    }
    case 'save-template': {
      const src = id ? state.workouts.find(w => w.id === id) : state.active;
      if (!src) break;
      editTemplate(templateFromWorkout(src));
      break;
    }
    case 't-sets': {
      const en = templateDraft.entries[+el.dataset.i];
      en.sets = Math.min(20, Math.max(1, en.sets + +el.dataset.v)); editTemplate(templateDraft, { keepScroll: true });
      break;
    }
    case 't-remove': templateDraft.entries.splice(+el.dataset.i, 1); editTemplate(templateDraft, { keepScroll: true }); break;
    case 't-move': {
      const i = +el.dataset.i, j = i + +el.dataset.v, list = templateDraft.entries;
      if (j < 0 || j >= list.length) break;
      [list[i], list[j]] = [list[j], list[i]];
      editTemplate(templateDraft, { keepScroll: true, moved: j });
      break;
    }
    case 't-add': pickExercise('t-pick'); break;
    case 't-pick': templateDraft.entries.push({ exerciseId: id, sets: 3 }); editTemplate(templateDraft); break;
    case 't-back': editTemplate(templateDraft); break;
    case 't-save': {
      const t = templateDraft;
      t.name = t.name.trim();
      if (!t.name) { toast('Give it a name'); break; }
      if (!t.entries.length) { toast('Add at least one exercise'); break; }
      const i = state.templates.findIndex(x => x.id === t.id);
      if (i >= 0) state.templates[i] = t; else state.templates.push(t);
      setDraft(null); closeSheet(); render(); toast('Template saved');
      break;
    }
    case 't-delete': {
      const doomed = templateDraft?.id;
      askConfirm({ title: 'Delete this template?', body: 'Your past workouts stay in your history.', confirmLabel: 'Delete', danger: true })
        .then(ok => { if (ok) { state.templates = state.templates.filter(x => x.id !== doomed); setDraft(null); closeSheet(); render(); } });
      break;
    }
    // Body weight
    case 'bw-log': if (logBodyweight($('#bw-input').value)) { render(); toast('Weight logged'); } break;
    case 'bw-history': showBodyweightHistory(); break;
    case 'bw-del':
      state.bodyweight = state.bodyweight.filter(b => b.id !== id); save(); showBodyweightHistory(); render();
      break;
    case 'recover-data': {
      const rc = recoverableCopy(); if (!rc) break;
      try {
        localStorage.setItem(STORE_KEY + '.replaced', JSON.stringify(state)); // keep what we had, just in case
        localStorage.setItem(STORE_KEY, rc.raw);
        state = load();
        const ok = state.workouts.length >= rc.workouts && state.templates.length >= rc.templates;
        save(); applyTheme(); closeSheet(); render();
        toast(ok ? 'Your data is back' : 'Only part of the copy could be restored');
      } catch { toast('Could not restore the copy'); }
      break;
    }
    case 'export': exportBackup(); break;
    case 'edit-start': {
      if (!a) break;
      let val = timeValue(a.date);
      const p = askConfirm({ title: 'When did you start?', body: 'Set this if you began training before you tapped Start.', confirmLabel: 'Save',
        html: `<input type="time" id="start-time" class="time-input" value="${val}" />` });
      $('#start-time').addEventListener('input', e => { val = e.target.value; });
      p.then(ok => {
        if (!ok || !state.active) return;
        const d = atTime(state.active.date, val);
        if (!d) { toast('Pick a time, like 18:05'); return; }
        if (d > new Date()) { toast('The start can’t be later than now'); return; }
        state.active.date = d.toISOString(); save(); render();
        toast(`Start set to ${clock(d)}`);
      });
      break;
    }
    case 'edit-wtime': {
      const w = state.workouts.find(x => x.id === id); if (!w) break;
      let sv = timeValue(w.date), fv = w.duration ? timeValue(+new Date(w.date) + w.duration) : '';
      const p = askConfirm({ title: 'Workout time', confirmLabel: 'Save',
        html: `<div class="time-pair">
            <label><span>Started</span><input type="time" id="w-start" class="time-input" value="${sv}" /></label>
            <label><span>Finished</span><input type="time" id="w-end" class="time-input" value="${fv}" /></label>
          </div>` });
      $('#w-start').addEventListener('input', e => { sv = e.target.value; });
      $('#w-end').addEventListener('input', e => { fv = e.target.value; });
      p.then(ok => {
        if (!ok) return;
        const start = atTime(w.date, sv), end = atTime(w.date, fv);
        if (!start || !end) { toast('Pick both times, like 18:05 and 19:15'); return; }
        if (end <= start) end.setDate(end.getDate() + 1); // finished after midnight
        const ms = end - start;
        if (ms > 6 * 3600e3) { toast('That’s over 6 hours. Check the times'); return; }
        w.date = start.toISOString(); w.duration = ms; save();
        openWorkout(w.id); render();
        toast(`Saved · ${fmtDuration(ms)}`);
      });
      break;
    }
  }
});

// Live inputs in the active workout (no re-render, keeps focus)
document.addEventListener('input', e => {
  const a = state.active; if (!a) return;
  const t = e.target;
  if (t.dataset.set) {
    const [i, j, k] = t.dataset.set.split(':');
    a.entries[+i].sets[+j][k] = t.value; save();
  } else if (t.dataset.field && tab === 'train') {
    a[t.dataset.field] = t.value; save();
  }
});

// Once a set's reps are filled in (fires when the field loses focus):
// cheer on milestones and auto-start the rest timer.
document.addEventListener('change', e => {
  const t = e.target;
  if (!state.active || !t.dataset.set?.endsWith(':r') || num(t.value) <= 0) return;
  checkExerciseMilestone(+t.dataset.set.split(':')[0]);
  if (state.autoRest) startRest();
});

// Enter in the body weight field logs it.
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.id === 'bw-input') $('[data-act="bw-log"]')?.click();
});

$('#settings-btn').addEventListener('click', openSettings);

/* ---------- Boot ---------- */
applyTheme();
render();
renderRest();
renderStretch();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
