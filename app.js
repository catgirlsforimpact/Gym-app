'use strict';

/* ---------- State & storage ---------- */
const STORE_KEY = 'liftlog.v1';

function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); }

function defaultState() {
  return {
    unit: 'kg',
    theme: 'auto',
    exercises: DEFAULT_EXERCISES.map(e => ({ ...e, tips: [...e.tips], note: '', custom: false })),
    workouts: [],   // { id, date, title, note, duration, entries: [{ exerciseId, sets: [{ w, r }] }] }
    active: null,   // in-progress workout
    notes: [],      // { id, date, text }
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaultState();
    const s = { ...defaultState(), ...JSON.parse(raw) };
    // Add any new built-in exercises shipped after first launch.
    const have = new Set(s.exercises.map(e => e.id));
    DEFAULT_EXERCISES.forEach(e => { if (!have.has(e.id)) s.exercises.push({ ...e, tips: [...e.tips], note: '', custom: false }); });
    return s;
  } catch (err) {
    console.error(err);
    return defaultState();
  }
}

let state = load();
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
  catch (err) { toast('Could not save — storage unavailable'); }
}

/* ---------- Helpers ---------- */
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
function fmtDuration(ms) {
  const m = Math.floor(ms / 60000), h = Math.floor(m / 60);
  return h ? `${h}h ${m % 60}m` : `${m}m`;
}
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

function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast'; el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1800);
}

/* ---------- Charts (tiny SVG, no deps) ---------- */
function lineChart(points, { height = 170, unit = '' } = {}) {
  if (points.length < 2) {
    return `<div class="empty small">Log this exercise ${points.length ? 'once more' : 'a couple of times'} to see a trend.</div>`;
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
      <text class="lbl" x="${pl - 6}" y="${y(t) + 3}" text-anchor="end">${Math.round(t)}</text>`).join('')}
    <path class="area" d="${area}"/>
    <path class="ln" d="${path}"/>
    ${points.map((p, i) => `<circle class="pt" cx="${x(i)}" cy="${y(p.y)}" r="3.5"><title>${esc(p.label)}: ${fmt(p.y)} ${unit}</title></circle>`).join('')}
    ${points.map((p, i) => (i % showEvery === 0 || i === points.length - 1)
      ? `<text class="lbl" x="${x(i)}" y="${H - 6}" text-anchor="middle">${esc(p.label)}</text>` : '').join('')}
  </svg>`;
}

function barChart(bars, { height = 120 } = {}) {
  const W = 360, H = height, pb = 20, pt = 8;
  const max = Math.max(1, ...bars.map(b => b.v));
  const bw = W / bars.length;
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Workouts per week">
    ${bars.map((b, i) => {
      const h = b.v ? Math.max(4, (b.v / max) * (H - pb - pt)) : 3;
      return `<rect class="bar ${b.v ? '' : 'zero'}" x="${i * bw + bw * 0.2}" y="${H - pb - h}" width="${bw * 0.6}" height="${h}" rx="3"><title>${esc(b.label)}: ${b.v}</title></rect>
        ${i % 2 === bars.length % 2 ? '' : `<text class="lbl" x="${i * bw + bw / 2}" y="${H - 5}" text-anchor="middle">${esc(b.label)}</text>`}`;
    }).join('')}
  </svg>`;
}

/* ---------- Navigation ---------- */
let tab = 'train';
const titles = { train: 'Train', exercises: 'Exercises', progress: 'Progress', notes: 'Notes' };
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
    return `
      <button class="btn block" data-act="start">Start workout</button>
      ${state.workouts.length ? `<button class="btn ghost block" style="margin-top:10px" data-act="repeat">Repeat last workout</button>` : ''}
      <div class="label">Recent</div>
      ${recent.length ? `<div class="list">${recent.map(workoutRow).join('')}</div>`
        : `<div class="empty">No workouts yet.<br>Start one and log your first sets.</div>`}
    `;
  }
  return `
    <div class="workout-head">
      <div class="row between">
        <input class="title-input" data-field="title" value="${esc(a.title)}" aria-label="Workout name" />
        <span class="timer" id="timer"></span>
      </div>
      <div class="muted small">${fmtDate(a.date, { weekday: 'long', month: 'long', day: 'numeric' })}</div>
    </div>

    ${a.entries.map((en, i) => entryBlock(en, i)).join('') || `<div class="empty">Add your first exercise.</div>`}

    <button class="btn ghost block" style="margin-top:18px" data-act="add-exercise">+ Add exercise</button>

    <div class="label">Workout notes</div>
    <textarea data-field="note" placeholder="How did it feel? Energy, sleep, anything to remember…">${esc(a.note)}</textarea>

    <div class="row" style="margin-top:20px">
      <button class="btn danger" data-act="discard">Discard</button>
      <button class="btn" style="flex:1" data-act="finish">Finish workout</button>
    </div>
  `;
};

function entryBlock(en, i) {
  const ex = exById(en.exerciseId) || { name: 'Unknown exercise' };
  const hist = exerciseHistory(en.exerciseId);
  const last = hist[hist.length - 1];
  return `
    <div class="card entry" data-entry="${i}">
      <div class="entry-head">
        <button class="entry-name" data-act="show-ex" data-id="${esc(en.exerciseId)}">${esc(ex.name)}</button>
        <button class="link" data-act="remove-entry" data-i="${i}">Remove</button>
      </div>
      <div class="sets-grid">
        <span class="h">Set</span><span class="h" style="text-align:center">${state.unit}</span><span class="h" style="text-align:center">Reps</span><span></span>
        ${en.sets.map((s, j) => `
          <span class="n">${j + 1}</span>
          <input inputmode="decimal" data-set="${i}:${j}:w" value="${esc(s.w)}" placeholder="${last?.topW ?? 0}" aria-label="Weight set ${j + 1}" />
          <input inputmode="numeric" data-set="${i}:${j}:r" value="${esc(s.r)}" placeholder="${last?.topR ?? 0}" aria-label="Reps set ${j + 1}" />
          <button class="x" data-act="remove-set" data-i="${i}" data-j="${j}" aria-label="Remove set">×</button>
        `).join('')}
      </div>
      <div class="row between" style="margin-top:10px">
        <span class="prev">${last ? `Last: ${last.sets.map(s => `${fmt(num(s.w))}×${num(s.r)}`).join(', ')}` : 'First time — have fun'}</span>
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
  a.entries = a.entries.map(en => ({ ...en, sets: en.sets.filter(s => num(s.r) > 0).map(s => ({ w: num(s.w), r: num(s.r) })) }))
    .filter(en => en.sets.length);
  if (!a.entries.length) { toast('Log at least one set first'); return; }
  // Detect PRs before saving
  const prs = a.entries.filter(en => {
    const prev = Math.max(0, ...exerciseHistory(en.exerciseId).map(h => h.best1rm));
    const now = Math.max(...en.sets.map(s => e1rm(s.w, s.r)));
    return prev > 0 && now > prev;
  }).map(en => exById(en.exerciseId)?.name);
  a.duration = Date.now() - new Date(a.date);
  state.workouts.push(a);
  state.active = null;
  save(); render();
  toast(prs.length ? `New PR: ${prs.join(', ')} 🎉` : 'Workout saved');
}

/* ---------- Exercises ---------- */
let exFilter = 'All', exQuery = '';

views.exercises = () => {
  const groups = ['All', ...new Set(state.exercises.map(e => e.group))];
  return `
    <input type="search" id="ex-search" placeholder="Search exercises" value="${esc(exQuery)}" />
    <div class="chips" style="margin-top:12px">
      ${groups.map(g => `<button class="chip ${g === exFilter ? 'active' : ''}" data-act="ex-filter" data-g="${esc(g)}">${esc(g)}</button>`).join('')}
    </div>
    <div class="list" id="ex-list" style="margin-top:12px">${exerciseListHtml()}</div>
    <button class="btn ghost block" style="margin-top:18px" data-act="new-ex">+ New exercise</button>
  `;
};

function exerciseListHtml(act = 'show-ex') {
  const q = exQuery.trim().toLowerCase();
  const list = state.exercises
    .filter(e => (exFilter === 'All' || e.group === exFilter) && (!q || e.name.toLowerCase().includes(q) || e.group.toLowerCase().includes(q)))
    .sort((a, b) => a.name.localeCompare(b.name));
  if (!list.length) return `<div class="empty">Nothing found.</div>`;
  return list.map(e => {
    const h = exerciseHistory(e.id);
    const best = Math.max(0, ...h.map(x => x.best1rm));
    return `<button class="list-item" data-act="${act}" data-id="${esc(e.id)}">
      <div><div class="title">${esc(e.name)}</div><div class="sub">${esc(e.group)}${h.length ? ` · ${h.length} session${h.length > 1 ? 's' : ''}` : ''}</div></div>
      <span class="sub">${best ? `${fmt(best)} ${state.unit}` : ''} <span class="chev">›</span></span>
    </button>`;
  }).join('');
}

afterRender.exercises = () => {
  $('#ex-search')?.addEventListener('input', e => { exQuery = e.target.value; $('#ex-list').innerHTML = exerciseListHtml(); });
};

/* ---------- Progress ---------- */
let progressEx = null;

views.progress = () => {
  const ws = state.workouts;
  if (!ws.length) return `<div class="empty">Your stats will show up here after your first workout.</div>`;

  const now = new Date();
  const thisWeek = weekStart(now);
  const weeks = [];
  for (let i = 11; i >= 0; i--) { const d = new Date(thisWeek); d.setDate(d.getDate() - i * 7); weeks.push(d); }
  const perWeek = weeks.map(w => {
    const end = new Date(w); end.setDate(end.getDate() + 7);
    return { label: w.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }), v: ws.filter(x => { const d = new Date(x.date); return d >= w && d < end; }).length };
  });
  // Streak = consecutive weeks (ending this or last week) with ≥1 workout
  let streak = 0;
  for (let i = perWeek.length - 1; i >= 0; i--) {
    if (perWeek[i].v) streak++;
    else if (i === perWeek.length - 1) continue; // current week may not have one yet
    else break;
  }
  const monthAgo = new Date(now); monthAgo.setDate(now.getDate() - 30);
  const vol30 = ws.filter(w => new Date(w.date) >= monthAgo).reduce((t, w) => t + workoutVolume(w), 0);

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
    <div class="stats">
      <div class="stat"><div class="v">${ws.length}</div><div class="k">Workouts</div></div>
      <div class="stat"><div class="v">${perWeek[perWeek.length - 1].v}</div><div class="k">This week</div></div>
      <div class="stat"><div class="v">${streak}</div><div class="k">Week streak</div></div>
      <div class="stat"><div class="v">${vol30 >= 10000 ? fmt(vol30 / 1000) + 'k' : fmt(vol30)}</div><div class="k">${state.unit} lifted · 30d</div></div>
    </div>

    <div class="label">Workouts per week</div>
    <div class="card">${barChart(perWeek)}</div>

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
function openSheet(html, after) {
  const sheet = $('#sheet');
  sheet.innerHTML = html;
  sheet.hidden = false; $('#backdrop').hidden = false;
  document.body.style.overflow = 'hidden';
  sheet.scrollTop = 0;
  after?.(sheet);
}
function closeSheet() {
  $('#sheet').hidden = true; $('#backdrop').hidden = true;
  document.body.style.overflow = '';
}
$('#backdrop').addEventListener('click', closeSheet);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });

function showExercise(id) {
  const ex = exById(id); if (!ex) return;
  const hist = exerciseHistory(id);
  const best = hist.reduce((b, h) => h.best1rm > b.best1rm ? h : b, { best1rm: 0 });
  openSheet(`
    <div class="row between">
      <div><h2>${esc(ex.name)}</h2><div class="muted small">${esc(ex.group)}</div></div>
      <button class="link" data-act="edit-ex" data-id="${esc(id)}">Edit</button>
    </div>

    ${hist.length ? `
      <div class="stats" style="margin-top:16px">
        <div class="stat"><div class="v">${fmt(best.best1rm)}</div><div class="k">Est. 1RM (${state.unit})</div></div>
        <div class="stat"><div class="v">${fmt(best.topW)}×${best.topR}</div><div class="k">Best set</div></div>
      </div>
      <div class="card" style="margin-top:10px">${lineChart(hist.map(h => ({ y: h.best1rm, label: fmtDate(h.date, { month: 'numeric', day: 'numeric' }) })), { height: 140, unit: state.unit })}</div>
    ` : ''}

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
  const ex = id ? exById(id) : { name: '', group: '', tips: [], custom: true };
  const groups = [...new Set(state.exercises.map(e => e.group))];
  openSheet(`
    <h2>${id ? 'Edit exercise' : 'New exercise'}</h2>
    <div class="stack" style="margin-top:16px">
      <input id="f-name" placeholder="Name" value="${esc(ex.name)}" />
      <input id="f-group" placeholder="Muscle group (e.g. Legs)" value="${esc(ex.group)}" list="groups" />
      <datalist id="groups">${groups.map(g => `<option value="${esc(g)}">`).join('')}</datalist>
      <div class="label" style="margin-top:18px">Form tips · one per line</div>
      <textarea id="f-tips" rows="6" placeholder="Brace your core&#10;Keep elbows tucked">${esc(ex.tips.join('\n'))}</textarea>
    </div>
    <button class="btn block" style="margin-top:18px" data-act="save-ex" data-id="${esc(id || '')}">Save</button>
    ${id && ex.custom ? `<button class="btn danger block" style="margin-top:6px" data-act="delete-ex" data-id="${esc(id)}">Delete exercise</button>` : ''}
  `, sheet => $('#f-name', sheet).focus());
}

function pickExercise() {
  exQuery = ''; exFilter = 'All';
  openSheet(`
    <h2>Add exercise</h2>
    <input type="search" id="pick-search" placeholder="Search" style="margin-top:14px" />
    <div class="list" id="pick-list" style="margin-top:10px">${exerciseListHtml('pick-ex')}</div>
    <button class="btn ghost block" style="margin-top:14px" data-act="new-ex">+ Create new exercise</button>
  `, sheet => {
    const s = $('#pick-search', sheet);
    s.addEventListener('input', () => { exQuery = s.value; $('#pick-list').innerHTML = exerciseListHtml('pick-ex'); });
  });
}

function openWorkout(id) {
  const w = state.workouts.find(x => x.id === id); if (!w) return;
  openSheet(`
    <h2>${esc(w.title || 'Workout')}</h2>
    <div class="muted small">${fmtDate(w.date, { weekday: 'long', month: 'long', day: 'numeric' })}${w.duration ? ` · ${fmtDuration(w.duration)}` : ''} · ${fmt(workoutVolume(w))} ${state.unit}</div>
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
  `, sheet => {
    $('#w-note', sheet).addEventListener('input', e => { w.note = e.target.value; save(); });
  });
}

function openSettings() {
  openSheet(`
    <h2>Settings</h2>
    <div class="label">Units</div>
    <div class="seg">${['kg', 'lb'].map(u => `<button class="${state.unit === u ? 'active' : ''}" data-act="unit" data-v="${u}">${u}</button>`).join('')}</div>
    <div class="label">Appearance</div>
    <div class="seg">${['auto', 'light', 'dark'].map(t => `<button class="${state.theme === t ? 'active' : ''}" data-act="theme" data-v="${t}">${t[0].toUpperCase() + t.slice(1)}</button>`).join('')}</div>
    <div class="label">Your data</div>
    <p class="small muted" style="margin-top:0">Everything is stored on this device. Export a backup now and then.</p>
    <div class="row">
      <button class="btn ghost" style="flex:1" data-act="export">Export backup</button>
      <label class="btn ghost" style="flex:1">Import<input type="file" id="import-file" accept="application/json" hidden /></label>
    </div>
  `, sheet => {
    $('#import-file', sheet).addEventListener('change', async e => {
      const file = e.target.files[0]; if (!file) return;
      try {
        const data = JSON.parse(await file.text());
        if (!Array.isArray(data.workouts) || !Array.isArray(data.exercises)) throw new Error('bad file');
        if (!confirm('Replace all current data with this backup?')) return;
        state = { ...defaultState(), ...data }; save(); applyTheme(); closeSheet(); render(); toast('Backup restored');
      } catch { toast('That file doesn’t look like a backup'); }
    });
  });
}

function applyTheme() {
  if (state.theme === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.dataset.theme = state.theme;
}

/* ---------- Global event handling ---------- */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const { act, id } = el.dataset;
  const a = state.active;
  switch (act) {
    case 'start': startWorkout(); break;
    case 'repeat': {
      const src = id ? state.workouts.find(w => w.id === id)
        : [...state.workouts].sort((x, y) => new Date(y.date) - new Date(x.date))[0];
      if (state.active && !confirm('You already have a workout in progress. Replace it?')) break;
      closeSheet(); tab = 'train'; go('train');
      startWorkout(src.entries.map(en => ({ exerciseId: en.exerciseId, sets: en.sets.map(s => ({ w: s.w, r: '' })) })));
      state.active.title = src.title; save(); render();
      break;
    }
    case 'add-exercise': pickExercise(); break;
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
    case 'remove-entry': a.entries.splice(+el.dataset.i, 1); save(); render(); break;
    case 'discard': if (confirm('Discard this workout?')) { state.active = null; save(); render(); } break;
    case 'finish': finishWorkout(); break;
    case 'show-ex': showExercise(id); break;
    case 'edit-ex': editExercise(id); break;
    case 'new-ex': editExercise(null); break;
    case 'save-ex': {
      const name = $('#f-name').value.trim();
      if (!name) { toast('Give it a name'); break; }
      const group = $('#f-group').value.trim() || 'Other';
      const tips = $('#f-tips').value.split('\n').map(s => s.trim()).filter(Boolean);
      if (id) Object.assign(exById(id), { name, group, tips });
      else state.exercises.push({ id: uid(), name, group, tips, note: '', custom: true });
      save(); closeSheet(); render(); toast('Saved');
      break;
    }
    case 'delete-ex':
      if (state.workouts.some(w => w.entries.some(en => en.exerciseId === id))) { toast('It’s used in past workouts — can’t delete'); break; }
      if (confirm('Delete this exercise?')) { state.exercises = state.exercises.filter(x => x.id !== id); save(); closeSheet(); render(); }
      break;
    case 'ex-filter': exFilter = el.dataset.g; render(); break;
    case 'open-workout': openWorkout(id); break;
    case 'delete-workout':
      if (confirm('Delete this workout permanently?')) { state.workouts = state.workouts.filter(w => w.id !== id); save(); closeSheet(); render(); }
      break;
    case 'add-note': {
      const t = $('#note-input').value.trim(); if (!t) break;
      state.notes.push({ id: uid(), date: new Date().toISOString(), text: t }); save(); render();
      break;
    }
    case 'del-note': if (confirm('Delete note?')) { state.notes = state.notes.filter(n => n.id !== id); save(); render(); } break;
    case 'unit': state.unit = el.dataset.v; save(); openSettings(); render(); break;
    case 'theme': state.theme = el.dataset.v; save(); applyTheme(); openSettings(); break;
    case 'export': {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `liftlog-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 1000);
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

$('#settings-btn').addEventListener('click', openSettings);

/* ---------- Boot ---------- */
applyTheme();
render();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
