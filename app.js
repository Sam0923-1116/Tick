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
const MONEY_CATS = ["Food", "Transport", "Study", "Fun", "Shopping", "Living", "Allowance", "Part-time job", "Other"];
const PRIORITIES = [[0, "None"], [1, "Low"], [2, "Medium"], [3, "High"]];
const PRIO_COLOR = ["#8E8E93", "#4C8BF5", "#E08A00", "#E5484D"];
const BG_KEY = "myhq-bg"; // background photo is only kept on this phone
const HOME_CARDS = [["classes", "📚 Classes"], ["agenda", "📆 Today's events"], ["todos", "✅ Today's to-dos"], ["tasks", "📝 Homework due soon"],
  ["exam", "⏳ Exam countdown"], ["habits", "💧 Today's habits"], ["focus", "⏱️ Focus today"]];
const HOME_DEFAULT = ["classes", "agenda", "tasks", "exam", "focus"];
const BG_COLORS = ["#FDE2E4", "#FFF1C1", "#E2F0CB", "#DFE7FD", "#E8DFF5", "#D9F2F2", "#2B2D42", "#0B3D2E"];
const REPEATS = [["none", "Never"], ["daily", "Every day"], ["weekly", "Every week"], ["monthly", "Every month"], ["yearly", "Every year"]];

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
const money = n => "$" + Math.round(n).toLocaleString();
const fmtMin = m => m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`;
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

function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toast.t);
  toast.t = setTimeout(() => el.classList.remove("show"), 2400);
}

// ===== Data =====
function fresh() {
  const s = { id: uid(), name: "My timetable", classes: [] };
  return {
    version: 1, updatedAt: 0, schedules: [s], activeSchedule: s.id,
    tasks: [], todos: [], events: [], focus: [], exams: [], unis: [], money: [], habits: [], habitLog: {},
    settings: { work: 25, brk: 5 }, timer: null, lastBackup: null,
  };
}

// Turn old Chinese option values into the English ones
function migrate(d) {
  const en = s => OLD_NAMES[s] || s;
  d.tasks.forEach(t => { t.type = en(t.type); t.subject = en(t.subject); });
  d.unis.forEach(u => { u.status = en(u.status); u.country = en(u.country); (u.items || []).forEach(i => { i.text = en(i.text); }); });
  d.money.forEach(x => { x.category = en(x.category); });
  d.focus.forEach(f => { f.subject = en(f.subject); });
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
const curUni = () => find(db.unis, ui.pageId);

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
  for (let i = 1; i <= 7; i++) {
    const day = (now.getDay() + i) % 7;
    const list = classesOn(day);
    if (list.length) return { label: i === 1 ? "Tomorrow" : DAYS_FULL[day], c: list[0] };
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
  db.events.filter(e => occursOn(e, ds)).forEach(e => out.push(eventItem(e, ds)));
  db.exams.filter(e => e.date === ds).forEach(e => out.push({ title: "Exam: " + e.name, color: "#E5484D", act: "editExam", id: e.id }));
  db.unis.filter(u => u.deadline === ds).forEach(u => out.push({ title: "Deadline: " + u.name, color: "#B48CDB", act: "openUni", id: u.id }));
  db.tasks.filter(t => t.due === ds).forEach(t => out.push({ title: t.title, color: colorOf(t.subject), act: "editTask", check: "toggleTask", id: t.id, done: t.done, tag: t.type }));
  db.todos.filter(t => t.date === ds).forEach(t => out.push({ title: t.text, color: PRIO_COLOR[t.priority || 0], act: "editTodo", check: "toggleTodo", id: t.id, done: t.done, prio: t.priority || 0 }));
  if (withClasses) classesOn(parseYmd(ds).getDay()).forEach(c => out.push({ title: c.name, time: c.start, end: c.end, color: c.color, act: "editClass", id: c.id, tag: c.room, isClass: true }));
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
      <div class="muted small">${c.start}–${c.end}${c.room ? " · " + esc(c.room) : ""}</div></div>
    ${isNow ? '<span class="pill now">Now</span>' : ""}
  </div>`;

const todoRow = (t, showDate) => `
  <div class="row">
    <button class="check prio${t.priority || 0} ${t.done ? "on" : ""}" data-act="toggleTodo" data-id="${t.id}"></button>
    <div class="grow" data-act="editTodo" data-id="${t.id}">
      <span class="${t.done ? "done" : ""}">${esc(t.text)}</span>
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

const checkItem = (it, i) => `
  <div class="row">
    <button class="check ${it.done ? "on" : ""}" data-act="toggleItem" data-id="${i}"></button>
    <span class="grow ${it.done ? "done" : ""}">${esc(it.text)}</span>
    <button class="x" data-act="delItem" data-id="${i}">×</button>
  </div>`;

const empty = text => `<p class="empty">${text}</p>`;

// ===== Pages =====
const VIEWS = {
  today() {
    const now = new Date(), nm = now.getHours() * 60 + now.getMinutes(), td = ymd(now);
    const list = classesOn(now.getDay());
    const cur = list.find(c => toMin(c.start) <= nm && nm < toMin(c.end));
    const coming = (cur ? [cur] : []).concat(list.filter(c => toMin(c.start) > nm));
    let classes;
    if (coming.length) {
      classes = coming.slice(0, 3).map(c => classRow(c, c === cur)).join("");
      if (coming.length > 3) classes += `<p class="muted small">${coming.length - 3} more</p>`;
    } else {
      const nx = nextClassDay(now);
      classes = empty(list.length ? "Classes are over for today 🎉" : "No classes today 😴") +
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
      focus: `<section class="card" data-act="tab" data-id="focus"><h2>Focus today</h2><p class="big">${fmtMin(focusMin)}</p></section>`,
    };
    const shown = homeOrder().map(k => cards[k] || "").join("");

    return {
      title: `${DAYS_FULL[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}`,
      html: `
        ${needBackup ? `<div class="banner" data-act="open" data-id="settings">💾 ${db.lastBackup ? "No backup in over 2 weeks" : "Never backed up"} — turn on cloud sync ›</div>` : ""}
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
        <section class="card"><h2>${fmtDate(sel)}${sel === td ? " · Today" : ""}</h2>
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
        <section class="card"><h2>Today</h2><p class="big">${fmtMin(sumBy(db.focus.filter(f => f.date === td), "minutes"))}</p></section>
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
    const items = [
      ["schedule", "📚", "Timetable", sched().name],
      ["exams", "⏰", "Exam countdown", exam ? `${exam.name} in ${plural(daysUntil(exam.date), "day")}` : "No exams yet"],
      ["unis", "🎓", "Uni applications", `${db.unis.length} ${db.unis.length === 1 ? "university" : "universities"}`],
      ["money", "🐷", "Money", `Spent this month: ${money(monthOut)}`],
      ["habits", "🌱", "Habits", plural(db.habits.length, "habit")],
      ["appearance", "🎨", "Appearance", "Home cards, accent colour, background"],
      ["settings", "☁️", "Sync & backup", sync && sync.token ? `Synced ${sync.lastSync ? hhmm(sync.lastSync) : ""}` : "Cloud sync is off"],
    ];
    return {
      title: "More",
      html: `<section class="card">${items.map(([id, ic, name, sub]) => `
        <div class="row" data-act="open" data-id="${id}"><span class="icon">${ic}</span>
          <div class="grow"><b>${name}</b><div class="muted small">${esc(sub)}</div></div><span class="muted">›</span></div>`).join("")}</section>`,
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
          ${u.items.map(checkItem).join("") || empty("No items")}
          <form class="inline" data-form="addItem"><input name="text" placeholder="Add an item…" autocomplete="off"><button class="btn">＋</button></form></section>
        ${u.notes ? `<section class="card"><h2>Notes</h2><p class="pre">${esc(u.notes)}</p></section>` : ""}`,
    };
  },

  money() {
    const [y, m] = ui.month.split("-").map(Number);
    const items = db.money.filter(x => x.date.startsWith(ui.month)).sort((a, b) => b.date.localeCompare(a.date));
    const out = items.filter(x => x.type === "out"), inc = items.filter(x => x.type === "in");
    const outSum = sumBy(out, "amount"), incSum = sumBy(inc, "amount");
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
    v[x.key] = x.type === "number" ? Number(raw) : String(raw).trim();
  });
  const res = await formState.onSave(v);
  if (res) { if (res !== true) toast(res); return; }
  save(); closeModal(); render();
}

function deleteForm() {
  if (!confirm("Delete this?")) return;
  const res = formState.onDelete();
  if (res) return toast(res);
  save(); closeModal(); render();
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
    { key: "note", label: "Note", type: "textarea" },
  ], t || { date: date ?? ymd(), priority: 0 }, v => {
    v.priority = Number(v.priority);
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
    { key: "color", label: "Colour", type: "color" },
    { key: "note", label: "Note", type: "textarea" },
  ], e || { date: date || ymd(), repeat: "none", color: PALETTE[8] }, v => {
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
  }, isNew ? null : () => { db.exams = db.exams.filter(x => x !== e); });
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

// ===== Swipe left / right =====
// On the month grid: change month. In Lists: To-dos ↔ Homework first. Anywhere else: next/previous tab.
// Inside a sub-page: swipe right = back.
let touch = null;
document.addEventListener("touchstart", e => {
  touch = null;
  if (!$("#modal").hidden || e.touches.length > 1 || e.target.closest("input, select, textarea, nav, .swatches, .chips")) return;
  const t = e.touches[0];
  touch = { x: t.clientX, y: t.clientY, time: Date.now(), onCal: !!e.target.closest(".cal, .cal-week, .month") };
}, { passive: true });
document.addEventListener("touchend", e => {
  if (!touch) return;
  const t = e.changedTouches[0], dx = t.clientX - touch.x, dy = t.clientY - touch.y, s = touch;
  touch = null;
  if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5 || Date.now() - s.time > 700) return;
  swipe(dx < 0 ? 1 : -1, s.onCal);
}, { passive: true });

// dir = 1: swiped left (go forward); dir = -1: swiped right (go back)
function swipe(dir, onCal) {
  if (ui.page) { if (dir < 0) { ACT.back(); slideIn(dir); } return; }
  if (onCal && ui.tab === "calendar") { ACT.calMonth(dir); return slideIn(dir); }
  if (ui.tab === "list" && ui.listMode === (dir > 0 ? "todo" : "task")) { ACT.listMode(dir > 0 ? "task" : "todo"); return slideIn(dir); }
  const next = TABS[TABS.indexOf(ui.tab) + dir];
  if (!next) return;
  if (next === "list") ui.listMode = dir > 0 ? "todo" : "task"; // land on the side you swiped in from
  ACT.tab(next);
  slideIn(dir);
}

function slideIn(dir) {
  const v = $("#view");
  v.classList.remove("slide-l", "slide-r");
  void v.offsetWidth; // restart the animation
  v.classList.add(dir > 0 ? "slide-l" : "slide-r");
}

// ===== Button actions =====
const ACT = {
  tab: id => { ui.tab = id; ui.page = null; render(); scrollTo(0, 0); },
  open: id => { ui.page = id; render(); scrollTo(0, 0); },
  back: () => { ui.page = ui.page === "uni" ? "unis" : null; render(); },
  closeModal, submitForm, deleteForm,

  goList: mode => { ui.listMode = mode; ACT.tab("list"); },
  listMode: mode => { ui.listMode = mode; ui.showDone = false; render(); },
  toggleShowDone: () => { ui.showDone = !ui.showDone; render(); },

  addTodo: () => todoForm(null),
  addTodoOn: date => todoForm(null, date),
  editTodo: id => todoForm(find(db.todos, id)),
  toggleTodo: id => { const t = find(db.todos, id); t.done = !t.done; t.doneAt = t.done ? ymd() : null; save(); render(); },

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
  focusSettings: () => form("Timer length", [
    { key: "work", label: "Focus (minutes)", type: "number", required: true },
    { key: "brk", label: "Break (minutes)", type: "number", required: true },
  ], db.settings, v => {
    if (!(v.work >= 1 && v.brk >= 1)) return "At least 1 minute";
    Object.assign(db.settings, { work: Math.round(v.work), brk: Math.round(v.brk) });
  }),
  delFocus: id => { if (confirm("Delete this session?")) { db.focus = db.focus.filter(f => f.id !== id); save(); render(); } },

  addExam: () => examForm(null),
  editExam: id => examForm(find(db.exams, id)),

  addUni: () => uniForm(null),
  editUni: id => uniForm(find(db.unis, id)),
  openUni: id => { ui.pageId = id; ui.page = "uni"; render(); scrollTo(0, 0); },
  toggleItem: i => { const it = curUni().items[Number(i)]; it.done = !it.done; save(); render(); },
  delItem: i => { curUni().items.splice(Number(i), 1); save(); render(); },

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
  addTodo: f => {
    const text = f.elements.text.value.trim();
    if (!text) return;
    db.todos.push({ id: uid(), text, date: ymd(), priority: 0, done: false });
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
document.addEventListener("change", e => { const el = e.target.closest("[data-change]"); if (el) CHANGE[el.dataset.change](el); });
document.addEventListener("visibilitychange", () => {
  if (document.hidden) { if (pushPending) { clearTimeout(pushTimer); runSync(push); } }
  else { tick(); render(); pullIfStale(); }
});
// When another window changes the data, update here too so old data doesn't overwrite new data
window.addEventListener("storage", e => { if (e.key === KEY) { db = load(); render(); } });
setInterval(tick, 1000);

render();
pullIfStale();

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js");
if (navigator.storage && navigator.storage.persist) navigator.storage.persist();
