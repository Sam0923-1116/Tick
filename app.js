"use strict";
// My HQ — personal study + life app.
// Data lives on this phone (localStorage) and can optionally sync to your own private GitHub repo.

// ===== Settings =====
const KEY = "myhq-v1";
const SYNC_KEY = "myhq-sync";
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYS_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
const TABS = ["today", "calendar", "list", "focus", "more"];
const PALETTE = ["#4C8BF5", "#00B4EF", "#00A86B", "#4CB800", "#F9B934", "#FFB000", "#D63A5A", "#FF5FA2", "#B48CDB", "#8E8E93"];
const TASK_TYPES = ["Homework", "IA", "EE", "TOK", "Quiz", "Presentation", "Other"];
const UNI_STATUS = ["Researching", "Preparing", "Submitted", "Interview", "Offer", "Waitlist", "Rejected"];
const UNI_COUNTRIES = ["UK", "US", "Canada", "Other"];
const UNI_ITEMS = ["Personal statement / Essay", "Reference letter", "Transcript / Predicted grades", "English test score", "Pay application fee"];
const MONEY_CATS = ["Food", "Groceries", "Rent", "Bills", "Transport", "Study", "Fun", "Shopping", "Living", "Allowance", "Part-time job", "Other"];
const CURRENCIES = ["$", "NT$", "£", "US$", "C$", "€"];
const CLASS_KINDS = [["", "—"], ["Lecture", "Lecture"], ["Tutorial", "Tutorial"], ["Lab", "Lab"], ["Seminar", "Seminar"], ["Workshop", "Workshop"]];
const GRADE_SYSTEMS = [["ib", "IB Diploma (1–7, out of 45)"], ["uk", "UK (First, 2:1, 2:2…)"], ["gpa", "US / Canada GPA (4.0)"], ["pct", "Percentage only"]];
const CORE_GRADES = [["", "—"], ["A", "A"], ["B", "B"], ["C", "C"], ["D", "D"], ["E", "E"]];
// IB core points from TOK + EE grades (any E = fail)
const CORE_POINTS = { AA: 3, AB: 3, AC: 2, AD: 2, BB: 2, BC: 2, BD: 1, CC: 1, CD: 0, DD: 0 };
const PEOPLE_ROLES = ["Lecturer", "Professor", "Tutor", "TA", "Advisor", "Other"];
const DOC_NAMES = ["Passport", "Visa / BRP / eVisa", "Student insurance", "Accommodation contract", "CAS / I-20", "Driving licence"];
const PREP_ITEMS = ["CAS / I-20 received", "Visa approved", "Flights booked", "Accommodation sorted", "Health insurance / IHS", "Open a bank account",
  "Phone plan / SIM", "Online enrolment done", "Register with a doctor (GP)", "Pack (adapter, documents, meds)"];
const HOME_TZ = "Asia/Taipei"; // shown on Today when you're in a different time zone
const PRIORITIES = [[0, "None"], [1, "Low"], [2, "Medium"], [3, "High"]];
const PRIO_COLOR = ["#8E8E93", "#4C8BF5", "#E08A00", "#E5484D"];
const BG_KEY = "myhq-bg"; // background photo is only kept on this phone
const HOME_CARDS = [["classes", "📚 Classes"], ["agenda", "📆 Today's events"], ["week", "🗓️ Next 7 days"], ["todos", "✅ Today's to-dos"], ["tasks", "📝 Homework due soon"],
  ["exam", "⏳ Exam countdown"], ["habits", "💧 Today's habits"], ["focus", "⏱️ Focus today"]];
const HOME_DEFAULT = ["classes", "agenda", "week", "tasks", "exam", "focus"];
const NEW_CARDS = ["week"]; // cards added after launch: shown once to people with a custom home layout
const BG_COLORS = ["#FDE2E4", "#FFF1C1", "#E2F0CB", "#DFE7FD", "#E8DFF5", "#D9F2F2", "#2B2D42", "#0B3D2E"];
const REPEATS = [["none", "Never"], ["daily", "Every day"], ["weekly", "Every week"], ["monthly", "Every month"], ["yearly", "Every year"]];
const REMINDS = [["", "No reminder"], ["0", "At start time (8:00 if all day)"], ["10", "10 min before"], ["30", "30 min before"], ["60", "1 hour before"], ["1440", "1 day before"]];
const TASK_REMIND_TIMES = [["", "Off"], ["18:00", "18:00"], ["19:00", "19:00"], ["20:00", "20:00"], ["21:00", "21:00"], ["22:00", "22:00"]];

// Old Chinese values saved before the app switched to English
const OLD_NAMES = {
  "作業": "Homework", "小考": "Quiz", "報告": "Presentation", "其他": "Other",
  "研究中": "Researching", "準備中": "Preparing", "已送出": "Submitted", "面試": "Interview", "錄取": "Offer", "候補": "Waitlist", "未錄取": "Rejected",
  "英國 UK": "UK", "美國 US": "US", "加拿大 Canada": "Canada",
  "餐飲": "Food", "交通": "Transport", "學習": "Study", "娛樂": "Fun", "購物": "Shopping", "生活": "Living", "零用錢": "Allowance", "打工": "Part-time job",
  "個人陳述 / Essay": "Personal statement / Essay", "推薦信": "Reference letter", "成績單 / Predicted grades": "Transcript / Predicted grades",
  "語言成績": "English test score", "繳交申請費": "Pay application fee",
};

// ===== Helpers =====
const $ = s => document.querySelector(s);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const pad = n => String(n).padStart(2, "0");
const ymd = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseYmd = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const daysBetween = (a, b) => Math.round((parseYmd(b) - parseYmd(a)) / 864e5);
const daysUntil = s => daysBetween(ymd(), s);
const toMin = t => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const find = (arr, id) => arr.find(x => x.id === id);
const sumBy = (arr, k) => arr.reduce((s, x) => s + Number(x[k] || 0), 0);
const money = n => (db.settings.currency || "$") + Math.round(n).toLocaleString();
const fmtMin = m => m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ""}` : `${m} min`;
const byDue = (a, b) => (a.due || "9999").localeCompare(b.due || "9999");
const hhmm = ts => { const d = new Date(ts); return `${MONTHS[d.getMonth()]} ${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

function fmtDate(s) {
  const d = parseYmd(s);
  const year = d.getFullYear() === new Date().getFullYear() ? "" : " " + d.getFullYear();
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}${year}`;
}

function dueLabel(s) {
  const n = daysUntil(s);
  if (n < 0) return `<span class="late">${-n}d overdue</span>`;
  if (n === 0) return `<span class="late">Today</span>`;
  if (n === 1) return `<span class="soon">Tomorrow</span>`;
  return `<span class="${n <= 3 ? "soon" : "muted small"}">${n} days left</span>`;
}

// Short message at the bottom; with undo it gets an "Undo" button and stays a bit longer
function toast(msg, undo) {
  const el = $("#toast");
  el.innerHTML = esc(msg) + (undo ? ' <button data-act="undo">Undo</button>' : "");
  el.classList.toggle("has-undo", !!undo);
  toast.undo = undo || null;
  el.classList.add("show");
  clearTimeout(toast.t);
  toast.t = setTimeout(() => { el.classList.remove("show", "has-undo"); toast.undo = null; }, undo ? 5000 : 2400);
}

// Take a copy of all data before deleting, so "Undo" can put it back
const undoTo = snap => () => { db = JSON.parse(snap); save(); render(); toast("Restored ↩️"); };
function deleteWithUndo(fn, msg = "Deleted") {
  const snap = JSON.stringify(db);
  fn(); save(); render();
  toast(msg, undoTo(snap));
}

// ===== Data =====
function fresh() {
  const s = { id: uid(), name: "My timetable", classes: [] };
  return {
    version: 1, updatedAt: 0, schedules: [s], activeSchedule: s.id,
    tasks: [], todos: [], events: [], focus: [], exams: [], unis: [], money: [], habits: [], habitLog: {}, holidays: [],
    terms: [], modules: [], docs: [], recurring: [], prep: PREP_ITEMS.map(text => ({ text, done: false })),
    settings: { work: 25, brk: 5, goal: 120, taskRemind: "20:00", currency: "$", budget: 0, gradeSystem: "ib" }, timer: null, lastBackup: null,
  };
}

// Turn old Chinese option values into the English ones
function migrate(d) {
  const en = s => OLD_NAMES[s] || s;
  d.tasks.forEach(t => { t.type = en(t.type); t.subject = en(t.subject); });
  d.unis.forEach(u => { u.status = en(u.status); u.country = en(u.country); (u.items || []).forEach(i => { i.text = en(i.text); }); });
  d.money.forEach(x => { x.category = en(x.category); });
  d.focus.forEach(f => { f.subject = en(f.subject); });
  d.settings = { ...fresh().settings, ...d.settings }; // new settings get their defaults
  // IB mode added: switch to it once if no modules exist yet (still in high school)
  if (!d.settings.ibIntro) { if (!d.modules.length) d.settings.gradeSystem = "ib"; d.settings.ibIntro = true; }
  // New home cards appear once for people who already arranged their home page
  const seen = d.settings.cardsSeen || [];
  if (d.settings.home) NEW_CARDS.filter(k => !seen.includes(k) && !d.settings.home.includes(k)).forEach(k => {
    const i = d.settings.home.indexOf("agenda");
    d.settings.home.splice(i >= 0 ? i + 1 : 1, 0, k);
  });
  d.settings.cardsSeen = [...new Set([...seen, ...NEW_CARDS])];
  return d;
}

function load() {
  let d = null;
  try { d = JSON.parse(localStorage.getItem(KEY)); } catch {}
  d = d && d.version ? migrate({ ...fresh(), ...d }) : fresh();
  // Done to-dos older than 30 days are cleared automatically
  const cutoff = ymd(addDays(new Date(), -30));
  d.todos = d.todos.filter(t => !(t.done && t.doneAt && t.doneAt < cutoff));
  return d;
}

let db = load();
function save() {
  db.updatedAt = Date.now();
  localStorage.setItem(KEY, JSON.stringify(db));
  schedulePush();
}

const homeOrder = () => (db.settings.home || HOME_DEFAULT).filter(k => HOME_CARDS.some(c => c[0] === k));
const getBgImage = () => { try { return localStorage.getItem(BG_KEY); } catch { return null; } };

// Apply accent colour and background
function applyTheme() {
  const s = db.settings, img = getBgImage(), bg = $("#bg");
  document.documentElement.style.setProperty("--accent", s.accent || PALETTE[0]);
  bg.style.backgroundImage = img ? `url(${img})` : "none";
  bg.style.backgroundColor = !img && s.bgColor ? s.bgColor : "transparent";
  document.body.classList.toggle("custom-bg", !!(img || s.bgColor));
  // Light background colour → keep dark text on it; dark colour or photo → white text
  document.body.classList.toggle("bg-light", !img && !!s.bgColor && isLight(s.bgColor));
}

function isLight(hex) {
  const n = parseInt(hex.replace("#", ""), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 160;
}

// Shrink the photo before saving it (phone photos are too big for localStorage)
function setBgImage(file) {
  const url = URL.createObjectURL(file), img = new Image();
  img.onload = () => {
    const k = Math.min(1, 1400 / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * k);
    c.height = Math.round(img.height * k);
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(url);
    try { localStorage.setItem(BG_KEY, c.toDataURL("image/jpeg", 0.82)); }
    catch { return toast("Image too big, try another one"); }
    render(); toast("Background updated 🖼️");
  };
  img.onerror = () => { URL.revokeObjectURL(url); toast("Couldn't read this image"); };
  img.src = url;
}

const sched = () => db.schedules.find(s => s.id === db.activeSchedule) || db.schedules[0];
const classesOn = day => sched().classes.filter(c => +c.day === day).sort((a, b) => toMin(a.start) - toMin(b.start));
const habitDone = (id, date) => (db.habitLog[date] || []).includes(id);
// The holiday covering this date, if any; no classes are shown on holidays
const holidayOn = ds => db.holidays.find(h => h.start <= ds && ds <= (h.end || h.start));
// Terms belong to a timetable. If the active timetable has terms, classes only happen inside them,
// and a class can be limited to some weeks ("1-10", "1-5, 7-11", "odd", "even"; empty = every week).
const schedTerms = () => db.terms.filter(t => t.sched === sched().id);
const termOn = ds => schedTerms().find(t => t.start <= ds && ds <= t.end);
const weekOf = (t, ds) => { const s = parseYmd(t.start); return Math.floor(daysBetween(ymd(addDays(s, -((s.getDay() + 6) % 7))), ds) / 7) + 1; };
function inWeeks(spec, w) {
  spec = String(spec || "").trim().toLowerCase();
  if (!spec) return true;
  if (spec === "odd") return w % 2 === 1;
  if (spec === "even") return w % 2 === 0;
  return spec.split(",").some(p => { const [a, b] = p.split("-").map(x => parseInt(x, 10)); return b ? w >= a && w <= b : w === a; });
}
function classesOnDate(ds) {
  if (holidayOn(ds)) return [];
  const t = termOn(ds);
  if (schedTerms().length && !t) return []; // between terms
  return classesOn(parseYmd(ds).getDay()).filter(c => !t || inWeeks(c.weeks, weekOf(t, ds)));
}
const termLabel = ds => { const t = termOn(ds); return t ? `${t.name} · Week ${weekOf(t, ds)}` : ""; };

// The time back home, only when the phone is in another time zone
function homeTime(tz = HOME_TZ, now = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", weekday: "short" })
    .formatToParts(now).map(x => [x.type, x.value]));
  const there = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  const here = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes());
  const diff = Math.round((there - here) / 36e5);
  if (!diff) return "";
  return `🇹🇼 Taiwan ${pad(p.hour)}:${pad(p.minute)}${Number(p.day) !== now.getDate() ? " " + p.weekday : ""} (${diff > 0 ? "+" : ""}${diff}h)`;
}
const curUni = () => find(db.unis, ui.pageId);
const curModule = () => find(db.modules, ui.pageId);

// ===== Grades =====
// Module mark = weighted average of the assessments that have a score
const scored = m => m.items.filter(i => i.score !== "" && i.score != null);
function moduleAvg(m) {
  const s = scored(m), w = sumBy(s, "weight");
  return w ? s.reduce((t, i) => t + i.weight * i.score, 0) / w : null;
}
// Score needed on the rest of the module to reach the target
function neededFor(m) {
  const total = sumBy(m.items, "weight"), s = scored(m), rest = total - sumBy(s, "weight");
  if (!total || rest <= 0) return null;
  return { need: (m.target * total - s.reduce((t, i) => t + i.weight * i.score, 0)) / rest, rest: Math.round((rest / total) * 100) };
}
const GPA = [[93, "A", 4.0], [90, "A-", 3.7], [87, "B+", 3.3], [83, "B", 3.0], [80, "B-", 2.7], [77, "C+", 2.3], [73, "C", 2.0], [70, "C-", 1.7], [67, "D+", 1.3], [60, "D", 1.0], [0, "F", 0]];
const gpaOf = p => GPA.find(g => p >= g[0]);
function gradeLabel(p) {
  if (p == null) return "";
  if (db.settings.gradeSystem === "gpa") { const g = gpaOf(p); return `${g[1]} (${g[2].toFixed(1)})`; }
  if (db.settings.gradeSystem === "uk") return p >= 70 ? "First" : p >= 60 ? "2:1" : p >= 50 ? "2:2" : p >= 40 ? "Third" : "Fail";
  return "";
}
const pct = p => (Math.round(p * 10) / 10) + "%";
// IB: subject grades (1–7) + core points (TOK/EE), out of 45
function ibTotal() {
  const graded = db.modules.filter(m => Number(m.ib) >= 1);
  const { ibTok: t, ibEe: e } = db.settings;
  const core = !t || !e ? null : t === "E" || e === "E" ? -1 : CORE_POINTS[[t, e].sort().join("")];
  const subjects = graded.reduce((s, m) => s + Number(m.ib), 0);
  return { subjects, n: graded.length, core, total: subjects + Math.max(core || 0, 0) };
}

// Overall: credit-weighted (GPA uses each module's grade points)
function overallGrade() {
  const list = db.modules.map(m => ({ c: Number(m.credits) || 1, a: moduleAvg(m) })).filter(x => x.a != null);
  const c = sumBy(list, "c");
  if (!c) return null;
  return { avg: list.reduce((t, x) => t + x.c * x.a, 0) / c, gpa: list.reduce((t, x) => t + x.c * gpaOf(x.a)[2], 0) / c, n: list.length };
}

function subjects() {
  const set = new Set(sched().classes.map(c => c.name));
  db.tasks.forEach(t => t.subject && set.add(t.subject));
  set.delete("Other");
  return [...set, "Other"];
}

function colorOf(name) {
  const c = sched().classes.find(x => x.name === name);
  if (c) return c.color;
  if (!name || name === "Other") return "#8E8E93";
  let s = 0;
  for (const ch of name) s += ch.charCodeAt(0);
  return PALETTE[s % PALETTE.length];
}

function nextClassDay(now) {
  for (let i = 1; i <= 60; i++) {
    const d = addDays(now, i), list = classesOnDate(ymd(d));
    if (list.length) return { label: i === 1 ? "Tomorrow" : i < 7 ? DAYS_FULL[d.getDay()] : fmtDate(ymd(d)), c: list[0] };
  }
  return null;
}

function streak(id) {
  let d = new Date(), n = 0;
  if (!habitDone(id, ymd(d))) d = addDays(d, -1);
  while (habitDone(id, ymd(d))) { n++; d = addDays(d, -1); }
  return n;
}

// Does an event start on this day (handles repeats)
function startsOn(e, ds) {
  if (ds < e.date) return false;
  const a = parseYmd(e.date), b = parseYmd(ds);
  switch (e.repeat) {
    case "daily": return true;
    case "weekly": return a.getDay() === b.getDay();
    case "monthly": return a.getDate() === b.getDate();
    case "yearly": return a.getDate() === b.getDate() && a.getMonth() === b.getMonth();
    default: return ds === e.date;
  }
}

// How many days the event lasts (end date filled in = multi-day event)
const spanOf = e => e.endDate && e.endDate > e.date ? daysBetween(e.date, e.endDate) + 1 : 1;

// Which day of the event this is (1 = first day); 0 = not on this day
function occursOn(e, ds) {
  for (let k = 0; k < spanOf(e); k++) if (startsOn(e, ymd(addDays(parseYmd(ds), -k)))) return k + 1;
  return 0;
}

function eventItem(e, ds) {
  const n = spanOf(e), k = occursOn(e, ds);
  const tags = [];
  if (e.repeat && e.repeat !== "none") tags.push("🔁");
  if (n > 1) tags.push(`Day ${k}/${n}`);
  if (n > 1 && k === n && e.start && e.end) tags.push("until " + e.end);
  // Multi-day: first day shows the start time, the other days count as all-day
  const time = k === 1 ? e.start || "" : "";
  return { title: e.title, time, end: n === 1 ? e.end || "" : "", color: e.color, act: "editEvent", id: e.id, tag: tags.join(" ") };
}

// Everything on one day: events, exams, homework, to-dos, uni deadlines (and classes)
function itemsOn(ds, withClasses) {
  const out = [];
  const hol = holidayOn(ds);
  if (hol) out.push({ title: "🏖️ " + hol.name, color: "#4CB800", act: "editHoliday", id: hol.id });
  db.events.filter(e => occursOn(e, ds)).forEach(e => out.push(eventItem(e, ds)));
  db.exams.filter(e => e.date === ds).forEach(e => out.push({ title: "Exam: " + e.name, color: "#E5484D", act: "editExam", id: e.id }));
  db.unis.filter(u => u.deadline === ds).forEach(u => out.push({ title: "Deadline: " + u.name, color: "#B48CDB", act: "openUni", id: u.id }));
  db.docs.filter(d => d.expiry === ds).forEach(d => out.push({ title: "🛂 " + d.name + " expires", color: "#E08A00", act: "editDoc", id: d.id }));
  db.tasks.filter(t => t.due === ds).forEach(t => out.push({ title: t.title, color: colorOf(t.subject), act: "editTask", check: "toggleTask", id: t.id, done: t.done, tag: t.type }));
  db.todos.filter(t => t.date === ds).forEach(t => out.push({ title: t.text, color: PRIO_COLOR[t.priority || 0], act: "editTodo", check: "toggleTodo", id: t.id, done: t.done, prio: t.priority || 0 }));
  if (withClasses) {
    classesOnDate(ds).forEach(c => out.push({ title: c.name, time: c.start, end: c.end, color: c.color, act: "editClass", id: c.id, tag: [c.kind, c.room].filter(Boolean).join(" · "), isClass: true }));
    // Office hours from Modules → people
    if (!hol) db.modules.forEach(m => m.people.filter(p => p.ohDay !== "" && p.ohDay != null && +p.ohDay === parseYmd(ds).getDay() && p.ohStart).forEach(p =>
      out.push({ title: "Office hours: " + p.name, time: p.ohStart, end: p.ohEnd || "", color: "#8E8E93", act: "openModule", id: m.id, tag: [m.name, p.ohPlace].filter(Boolean).join(" · "), isClass: true })));
  }
  return out.sort((a, b) => (a.done - b.done) || (a.time || "").localeCompare(b.time || "") || ((b.prio || 0) - (a.prio || 0)));
}

// ===== Screen state =====
const ui = {
  tab: "today", page: null, pageId: null, day: new Date().getDay(), listMode: "todo", showDone: false,
  month: ymd().slice(0, 7), calMonth: ymd().slice(0, 7), selDate: ymd(), lastSubject: null,
};

const classRow = (c, isNow, edit) => `
  <div class="row" ${edit ? `data-act="editClass" data-id="${c.id}"` : ""}>
    <i class="bar" style="background:${esc(c.color)}"></i>
    <div class="grow"><b>${esc(c.name)}</b>
      <div class="muted small">${c.start}–${c.end}${[c.kind, c.room, c.weeks ? "Wk " + c.weeks : ""].filter(Boolean).map(x => " · " + esc(x)).join("")}</div></div>
    ${isNow ? '<span class="pill now">Now</span>' : ""}
  </div>`;

const todoRow = (t, showDate) => `
  <div class="row">
    <button class="check prio${t.priority || 0} ${t.done ? "on" : ""}" data-act="toggleTodo" data-id="${t.id}"></button>
    <div class="grow" data-act="editTodo" data-id="${t.id}">
      <span class="${t.done ? "done" : ""}">${esc(t.text)}</span>${t.repeat && t.repeat !== "none" ? ' <span class="small muted">🔁</span>' : ""}
      ${showDate && t.date ? `<div class="small">${t.date < ymd() && !t.done ? dueLabel(t.date) : `<span class="muted">${fmtDate(t.date)}</span>`}</div>` : ""}
    </div>
    ${t.priority ? `<span class="flag" style="color:${PRIO_COLOR[t.priority]}">⚑</span>` : ""}
  </div>`;

const taskRow = t => `
  <div class="row">
    <button class="check ${t.done ? "on" : ""}" data-act="toggleTask" data-id="${t.id}"></button>
    <div class="grow" data-act="editTask" data-id="${t.id}">
      <b class="${t.done ? "done" : ""}">${esc(t.title)}</b>
      <div class="small"><span class="tag" style="--c:${esc(colorOf(t.subject))}">${esc(t.subject)}</span>
        <span class="muted">${esc(t.type)} · ${t.due ? fmtDate(t.due) : "No due date"}</span> ${t.due && !t.done ? dueLabel(t.due) : ""}</div>
    </div>
  </div>`;

const itemRow = it => `
  <div class="row">
    ${it.check ? `<button class="check ${it.done ? "on" : ""}" data-act="${it.check}" data-id="${it.id}"></button>` : `<i class="bar" style="background:${esc(it.color)}"></i>`}
    <div class="grow" data-act="${it.act}" data-id="${it.id}">
      <span class="${it.done ? "done" : ""}">${esc(it.title)}</span>
      ${it.time || it.tag ? `<div class="muted small">${it.time ? it.time + (it.end ? "–" + it.end : "") : ""}${it.time && it.tag ? " · " : ""}${esc(it.tag || "")}</div>` : ""}
    </div>
    ${it.check ? `<i class="dot" style="background:${esc(it.color)}"></i>` : ""}
  </div>`;

// A checklist row; kind "Item" = uni checklist, "Prep" = before-you-go list
const checkItem = (it, i, kind = "Item") => `
  <div class="row">
    <button class="check ${it.done ? "on" : ""}" data-act="toggle${kind}" data-id="${i}"></button>
    <span class="grow ${it.done ? "done" : ""}">${esc(it.text)}</span>
    <button class="x" data-act="del${kind}" data-id="${i}">×</button>
  </div>`;

const empty = text => `<p class="empty">${text}</p>`;

// Today's focus minutes with a progress bar towards the daily goal
function goalBlock(min) {
  const goal = db.settings.goal || 0;
  if (!goal) return `<p class="big">${fmtMin(min)}</p>`;
  return `<p class="big">${fmtMin(min)} <small class="muted">/ ${fmtMin(goal)}</small></p>
    <div class="meter"><i style="width:${Math.min(100, (min / goal) * 100)}%;background:${min >= goal ? "var(--ok)" : "var(--accent)"}"></i></div>
    <p class="small ${min >= goal ? "" : "muted"}">${min >= goal ? "🎉 Goal reached!" : `${fmtMin(goal - min)} to go`}</p>`;
}

// ===== Pages =====
const VIEWS = {
  today() {
    const now = new Date(), nm = now.getHours() * 60 + now.getMinutes(), td = ymd(now);
    const list = classesOnDate(td), hol = holidayOn(td);
    const cur = list.find(c => toMin(c.start) <= nm && nm < toMin(c.end));
    const coming = (cur ? [cur] : []).concat(list.filter(c => toMin(c.start) > nm));
    let classes;
    if (coming.length) {
      classes = coming.slice(0, 3).map(c => classRow(c, c === cur)).join("");
      if (coming.length > 3) classes += `<p class="muted small">${coming.length - 3} more</p>`;
    } else {
      const nx = nextClassDay(now);
      classes = empty(hol ? `${esc(hol.name)} — no classes 🏖️` : list.length ? "Classes are over for today 🎉" : "No classes today 😴") +
        (nx ? `<p class="muted small center">${nx.label} ${nx.c.start} ${esc(nx.c.name)}</p>` : "");
    }

    const agenda = itemsOn(td, false).filter(it => !it.check);
    const todos = db.todos.filter(t => t.date && (t.done ? t.date === td : t.date <= td))
      .sort((a, b) => (a.done - b.done) || ((b.priority || 0) - (a.priority || 0)));
    const tasks = db.tasks.filter(t => !t.done).sort(byDue).slice(0, 3);
    const exam = db.exams.filter(e => daysUntil(e.date) >= 0).sort((a, b) => a.date.localeCompare(b.date))[0];
    const focusMin = sumBy(db.focus.filter(f => f.date === td), "minutes");
    const hasData = db.tasks.length + db.money.length + sched().classes.length > 0;
    const needBackup = hasData && !(sync && sync.token) && (!db.lastBackup || daysUntil(db.lastBackup) < -14);

    // Home cards; order and visibility are set in Appearance
    const cards = {
      classes: `<section class="card"><h2>Classes <a data-act="open" data-id="schedule">Timetable ›</a></h2>${classes}</section>`,
      agenda: agenda.length ? `<section class="card"><h2>Today's events <a data-act="tab" data-id="calendar">Calendar ›</a></h2>${agenda.map(itemRow).join("")}</section>` : "",
      todos: `<section class="card"><h2>Today's to-dos <a data-act="goList" data-id="todo">All ›</a></h2>
          ${todos.map(t => todoRow(t, t.date < td)).join("") || empty("Nothing to do today")}
          <form class="inline" data-form="addTodo"><input name="text" placeholder="Add a to-do for today…" autocomplete="off"><button class="btn">＋</button></form>
        </section>`,
      tasks: `<section class="card"><h2>Homework due soon <a data-act="goList" data-id="task">All ›</a></h2>
          ${tasks.map(t => `
            <div class="row" data-act="editTask" data-id="${t.id}">
              <i class="bar" style="background:${esc(colorOf(t.subject))}"></i>
              <div class="grow"><b>${esc(t.title)}</b><div class="muted small">${esc(t.subject)} · ${t.due ? fmtDate(t.due) : "No due date"}</div></div>
              ${t.due ? dueLabel(t.due) : ""}
            </div>`).join("") || empty("No homework left 👍")}
        </section>`,
      exam: exam ? `<section class="card" data-act="open" data-id="exams"><h2>Exam countdown</h2>
          <p class="big">${daysUntil(exam.date)} <small class="muted">days</small></p>
          <div class="muted small">${esc(exam.name)} · ${fmtDate(exam.date)}</div></section>` : "",
      habits: db.habits.length ? `<section class="card"><h2>Today's habits <a data-act="open" data-id="habits">All ›</a></h2>
          <div class="chips">${db.habits.map(h => `<button class="chip ${habitDone(h.id, td) ? "on" : ""}" data-act="toggleHabit" data-id="${h.id}|${td}">${esc(h.icon)} ${esc(h.name)}</button>`).join("")}</div></section>` : "",
      focus: `<section class="card" data-act="tab" data-id="focus"><h2>Focus today</h2>${goalBlock(focusMin)}</section>`,
      week: (() => {
        // Tomorrow + the 6 days after: only days with something on, max 4 items each
        const days = [...Array(7)].map((_, i) => ymd(addDays(now, i + 1))).map(ds => ({ ds, items: itemsOn(ds, false).filter(it => !it.done) })).filter(d => d.items.length);
        return `<section class="card"><h2>Next 7 days <a data-act="tab" data-id="calendar">Calendar ›</a></h2>
          ${days.map(d => `<h3 class="date">${daysUntil(d.ds) === 1 ? "Tomorrow" : fmtDate(d.ds)}</h3>${d.items.slice(0, 4).map(itemRow).join("")}
            ${d.items.length > 4 ? `<p class="muted small">+${d.items.length - 4} more</p>` : ""}`).join("") || empty("Nothing planned this week 🎉")}</section>`;
      })(),
    };
    const shown = homeOrder().map(k => cards[k] || "").join("");

    return {
      title: `${DAYS_FULL[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}`,
      action: `<button class="icon-btn" data-act="openSearch" aria-label="Search">🔍</button>`,
      html: `
        ${needBackup ? `<div class="banner" data-act="open" data-id="settings">💾 ${db.lastBackup ? "No backup in over 2 weeks" : "Never backed up"} — turn on cloud sync ›</div>` : ""}
        ${termLabel(td) || homeTime() ? `<p class="topline">${[termLabel(td) && "📆 " + termLabel(td), `<span id="homeClock">${homeTime()}</span>`].filter(Boolean).join(" · ")}</p>` : ""}
        ${shown || `<section class="card">${empty("All home cards are turned off<br>Turn them on in More → Appearance")}</section>`}`,
    };
  },

  appearance() {
    const order = homeOrder();
    const hidden = HOME_CARDS.filter(([k]) => !order.includes(k));
    const name = k => HOME_CARDS.find(c => c[0] === k)[1];
    const s = db.settings, img = getBgImage();
    const bgType = img ? "image" : s.bgColor ? "color" : "none";
    return {
      title: "Appearance",
      html: `
        <section class="card"><h2>Home cards <a data-act="homeReset">Reset</a></h2>
          ${order.map((k, i) => `
            <div class="row"><span class="grow">${name(k)}</span>
              <button class="mini" data-act="homeMove" data-id="${k}|-1" ${i === 0 ? "disabled" : ""}>↑</button>
              <button class="mini" data-act="homeMove" data-id="${k}|1" ${i === order.length - 1 ? "disabled" : ""}>↓</button>
              <button class="switch on" data-act="homeToggle" data-id="${k}" aria-label="Hide"></button></div>`).join("")}
          ${hidden.map(([k, n]) => `
            <div class="row"><span class="grow muted">${n}</span>
              <button class="switch" data-act="homeToggle" data-id="${k}" aria-label="Show"></button></div>`).join("")}
          <p class="small muted">Use ↑ ↓ to change the order, and the switch to show or hide a card.</p>
        </section>
        <section class="card"><h2>Accent colour</h2>
          <div class="swatches">${PALETTE.map(c => `<button class="sw ${c === (s.accent || PALETTE[0]) ? "on" : ""}" style="background:${c}" data-act="setAccent" data-id="${c}"></button>`).join("")}</div>
        </section>
        <section class="card"><h2>Background <span>${{ none: "Default", color: "Colour", image: "Photo" }[bgType]}</span></h2>
          <div class="swatches">${BG_COLORS.map(c => `<button class="sw ${bgType === "color" && s.bgColor === c ? "on" : ""}" style="background:${c}" data-act="setBgColor" data-id="${c}"></button>`).join("")}
            <label class="sw custom" title="Custom colour"><input type="color" data-change="bgCustom" value="${esc(s.bgColor || "#DFE7FD")}">＋</label></div>
          <label class="btn wide" style="margin-top:12px">🖼️ Choose a photo<input type="file" accept="image/*" data-change="bgImage" hidden></label>
          ${bgType !== "none" ? `<button class="btn wide" data-act="clearBg">Back to default background</button>` : ""}
          <p class="small muted">The background photo stays on this phone only (too big for cloud sync). Home layout, accent and background colour do sync.</p>
        </section>`,
    };
  },

  calendar() {
    const [y, m] = ui.calMonth.split("-").map(Number);
    const first = new Date(y, m - 1, 1);
    const offset = first.getDay(); // week starts on Sunday
    const daysInMonth = new Date(y, m, 0).getDate();
    const start = addDays(first, -offset);
    const td = ymd();
    const cells = [];
    for (let i = 0; i < Math.ceil((offset + daysInMonth) / 7) * 7; i++) {
      const d = addDays(start, i), ds = ymd(d);
      const items = itemsOn(ds, false);
      cells.push(`<button class="cal-cell ${d.getMonth() !== m - 1 ? "out" : ""} ${ds === td ? "today" : ""} ${ds === ui.selDate ? "sel" : ""}" data-act="pickDate" data-id="${ds}">
        <span class="num">${d.getDate()}</span>
        ${items.slice(0, 3).map(it => `<i class="${it.done ? "done" : ""}" style="--c:${esc(it.color)}">${esc(it.title)}</i>`).join("")}
        ${items.length > 3 ? `<em>+${items.length - 3}</em>` : ""}</button>`);
    }
    const sel = ui.selDate;
    const agenda = itemsOn(sel, true);
    const classes = agenda.filter(it => it.isClass), others = agenda.filter(it => !it.isClass);
    return {
      title: "Calendar",
      action: `<button class="txt" data-act="calToday">Today</button>`,
      html: `
        <div class="month"><button data-act="calMonth" data-id="-1">‹</button><b>${MONTHS_FULL[m - 1]} ${y}</b><button data-act="calMonth" data-id="1">›</button></div>
        <div class="cal-week">${DAYS.map(d => `<span>${d}</span>`).join("")}</div>
        <div class="cal">${cells.join("")}</div>
        <section class="card"><h2>${fmtDate(sel)}${sel === td ? " · Today" : ""}${termLabel(sel) ? `<span>${esc(termLabel(sel))}</span>` : ""}</h2>
          ${others.map(itemRow).join("") || empty("Nothing planned")}
          <div class="agenda-add">
            <button class="btn" data-act="addEvent" data-id="${sel}">＋ Event</button>
            <button class="btn" data-act="addTodoOn" data-id="${sel}">＋ To-do</button>
            <button class="btn" data-act="addTaskOn" data-id="${sel}">＋ Homework</button>
          </div></section>
        ${classes.length ? `<section class="card"><h2>Classes this day</h2>${classes.map(itemRow).join("")}</section>` : ""}`,
    };
  },

  list() {
    const td = ymd(), tmr = ymd(addDays(new Date(), 1));
    const todoOpen = db.todos.filter(t => !t.done), taskOpen = db.tasks.filter(t => !t.done);
    let body, doneCount;
    if (ui.listMode === "todo") {
      const sortT = (a, b) => ((b.priority || 0) - (a.priority || 0)) || (a.date || "").localeCompare(b.date || "");
      const groups = [
        ["Overdue", t => t.date && t.date < td], ["Today", t => t.date === td], ["Tomorrow", t => t.date === tmr],
        ["Later", t => t.date > tmr], ["No date", t => !t.date],
      ];
      body = groups.map(([name, fn]) => {
        const g = todoOpen.filter(fn).sort(sortT);
        return g.length ? `<section class="card"><h2>${name} <span>${g.length}</span></h2>${g.map(t => todoRow(t, name !== "Today" && name !== "Tomorrow")).join("")}</section>` : "";
      }).join("") || `<section class="card">${empty("No to-dos — tap ＋ at the top right to add one")}</section>`;
      const done = db.todos.filter(t => t.done);
      doneCount = done.length;
      if (ui.showDone && done.length) body += `<section class="card"><h2>Done</h2>${done.map(t => todoRow(t, true)).join("")}</section>`;
    } else {
      body = `<section class="card">${taskOpen.sort(byDue).map(taskRow).join("") || empty("No homework — tap ＋ at the top right to add one")}</section>`;
      const done = db.tasks.filter(t => t.done).sort(byDue).reverse();
      doneCount = done.length;
      if (ui.showDone && done.length) body += `<section class="card"><h2>Done</h2>${done.map(taskRow).join("")}</section>`;
    }
    return {
      title: "Lists",
      action: `<button data-act="${ui.listMode === "todo" ? "addTodo" : "addTask"}">＋</button>`,
      html: `
        <div class="seg">
          <button class="${ui.listMode === "todo" ? "on" : ""}" data-act="listMode" data-id="todo">To-dos ${todoOpen.length}</button>
          <button class="${ui.listMode === "task" ? "on" : ""}" data-act="listMode" data-id="task">Homework ${taskOpen.length}</button>
        </div>
        ${body}
        ${doneCount ? `<button class="btn wide" data-act="toggleShowDone">${ui.showDone ? "Hide" : "Show"} done (${doneCount})</button>` : ""}`,
    };
  },

  schedule() {
    const s = sched(), list = classesOn(ui.day), todayD = new Date().getDay();
    return {
      title: "Timetable",
      action: `<button class="txt" data-act="newSched">＋ New</button>`,
      html: `
        <div class="toolbar">
          <select data-change="switchSched">${db.schedules.map(x => `<option value="${x.id}" ${x.id === s.id ? "selected" : ""}>${esc(x.name)}</option>`).join("")}</select>
          <button class="btn" data-act="schedMenu">Manage</button>
        </div>
        <div class="days">${WEEK_ORDER.map(i => `<button class="${i === ui.day ? "on" : ""} ${i === todayD ? "today" : ""}" data-act="pickDay" data-id="${i}">${DAYS[i]}<small>${classesOn(i).length || ""}</small></button>`).join("")}</div>
        <section class="card">${list.map(c => classRow(c, false, true)).join("") || empty("No classes this day")}</section>
        <button class="btn wide" data-act="addClass">＋ Add class</button>`,
    };
  },

  focus() {
    const t = db.timer, now = new Date(), td = ymd(now);
    const monday = ymd(addDays(now, -((now.getDay() + 6) % 7)));
    const bySubject = {};
    db.focus.filter(f => f.date >= monday).forEach(f => { bySubject[f.subject] = (bySubject[f.subject] || 0) + f.minutes; });
    const rows = Object.entries(bySubject).sort((a, b) => b[1] - a[1]);
    const max = rows.length ? rows[0][1] : 1;
    const recent = [...db.focus].reverse().slice(0, 5);
    const subjectList = subjects();
    // This week's minutes per day (Mon–Sun) for the chart
    const week = [...Array(7)].map((_, i) => { const ds = ymd(addDays(parseYmd(monday), i)); return { ds, min: sumBy(db.focus.filter(f => f.date === ds), "minutes") }; });
    const goal = db.settings.goal || 0;
    const top = Math.max(goal, ...week.map(w => w.min), 1) * 1.1;
    const chart = `<div class="wbars">${goal ? `<div class="wgoal" style="bottom:${(goal / top) * 100}%"></div>` : ""}
        ${week.map(w => `<i class="${w.ds === td ? "today" : ""} ${goal && w.min >= goal ? "met" : ""}" style="height:${(w.min / top) * 100}%"></i>`).join("")}</div>
      <div class="wlabels">${week.map(w => `<span class="${w.ds === td ? "on" : ""}">${DAYS[parseYmd(w.ds).getDay()]}</span>`).join("")}</div>
      <p class="small muted">${goal ? `Goal reached on ${week.filter(w => w.min >= goal).length} of 7 days · dashed line = ${fmtMin(goal)} goal` : "Set a daily goal in Settings to see the goal line"}</p>`;
    const pick = subjectList.includes(ui.lastSubject) ? ui.lastSubject : subjectList[0];

    const control = t
      ? `<p class="center muted">${t.mode === "work" ? "Focusing: " + esc(t.subject) : "On a break ☕"}</p>
         <button class="btn primary wide" data-act="stopTimer">${t.mode === "work" ? "Finish and save" : "End break"}</button>
         ${t.mode === "work" ? `<button class="btn wide" data-act="cancelTimer">Give up (don't save)</button>` : ""}`
      : `<select id="focusSubject">${subjectList.map(s => `<option ${s === pick ? "selected" : ""}>${esc(s)}</option>`).join("")}</select>
         <button class="btn primary wide" data-act="startWork">Focus for ${db.settings.work} min</button>
         <button class="btn wide" data-act="startBreak">Break for ${db.settings.brk} min</button>`;

    return {
      title: "Focus",
      action: `<button class="txt" data-act="focusSettings">Settings</button>`,
      html: `
        <section class="card focus-card"><div id="clock" class="clock">${clockText()}</div>${control}</section>
        <section class="card"><h2>Today</h2>${goalBlock(sumBy(db.focus.filter(f => f.date === td), "minutes"))}</section>
        <section class="card"><h2>This week <span>${fmtMin(sumBy(week, "min"))}</span></h2>${chart}</section>
        <section class="card"><h2>This week by subject <span>${fmtMin(rows.reduce((s, r) => s + r[1], 0))}</span></h2>
          ${rows.map(([s, m]) => `<div class="barrow"><div class="small"><b>${esc(s)}</b> <span class="muted">${fmtMin(m)}</span></div>
            <div class="meter"><i style="width:${(m / max) * 100}%;background:${esc(colorOf(s))}"></i></div></div>`).join("") || empty("Nothing recorded this week")}
        </section>
        ${recent.length ? `<section class="card"><h2>Recent sessions</h2>${recent.map(f => `
          <div class="row"><div class="grow"><b>${esc(f.subject)}</b> <span class="muted small">${fmtDate(f.date)}</span></div>
            <span class="small">${fmtMin(f.minutes)}</span><button class="x" data-act="delFocus" data-id="${f.id}">×</button></div>`).join("")}</section>` : ""}`,
    };
  },

  more() {
    const exam = db.exams.filter(e => daysUntil(e.date) >= 0).sort((a, b) => a.date.localeCompare(b.date))[0];
    const monthOut = sumBy(db.money.filter(x => x.type === "out" && x.date.startsWith(ymd().slice(0, 7))), "amount");
    const nextHol = [...db.holidays].filter(x => (x.end || x.start) >= ymd()).sort((a, b) => a.start.localeCompare(b.start))[0];
    const firstDoc = [...db.docs].sort((a, b) => a.expiry.localeCompare(b.expiry))[0];
    const o = overallGrade();
    // [page, icon, bubble colour, name, short note]
    const groups = [
      ["School", [
        ["schedule", "📚", "120,170,255", "Timetable", sched().name],
        ["holidays", "🏖️", "120,220,160", "Terms & holidays", termLabel(ymd()) || (nextHol ? `Next: ${nextHol.name}` : "None yet")],
        ["modules", "📘", "110,210,230", db.settings.gradeSystem === "ib" ? "IB grades & subjects" : "Modules & grades",
          db.settings.gradeSystem === "ib" ? (db.modules.length ? `IB total ${ibTotal().total} / 45` : "Grades, TOK/EE, teachers")
          : o ? `Overall ${db.settings.gradeSystem === "gpa" ? "GPA " + o.gpa.toFixed(2) : pct(o.avg)}` : "Marks, lecturers, office hours"],
        ["exams", "⏰", "255,196,77", "Exam countdown", exam ? `${exam.name} in ${plural(daysUntil(exam.date), "day")}` : "No exams yet"],
      ]],
      ["Uni & abroad", [
        ["unis", "🎓", "190,150,255", "Uni applications", `${db.unis.length} ${db.unis.length === 1 ? "university" : "universities"}`],
        ["docs", "🛂", "255,160,110", "Documents & prep", firstDoc ? `${firstDoc.name} expires ${fmtDate(firstDoc.expiry)}` : `Before you go ${db.prep.filter(i => i.done).length}/${db.prep.length}`],
      ]],
      ["Life", [
        ["money", "🐷", "255,150,190", "Money", `This month: ${money(monthOut)}`],
        ["habits", "🌱", "120,220,160", "Habits", plural(db.habits.length, "habit")],
      ]],
      ["Settings", [
        ["reminders", "🔔", "255,196,77", "Reminders", db.settings.taskRemind ? `Homework & exams at ${db.settings.taskRemind}` : "Homework & exams off"],
        ["appearance", "🎨", "255,150,190", "Appearance", "Home cards, colours, background"],
        ["settings", "☁️", "120,170,255", "Sync & backup", sync && sync.token ? `Synced ${sync.lastSync ? hhmm(sync.lastSync) : ""}` : "Cloud sync is off"],
      ]],
    ];
    return {
      title: "More",
      html: groups.map(([g, rows]) => `<h3 class="group">${g}</h3><section class="card">${rows.map(([id, ic, rgb, name, sub]) => `
        <div class="row" data-act="open" data-id="${id}"><span class="icon" style="background:rgba(${rgb},.25)">${ic}</span>
          <div class="grow"><b>${name}</b><div class="muted small">${esc(sub)}</div></div><span class="muted">›</span></div>`).join("")}</section>`).join(""),
    };
  },

  search() {
    return {
      title: "Search",
      html: `<input id="searchBox" class="search" type="search" data-input="search" value="${esc(ui.query || "")}" placeholder="Events, to-dos, homework, people…" autocomplete="off" autocapitalize="off">
        <div id="results">${searchResults(ui.query || "")}</div>`,
    };
  },

  holidays() {
    const list = [...db.holidays].sort((a, b) => b.start.localeCompare(a.start));
    const td = ymd();
    const row = h => `<div class="row" data-act="editHoliday" data-id="${h.id}">
        <div class="grow"><b>🏖️ ${esc(h.name)}</b><div class="muted small">${fmtDate(h.start)}${h.end && h.end !== h.start ? " – " + fmtDate(h.end) : ""}</div></div>
        ${h.start <= td && td <= (h.end || h.start) ? '<span class="pill now">Now</span>' : ""}</div>`;
    const coming = list.filter(h => (h.end || h.start) >= td).reverse(), past = list.filter(h => (h.end || h.start) < td);
    const terms = [...db.terms].sort((a, b) => a.start.localeCompare(b.start));
    const schedName = id => (db.schedules.find(s => s.id === id) || {}).name || "(deleted timetable)";
    return {
      title: "Terms & holidays",
      html: `
        <section class="card"><h2>Terms <a data-act="addTerm">＋ Add</a></h2>
          ${terms.map(t => `<div class="row" data-act="editTerm" data-id="${t.id}">
            <div class="grow"><b>${esc(t.name)}</b><div class="muted small">${fmtDate(t.start)} – ${fmtDate(t.end)} · ${esc(schedName(t.sched))}</div></div>
            ${t.start <= td && td <= t.end && t.sched === sched().id ? `<span class="pill now">Week ${weekOf(t, td)}</span>` : ""}</div>`).join("")
            || empty("No terms yet")}
          <p class="small muted">A term belongs to one timetable. When that timetable has terms, Today shows the week number, and classes only appear during terms (and only in the weeks you set for each class).</p></section>
        <section class="card"><h2>Holidays <a data-act="addHoliday">＋ Add</a></h2>
          ${coming.map(row).join("") || empty("No holidays yet")}
          <p class="small muted">Classes are hidden on holidays (app and widget). Reading week works well as a holiday.</p></section>
        ${past.length ? `<section class="card"><h2>Past holidays</h2>${past.map(row).join("")}</section>` : ""}`,
    };
  },

  modules() {
    const o = overallGrade(), sys = db.settings.gradeSystem, ib = sys === "ib";
    const s = db.settings, it = ib && ibTotal(), target = Number(s.ibTarget) || 0;
    const sel = (key, opts) => `<select data-change="ibSetting" data-key="${key}">${opts.map(([v, l]) => `<option value="${v}" ${v === (s[key] || "") ? "selected" : ""}>${l}</option>`).join("")}</select>`;
    const ibCards = ib ? `
        <section class="card"><h2>IB total <span>${it.n}/6 subjects graded</span></h2>
          <p class="big">${it.total} <small class="muted">/ 45</small></p>
          <p class="small muted">Subjects ${it.subjects}${it.core == null ? " · add TOK & EE grades below" : it.core < 0 ? " · ⚠️ an E in TOK or EE fails the diploma" : ` + core ${it.core}`}</p>
          ${target ? `<p class="small">${it.total >= target ? `🎉 On target (${target})` : `<b>${target - it.total}</b> more points needed for ${target}`}</p>` : ""}</section>
        <section class="card"><h2>Core & target</h2>
          <div class="core-grid"><label>TOK ${sel("ibTok", CORE_GRADES)}</label><label>EE ${sel("ibEe", CORE_GRADES)}</label>
            <label>Target ${sel("ibTarget", [["", "—"], ...[...Array(22)].map((_, i) => [String(45 - i), String(45 - i)])])}</label></div>
          <p class="small muted">Set each subject's IB grade (1–7) inside the subject. Target = your offer, e.g. 36.</p></section>` : "";
    return {
      title: ib ? "IB subjects & grades" : "Modules & grades",
      action: `<button data-act="addModule">＋</button>`,
      html: `
        ${ibCards}
        ${ib && !db.modules.length ? `<button class="btn wide primary" data-act="importIB">📚 Add my subjects from the timetable</button>` : ""}
        ${!ib && o ? `<section class="card"><h2>Overall <span>${plural(o.n, "module")} with marks</span></h2>
          <p class="big">${sys === "gpa" ? "GPA " + o.gpa.toFixed(2) : pct(o.avg)} <small class="muted">${sys === "gpa" ? pct(o.avg) : gradeLabel(o.avg)}</small></p>
          <p class="small muted">Weighted by credits.</p></section>` : ""}
        <section class="card">${db.modules.map(m => { const a = moduleAvg(m); return `
          <div class="row" data-act="openModule" data-id="${m.id}">
            <i class="bar" style="background:${esc(colorOf(m.name))}"></i>
            <div class="grow"><b>${esc(m.name)}</b><div class="muted small">${m.credits ? m.credits + " credits · " : ""}${m.items.length ? `${scored(m).length}/${m.items.length} marked` : "No assessments yet"}</div></div>
            ${ib ? `<div class="right"><b class="ibgrade">${m.ib || "—"}</b><div class="small muted">${esc(m.level || "")}</div></div>`
              : a != null ? `<div class="right"><b>${pct(a)}</b><div class="small muted">${gradeLabel(a)}</div></div>` : ""}</div>`; }).join("")
          || empty("No modules yet — tap ＋ at the top right<br>Each module has its assessments & marks,<br>plus People (lecturers, email, office hours)")}</section>
        <section class="card"><h2>Grading system</h2>
          <select data-change="gradeSystem">${GRADE_SYSTEMS.map(([v, l]) => `<option value="${v}" ${v === sys ? "selected" : ""}>${l}</option>`).join("")}</select></section>`,
    };
  },

  module() {
    const m = curModule();
    if (!m) { ui.page = "modules"; return VIEWS.modules(); }
    const a = moduleAvg(m), need = neededFor(m), totalW = sumBy(m.items, "weight");
    let needText = "";
    if (need) needText = need.need <= 0 ? `🎉 ${pct(m.target)} is already secured` : need.need > 100 ? `${pct(m.target)} is no longer reachable — max is ${pct(((a * (100 - need.rest)) + 100 * need.rest) / 100)}` : `Need <b>${pct(need.need)}</b> on the remaining ${need.rest}% to get ${pct(m.target)}${gradeLabel(m.target) ? " (" + gradeLabel(m.target) + ")" : ""}`;
    return {
      title: m.name,
      action: `<button class="txt" data-act="editModule" data-id="${m.id}">Edit</button>`,
      html: `
        ${db.settings.gradeSystem === "ib" ? `<section class="card" data-act="editModule" data-id="${m.id}"><h2>IB grade <span>${esc(m.level || "")}</span></h2>
          <p class="big">${m.ib || "—"} <small class="muted">/ 7</small></p><p class="small muted">Tap to change</p></section>` : ""}
        <section class="card"><h2>${db.settings.gradeSystem === "ib" ? "Assessment average" : "Current mark"} ${m.credits ? `<span>${m.credits} credits</span>` : ""}</h2>
          <p class="big">${a != null ? pct(a) : "—"} <small class="muted">${gradeLabel(a)}</small></p>
          ${needText ? `<p class="small">${needText}</p>` : ""}
          ${totalW && totalW !== 100 ? `<p class="small late">Weights add up to ${totalW}%, not 100%</p>` : ""}</section>
        <section class="card"><h2>Assessments <a data-act="addAssess">＋ Add</a></h2>
          ${m.items.map((it, i) => `<div class="row" data-act="editAssess" data-id="${i}">
            <div class="grow"><b>${esc(it.name)}</b><div class="muted small">${it.weight}% of the module</div></div>
            <b>${it.score !== "" && it.score != null ? pct(it.score) : '<span class="muted">—</span>'}</b></div>`).join("")
            || empty("e.g. Problem sheets 10%, Midterm 20%, Final exam 70%")}</section>
        <section class="card"><h2>People <a data-act="addPerson">＋ Add</a></h2>
          ${m.people.map((p, i) => `<div class="row">
            <div class="grow" data-act="editPerson" data-id="${i}"><b>${esc(p.name)}</b> <span class="muted small">${esc(p.role)}</span>
              <div class="muted small">${p.ohDay !== "" && p.ohDay != null && p.ohStart ? `Office hours: ${DAYS[p.ohDay]} ${p.ohStart}${p.ohEnd ? "–" + p.ohEnd : ""}${p.ohPlace ? " · " + esc(p.ohPlace) : ""}` : "No office hours set"}</div></div>
            ${p.email ? `<a class="maillink" href="mailto:${esc(p.email)}">Email</a>` : ""}</div>`).join("")
            || empty("Add lecturers, tutors and TAs<br>Office hours show up in your calendar")}</section>
        ${m.link ? `<a class="btn wide" href="${esc(m.link)}" target="_blank" rel="noopener">🔗 Open course page</a>` : ""}`,
    };
  },

  docs() {
    const list = [...db.docs].sort((a, b) => a.expiry.localeCompare(b.expiry));
    const left = s => { const n = daysUntil(s); return n < 0 ? `<span class="late">Expired</span>` : `<span class="${n <= 90 ? "soon" : "muted small"}">${n === 0 ? "Today" : n + " days"}</span>`; };
    return {
      title: "Documents & prep",
      action: `<button data-act="addDoc">＋</button>`,
      html: `
        <section class="card"><h2>Expiry dates</h2>
          ${list.map(d => `<div class="row" data-act="editDoc" data-id="${d.id}">
            <div class="grow"><b>🛂 ${esc(d.name)}</b><div class="muted small">${fmtDate(d.expiry)}${d.note ? " · " + esc(d.note) : ""}</div></div>${left(d.expiry)}</div>`).join("")
            || empty("Add your passport, visa, insurance…<br>You'll be reminded 3 months, 1 month and 1 week before")}</section>
        <section class="card"><h2>Before you go <span>${db.prep.filter(i => i.done).length}/${db.prep.length}</span></h2>
          ${db.prep.map((it, i) => checkItem(it, i, "Prep")).join("")}
          <form class="inline" data-form="addPrep"><input name="text" placeholder="Add an item…" autocomplete="off"><button class="btn">＋</button></form></section>`,
    };
  },

  reminders() {
    const on = sync && sync.token;
    return {
      title: "Reminders",
      html: `
        <section class="card"><h2>How it works</h2>
          <p class="small">iPhone notifications are sent by your <b>Class Schedule</b> widget in Scriptable. It reads Tick's synced data and sets the reminders for the next 7 days.</p>
          <p class="small muted">Needs: cloud sync on${on ? " ✅" : " ❌ (turn it on in Sync & backup)"}, the Class Schedule widget on your home screen, and notifications allowed for Scriptable. New reminders are picked up the next time the widget refreshes (usually within 15–30 min).</p></section>
        <section class="card"><h2>Documents</h2>
          <p class="small muted">Passport, visa etc. from Documents & prep: reminded 3 months, 1 month, 1 week before and on the day they expire (9:00).</p></section>
        <section class="card"><h2>Events</h2>
          <p class="small muted">Choose a reminder for each event when you add or edit it (default: 30 min before).</p></section>
        <section class="card"><h2>Homework & exams</h2>
          <label class="field"><span>Remind me the evening before, at</span>
            <select data-change="taskRemind">${TASK_REMIND_TIMES.map(([v, l]) => `<option value="${v}" ${v === (db.settings.taskRemind || "") ? "selected" : ""}>${l}</option>`).join("")}</select></label></section>`,
    };
  },

  exams() {
    const sorted = [...db.exams].sort((a, b) => a.date.localeCompare(b.date));
    const coming = sorted.filter(e => daysUntil(e.date) >= 0);
    const past = sorted.filter(e => daysUntil(e.date) < 0).reverse();
    const row = e => {
      const n = daysUntil(e.date);
      return `<div class="row" data-act="editExam" data-id="${e.id}">
        <div class="count"><b>${n < 0 ? "✓" : n}</b><small>${n < 0 ? "done" : n === 0 ? "today!" : "days"}</small></div>
        <div class="grow"><b>${esc(e.name)}</b><div class="muted small">${fmtDate(e.date)}${e.note ? " · " + esc(e.note) : ""}</div></div></div>`;
    };
    return {
      title: "Exam countdown",
      action: `<button data-act="addExam">＋</button>`,
      html: `<section class="card">${coming.map(row).join("") || empty("No exams yet — tap ＋ at the top right to add one")}</section>
        ${past.length ? `<section class="card"><h2>Finished</h2>${past.map(row).join("")}</section>` : ""}`,
    };
  },

  unis() {
    const list = [...db.unis].sort((a, b) => (a.deadline || "9999").localeCompare(b.deadline || "9999"));
    return {
      title: "Uni applications",
      action: `<button data-act="addUni">＋</button>`,
      html: `<section class="card">${list.map(u => `
        <div class="row" data-act="openUni" data-id="${u.id}">
          <div class="grow"><b>${esc(u.name)}</b>
            <div class="muted small">${esc([u.program, u.country].filter(Boolean).join(" · "))}</div>
            <div class="small">${u.deadline ? fmtDate(u.deadline) + " " + dueLabel(u.deadline) : '<span class="muted">No deadline set</span>'}
              <span class="muted">· Ready ${u.items.filter(i => i.done).length}/${u.items.length}</span></div></div>
          <span class="pill">${esc(u.status)}</span>
        </div>`).join("") || empty("No universities yet — tap ＋ at the top right to add one")}</section>`,
    };
  },

  uni() {
    const u = curUni();
    if (!u) { ui.page = "unis"; return VIEWS.unis(); }
    return {
      title: u.name,
      action: `<button class="txt" data-act="editUni" data-id="${u.id}">Edit</button>`,
      html: `
        <section class="card"><h2>Details <span class="pill">${esc(u.status)}</span></h2>
          <div>${esc([u.program, u.country].filter(Boolean).join(" · ")) || '<span class="muted">(no course entered)</span>'}</div>
          <div class="small">Deadline: ${u.deadline ? fmtDate(u.deadline) + " " + dueLabel(u.deadline) : "not set"}</div></section>
        <section class="card"><h2>Checklist <span>${u.items.filter(i => i.done).length}/${u.items.length}</span></h2>
          ${u.items.map((it, i) => checkItem(it, i)).join("") || empty("No items")}
          <form class="inline" data-form="addItem"><input name="text" placeholder="Add an item…" autocomplete="off"><button class="btn">＋</button></form></section>
        ${u.notes ? `<section class="card"><h2>Notes</h2><p class="pre">${esc(u.notes)}</p></section>` : ""}`,
    };
  },

  money() {
    const [y, m] = ui.month.split("-").map(Number);
    const items = db.money.filter(x => x.date.startsWith(ui.month)).sort((a, b) => b.date.localeCompare(a.date));
    const out = items.filter(x => x.type === "out"), inc = items.filter(x => x.type === "in");
    const outSum = sumBy(out, "amount"), incSum = sumBy(inc, "amount"), budget = Number(db.settings.budget) || 0;
    const cats = {};
    out.forEach(x => { cats[x.category] = (cats[x.category] || 0) + x.amount; });
    const catRows = Object.entries(cats).sort((a, b) => b[1] - a[1]);
    const groups = {};
    items.forEach(x => (groups[x.date] ||= []).push(x));
    return {
      title: "Money",
      action: `<button data-act="addMoney">＋</button>`,
      html: `
        <div class="month"><button data-act="month" data-id="-1">‹</button><b>${MONTHS_FULL[m - 1]} ${y}</b><button data-act="month" data-id="1">›</button></div>
        <section class="card stats">
          <div><span class="muted small">Spent</span><b>${money(outSum)}</b></div>
          <div><span class="muted small">Income</span><b class="pos">${money(incSum)}</b></div>
          <div><span class="muted small">Balance</span><b>${money(incSum - outSum)}</b></div></section>
        <section class="card"><h2>Monthly budget <a data-act="moneySettings">Settings</a></h2>
          ${budget ? `<p class="small"><b>${money(budget - outSum)}</b> ${budget >= outSum ? "left" : "over budget"} of ${money(budget)}</p>
            <div class="meter"><i style="width:${Math.min(100, (outSum / budget) * 100)}%;background:${outSum > budget ? "var(--danger)" : outSum > budget * 0.8 ? "var(--warn)" : "var(--ok)"}"></i></div>`
            : `<p class="small muted">No budget set. Tap Settings to set one and choose your currency.</p>`}</section>
        <section class="card"><h2>Fixed every month <a data-act="addRecurring">＋ Add</a></h2>
          ${db.recurring.map(x => `<div class="row" data-act="editRecurring" data-id="${x.id}">
            <div class="grow"><b>${esc(x.category)}</b>${x.note ? ` <span class="muted small">${esc(x.note)}</span>` : ""}<div class="muted small">Day ${x.day} of every month</div></div>
            <b class="${x.type === "in" ? "pos" : ""}">${x.type === "in" ? "+" : "−"}${money(x.amount)}</b></div>`).join("")
            || `<p class="small muted">Rent, phone bill, subscriptions… recorded automatically each month.</p>`}</section>
        ${catRows.length ? `<section class="card"><h2>Spending by category</h2>${catRows.map(([c, v], i) => `
          <div class="barrow"><div class="small"><b>${esc(c)}</b> <span class="muted">${money(v)} · ${Math.round((v / outSum) * 100)}%</span></div>
          <div class="meter"><i style="width:${(v / catRows[0][1]) * 100}%;background:${PALETTE[i % PALETTE.length]}"></i></div></div>`).join("")}</section>` : ""}
        <section class="card">${Object.keys(groups).map(d => `<h3 class="date">${fmtDate(d)}</h3>` + groups[d].map(x => `
          <div class="row" data-act="editMoney" data-id="${x.id}">
            <div class="grow"><b>${esc(x.category)}</b>${x.note ? ` <span class="muted small">${esc(x.note)}</span>` : ""}</div>
            <b class="${x.type === "in" ? "pos" : ""}">${x.type === "in" ? "+" : "−"}${money(x.amount)}</b></div>`).join("")).join("") || empty("Nothing recorded this month")}</section>`,
    };
  },

  habits() {
    const days = [...Array(7)].map((_, i) => ymd(addDays(new Date(), i - 6)));
    return {
      title: "Habits",
      action: `<button data-act="addHabit">＋</button>`,
      html: db.habits.map(h => `
        <section class="card">
          <div class="row" data-act="editHabit" data-id="${h.id}"><b class="grow">${esc(h.icon)} ${esc(h.name)}</b>
            <span class="small muted">🔥 ${plural(streak(h.id), "day")} streak</span></div>
          <div class="dots">${days.map((d, i) => `<button class="${habitDone(h.id, d) ? "on" : ""}" data-act="toggleHabit" data-id="${h.id}|${d}">${i === 6 ? "Tdy" : DAYS[parseYmd(d).getDay()]}</button>`).join("")}</div>
        </section>`).join("") || `<section class="card">${empty("No habits yet — tap ＋ at the top right to add one<br>e.g. 💧 Drink water, 🏃 Exercise, 📖 Read")}</section>`,
    };
  },

  settings() {
    const on = sync && sync.token;
    return {
      title: "Sync & backup",
      html: `
        <section class="card"><h2>☁️ Cloud sync (private GitHub repo)</h2>
          ${on ? `
            <p class="small">Connected: <b>${esc(sync.repo)}</b></p>
            <p class="small muted" id="syncStatus">${syncStatusText()}</p>
            <button class="btn wide" data-act="syncNow">🔄 Sync now</button>
            <button class="btn wide danger" data-act="syncOff">Disconnect (data stays on phone and in the cloud)</button>`
          : `<p class="small muted">When on, your data is saved automatically to your own private GitHub repo. If Safari data is cleared or you change phones, reconnect to get everything back. The home-screen widget reads this data too.</p>
            <button class="btn primary wide" data-act="syncSetup">Turn on cloud sync</button>`}
        </section>
        <section class="card"><h2>Manual backup</h2>
          <p class="small muted">${db.lastBackup ? `Last backup: ${fmtDate(db.lastBackup)}` : "No manual backup yet."}</p>
          <button class="btn wide" data-act="exportShare">📤 Export backup file</button>
          <button class="btn wide" data-act="copyBackup">📋 Copy backup text</button></section>
        <section class="card"><h2>Restore</h2>
          <label class="btn wide">📂 Import backup file<input type="file" accept=".json,application/json,text/plain" data-change="importFile" hidden></label>
          <button class="btn wide" data-act="pasteBackup">📝 Paste backup text</button></section>
        <section class="card"><h2>Data</h2>
          <p class="small muted">${plural(db.schedules.length, "timetable")} · ${plural(db.todos.length, "to-do")} · ${db.tasks.length} homework · ${plural(db.events.length, "event")} · ${plural(db.money.length, "money record")}</p>
          <button class="btn wide danger" data-act="resetAll">Erase data on this phone</button></section>`,
    };
  },
};

function render() {
  const v = VIEWS[ui.page || ui.tab]();
  $("#title").textContent = v.title;
  $("#back").hidden = !ui.page;
  $("#topAction").innerHTML = v.action || "";
  $("#view").innerHTML = v.html;
  $("#fab").hidden = !(ui.tab === "today" && !ui.page);
  document.querySelectorAll("#tabs button").forEach(b => b.classList.toggle("on", b.dataset.tab === ui.tab));
  applyTheme();
}

// ===== Forms (sheet that slides up from the bottom) =====
let formState = null;

function field(f, v) {
  v = v ?? "";
  const id = "f_" + f.key;
  if (f.type === "color") {
    const opts = !v || PALETTE.includes(v) ? PALETTE : [...PALETTE, v];
    return `<div class="field"><span>${esc(f.label)}</span><div class="swatches">${opts.map(c => `
      <label><input type="radio" name="${f.key}" value="${c}" ${c === (v || PALETTE[0]) ? "checked" : ""}><i style="background:${esc(c)}"></i></label>`).join("")}</div></div>`;
  }
  let input;
  if (f.type === "select") {
    input = `<select id="${id}" name="${f.key}">${f.options.map(o => {
      const [val, label] = Array.isArray(o) ? o : [o, o];
      return `<option value="${esc(val)}" ${String(val) === String(v) ? "selected" : ""}>${esc(label)}</option>`;
    }).join("")}</select>`;
  } else if (f.type === "textarea") {
    input = `<textarea id="${id}" name="${f.key}" rows="4" ${f.required ? "required" : ""}>${esc(v)}</textarea>`;
  } else {
    input = `<input id="${id}" name="${f.key}" type="${f.type}" value="${esc(v)}" ${f.required ? "required" : ""}
      ${f.ph ? `placeholder="${esc(f.ph)}"` : ""} ${f.type === "number" ? 'inputmode="decimal" step="any"' : ""}
      ${f.list ? `list="${id}_l"` : ""} autocomplete="off" autocapitalize="off">` +
      (f.list ? `<datalist id="${id}_l">${f.list.map(x => `<option value="${esc(x)}">`).join("")}</datalist>` : "");
  }
  return `<label class="field" for="${id}"><span>${esc(f.label)}</span>${input}${f.hint ? `<small class="muted">${f.hint}</small>` : ""}</label>`;
}

// onSave(values) returns a string = error message; returns true = it handled everything itself
// extra = optional HTML for more buttons under the form
function form(title, fields, values, onSave, onDelete, extra = "") {
  formState = { fields, onSave, onDelete };
  $("#modal").innerHTML = `
    <div class="backdrop" data-act="closeModal"></div>
    <div class="sheet">
      <div class="sheet-head"><button type="button" data-act="closeModal">Cancel</button><b>${esc(title)}</b>
        <button type="button" class="strong" data-act="submitForm">Save</button></div>
      <form id="f" data-form="modalForm">${fields.map(f => field(f, values[f.key])).join("")}<button hidden></button></form>
      ${extra}
      ${onDelete ? `<button type="button" class="btn danger wide" data-act="deleteForm">Delete</button>` : ""}
    </div>`;
  $("#modal").hidden = false;
}

function closeModal() {
  $("#modal").hidden = true;
  $("#modal").innerHTML = "";
  formState = null;
}

async function submitForm() {
  const f = $("#f");
  if (!f.reportValidity()) return;
  const fd = new FormData(f), v = {};
  formState.fields.forEach(x => {
    const raw = fd.get(x.key) ?? "";
    v[x.key] = x.type === "number" ? (raw === "" && x.optional ? "" : Number(raw)) : String(raw).trim();
  });
  const res = await formState.onSave(v);
  if (res) { if (res !== true) toast(res); return; }
  save(); closeModal(); render();
}

function deleteForm() {
  const snap = JSON.stringify(db);
  const res = formState.onDelete();
  if (res) return toast(res);
  save(); closeModal(); render();
  toast("Deleted", undoTo(snap));
}

function classForm(c) {
  const isNew = !c;
  const values = c || { day: ui.day, start: "08:10", end: "09:00", color: PALETTE[0] };
  form(isNew ? "New class" : "Edit class", [
    { key: "name", label: "Subject", type: "text", required: true, list: subjects().filter(s => s !== "Other") },
    { key: "day", label: "Day", type: "select", options: WEEK_ORDER.map(i => [i, DAYS_FULL[i]]) },
    { key: "start", label: "Start", type: "time", required: true },
    { key: "end", label: "End", type: "time", required: true },
    { key: "room", label: "Room / note", type: "text", ph: "e.g. A201, period 3" },
    { key: "kind", label: "Type", type: "select", options: CLASS_KINDS },
    { key: "weeks", label: "Weeks (only if the timetable has terms)", type: "text", ph: "Every week", hint: "e.g. 1-10 · 1-5, 7-11 · odd · even" },
    { key: "color", label: "Colour (changes for the whole subject)", type: "color" },
  ], values, v => {
    if (toMin(v.end) <= toMin(v.start)) return "End time must be after start time";
    v.day = Number(v.day);
    if (isNew) sched().classes.push({ id: uid(), ...v });
    else Object.assign(c, v);
    sched().classes.forEach(x => { if (x.name === v.name) x.color = v.color; });
    ui.day = v.day;
  }, isNew ? null : () => { sched().classes = sched().classes.filter(x => x !== c); });

  // Typing an existing subject picks its colour automatically
  $("#f_name").addEventListener("input", e => {
    const same = sched().classes.find(x => x.name === e.target.value.trim());
    const radio = same && $(`#f input[name=color][value="${same.color}"]`);
    if (radio) radio.checked = true;
  });
}

function todoForm(t, date) {
  const isNew = !t;
  form(isNew ? "New to-do" : "Edit to-do", [
    { key: "text", label: "What to do", type: "text", required: true },
    { key: "date", label: "Date (optional)", type: "date" },
    { key: "priority", label: "Priority", type: "select", options: PRIORITIES },
    { key: "repeat", label: "Repeat (next one appears when you tick it off)", type: "select", options: REPEATS },
    { key: "note", label: "Note", type: "textarea" },
  ], t || { date: date ?? ymd(), priority: 0, repeat: "none" }, v => {
    v.priority = Number(v.priority);
    if (v.repeat !== "none" && !v.date) v.date = ymd(); // repeating needs a date to count from
    if (isNew) db.todos.push({ id: uid(), done: false, ...v });
    else Object.assign(t, v);
  }, isNew ? null : () => { db.todos = db.todos.filter(x => x !== t); });
}

function taskForm(t, due) {
  const isNew = !t;
  form(isNew ? "New homework" : "Edit homework", [
    { key: "title", label: "Name", type: "text", required: true, ph: "e.g. Math IA first draft" },
    { key: "subject", label: "Subject", type: "select", options: subjects() },
    { key: "type", label: "Type", type: "select", options: TASK_TYPES },
    { key: "due", label: "Due date", type: "date" },
    { key: "note", label: "Note", type: "textarea" },
  ], t || { type: "Homework", due: due || ymd(addDays(new Date(), 7)) }, v => {
    if (isNew) db.tasks.push({ id: uid(), done: false, ...v });
    else Object.assign(t, v);
  }, isNew ? null : () => { db.tasks = db.tasks.filter(x => x !== t); });
}

function eventForm(e, date) {
  const isNew = !e;
  form(isNew ? "New event" : "Edit event", [
    { key: "title", label: "Event", type: "text", required: true, ph: "e.g. Tutoring, dentist, club" },
    { key: "date", label: isNew ? "Start date" : "Start date (first day if it repeats)", type: "date", required: true },
    { key: "endDate", label: "End date (only for multi-day events)", type: "date" },
    { key: "start", label: "Start time (empty = all day)", type: "time" },
    { key: "end", label: "End time (multi-day = time it ends on the last day)", type: "time" },
    { key: "repeat", label: "Repeat", type: "select", options: REPEATS },
    { key: "remind", label: "Reminder", type: "select", options: REMINDS },
    { key: "color", label: "Colour", type: "color" },
    { key: "note", label: "Note", type: "textarea" },
  ], e || { date: date || ymd(), repeat: "none", remind: "30", color: PALETTE[8] }, v => {
    // Start date changed but end date left alone: move the end date along with it
    if (!isNew && e.endDate && v.endDate === e.endDate && v.date !== e.date) v.endDate = ymd(addDays(parseYmd(e.endDate), daysBetween(e.date, v.date)));
    if (v.endDate && v.endDate < v.date) return "End date can't be before the start date";
    if (v.endDate === v.date) v.endDate = "";
    if (!v.endDate && v.start && v.end && toMin(v.end) <= toMin(v.start)) return "End time must be after start time";
    if (!v.start) v.end = "";
    if (isNew) db.events.push({ id: uid(), ...v });
    else Object.assign(e, v);
  }, isNew ? null : () => { db.events = db.events.filter(x => x !== e); },
  isNew ? "" : `<button type="button" class="btn wide" data-act="moveEvent" data-id="${e.id}">📅 Move to another day</button>`);
}

// Move an event to a new start date; multi-day events keep their length
function moveEventForm(e) {
  form("Move event", [
    { key: "date", label: `Move "${e.title}" to`, type: "date", required: true, hint: spanOf(e) > 1 ? `All ${spanOf(e)} days move together.` : "" },
  ], { date: e.date }, v => {
    const shift = daysBetween(e.date, v.date);
    if (e.endDate) e.endDate = ymd(addDays(parseYmd(e.endDate), shift));
    e.date = v.date;
    ui.selDate = v.date; ui.calMonth = v.date.slice(0, 7);
    toast(`Moved to ${fmtDate(v.date)} ✅`);
  });
}

function examForm(e) {
  const isNew = !e;
  form(isNew ? "New exam" : "Edit exam", [
    { key: "name", label: "Exam name", type: "text", required: true, ph: "e.g. IB finals, Mock exam" },
    { key: "date", label: "Date", type: "date", required: true },
    { key: "note", label: "Note", type: "text" },
  ], e || {}, v => {
    if (isNew) db.exams.push({ id: uid(), ...v });
    else Object.assign(e, v);
  }, isNew ? null : () => { db.exams = db.exams.filter(x => x !== e); },
  !isNew && daysUntil(e.date) > 0 ? `<button type="button" class="btn wide" data-act="planRevision" data-id="${e.id}">📖 Plan revision</button>` : "");
}

// Spread revision topics as to-dos over the days before the exam
function revisionForm(exam) {
  form("Plan revision", [
    { key: "topics", label: `Topics to revise for ${exam.name} (one per line)`, type: "textarea", required: true },
    { key: "start", label: "Start revising on", type: "date", required: true },
    { key: "review", label: "Day before the exam", type: "select", options: [["yes", "Full review"], ["no", "Topics as normal"]] },
  ], { start: ymd(), review: "yes" }, v => {
    const topics = v.topics.split("\n").map(t => t.trim()).filter(Boolean);
    const last = ymd(addDays(parseYmd(exam.date), v.review === "yes" ? -2 : -1)); // last day for topics
    const days = daysBetween(v.start, last) + 1;
    if (!topics.length) return "Add at least one topic";
    if (v.start >= exam.date) return "Start before the exam date";
    if (days < 1) return "Not enough days — pick an earlier start date";
    topics.forEach((t, i) => db.todos.push({ id: uid(), text: `📖 ${t} (${exam.name})`, date: ymd(addDays(parseYmd(v.start), Math.floor((i * days) / topics.length))), priority: 1, done: false }));
    if (v.review === "yes") db.todos.push({ id: uid(), text: `📖 Full review (${exam.name})`, date: ymd(addDays(parseYmd(exam.date), -1)), priority: 2, done: false });
    toast(`Added ${topics.length + (v.review === "yes" ? 1 : 0)} revision to-dos ✅`);
  });
}

function termForm(t) {
  const isNew = !t;
  form(isNew ? "New term" : "Edit term", [
    { key: "name", label: "Name", type: "text", required: true, ph: "e.g. Term 1, Fall semester" },
    { key: "sched", label: "Timetable", type: "select", options: db.schedules.map(s => [s.id, s.name]) },
    { key: "start", label: "First day (Week 1 starts that Monday)", type: "date", required: true },
    { key: "end", label: "Last day", type: "date", required: true },
  ], t || { sched: sched().id }, v => {
    if (v.end < v.start) return "Last day can't be before the first day";
    if (isNew) db.terms.push({ id: uid(), ...v });
    else Object.assign(t, v);
  }, isNew ? null : () => { db.terms = db.terms.filter(x => x !== t); });
}

function moduleForm(m) {
  const isNew = !m, ib = db.settings.gradeSystem === "ib";
  form(isNew ? (ib ? "New subject" : "New module") : (ib ? "Edit subject" : "Edit module"), [
    { key: "name", label: ib ? "Subject" : "Module", type: "text", required: true, ph: ib ? "e.g. Physics HL" : "e.g. Linear Algebra" },
    ...(ib ? [
      { key: "level", label: "Level", type: "select", options: ["HL", "SL"] },
      { key: "ib", label: "IB grade (predicted or latest)", type: "select", options: [["", "—"], ...[7, 6, 5, 4, 3, 2, 1].map(n => [String(n), String(n)])] },
    ] : [{ key: "credits", label: "Credits (for the overall average)", type: "number", optional: true, ph: "e.g. 15" }]),
    { key: "target", label: "Target mark (%)", type: "number", required: true },
    { key: "link", label: "Course page link (Moodle / Canvas…)", type: "url", ph: "https://" },
  ], m || { target: 70, level: "HL" }, v => {
    if (isNew) { const x = { id: uid(), items: [], people: [], ...v }; db.modules.push(x); ui.pageId = x.id; ui.page = "module"; }
    else Object.assign(m, v);
  }, isNew ? null : () => { db.modules = db.modules.filter(x => x !== m); ui.page = "modules"; });
}

function assessForm(i) {
  const m = curModule(), it = m.items[i], isNew = !it;
  form(isNew ? "New assessment" : "Edit assessment", [
    { key: "name", label: "Assessment", type: "text", required: true, ph: "e.g. Final exam" },
    { key: "weight", label: "Weight (% of the module)", type: "number", required: true },
    { key: "score", label: "Your mark (%) — leave empty until you get it back", type: "number", optional: true },
  ], it || {}, v => {
    if (!(v.weight > 0)) return "Weight must be more than 0";
    if (v.score !== "" && (v.score < 0 || v.score > 100)) return "Mark must be 0–100";
    if (isNew) m.items.push(v); else Object.assign(it, v);
  }, isNew ? null : () => { m.items.splice(i, 1); });
}

function personForm(i) {
  const m = curModule(), p = m.people[i], isNew = !p;
  form(isNew ? "New person" : "Edit person", [
    { key: "name", label: "Name", type: "text", required: true, ph: "e.g. Dr Smith" },
    { key: "role", label: "Role", type: "select", options: PEOPLE_ROLES },
    { key: "email", label: "Email", type: "email" },
    { key: "ohDay", label: "Office hours day", type: "select", options: [["", "None"], ...WEEK_ORDER.map(d => [d, DAYS_FULL[d]])] },
    { key: "ohStart", label: "Office hours start", type: "time" },
    { key: "ohEnd", label: "Office hours end", type: "time" },
    { key: "ohPlace", label: "Where", type: "text", ph: "e.g. Room 3.14, Zoom" },
  ], p || { role: "Lecturer", ohDay: "" }, v => {
    if (v.ohDay !== "" && !v.ohStart) return "Add a start time for office hours";
    if (isNew) m.people.push(v); else Object.assign(p, v);
  }, isNew ? null : () => { m.people.splice(i, 1); });
}

function docForm(d) {
  const isNew = !d;
  form(isNew ? "New document" : "Edit document", [
    { key: "name", label: "Document", type: "text", required: true, list: DOC_NAMES, ph: "e.g. Passport" },
    { key: "expiry", label: "Expires on", type: "date", required: true },
    { key: "note", label: "Note", type: "text", ph: "e.g. renew at the embassy" },
  ], d || {}, v => {
    if (isNew) db.docs.push({ id: uid(), ...v }); else Object.assign(d, v);
  }, isNew ? null : () => { db.docs = db.docs.filter(x => x !== d); });
}

function recurringForm(x) {
  const isNew = !x;
  form(isNew ? "New fixed cost" : "Edit fixed cost", [
    { key: "type", label: "Type", type: "select", options: [["out", "Spent"], ["in", "Income"]] },
    { key: "amount", label: "Amount", type: "number", required: true },
    { key: "category", label: "Category", type: "select", options: MONEY_CATS },
    { key: "day", label: "Day of the month (1–28)", type: "number", required: true, hint: "If that day has already passed this month, it starts next month." },
    { key: "note", label: "Note", type: "text", ph: "e.g. Rent, phone plan, Spotify" },
  ], x || { type: "out", category: "Rent", day: 1 }, v => {
    if (!(v.amount > 0)) return "Amount must be more than 0";
    v.day = Math.round(v.day);
    if (!(v.day >= 1 && v.day <= 28)) return "Pick a day from 1 to 28";
    if (isNew) {
      // If that day already passed this month, start next month
      db.recurring.push({ id: uid(), ...v, last: v.day < new Date().getDate() ? ymd().slice(0, 7) : "" });
    } else Object.assign(x, v);
    applyRecurring();
  }, isNew ? null : () => { db.recurring = db.recurring.filter(y => y !== x); });
}

// Add this month's fixed costs once their day has come
function applyRecurring() {
  const month = ymd().slice(0, 7), today = new Date().getDate();
  let added = 0;
  db.recurring.forEach(r => {
    if (r.last === month || today < r.day) return;
    db.money.push({ id: uid(), type: r.type, amount: r.amount, category: r.category, date: `${month}-${pad(r.day)}`, note: r.note || "", auto: true });
    r.last = month; added++;
  });
  return added;
}

// Next date for a repeating to-do
function nextDate(ds, rep) {
  const d = parseYmd(ds);
  if (rep === "daily") return ymd(addDays(d, 1));
  if (rep === "weekly") return ymd(addDays(d, 7));
  const months = rep === "yearly" ? 12 : 1;
  const n = new Date(d.getFullYear(), d.getMonth() + months, 1);
  n.setDate(Math.min(d.getDate(), new Date(n.getFullYear(), n.getMonth() + 1, 0).getDate()));
  return ymd(n);
}

function holidayForm(h) {
  const isNew = !h;
  form(isNew ? "New holiday" : "Edit holiday", [
    { key: "name", label: "Name", type: "text", required: true, ph: "e.g. Christmas break" },
    { key: "start", label: "First day", type: "date", required: true },
    { key: "end", label: "Last day (empty = one day)", type: "date" },
  ], h || { start: ymd() }, v => {
    if (v.end && v.end < v.start) return "Last day can't be before the first day";
    if (isNew) db.holidays.push({ id: uid(), ...v });
    else Object.assign(h, v);
  }, isNew ? null : () => { db.holidays = db.holidays.filter(x => x !== h); });
}

function uniForm(u) {
  const isNew = !u;
  form(isNew ? "New university" : "Edit university", [
    { key: "name", label: "University", type: "text", required: true },
    { key: "program", label: "Course", type: "text", ph: "e.g. Mathematics and Statistics" },
    { key: "country", label: "Country", type: "select", options: UNI_COUNTRIES },
    { key: "deadline", label: "Deadline", type: "date" },
    { key: "status", label: "Status", type: "select", options: UNI_STATUS },
    { key: "notes", label: "Notes", type: "textarea" },
  ], u || { status: "Researching" }, v => {
    if (isNew) db.unis.push({ id: uid(), items: UNI_ITEMS.map(text => ({ text, done: false })), ...v });
    else Object.assign(u, v);
  }, isNew ? null : () => { db.unis = db.unis.filter(x => x !== u); ui.page = "unis"; });
}

function moneyForm(x) {
  const isNew = !x;
  form(isNew ? "New record" : "Edit record", [
    { key: "type", label: "Type", type: "select", options: [["out", "Spent"], ["in", "Income"]] },
    { key: "amount", label: "Amount", type: "number", required: true },
    { key: "category", label: "Category", type: "select", options: MONEY_CATS },
    { key: "date", label: "Date", type: "date", required: true },
    { key: "note", label: "Note", type: "text" },
  ], x || { type: "out", category: "Food", date: ymd() }, v => {
    if (!(v.amount > 0)) return "Amount must be more than 0";
    if (isNew) db.money.push({ id: uid(), ...v });
    else Object.assign(x, v);
    ui.month = v.date.slice(0, 7);
  }, isNew ? null : () => { db.money = db.money.filter(y => y !== x); });
}

function habitForm(h) {
  const isNew = !h;
  form(isNew ? "New habit" : "Edit habit", [
    { key: "icon", label: "Icon (one emoji)", type: "text", ph: "💧" },
    { key: "name", label: "Name", type: "text", required: true, ph: "e.g. Drink 2L of water" },
  ], h || {}, v => {
    if (isNew) db.habits.push({ id: uid(), ...v });
    else Object.assign(h, v);
  }, isNew ? null : () => { db.habits = db.habits.filter(x => x !== h); });
}

// ===== Focus timer =====
function clockText() {
  const t = db.timer;
  const sec = Math.ceil((t ? Math.max(0, t.end - Date.now()) : db.settings.work * 60000) / 1000);
  return `${pad(Math.floor(sec / 60))}:${pad(sec % 60)}`;
}

function startTimer(mode) {
  const minutes = mode === "work" ? db.settings.work : db.settings.brk;
  const subject = mode === "work" ? $("#focusSubject").value : "";
  if (subject) ui.lastSubject = subject;
  db.timer = { mode, subject, minutes, start: Date.now(), end: Date.now() + minutes * 60000 };
  save(); render();
}

function endTimer(record, finished) {
  const t = db.timer;
  if (!t) return;
  if (record && t.mode === "work") {
    const m = finished ? t.minutes : Math.floor((Date.now() - t.start) / 60000);
    if (m >= 1) db.focus.push({ id: uid(), subject: t.subject, minutes: m, date: ymd(new Date(t.start)) });
    else if (!finished) toast("Less than 1 minute — not saved");
  }
  db.timer = null;
  save(); render();
  if (finished) toast(t.mode === "work" ? `${t.minutes} min done 🍅 Take a break!` : "Break's over — you got this 💪");
}

function tick() {
  const hc = $("#homeClock");
  if (hc) hc.textContent = homeTime();
  if (!db.timer) return;
  if (Date.now() >= db.timer.end) return endTimer(true, true);
  const el = $("#clock");
  if (el) el.textContent = clockText();
}

// ===== Cloud sync (private GitHub repo) =====
// sync = { repo: "user/repo", token, path, sha, lastSync, error }; only on this phone, never in backups
let sync = null;
try { sync = JSON.parse(localStorage.getItem(SYNC_KEY)); } catch {}
const saveSync = () => localStorage.setItem(SYNC_KEY, JSON.stringify(sync));
let pushTimer = null, pushPending = false, syncBusy = false, lastPull = 0;

const b64encode = s => { let bin = ""; new TextEncoder().encode(s).forEach(b => { bin += String.fromCharCode(b); }); return btoa(bin); };
const b64decode = b => new TextDecoder().decode(Uint8Array.from(atob(b.replace(/\s/g, "")), c => c.charCodeAt(0)));

function syncStatusText() {
  if (!sync) return "";
  if (syncBusy) return "Syncing…";
  if (sync.error) return "⚠️ " + sync.error;
  return sync.lastSync ? `Last synced: ${hhmm(sync.lastSync)} ✅` : "Not synced yet";
}
function showSyncStatus() { const el = $("#syncStatus"); if (el) el.textContent = syncStatusText(); }

function gh(method, body) {
  return fetch(`https://api.github.com/repos/${sync.repo}/contents/${sync.path}`, {
    method, cache: "no-store",
    headers: { Authorization: `Bearer ${sync.token}`, Accept: "application/vnd.github+json", ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
}

function useRemote(remote) {
  db = migrate({ ...fresh(), ...remote });
  localStorage.setItem(KEY, JSON.stringify(db));
  render();
}

// Download cloud data and compare: newer cloud = use it, newer phone = upload
async function pull() {
  const res = await gh("GET");
  if (res.status === 404) { sync.sha = null; return push(false); }
  if (!res.ok) throw new Error(res.status === 401 ? "Token is wrong or expired" : "Download failed (" + res.status + ")");
  const j = await res.json();
  sync.sha = j.sha;
  const remote = JSON.parse(b64decode(j.content));
  if ((remote.updatedAt || 0) > (db.updatedAt || 0)) useRemote(remote);
  else if ((remote.updatedAt || 0) < (db.updatedAt || 0)) return push(false);
}

async function push(retry = true) {
  pushPending = false;
  const res = await gh("PUT", { message: "sync " + new Date().toISOString(), content: b64encode(JSON.stringify(db)), ...(sync.sha ? { sha: sync.sha } : {}) });
  if ((res.status === 409 || res.status === 422) && retry) return pull(); // changed on another device: compare again
  if (!res.ok) throw new Error(res.status === 401 ? "Token is wrong or expired" : "Upload failed (" + res.status + ")");
  sync.sha = (await res.json()).content.sha;
}

async function runSync(fn) {
  if (!sync || !sync.token || syncBusy) return;
  syncBusy = true; showSyncStatus();
  try {
    await fn();
    sync.lastSync = Date.now(); sync.error = null;
  } catch (e) {
    sync.error = e.message === "Failed to fetch" ? "No internet, will try again later" : e.message;
    if (fn === push) pushPending = true;
  }
  syncBusy = false; saveSync(); showSyncStatus();
  // If the app is already in the background, upload right away (timers may not run there)
  if (pushPending && !sync.error) { if (document.hidden) runSync(push); else schedulePush(); }
}

function schedulePush() {
  if (!sync || !sync.token) return;
  pushPending = true;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(() => runSync(push), 500);
}

function pullIfStale() {
  if (!sync || !sync.token || Date.now() - lastPull < 20000) return;
  lastPull = Date.now();
  runSync(pushPending ? push : pull);
}

function syncSetup() {
  form("Turn on cloud sync", [
    { key: "repo", label: "Private repo (user/repo-name)", type: "text", required: true, ph: "e.g. sam/myhq-data" },
    { key: "token", label: "GitHub Token", type: "password", required: true, hint: "Only stored on this phone" },
  ], { repo: "" }, async v => {
    const repo = v.repo.replace(/^https?:\/\/github\.com\//, "").replace(/\/$/, "");
    if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) return "It should look like: user/repo-name";
    sync = { repo, token: v.token, path: "data.json", sha: null, lastSync: null, error: null };
    try {
      const res = await gh("GET");
      if (res.status === 401) throw new Error("Wrong token");
      if (res.status === 404) {
        const check = await fetch(`https://api.github.com/repos/${repo}`, { headers: { Authorization: `Bearer ${v.token}` } });
        if (!check.ok) throw new Error("Repo not found, or the token has no access");
        await push(false); // nothing in the cloud yet: upload this phone's data
      } else if (res.ok) {
        const j = await res.json();
        sync.sha = j.sha;
        if (confirm("There's already data in the cloud.\nOK: use the cloud data (replaces this phone's)\nCancel: use this phone's data (replaces the cloud's)")) useRemote(JSON.parse(b64decode(j.content)));
        else await push(false);
      } else throw new Error("Connection failed (" + res.status + ")");
    } catch (e) {
      sync = null;
      return e.message === "Failed to fetch" ? "No internet" : e.message;
    }
    sync.lastSync = Date.now();
    saveSync(); closeModal(); render(); toast("Cloud sync is on ☁️");
    return true;
  });
}

// ===== Backup =====
async function exportShare() {
  const name = `myhq-backup-${ymd()}.json`;
  const file = new File([JSON.stringify(db)], name, { type: "application/json" });
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: name });
    } else {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(file);
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    }
    db.lastBackup = ymd(); save(); render(); toast("Backup exported ✅");
  } catch (e) {
    if (e.name !== "AbortError") toast("Export failed — try Copy backup text");
  }
}

async function copyBackup() {
  try {
    await navigator.clipboard.writeText(JSON.stringify(db));
    db.lastBackup = ymd(); save(); render();
    toast("Copied — paste it into Notes to keep it safe");
  } catch { toast("Copy failed"); }
}

function importData(text) {
  let d;
  try { d = JSON.parse(text); } catch { return toast("Can't read this backup"); }
  if (!d || !d.version || !Array.isArray(d.schedules)) return toast("This isn't a My HQ backup");
  if (!confirm("Importing replaces all current data. Continue?")) return;
  db = migrate({ ...fresh(), ...d });
  save(); closeModal();
  ui.page = null; ui.tab = "today";
  render(); toast("Import done ✅");
}

// ===== Quick add: "Math quiz fri 3pm" → event / to-do / homework =====
// Rules: has a time or "every …" → event; "hw"/"homework"/"due" → homework; "todo" or nothing else → to-do
const WEEKDAY_RE = "(sun(?:day)?|mon(?:day)?|tue(?:s|sday)?|wed(?:nesday)?|thu(?:r|rs|rsday)?|fri(?:day)?|sat(?:urday)?)";
const MONTH_RE = "(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\\.?";
const PRE = "(?:(?:on|by)\\s+)?";

function parseQuick(text, now = new Date()) {
  let s = " " + text + " ";
  const take = re => { const m = s.match(re); if (m) s = s.replace(m[0], " "); return m; };
  const today = parseYmd(ymd(now));
  const inDays = n => ymd(addDays(today, n));
  const weekday = (name, next) => {
    const wd = DAYS.findIndex(d => d.toLowerCase() === name.slice(0, 3).toLowerCase());
    const diff = (wd - today.getDay() + 7) % 7;
    return inDays(next ? (diff === 0 ? 7 : diff + 7) : diff);
  };
  // "Nov 20" or "11/20": this year, or next year if that date has already passed
  const monthDay = (mi, d) => {
    let x = new Date(today.getFullYear(), mi, d);
    if (x.getMonth() !== mi) return "";
    if (x < today) x = new Date(today.getFullYear() + 1, mi, d);
    return ymd(x);
  };
  const to24 = (h, m, p) => {
    h = Number(h); m = Number(m || 0);
    if (p) h = (h % 12) + (p.toLowerCase() === "pm" ? 12 : 0);
    return h <= 23 && m <= 59 ? `${pad(h)}:${pad(m)}` : "";
  };
  const r = { kind: null, date: "", start: "", end: "", repeat: "none" };

  if (take(/\b(?:hw|homework)\b/i)) r.kind = "task";
  else if (take(/\bto-?do\b/i)) r.kind = "todo";
  if (take(/\bdue\b/i)) r.kind = "task";

  // Repeats
  let m;
  if ((m = take(new RegExp(`\\bevery\\s+${WEEKDAY_RE}\\b`, "i")))) { r.repeat = "weekly"; r.date = weekday(m[1]); }
  else if (take(/\b(?:every\s*day|daily)\b/i)) r.repeat = "daily";
  else if (take(/\b(?:every\s*week|weekly)\b/i)) r.repeat = "weekly";
  else if (take(/\b(?:every\s*month|monthly)\b/i)) r.repeat = "monthly";
  else if (take(/\b(?:every\s*year|yearly)\b/i)) r.repeat = "yearly";

  // Times: "3-5pm", "15:00-17:00", "3pm", "3:30pm", "15:00"
  if ((m = take(/\b(?:from\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:-|–|to)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i))) {
    let p1 = m[3] || m[6];
    if (!m[3] && to24(m[1], m[2], p1) > to24(m[4], m[5], m[6])) p1 = "am"; // "11-1pm" = 11am to 1pm
    r.start = to24(m[1], m[2], p1); r.end = to24(m[4], m[5], m[6]);
  } else if ((m = take(/\b(?:from\s+)?(\d{1,2}):(\d{2})\s*(?:-|–|to)\s*(\d{1,2}):(\d{2})\b/))) {
    r.start = to24(m[1], m[2]); r.end = to24(m[3], m[4]);
  } else if ((m = take(/\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i)) || (m = take(/\b(?:at\s+)?(\d{1,2}):(\d{2})\b/))) {
    r.start = to24(m[1], m[2], m[3]);
  }

  // Dates
  if (take(new RegExp(`\\b${PRE}(?:today|tdy|tonight)\\b`, "i"))) r.date = inDays(0);
  else if (take(new RegExp(`\\b${PRE}(?:tomorrow|tmrw|tmr|tmw)\\b`, "i"))) r.date = inDays(1);
  else if ((m = take(/\bin\s+(\d{1,3})\s+days?\b/i))) r.date = inDays(Number(m[1]));
  else if ((m = take(new RegExp(`\\b${PRE}(next\\s+)?${WEEKDAY_RE}\\b`, "i")))) r.date = weekday(m[2], !!m[1]);
  else if ((m = take(new RegExp(`\\b${PRE}${MONTH_RE}\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`, "i")))) r.date = monthDay(MONTHS.findIndex(x => x.toLowerCase() === m[1].toLowerCase()), Number(m[2]));
  else if ((m = take(new RegExp(`\\b${PRE}(\\d{1,2})(?:st|nd|rd|th)?\\s+${MONTH_RE}\\b`, "i")))) r.date = monthDay(MONTHS.findIndex(x => x.toLowerCase() === m[2].toLowerCase()), Number(m[1]));
  else if ((m = take(/\b(?:(?:on|by)\s+)?(\d{1,2})\/(\d{1,2})\b/))) r.date = monthDay(Number(m[1]) - 1, Number(m[2]));

  r.title = s.replace(/\s+/g, " ").trim().replace(/^(?:on|at|by|for)\s+|\s+(?:on|at|by|for)$/gi, "").trim();
  if (!r.title) return null;
  if (!r.kind) r.kind = r.start || r.repeat !== "none" ? "event" : "todo";
  if (r.kind === "event") r.date ||= inDays(0);
  if (r.kind === "todo") r.date ||= inDays(0);
  if (r.kind === "task") {
    r.date ||= inDays(7);
    // Subject: a timetable subject whose first word is in the text ("physics" → "Physics HL")
    const low = text.toLowerCase();
    r.subject = subjects().find(x => x !== "Other" && new RegExp(`\\b${x.split(" ")[0].toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(low)) || "Other";
  }
  return r;
}

function quickText(q) {
  if (!q) return "Add a name too";
  const kind = { event: "📅 Event", todo: "✅ To-do", task: "📝 Homework" }[q.kind];
  const time = q.start ? ` · ${q.start}${q.end ? "–" + q.end : ""}` : "";
  const rep = q.repeat !== "none" ? ` · 🔁 ${REPEATS.find(x => x[0] === q.repeat)[1].toLowerCase()}` : "";
  return `${kind}: <b>${esc(q.title)}</b> · ${q.kind === "task" ? "due " : ""}${fmtDate(q.date)}${time}${rep}${q.subject ? " · " + esc(q.subject) : ""}`;
}

// ===== Search everything =====
function searchResults(q) {
  q = q.trim().toLowerCase();
  if (!q) return `<p class="empty">Type to search everything in Tick</p>`;
  const has = (...xs) => xs.some(x => String(x || "").toLowerCase().includes(q));
  const res = []; // [icon, title, note, act, id]
  db.events.filter(e => has(e.title, e.note)).forEach(e => res.push(["📅", e.title, fmtDate(e.date) + (e.start ? " " + e.start : ""), "editEvent", e.id]));
  db.todos.filter(t => has(t.text, t.note)).forEach(t => res.push([t.done ? "☑️" : "✅", t.text, t.date ? fmtDate(t.date) : "No date", "editTodo", t.id]));
  db.tasks.filter(t => has(t.title, t.subject, t.note)).forEach(t => res.push(["📝", t.title, `${t.subject}${t.due ? " · due " + fmtDate(t.due) : ""}`, "editTask", t.id]));
  db.exams.filter(e => has(e.name, e.note)).forEach(e => res.push(["⏳", e.name, fmtDate(e.date), "editExam", e.id]));
  sched().classes.filter(c => has(c.name, c.room)).forEach(c => res.push(["📚", c.name, `${DAYS_FULL[c.day]} ${c.start}`, "editClass", c.id]));
  db.modules.filter(m => has(m.name, ...m.people.map(p => p.name))).forEach(m => res.push(["📘", m.name, m.people.map(p => p.name).join(", ") || "Module", "openModule", m.id]));
  db.unis.filter(u => has(u.name, u.program, u.notes)).forEach(u => res.push(["🎓", u.name, u.program || u.status, "openUni", u.id]));
  db.docs.filter(d => has(d.name, d.note)).forEach(d => res.push(["🛂", d.name, "Expires " + fmtDate(d.expiry), "editDoc", d.id]));
  db.holidays.filter(h => has(h.name)).forEach(h => res.push(["🏖️", h.name, fmtDate(h.start), "editHoliday", h.id]));
  db.money.filter(x => has(x.note, x.category)).forEach(x => res.push(["🐷", `${x.category} ${x.type === "in" ? "+" : "−"}${money(x.amount)}`, fmtDate(x.date) + (x.note ? " · " + x.note : ""), "editMoney", x.id]));
  if (!res.length) return `<p class="empty">Nothing found for “${esc(q)}”</p>`;
  return `<section class="card">${res.slice(0, 60).map(([ic, title, note, act, id]) => `
    <div class="row" data-act="${act}" data-id="${id}"><span class="sicon">${ic}</span>
      <div class="grow"><b>${esc(title)}</b><div class="muted small">${esc(note)}</div></div></div>`).join("")}</section>
    ${res.length > 60 ? `<p class="muted small center">Showing 60 of ${res.length}</p>` : ""}`;
}

// ===== Quick add sheet (the round ＋ button on Today) =====
function quickSheet() {
  formState = null;
  $("#modal").innerHTML = `
    <div class="backdrop" data-act="closeModal"></div>
    <div class="sheet">
      <div class="sheet-head"><button type="button" data-act="closeModal">Cancel</button><b>Quick add</b>
        <button type="button" class="strong" data-act="quickSubmit">Add</button></div>
      <form data-form="quickAdd"><input id="quickInput" name="text" data-input="quick" placeholder="e.g. Math quiz fri 3pm" autocomplete="off" autocapitalize="off"></form>
      <div id="quickPreview" class="small muted"></div>
      <p class="small muted" style="margin:16px 0 0 4px">Or open the full form</p>
      <div class="agenda-add"><button class="btn" data-act="addEvent">＋ Event</button><button class="btn" data-act="addTodo">＋ To-do</button><button class="btn" data-act="addTask">＋ Homework</button></div>
    </div>`;
  $("#modal").hidden = false;
  $("#quickInput").focus();
}

function quickAdd(f) {
  const q = parseQuick(f.elements.text.value);
  if (!q) return;
  if (q.kind === "event") db.events.push({ id: uid(), title: q.title, date: q.date, endDate: "", start: q.start, end: q.start ? q.end : "", repeat: q.repeat, remind: "30", color: PALETTE[8], note: "" });
  else if (q.kind === "task") db.tasks.push({ id: uid(), title: q.title, subject: q.subject, type: "Homework", due: q.date, note: "", done: false });
  else db.todos.push({ id: uid(), text: q.title, date: q.date, priority: 0, repeat: q.repeat, note: "", done: false });
  closeModal(); save(); render();
  toast("Added ✅ " + quickText(q).replace(/<[^>]+>/g, ""));
}

// ===== Swipe left / right =====
// On the month grid: change month. In Lists: To-dos ↔ Homework first. Anywhere else: next/previous tab.
// Inside a sub-page: swipe right = back.
// The page follows your finger; let go far (or fast) enough and it slides to the next one, otherwise it springs back.
const EASE = "cubic-bezier(.2, .8, .2, 1)";
let drag = null;
const dragEl = onCal => $(onCal ? ".cal" : "#view");

document.addEventListener("touchstart", e => {
  drag = null;
  if (!$("#modal").hidden || e.touches.length > 1 || e.target.closest("input, select, textarea, nav, .swatches, .chips")) return;
  const t = e.touches[0];
  const onCal = ui.tab === "calendar" && !ui.page && !!e.target.closest(".cal, .cal-week, .month");
  drag = { x: t.clientX, y: t.clientY, time: Date.now(), onCal, lock: null, dx: 0 };
}, { passive: true });

document.addEventListener("touchmove", e => {
  if (!drag) return;
  const t = e.touches[0], dx = t.clientX - drag.x, dy = t.clientY - drag.y;
  if (!drag.lock) {
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
    drag.lock = Math.abs(dx) > Math.abs(dy) ? "x" : "y"; // decide once: sideways swipe or normal scrolling
    if (drag.lock === "y") { drag = null; return; }
  }
  e.preventDefault();
  drag.dx = dx;
  const el = dragEl(drag.onCal);
  // Nothing to go to on that side: move only a little, like a rubber band
  const x = canSwipe(dx < 0 ? 1 : -1, drag.onCal) ? dx : dx * 0.25;
  el.style.transition = "none";
  el.style.transform = `translateX(${x}px)`;
  el.style.opacity = 1 - Math.min(Math.abs(x) / 700, 0.35);
}, { passive: false });

function endDrag() {
  if (!drag || drag.lock !== "x") { drag = null; return; }
  const d = drag, el = dragEl(d.onCal), dir = d.dx < 0 ? 1 : -1;
  drag = null;
  const speed = Math.abs(d.dx) / (Date.now() - d.time);
  if ((Math.abs(d.dx) > 70 || (speed > 0.35 && Math.abs(d.dx) > 25)) && canSwipe(dir, d.onCal)) {
    el.style.transition = "transform .15s ease-in, opacity .15s ease-in";
    el.style.transform = `translateX(${-dir * innerWidth * 0.5}px)`;
    el.style.opacity = "0";
    setTimeout(() => { swipe(dir, d.onCal); slideIn(dir, d.onCal); }, 140);
  } else {
    el.style.transition = `transform .3s ${EASE}, opacity .3s`;
    el.style.transform = "";
    el.style.opacity = "";
  }
}
document.addEventListener("touchend", endDrag);
document.addEventListener("touchcancel", endDrag);

// Is there somewhere to go? dir = 1: swiped left (forward); dir = -1: swiped right (back)
function canSwipe(dir, onCal) {
  if (ui.page) return dir < 0;
  if (onCal) return true;
  if (ui.tab === "list" && ui.listMode === (dir > 0 ? "todo" : "task")) return true;
  return !!TABS[TABS.indexOf(ui.tab) + dir];
}

function swipe(dir, onCal) {
  if (ui.page) return ACT.back();
  if (onCal) return ACT.calMonth(dir);
  if (ui.tab === "list" && ui.listMode === (dir > 0 ? "todo" : "task")) return ACT.listMode(dir > 0 ? "task" : "todo");
  const next = TABS[TABS.indexOf(ui.tab) + dir];
  if (next === "list") ui.listMode = dir > 0 ? "todo" : "task"; // land on the side you swiped in from
  ACT.tab(next);
}

// New content glides in from the side it came from (dir 0 = just a soft fade, used for tab taps)
function slideIn(dir, onCal) {
  const el = dragEl(onCal);
  el.style.transition = "none";
  el.style.transform = dir ? `translateX(${dir * 60}px)` : "translateY(6px)";
  el.style.opacity = "0";
  void el.offsetWidth; // apply the start position before animating
  el.style.transition = `transform .3s ${EASE}, opacity .25s`;
  el.style.transform = "";
  el.style.opacity = "";
}

// ===== Button actions =====
const ACT = {
  tab: id => { ui.tab = id; ui.page = null; render(); scrollTo(0, 0); slideIn(0); },
  open: id => { ui.page = id; render(); scrollTo(0, 0); slideIn(0); },
  back: () => { ui.page = { uni: "unis", module: "modules" }[ui.page] || null; render(); },
  closeModal, submitForm, deleteForm,
  openSearch: () => { ui.query = ""; ACT.open("search"); $("#searchBox").focus(); },
  quick: quickSheet,
  quickSubmit: () => quickAdd($("#modal form")),

  goList: mode => { ui.listMode = mode; ACT.tab("list"); },
  listMode: mode => { ui.listMode = mode; ui.showDone = false; render(); },
  toggleShowDone: () => { ui.showDone = !ui.showDone; render(); },

  addTodo: () => todoForm(null),
  addTodoOn: date => todoForm(null, date),
  editTodo: id => todoForm(find(db.todos, id)),
  toggleTodo: id => {
    const t = find(db.todos, id);
    t.done = !t.done; t.doneAt = t.done ? ymd() : null;
    if (t.done && t.repeat && t.repeat !== "none" && t.date) {
      // Repeating: tick it off and the next one appears
      const next = { ...t, id: uid(), done: false, doneAt: null, date: nextDate(t.date, t.repeat) };
      delete next.nextId;
      db.todos.push(next); t.nextId = next.id;
      toast(`Next one: ${fmtDate(next.date)} 🔁`);
    } else if (!t.done && t.nextId) {
      // Un-ticked: remove the copy it made (if not done yet)
      db.todos = db.todos.filter(x => !(x.id === t.nextId && !x.done));
      delete t.nextId;
    }
    save(); render();
  },

  pickDate: ds => { ui.selDate = ds; if (ds.slice(0, 7) !== ui.calMonth) ui.calMonth = ds.slice(0, 7); render(); },
  calMonth: n => {
    const [y, m] = ui.calMonth.split("-").map(Number);
    ui.calMonth = ymd(new Date(y, m - 1 + Number(n), 1)).slice(0, 7);
    render();
  },
  calToday: () => { ui.selDate = ymd(); ui.calMonth = ymd().slice(0, 7); render(); },
  addEvent: date => eventForm(null, date),
  editEvent: id => eventForm(find(db.events, id)),
  moveEvent: id => moveEventForm(find(db.events, id)),

  pickDay: id => { ui.day = Number(id); render(); },
  addClass: () => classForm(null),
  editClass: id => classForm(find(sched().classes, id)),
  newSched: () => form("New timetable", [
    { key: "name", label: "Timetable name", type: "text", required: true, ph: "e.g. Uni Year 1, Term 1" },
    { key: "from", label: "Start from", type: "select", options: [["empty", "Empty"], ["copy", "Copy the current timetable"]] },
  ], {}, v => {
    const s = { id: uid(), name: v.name, classes: v.from === "copy" ? sched().classes.map(c => ({ ...c, id: uid() })) : [] };
    db.schedules.push(s);
    db.activeSchedule = s.id;
  }),
  schedMenu: () => {
    const s = sched();
    form("Manage timetable", [{ key: "name", label: "Timetable name", type: "text", required: true }], s,
      v => { s.name = v.name; },
      () => {
        if (db.schedules.length === 1) return "You need to keep at least one timetable";
        db.schedules = db.schedules.filter(x => x !== s);
        db.activeSchedule = db.schedules[0].id;
      });
  },

  addTask: () => taskForm(null),
  addTaskOn: date => taskForm(null, date),
  editTask: id => taskForm(find(db.tasks, id)),
  toggleTask: id => { const t = find(db.tasks, id); t.done = !t.done; save(); render(); if (t.done) toast("Done ✅"); },

  startWork: () => startTimer("work"),
  startBreak: () => startTimer("break"),
  stopTimer: () => endTimer(true, false),
  cancelTimer: () => { if (confirm("Give up this session? The time won't be saved.")) endTimer(false, false); },
  focusSettings: () => form("Focus settings", [
    { key: "work", label: "Focus (minutes)", type: "number", required: true },
    { key: "brk", label: "Break (minutes)", type: "number", required: true },
    { key: "goal", label: "Daily goal (minutes, 0 = no goal)", type: "number", required: true },
  ], db.settings, v => {
    if (!(v.work >= 1 && v.brk >= 1)) return "At least 1 minute";
    if (!(v.goal >= 0)) return "Goal can't be negative";
    Object.assign(db.settings, { work: Math.round(v.work), brk: Math.round(v.brk), goal: Math.round(v.goal) });
  }),
  delFocus: id => deleteWithUndo(() => { db.focus = db.focus.filter(f => f.id !== id); }),
  undo: () => { if (toast.undo) toast.undo(); },

  addExam: () => examForm(null),
  editExam: id => examForm(find(db.exams, id)),
  planRevision: id => revisionForm(find(db.exams, id)),
  addHoliday: () => holidayForm(null),
  editHoliday: id => holidayForm(find(db.holidays, id)),
  addTerm: () => termForm(null),
  editTerm: id => termForm(find(db.terms, id)),

  addModule: () => moduleForm(null),
  // IB: make a subject for each class in the timetable (skips TOK, PE, homeroom-type classes)
  importIB: () => {
    const have = new Set(db.modules.map(m => m.name));
    const names = [...new Set(sched().classes.map(c => c.name))].filter(n => !have.has(n) && !/^(TOK|PE|Class Meeting|Homeroom|Assembly|CAS)$/i.test(n));
    names.forEach(name => db.modules.push({ id: uid(), name, level: /\bHL\b/i.test(name) ? "HL" : "SL", ib: "", credits: "", target: 70, link: "", items: [], people: [] }));
    save(); render();
    toast(names.length ? `Added ${plural(names.length, "subject")} — tap each to set its grade` : "No new subjects found in the timetable");
  },
  editModule: id => moduleForm(find(db.modules, id)),
  openModule: id => { ui.pageId = id; ui.page = "module"; render(); scrollTo(0, 0); },
  addAssess: () => assessForm(-1),
  editAssess: i => assessForm(Number(i)),
  addPerson: () => personForm(-1),
  editPerson: i => personForm(Number(i)),

  addDoc: () => docForm(null),
  editDoc: id => docForm(find(db.docs, id)),
  togglePrep: i => { const it = db.prep[Number(i)]; it.done = !it.done; save(); render(); },
  delPrep: i => deleteWithUndo(() => { db.prep.splice(Number(i), 1); }),

  addRecurring: () => recurringForm(null),
  editRecurring: id => recurringForm(find(db.recurring, id)),
  moneySettings: () => form("Money settings", [
    { key: "currency", label: "Currency", type: "select", options: CURRENCIES },
    { key: "budget", label: "Monthly budget (0 = none)", type: "number", required: true },
  ], db.settings, v => {
    if (!(v.budget >= 0)) return "Budget can't be negative";
    Object.assign(db.settings, { currency: v.currency, budget: v.budget });
  }),

  addUni: () => uniForm(null),
  editUni: id => uniForm(find(db.unis, id)),
  openUni: id => { ui.pageId = id; ui.page = "uni"; render(); scrollTo(0, 0); },
  toggleItem: i => { const it = curUni().items[Number(i)]; it.done = !it.done; save(); render(); },
  delItem: i => deleteWithUndo(() => { curUni().items.splice(Number(i), 1); }),

  month: n => {
    const [y, m] = ui.month.split("-").map(Number);
    ui.month = ymd(new Date(y, m - 1 + Number(n), 1)).slice(0, 7);
    render();
  },
  addMoney: () => moneyForm(null),
  editMoney: id => moneyForm(find(db.money, id)),

  addHabit: () => habitForm(null),
  editHabit: id => habitForm(find(db.habits, id)),
  toggleHabit: key => {
    const [id, date] = key.split("|");
    const list = db.habitLog[date] || (db.habitLog[date] = []);
    const i = list.indexOf(id);
    if (i >= 0) list.splice(i, 1); else list.push(id);
    save(); render();
  },

  homeMove: key => {
    const [k, dir] = key.split("|");
    const order = homeOrder(), i = order.indexOf(k), j = i + Number(dir);
    if (j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]];
    db.settings.home = order; save(); render();
  },
  homeToggle: k => {
    const order = homeOrder();
    db.settings.home = order.includes(k) ? order.filter(x => x !== k) : [...order, k];
    save(); render();
  },
  homeReset: () => { db.settings.home = [...HOME_DEFAULT]; save(); render(); },
  setAccent: c => { db.settings.accent = c; save(); render(); },
  setBgColor: c => { localStorage.removeItem(BG_KEY); db.settings.bgColor = c; save(); render(); },
  clearBg: () => { localStorage.removeItem(BG_KEY); db.settings.bgColor = null; save(); render(); },

  syncSetup,
  syncNow: () => { lastPull = Date.now(); runSync(pushPending ? push : pull); },
  syncOff: () => { if (confirm("Turn off cloud sync? Data stays on this phone and in the cloud.")) { sync = null; localStorage.removeItem(SYNC_KEY); render(); } },
  exportShare, copyBackup,
  pasteBackup: () => form("Paste backup text", [{ key: "text", label: "Paste the whole backup here", type: "textarea", required: true }], {},
    v => { importData(v.text); return true; }),
  resetAll: () => {
    if (confirm("Really erase the data on this phone? (Cloud data is not deleted)") && confirm("Last check: erase everything?")) {
      sync = null; localStorage.removeItem(SYNC_KEY);
      db = fresh(); localStorage.setItem(KEY, JSON.stringify(db));
      ui.page = null; ui.tab = "today"; render(); toast("Erased");
    }
  },
};

const SUBMIT = {
  modalForm: submitForm,
  quickAdd,
  addTodo: f => {
    const text = f.elements.text.value.trim();
    if (!text) return;
    db.todos.push({ id: uid(), text, date: ymd(), priority: 0, done: false });
    save(); render();
  },
  addPrep: f => {
    const text = f.elements.text.value.trim();
    if (!text) return;
    db.prep.push({ text, done: false });
    save(); render();
  },
  addItem: f => {
    const text = f.elements.text.value.trim();
    if (!text) return;
    curUni().items.push({ text, done: false });
    save(); render();
  },
};

const CHANGE = {
  gradeSystem: el => { db.settings.gradeSystem = el.value; save(); render(); },
  ibSetting: el => { db.settings[el.dataset.key] = el.value; save(); render(); },
  taskRemind: el => { db.settings.taskRemind = el.value; save(); toast(el.value ? `Reminders at ${el.value} the evening before 🔔` : "Homework & exam reminders off"); },
  switchSched: el => { db.activeSchedule = el.value; save(); render(); },
  bgCustom: el => { localStorage.removeItem(BG_KEY); db.settings.bgColor = el.value; save(); render(); },
  bgImage: el => { const file = el.files[0]; if (file) setBgImage(file); el.value = ""; },
  importFile: el => { const file = el.files[0]; if (file) file.text().then(importData); el.value = ""; },
};

document.addEventListener("click", e => {
  const el = e.target.closest("[data-act]");
  if (!el || !ACT[el.dataset.act]) return;
  e.preventDefault();
  ACT[el.dataset.act](el.dataset.id, el);
});
document.addEventListener("submit", e => { e.preventDefault(); SUBMIT[e.target.dataset.form]?.(e.target); });
// Quick add: show what will be created while typing
document.addEventListener("input", e => {
  if (e.target.dataset.input === "quick") $("#quickPreview").innerHTML = e.target.value.trim() ? quickText(parseQuick(e.target.value)) : "";
  if (e.target.dataset.input === "search") { ui.query = e.target.value; $("#results").innerHTML = searchResults(ui.query); }
});
document.addEventListener("change", e => { const el = e.target.closest("[data-change]"); if (el) CHANGE[el.dataset.change](el); });
document.addEventListener("visibilitychange", () => {
  if (document.hidden) { if (pushPending) { clearTimeout(pushTimer); runSync(push); } }
  else { if (applyRecurring()) save(); tick(); render(); pullIfStale(); }
});
// When another window changes the data, update here too so old data doesn't overwrite new data
window.addEventListener("storage", e => { if (e.key === KEY) { db = load(); render(); } });
setInterval(tick, 1000);

if (applyRecurring()) save();
render();
pullIfStale();

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js");
if (navigator.storage && navigator.storage.persist) navigator.storage.persist();
