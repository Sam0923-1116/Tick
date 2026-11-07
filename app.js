"use strict";
// My HQ — 個人用的學習 + 生活 App。
// 資料存在這支手機（localStorage），可選擇同步到自己的 GitHub 私人資料庫。

// ===== 設定 =====
const KEY = "myhq-v1";
const SYNC_KEY = "myhq-sync";
const DAYS = ["日", "一", "二", "三", "四", "五", "六"];
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
const PALETTE = ["#4C8BF5", "#00B4EF", "#00A86B", "#4CB800", "#F9B934", "#FFB000", "#D63A5A", "#FF5FA2", "#B48CDB", "#8E8E93"];
const TASK_TYPES = ["作業", "IA", "EE", "TOK", "小考", "報告", "其他"];
const UNI_STATUS = ["研究中", "準備中", "已送出", "面試", "錄取", "候補", "未錄取"];
const UNI_COUNTRIES = ["英國 UK", "美國 US", "加拿大 Canada", "其他"];
const UNI_ITEMS = ["個人陳述 / Essay", "推薦信", "成績單 / Predicted grades", "語言成績", "繳交申請費"];
const MONEY_CATS = ["餐飲", "交通", "學習", "娛樂", "購物", "生活", "零用錢", "打工", "其他"];
const PRIORITIES = [[0, "無"], [1, "低"], [2, "中"], [3, "高"]];
const PRIO_COLOR = ["#8E8E93", "#4C8BF5", "#E08A00", "#E5484D"];
const BG_KEY = "myhq-bg"; // 背景圖片只存這支手機
const HOME_CARDS = [["classes", "📚 課程"], ["agenda", "📆 今天行程"], ["todos", "✅ 今日待辦"], ["tasks", "📝 快到期的作業"],
  ["exam", "⏳ 考試倒數"], ["habits", "💧 今日習慣"], ["focus", "⏱️ 今天專注"]];
const HOME_DEFAULT = ["classes", "agenda", "tasks", "exam", "focus"];
const BG_COLORS = ["#FDE2E4", "#FFF1C1", "#E2F0CB", "#DFE7FD", "#E8DFF5", "#D9F2F2", "#2B2D42", "#0B3D2E"];
const REPEATS = [["none", "不重複"], ["daily", "每天"], ["weekly", "每週"], ["monthly", "每月"], ["yearly", "每年"]];

// ===== 小工具 =====
const $ = s => document.querySelector(s);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const pad = n => String(n).padStart(2, "0");
const ymd = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseYmd = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const daysUntil = s => Math.round((parseYmd(s) - parseYmd(ymd())) / 864e5);
const toMin = t => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const find = (arr, id) => arr.find(x => x.id === id);
const sumBy = (arr, k) => arr.reduce((s, x) => s + Number(x[k] || 0), 0);
const money = n => "$" + Math.round(n).toLocaleString();
const fmtMin = m => m >= 60 ? `${Math.floor(m / 60)} 小時 ${m % 60} 分` : `${m} 分鐘`;
const byDue = (a, b) => (a.due || "9999").localeCompare(b.due || "9999");
const hhmm = ts => { const d = new Date(ts); return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };

function fmtDate(s) {
  const d = parseYmd(s);
  const year = d.getFullYear() === new Date().getFullYear() ? "" : d.getFullYear() + "/";
  return `${year}${d.getMonth() + 1}/${d.getDate()}（${DAYS[d.getDay()]}）`;
}

function dueLabel(s) {
  const n = daysUntil(s);
  if (n < 0) return `<span class="late">逾期 ${-n} 天</span>`;
  if (n === 0) return `<span class="late">今天</span>`;
  if (n === 1) return `<span class="soon">明天</span>`;
  return `<span class="${n <= 3 ? "soon" : "muted small"}">剩 ${n} 天</span>`;
}

function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toast.t);
  toast.t = setTimeout(() => el.classList.remove("show"), 2400);
}

// ===== 資料 =====
function fresh() {
  const s = { id: uid(), name: "我的課表", classes: [] };
  return {
    version: 1, updatedAt: 0, schedules: [s], activeSchedule: s.id,
    tasks: [], todos: [], events: [], focus: [], exams: [], unis: [], money: [], habits: [], habitLog: {},
    settings: { work: 25, brk: 5 }, timer: null, lastBackup: null,
  };
}

function load() {
  let d = null;
  try { d = JSON.parse(localStorage.getItem(KEY)); } catch {}
  d = d && d.version ? { ...fresh(), ...d } : fresh();
  // 完成超過 30 天的待辦自動清掉
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

// 套用主題色和背景
function applyTheme() {
  const s = db.settings, img = getBgImage(), bg = $("#bg");
  document.documentElement.style.setProperty("--accent", s.accent || PALETTE[0]);
  bg.style.backgroundImage = img ? `url(${img})` : "none";
  bg.style.backgroundColor = !img && s.bgColor ? s.bgColor : "transparent";
  document.body.classList.toggle("custom-bg", !!(img || s.bgColor));
}

// 把相簿的照片縮小後存起來（手機照片太大，localStorage 放不下）
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
    catch { return toast("圖片太大，換一張試試"); }
    render(); toast("背景已更新 🖼️");
  };
  img.onerror = () => { URL.revokeObjectURL(url); toast("讀不到這張圖片"); };
  img.src = url;
}

const sched = () => db.schedules.find(s => s.id === db.activeSchedule) || db.schedules[0];
const classesOn = day => sched().classes.filter(c => +c.day === day).sort((a, b) => toMin(a.start) - toMin(b.start));
const habitDone = (id, date) => (db.habitLog[date] || []).includes(id);
const curUni = () => find(db.unis, ui.pageId);

function subjects() {
  const set = new Set(sched().classes.map(c => c.name));
  db.tasks.forEach(t => t.subject && set.add(t.subject));
  set.delete("其他");
  return [...set, "其他"];
}

function colorOf(name) {
  const c = sched().classes.find(x => x.name === name);
  if (c) return c.color;
  if (!name || name === "其他") return "#8E8E93";
  let s = 0;
  for (const ch of name) s += ch.charCodeAt(0);
  return PALETTE[s % PALETTE.length];
}

function nextClassDay(now) {
  for (let i = 1; i <= 7; i++) {
    const day = (now.getDay() + i) % 7;
    const list = classesOn(day);
    if (list.length) return { label: i === 1 ? "明天" : "星期" + DAYS[day], c: list[0] };
  }
  return null;
}

function streak(id) {
  let d = new Date(), n = 0;
  if (!habitDone(id, ymd(d))) d = addDays(d, -1);
  while (habitDone(id, ymd(d))) { n++; d = addDays(d, -1); }
  return n;
}

// 行程在某一天有沒有發生（處理重複）
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

// 行程總共幾天（有填結束日期 = 多天行程）
const spanOf = e => e.endDate && e.endDate > e.date ? Math.round((parseYmd(e.endDate) - parseYmd(e.date)) / 864e5) + 1 : 1;

// 這天是行程的第幾天（1 起算）；沒有 = 0
function occursOn(e, ds) {
  for (let k = 0; k < spanOf(e); k++) if (startsOn(e, ymd(addDays(parseYmd(ds), -k)))) return k + 1;
  return 0;
}

function eventItem(e, ds) {
  const n = spanOf(e), k = occursOn(e, ds);
  const tags = [];
  if (e.repeat && e.repeat !== "none") tags.push("🔁");
  if (n > 1) tags.push(`第 ${k}/${n} 天`);
  if (n > 1 && k === n && e.start && e.end) tags.push("到 " + e.end);
  // 多天行程：第一天顯示開始時間，其他天當整天
  const time = k === 1 ? e.start || "" : "";
  return { title: e.title, time, end: n === 1 ? e.end || "" : "", color: e.color, act: "editEvent", id: e.id, tag: tags.join(" ") };
}

// 某一天所有的事：行程、考試、作業、待辦、大學截止日（和課程）
function itemsOn(ds, withClasses) {
  const out = [];
  db.events.filter(e => occursOn(e, ds)).forEach(e => out.push(eventItem(e, ds)));
  db.exams.filter(e => e.date === ds).forEach(e => out.push({ title: "考試：" + e.name, color: "#E5484D", act: "editExam", id: e.id }));
  db.unis.filter(u => u.deadline === ds).forEach(u => out.push({ title: "截止：" + u.name, color: "#B48CDB", act: "openUni", id: u.id }));
  db.tasks.filter(t => t.due === ds).forEach(t => out.push({ title: t.title, color: colorOf(t.subject), act: "editTask", check: "toggleTask", id: t.id, done: t.done, tag: t.type }));
  db.todos.filter(t => t.date === ds).forEach(t => out.push({ title: t.text, color: PRIO_COLOR[t.priority || 0], act: "editTodo", check: "toggleTodo", id: t.id, done: t.done, prio: t.priority || 0 }));
  if (withClasses) classesOn(parseYmd(ds).getDay()).forEach(c => out.push({ title: c.name, time: c.start, end: c.end, color: c.color, act: "editClass", id: c.id, tag: c.room, isClass: true }));
  return out.sort((a, b) => (a.done - b.done) || (a.time || "").localeCompare(b.time || "") || ((b.prio || 0) - (a.prio || 0)));
}

// ===== 畫面狀態 =====
const ui = {
  tab: "today", page: null, pageId: null, day: new Date().getDay(), listMode: "todo", showDone: false,
  month: ymd().slice(0, 7), calMonth: ymd().slice(0, 7), selDate: ymd(), lastSubject: null,
};

const classRow = (c, isNow, edit) => `
  <div class="row" ${edit ? `data-act="editClass" data-id="${c.id}"` : ""}>
    <i class="bar" style="background:${esc(c.color)}"></i>
    <div class="grow"><b>${esc(c.name)}</b>
      <div class="muted small">${c.start}–${c.end}${c.room ? " · " + esc(c.room) : ""}</div></div>
    ${isNow ? '<span class="pill now">上課中</span>' : ""}
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
        <span class="muted">${esc(t.type)} · ${t.due ? fmtDate(t.due) : "沒有期限"}</span> ${t.due && !t.done ? dueLabel(t.due) : ""}</div>
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

// ===== 各頁面 =====
const VIEWS = {
  today() {
    const now = new Date(), nm = now.getHours() * 60 + now.getMinutes(), td = ymd(now);
    const list = classesOn(now.getDay());
    const cur = list.find(c => toMin(c.start) <= nm && nm < toMin(c.end));
    const coming = (cur ? [cur] : []).concat(list.filter(c => toMin(c.start) > nm));
    let classes;
    if (coming.length) {
      classes = coming.slice(0, 3).map(c => classRow(c, c === cur)).join("");
      if (coming.length > 3) classes += `<p class="muted small">還有 ${coming.length - 3} 堂</p>`;
    } else {
      const nx = nextClassDay(now);
      classes = empty(list.length ? "今天的課結束了 🎉" : "今天沒課 😴") +
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

    // 首頁每張卡片；順序和顯示與否在「外觀與版面」設定
    const cards = {
      classes: `<section class="card"><h2>課程 <a data-act="open" data-id="schedule">課表 ›</a></h2>${classes}</section>`,
      agenda: agenda.length ? `<section class="card"><h2>今天行程 <a data-act="tab" data-id="calendar">行事曆 ›</a></h2>${agenda.map(itemRow).join("")}</section>` : "",
      todos: `<section class="card"><h2>今日待辦 <a data-act="goList" data-id="todo">全部 ›</a></h2>
          ${todos.map(t => todoRow(t, t.date < td)).join("") || empty("今天沒有待辦")}
          <form class="inline" data-form="addTodo"><input name="text" placeholder="新增今天的待辦…" autocomplete="off"><button class="btn">＋</button></form>
        </section>`,
      tasks: `<section class="card"><h2>快到期的作業 <a data-act="goList" data-id="task">全部 ›</a></h2>
          ${tasks.map(t => `
            <div class="row" data-act="editTask" data-id="${t.id}">
              <i class="bar" style="background:${esc(colorOf(t.subject))}"></i>
              <div class="grow"><b>${esc(t.title)}</b><div class="muted small">${esc(t.subject)} · ${t.due ? fmtDate(t.due) : "沒有期限"}</div></div>
              ${t.due ? dueLabel(t.due) : ""}
            </div>`).join("") || empty("沒有待交的作業 👍")}
        </section>`,
      exam: exam ? `<section class="card" data-act="open" data-id="exams"><h2>考試倒數</h2>
          <p class="big">${daysUntil(exam.date)} <small class="muted">天</small></p>
          <div class="muted small">${esc(exam.name)} · ${fmtDate(exam.date)}</div></section>` : "",
      habits: db.habits.length ? `<section class="card"><h2>今日習慣 <a data-act="open" data-id="habits">全部 ›</a></h2>
          <div class="chips">${db.habits.map(h => `<button class="chip ${habitDone(h.id, td) ? "on" : ""}" data-act="toggleHabit" data-id="${h.id}|${td}">${esc(h.icon)} ${esc(h.name)}</button>`).join("")}</div></section>` : "",
      focus: `<section class="card" data-act="tab" data-id="focus"><h2>今天專注</h2><p class="big">${fmtMin(focusMin)}</p></section>`,
    };
    const shown = homeOrder().map(k => cards[k] || "").join("");

    return {
      title: `${now.getMonth() + 1}月${now.getDate()}日 星期${DAYS[now.getDay()]}`,
      html: `
        ${needBackup ? `<div class="banner" data-act="open" data-id="settings">💾 ${db.lastBackup ? "超過兩週沒備份了" : "還沒備份過"}，建議開啟雲端同步 ›</div>` : ""}
        ${shown || `<section class="card">${empty("首頁的卡片都關掉了<br>到「更多 → 外觀與版面」打開")}</section>`}`,
    };
  },

  appearance() {
    const order = homeOrder();
    const hidden = HOME_CARDS.filter(([k]) => !order.includes(k));
    const name = k => HOME_CARDS.find(c => c[0] === k)[1];
    const s = db.settings, img = getBgImage();
    const bgType = img ? "image" : s.bgColor ? "color" : "none";
    return {
      title: "外觀與版面",
      html: `
        <section class="card"><h2>首頁卡片 <a data-act="homeReset">恢復預設</a></h2>
          ${order.map((k, i) => `
            <div class="row"><span class="grow">${name(k)}</span>
              <button class="mini" data-act="homeMove" data-id="${k}|-1" ${i === 0 ? "disabled" : ""}>↑</button>
              <button class="mini" data-act="homeMove" data-id="${k}|1" ${i === order.length - 1 ? "disabled" : ""}>↓</button>
              <button class="switch on" data-act="homeToggle" data-id="${k}" aria-label="隱藏"></button></div>`).join("")}
          ${hidden.map(([k, n]) => `
            <div class="row"><span class="grow muted">${n}</span>
              <button class="switch" data-act="homeToggle" data-id="${k}" aria-label="顯示"></button></div>`).join("")}
          <p class="small muted">用 ↑ ↓ 調整順序，用開關決定要不要顯示。</p>
        </section>
        <section class="card"><h2>主題色</h2>
          <div class="swatches">${PALETTE.map(c => `<button class="sw ${c === (s.accent || PALETTE[0]) ? "on" : ""}" style="background:${c}" data-act="setAccent" data-id="${c}"></button>`).join("")}</div>
        </section>
        <section class="card"><h2>背景 <span>${{ none: "預設", color: "純色", image: "圖片" }[bgType]}</span></h2>
          <div class="swatches">${BG_COLORS.map(c => `<button class="sw ${bgType === "color" && s.bgColor === c ? "on" : ""}" style="background:${c}" data-act="setBgColor" data-id="${c}"></button>`).join("")}
            <label class="sw custom" title="自訂顏色"><input type="color" data-change="bgCustom" value="${esc(s.bgColor || "#DFE7FD")}">＋</label></div>
          <label class="btn wide" style="margin-top:12px">🖼️ 從相簿選背景圖片<input type="file" accept="image/*" data-change="bgImage" hidden></label>
          ${bgType !== "none" ? `<button class="btn wide" data-act="clearBg">恢復預設背景</button>` : ""}
          <p class="small muted">背景圖片只存在這支手機（太大，不放進雲端同步）；首頁版面、主題色和背景顏色會同步。</p>
        </section>`,
    };
  },

  calendar() {
    const [y, m] = ui.calMonth.split("-").map(Number);
    const first = new Date(y, m - 1, 1);
    const offset = first.getDay(); // 星期日開頭
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
      title: "行事曆",
      action: `<button class="txt" data-act="calToday">今天</button>`,
      html: `
        <div class="month"><button data-act="calMonth" data-id="-1">‹</button><b>${y} 年 ${m} 月</b><button data-act="calMonth" data-id="1">›</button></div>
        <div class="cal-week">${DAYS.map(d => `<span>${d}</span>`).join("")}</div>
        <div class="cal">${cells.join("")}</div>
        <section class="card"><h2>${fmtDate(sel)}${sel === td ? " · 今天" : ""}</h2>
          ${others.map(itemRow).join("") || empty("這天沒有安排")}
          <div class="agenda-add">
            <button class="btn" data-act="addEvent" data-id="${sel}">＋ 行程</button>
            <button class="btn" data-act="addTodoOn" data-id="${sel}">＋ 待辦</button>
            <button class="btn" data-act="addTaskOn" data-id="${sel}">＋ 作業</button>
          </div></section>
        ${classes.length ? `<section class="card"><h2>這天的課</h2>${classes.map(itemRow).join("")}</section>` : ""}`,
    };
  },

  list() {
    const td = ymd(), tmr = ymd(addDays(new Date(), 1));
    const todoOpen = db.todos.filter(t => !t.done), taskOpen = db.tasks.filter(t => !t.done);
    let body, doneCount;
    if (ui.listMode === "todo") {
      const sortT = (a, b) => ((b.priority || 0) - (a.priority || 0)) || (a.date || "").localeCompare(b.date || "");
      const groups = [
        ["逾期", t => t.date && t.date < td], ["今天", t => t.date === td], ["明天", t => t.date === tmr],
        ["之後", t => t.date > tmr], ["沒有日期", t => !t.date],
      ];
      body = groups.map(([name, fn]) => {
        const g = todoOpen.filter(fn).sort(sortT);
        return g.length ? `<section class="card"><h2>${name} <span>${g.length}</span></h2>${g.map(t => todoRow(t, name !== "今天" && name !== "明天")).join("")}</section>` : "";
      }).join("") || `<section class="card">${empty("沒有待辦，按右上角 ＋ 新增")}</section>`;
      const done = db.todos.filter(t => t.done);
      doneCount = done.length;
      if (ui.showDone && done.length) body += `<section class="card"><h2>已完成</h2>${done.map(t => todoRow(t, true)).join("")}</section>`;
    } else {
      body = `<section class="card">${taskOpen.sort(byDue).map(taskRow).join("") || empty("沒有待做的作業，按右上角 ＋ 新增")}</section>`;
      const done = db.tasks.filter(t => t.done).sort(byDue).reverse();
      doneCount = done.length;
      if (ui.showDone && done.length) body += `<section class="card"><h2>已完成</h2>${done.map(taskRow).join("")}</section>`;
    }
    return {
      title: "清單",
      action: `<button data-act="${ui.listMode === "todo" ? "addTodo" : "addTask"}">＋</button>`,
      html: `
        <div class="seg">
          <button class="${ui.listMode === "todo" ? "on" : ""}" data-act="listMode" data-id="todo">待辦 ${todoOpen.length}</button>
          <button class="${ui.listMode === "task" ? "on" : ""}" data-act="listMode" data-id="task">作業 ${taskOpen.length}</button>
        </div>
        ${body}
        ${doneCount ? `<button class="btn wide" data-act="toggleShowDone">${ui.showDone ? "隱藏" : "顯示"}已完成（${doneCount}）</button>` : ""}`,
    };
  },

  schedule() {
    const s = sched(), list = classesOn(ui.day), todayD = new Date().getDay();
    return {
      title: "課表",
      action: `<button class="txt" data-act="newSched">＋ 新課表</button>`,
      html: `
        <div class="toolbar">
          <select data-change="switchSched">${db.schedules.map(x => `<option value="${x.id}" ${x.id === s.id ? "selected" : ""}>${esc(x.name)}</option>`).join("")}</select>
          <button class="btn" data-act="schedMenu">管理</button>
        </div>
        <div class="days">${WEEK_ORDER.map(i => `<button class="${i === ui.day ? "on" : ""} ${i === todayD ? "today" : ""}" data-act="pickDay" data-id="${i}">${DAYS[i]}<small>${classesOn(i).length || ""}</small></button>`).join("")}</div>
        <section class="card">${list.map(c => classRow(c, false, true)).join("") || empty("這天沒有課")}</section>
        <button class="btn wide" data-act="addClass">＋ 新增課程</button>`,
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
      ? `<p class="center muted">${t.mode === "work" ? "專注中：" + esc(t.subject) : "休息中 ☕"}</p>
         <button class="btn primary wide" data-act="stopTimer">${t.mode === "work" ? "結束並記錄" : "結束休息"}</button>
         ${t.mode === "work" ? `<button class="btn wide" data-act="cancelTimer">放棄（不記錄）</button>` : ""}`
      : `<select id="focusSubject">${subjectList.map(s => `<option ${s === pick ? "selected" : ""}>${esc(s)}</option>`).join("")}</select>
         <button class="btn primary wide" data-act="startWork">開始專注 ${db.settings.work} 分鐘</button>
         <button class="btn wide" data-act="startBreak">休息 ${db.settings.brk} 分鐘</button>`;

    return {
      title: "專注",
      action: `<button class="txt" data-act="focusSettings">設定</button>`,
      html: `
        <section class="card focus-card"><div id="clock" class="clock">${clockText()}</div>${control}</section>
        <section class="card"><h2>今天</h2><p class="big">${fmtMin(sumBy(db.focus.filter(f => f.date === td), "minutes"))}</p></section>
        <section class="card"><h2>本週各科 <span>${fmtMin(rows.reduce((s, r) => s + r[1], 0))}</span></h2>
          ${rows.map(([s, m]) => `<div class="barrow"><div class="small"><b>${esc(s)}</b> <span class="muted">${fmtMin(m)}</span></div>
            <div class="meter"><i style="width:${(m / max) * 100}%;background:${esc(colorOf(s))}"></i></div></div>`).join("") || empty("這週還沒有紀錄")}
        </section>
        ${recent.length ? `<section class="card"><h2>最近紀錄</h2>${recent.map(f => `
          <div class="row"><div class="grow"><b>${esc(f.subject)}</b> <span class="muted small">${fmtDate(f.date)}</span></div>
            <span class="small">${fmtMin(f.minutes)}</span><button class="x" data-act="delFocus" data-id="${f.id}">×</button></div>`).join("")}</section>` : ""}`,
    };
  },

  more() {
    const exam = db.exams.filter(e => daysUntil(e.date) >= 0).sort((a, b) => a.date.localeCompare(b.date))[0];
    const monthOut = sumBy(db.money.filter(x => x.type === "out" && x.date.startsWith(ymd().slice(0, 7))), "amount");
    const items = [
      ["schedule", "📅", "課表", sched().name],
      ["exams", "⏳", "考試倒數", exam ? `${exam.name} 剩 ${daysUntil(exam.date)} 天` : "還沒有考試"],
      ["unis", "🎓", "大學申請", `${db.unis.length} 間學校`],
      ["money", "💰", "記帳", `本月支出 ${money(monthOut)}`],
      ["habits", "✅", "習慣", `${db.habits.length} 個習慣`],
      ["appearance", "🎨", "外觀與版面", "首頁卡片、主題色、背景"],
      ["settings", "☁️", "同步與備份", sync && sync.token ? `已同步 ${sync.lastSync ? hhmm(sync.lastSync) : ""}` : "還沒開啟雲端同步"],
    ];
    return {
      title: "更多",
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
        <div class="count"><b>${n < 0 ? "✓" : n}</b><small>${n < 0 ? "已結束" : n === 0 ? "就是今天" : "天"}</small></div>
        <div class="grow"><b>${esc(e.name)}</b><div class="muted small">${fmtDate(e.date)}${e.note ? " · " + esc(e.note) : ""}</div></div></div>`;
    };
    return {
      title: "考試倒數",
      action: `<button data-act="addExam">＋</button>`,
      html: `<section class="card">${coming.map(row).join("") || empty("還沒有考試，按右上角 ＋ 新增")}</section>
        ${past.length ? `<section class="card"><h2>已結束</h2>${past.map(row).join("")}</section>` : ""}`,
    };
  },

  unis() {
    const list = [...db.unis].sort((a, b) => (a.deadline || "9999").localeCompare(b.deadline || "9999"));
    return {
      title: "大學申請",
      action: `<button data-act="addUni">＋</button>`,
      html: `<section class="card">${list.map(u => `
        <div class="row" data-act="openUni" data-id="${u.id}">
          <div class="grow"><b>${esc(u.name)}</b>
            <div class="muted small">${esc([u.program, u.country].filter(Boolean).join(" · "))}</div>
            <div class="small">${u.deadline ? fmtDate(u.deadline) + " " + dueLabel(u.deadline) : '<span class="muted">未設定截止日</span>'}
              <span class="muted">· 準備 ${u.items.filter(i => i.done).length}/${u.items.length}</span></div></div>
          <span class="pill">${esc(u.status)}</span>
        </div>`).join("") || empty("還沒有學校，按右上角 ＋ 新增")}</section>`,
    };
  },

  uni() {
    const u = curUni();
    if (!u) { ui.page = "unis"; return VIEWS.unis(); }
    return {
      title: u.name,
      action: `<button class="txt" data-act="editUni" data-id="${u.id}">編輯</button>`,
      html: `
        <section class="card"><h2>基本資料 <span class="pill">${esc(u.status)}</span></h2>
          <div>${esc([u.program, u.country].filter(Boolean).join(" · ")) || '<span class="muted">（沒有填科系）</span>'}</div>
          <div class="small">截止日：${u.deadline ? fmtDate(u.deadline) + " " + dueLabel(u.deadline) : "未設定"}</div></section>
        <section class="card"><h2>要準備的東西 <span>${u.items.filter(i => i.done).length}/${u.items.length}</span></h2>
          ${u.items.map(checkItem).join("") || empty("沒有項目")}
          <form class="inline" data-form="addItem"><input name="text" placeholder="新增項目…" autocomplete="off"><button class="btn">＋</button></form></section>
        ${u.notes ? `<section class="card"><h2>筆記</h2><p class="pre">${esc(u.notes)}</p></section>` : ""}`,
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
      title: "記帳",
      action: `<button data-act="addMoney">＋</button>`,
      html: `
        <div class="month"><button data-act="month" data-id="-1">‹</button><b>${y} 年 ${m} 月</b><button data-act="month" data-id="1">›</button></div>
        <section class="card stats">
          <div><span class="muted small">支出</span><b>${money(outSum)}</b></div>
          <div><span class="muted small">收入</span><b class="pos">${money(incSum)}</b></div>
          <div><span class="muted small">結餘</span><b>${money(incSum - outSum)}</b></div></section>
        ${catRows.length ? `<section class="card"><h2>支出分類</h2>${catRows.map(([c, v], i) => `
          <div class="barrow"><div class="small"><b>${esc(c)}</b> <span class="muted">${money(v)} · ${Math.round((v / outSum) * 100)}%</span></div>
          <div class="meter"><i style="width:${(v / catRows[0][1]) * 100}%;background:${PALETTE[i % PALETTE.length]}"></i></div></div>`).join("")}</section>` : ""}
        <section class="card">${Object.keys(groups).map(d => `<h3 class="date">${fmtDate(d)}</h3>` + groups[d].map(x => `
          <div class="row" data-act="editMoney" data-id="${x.id}">
            <div class="grow"><b>${esc(x.category)}</b>${x.note ? ` <span class="muted small">${esc(x.note)}</span>` : ""}</div>
            <b class="${x.type === "in" ? "pos" : ""}">${x.type === "in" ? "+" : "−"}${money(x.amount)}</b></div>`).join("")).join("") || empty("這個月還沒有紀錄")}</section>`,
    };
  },

  habits() {
    const days = [...Array(7)].map((_, i) => ymd(addDays(new Date(), i - 6)));
    return {
      title: "習慣",
      action: `<button data-act="addHabit">＋</button>`,
      html: db.habits.map(h => `
        <section class="card">
          <div class="row" data-act="editHabit" data-id="${h.id}"><b class="grow">${esc(h.icon)} ${esc(h.name)}</b>
            <span class="small muted">🔥 連續 ${streak(h.id)} 天</span></div>
          <div class="dots">${days.map((d, i) => `<button class="${habitDone(h.id, d) ? "on" : ""}" data-act="toggleHabit" data-id="${h.id}|${d}">${i === 6 ? "今" : DAYS[parseYmd(d).getDay()]}</button>`).join("")}</div>
        </section>`).join("") || `<section class="card">${empty("還沒有習慣，按右上角 ＋ 新增<br>例如：💧 喝水、🏃 運動、📖 閱讀")}</section>`,
    };
  },

  settings() {
    const on = sync && sync.token;
    return {
      title: "同步與備份",
      html: `
        <section class="card"><h2>☁️ 雲端同步（GitHub 私人資料庫）</h2>
          ${on ? `
            <p class="small">已連線：<b>${esc(sync.repo)}</b></p>
            <p class="small muted" id="syncStatus">${syncStatusText()}</p>
            <button class="btn wide" data-act="syncNow">🔄 立即同步</button>
            <button class="btn wide danger" data-act="syncOff">中斷連線（資料會留在手機和雲端）</button>`
          : `<p class="small muted">開啟後，資料會自動存到你自己的 GitHub 私人資料庫。清除 Safari 資料或換手機時，重新連線就能找回全部資料；主畫面小工具也會讀這份資料。</p>
            <button class="btn primary wide" data-act="syncSetup">開啟雲端同步</button>`}
        </section>
        <section class="card"><h2>手動備份</h2>
          <p class="small muted">${db.lastBackup ? `上次備份：${fmtDate(db.lastBackup)}` : "還沒手動備份過。"}</p>
          <button class="btn wide" data-act="exportShare">📤 匯出備份檔</button>
          <button class="btn wide" data-act="copyBackup">📋 複製備份文字</button></section>
        <section class="card"><h2>還原</h2>
          <label class="btn wide">📂 從備份檔匯入<input type="file" accept=".json,application/json,text/plain" data-change="importFile" hidden></label>
          <button class="btn wide" data-act="pasteBackup">📝 貼上備份文字</button></section>
        <section class="card"><h2>資料</h2>
          <p class="small muted">${db.schedules.length} 個課表 · ${db.todos.length} 項待辦 · ${db.tasks.length} 項作業 · ${db.events.length} 個行程 · ${db.money.length} 筆帳</p>
          <button class="btn wide danger" data-act="resetAll">清除這支手機的資料</button></section>`,
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

// ===== 表單（從下方滑出的編輯視窗） =====
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

// onSave(values) 回傳字串 = 錯誤訊息；回傳 true = 已自己處理完
function form(title, fields, values, onSave, onDelete) {
  formState = { fields, onSave, onDelete };
  $("#modal").innerHTML = `
    <div class="backdrop" data-act="closeModal"></div>
    <div class="sheet">
      <div class="sheet-head"><button type="button" data-act="closeModal">取消</button><b>${esc(title)}</b>
        <button type="button" class="strong" data-act="submitForm">儲存</button></div>
      <form id="f" data-form="modalForm">${fields.map(f => field(f, values[f.key])).join("")}<button hidden></button></form>
      ${onDelete ? `<button type="button" class="btn danger wide" data-act="deleteForm">刪除</button>` : ""}
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
  if (!confirm("確定要刪除嗎？")) return;
  const res = formState.onDelete();
  if (res) return toast(res);
  save(); closeModal(); render();
}

function classForm(c) {
  const isNew = !c;
  const values = c || { day: ui.day, start: "08:10", end: "09:00", color: PALETTE[0] };
  form(isNew ? "新增課程" : "編輯課程", [
    { key: "name", label: "科目", type: "text", required: true, list: subjects().filter(s => s !== "其他") },
    { key: "day", label: "星期", type: "select", options: WEEK_ORDER.map(i => [i, "星期" + DAYS[i]]) },
    { key: "start", label: "開始", type: "time", required: true },
    { key: "end", label: "結束", type: "time", required: true },
    { key: "room", label: "教室／備註", type: "text", ph: "例如：A201、第3節" },
    { key: "color", label: "顏色（同科目會一起換）", type: "color" },
  ], values, v => {
    if (toMin(v.end) <= toMin(v.start)) return "結束時間要比開始晚";
    v.day = Number(v.day);
    if (isNew) sched().classes.push({ id: uid(), ...v });
    else Object.assign(c, v);
    sched().classes.forEach(x => { if (x.name === v.name) x.color = v.color; });
    ui.day = v.day;
  }, isNew ? null : () => { sched().classes = sched().classes.filter(x => x !== c); });

  // 輸入已存在的科目時，自動選它原本的顏色
  $("#f_name").addEventListener("input", e => {
    const same = sched().classes.find(x => x.name === e.target.value.trim());
    const radio = same && $(`#f input[name=color][value="${same.color}"]`);
    if (radio) radio.checked = true;
  });
}

function todoForm(t, date) {
  const isNew = !t;
  form(isNew ? "新增待辦" : "編輯待辦", [
    { key: "text", label: "要做什麼", type: "text", required: true },
    { key: "date", label: "日期（可以不填）", type: "date" },
    { key: "priority", label: "優先順序", type: "select", options: PRIORITIES },
    { key: "note", label: "備註", type: "textarea" },
  ], t || { date: date ?? ymd(), priority: 0 }, v => {
    v.priority = Number(v.priority);
    if (isNew) db.todos.push({ id: uid(), done: false, ...v });
    else Object.assign(t, v);
  }, isNew ? null : () => { db.todos = db.todos.filter(x => x !== t); });
}

function taskForm(t, due) {
  const isNew = !t;
  form(isNew ? "新增作業" : "編輯作業", [
    { key: "title", label: "名稱", type: "text", required: true, ph: "例如：Math IA 初稿" },
    { key: "subject", label: "科目", type: "select", options: subjects() },
    { key: "type", label: "類型", type: "select", options: TASK_TYPES },
    { key: "due", label: "截止日", type: "date" },
    { key: "note", label: "備註", type: "textarea" },
  ], t || { type: "作業", due: due || ymd(addDays(new Date(), 7)) }, v => {
    if (isNew) db.tasks.push({ id: uid(), done: false, ...v });
    else Object.assign(t, v);
  }, isNew ? null : () => { db.tasks = db.tasks.filter(x => x !== t); });
}

function eventForm(e, date) {
  const isNew = !e;
  form(isNew ? "新增行程" : "編輯行程", [
    { key: "title", label: "行程", type: "text", required: true, ph: "例如：補習、看牙醫、社團" },
    { key: "date", label: isNew ? "開始日期" : "開始日期（重複行程的第一天）", type: "date", required: true },
    { key: "endDate", label: "結束日期（多天行程才填）", type: "date" },
    { key: "start", label: "開始時間（不填 = 整天）", type: "time" },
    { key: "end", label: "結束時間（多天行程 = 最後一天幾點結束）", type: "time" },
    { key: "repeat", label: "重複", type: "select", options: REPEATS },
    { key: "color", label: "顏色", type: "color" },
    { key: "note", label: "備註", type: "textarea" },
  ], e || { date: date || ymd(), repeat: "none", color: PALETTE[8] }, v => {
    if (v.endDate && v.endDate < v.date) return "結束日期不能比開始日期早";
    if (v.endDate === v.date) v.endDate = "";
    if (!v.endDate && v.start && v.end && toMin(v.end) <= toMin(v.start)) return "結束時間要比開始晚";
    if (!v.start) v.end = "";
    if (isNew) db.events.push({ id: uid(), ...v });
    else Object.assign(e, v);
  }, isNew ? null : () => { db.events = db.events.filter(x => x !== e); });
}

function examForm(e) {
  const isNew = !e;
  form(isNew ? "新增考試" : "編輯考試", [
    { key: "name", label: "考試名稱", type: "text", required: true, ph: "例如：IB 大考、Mock exam" },
    { key: "date", label: "日期", type: "date", required: true },
    { key: "note", label: "備註", type: "text" },
  ], e || {}, v => {
    if (isNew) db.exams.push({ id: uid(), ...v });
    else Object.assign(e, v);
  }, isNew ? null : () => { db.exams = db.exams.filter(x => x !== e); });
}

function uniForm(u) {
  const isNew = !u;
  form(isNew ? "新增學校" : "編輯學校", [
    { key: "name", label: "學校", type: "text", required: true },
    { key: "program", label: "科系", type: "text", ph: "例如：Mathematics and Statistics" },
    { key: "country", label: "國家", type: "select", options: UNI_COUNTRIES },
    { key: "deadline", label: "截止日", type: "date" },
    { key: "status", label: "狀態", type: "select", options: UNI_STATUS },
    { key: "notes", label: "筆記", type: "textarea" },
  ], u || { status: "研究中" }, v => {
    if (isNew) db.unis.push({ id: uid(), items: UNI_ITEMS.map(text => ({ text, done: false })), ...v });
    else Object.assign(u, v);
  }, isNew ? null : () => { db.unis = db.unis.filter(x => x !== u); ui.page = "unis"; });
}

function moneyForm(x) {
  const isNew = !x;
  form(isNew ? "記一筆" : "編輯紀錄", [
    { key: "type", label: "類型", type: "select", options: [["out", "支出"], ["in", "收入"]] },
    { key: "amount", label: "金額", type: "number", required: true },
    { key: "category", label: "分類", type: "select", options: MONEY_CATS },
    { key: "date", label: "日期", type: "date", required: true },
    { key: "note", label: "備註", type: "text" },
  ], x || { type: "out", category: "餐飲", date: ymd() }, v => {
    if (!(v.amount > 0)) return "金額要大於 0";
    if (isNew) db.money.push({ id: uid(), ...v });
    else Object.assign(x, v);
    ui.month = v.date.slice(0, 7);
  }, isNew ? null : () => { db.money = db.money.filter(y => y !== x); });
}

function habitForm(h) {
  const isNew = !h;
  form(isNew ? "新增習慣" : "編輯習慣", [
    { key: "icon", label: "圖示（一個 emoji）", type: "text", ph: "💧" },
    { key: "name", label: "名稱", type: "text", required: true, ph: "例如：喝 2000cc 水" },
  ], h || {}, v => {
    if (isNew) db.habits.push({ id: uid(), ...v });
    else Object.assign(h, v);
  }, isNew ? null : () => { db.habits = db.habits.filter(x => x !== h); });
}

// ===== 專注計時器 =====
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
    else if (!finished) toast("不到 1 分鐘，不記錄");
  }
  db.timer = null;
  save(); render();
  if (finished) toast(t.mode === "work" ? `完成 ${t.minutes} 分鐘 🍅 休息一下吧` : "休息結束，繼續加油 💪");
}

function tick() {
  if (!db.timer) return;
  if (Date.now() >= db.timer.end) return endTimer(true, true);
  const el = $("#clock");
  if (el) el.textContent = clockText();
}

// ===== 雲端同步（GitHub 私人資料庫） =====
// sync = { repo: "帳號/資料庫", token, path, sha, lastSync, error }；只存在這支手機，不會進備份檔
let sync = null;
try { sync = JSON.parse(localStorage.getItem(SYNC_KEY)); } catch {}
const saveSync = () => localStorage.setItem(SYNC_KEY, JSON.stringify(sync));
let pushTimer = null, pushPending = false, syncBusy = false, lastPull = 0;

const b64encode = s => { let bin = ""; new TextEncoder().encode(s).forEach(b => { bin += String.fromCharCode(b); }); return btoa(bin); };
const b64decode = b => new TextDecoder().decode(Uint8Array.from(atob(b.replace(/\s/g, "")), c => c.charCodeAt(0)));

function syncStatusText() {
  if (!sync) return "";
  if (syncBusy) return "同步中…";
  if (sync.error) return "⚠️ " + sync.error;
  return sync.lastSync ? `上次同步：${hhmm(sync.lastSync)} ✅` : "還沒同步過";
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
  db = { ...fresh(), ...remote };
  localStorage.setItem(KEY, JSON.stringify(db));
  render();
}

// 下載雲端資料，比較誰比較新：雲端新就用雲端，手機新就上傳
async function pull() {
  const res = await gh("GET");
  if (res.status === 404) { sync.sha = null; return push(false); }
  if (!res.ok) throw new Error(res.status === 401 ? "Token 錯誤或過期" : "下載失敗（" + res.status + "）");
  const j = await res.json();
  sync.sha = j.sha;
  const remote = JSON.parse(b64decode(j.content));
  if ((remote.updatedAt || 0) > (db.updatedAt || 0)) useRemote(remote);
  else if ((remote.updatedAt || 0) < (db.updatedAt || 0)) return push(false);
}

async function push(retry = true) {
  pushPending = false;
  const res = await gh("PUT", { message: "sync " + new Date().toISOString(), content: b64encode(JSON.stringify(db)), ...(sync.sha ? { sha: sync.sha } : {}) });
  if ((res.status === 409 || res.status === 422) && retry) return pull(); // 雲端被別的裝置改過：重新比較
  if (!res.ok) throw new Error(res.status === 401 ? "Token 錯誤或過期" : "上傳失敗（" + res.status + "）");
  sync.sha = (await res.json()).content.sha;
}

async function runSync(fn) {
  if (!sync || !sync.token || syncBusy) return;
  syncBusy = true; showSyncStatus();
  try {
    await fn();
    sync.lastSync = Date.now(); sync.error = null;
  } catch (e) {
    sync.error = e.message === "Failed to fetch" ? "沒有網路，之後會再試" : e.message;
    if (fn === push) pushPending = true;
  }
  syncBusy = false; saveSync(); showSyncStatus();
  // 已經離開 App 時要馬上傳，計時器在背景可能不會跑
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
  form("開啟雲端同步", [
    { key: "repo", label: "私人資料庫（帳號/資料庫名稱）", type: "text", required: true, ph: "例如：sam/myhq-data" },
    { key: "token", label: "GitHub Token", type: "password", required: true, hint: "只會存在這支手機裡" },
  ], { repo: "" }, async v => {
    const repo = v.repo.replace(/^https?:\/\/github\.com\//, "").replace(/\/$/, "");
    if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) return "格式要像：帳號/資料庫名稱";
    sync = { repo, token: v.token, path: "data.json", sha: null, lastSync: null, error: null };
    try {
      const res = await gh("GET");
      if (res.status === 401) throw new Error("Token 不對");
      if (res.status === 404) {
        const check = await fetch(`https://api.github.com/repos/${repo}`, { headers: { Authorization: `Bearer ${v.token}` } });
        if (!check.ok) throw new Error("找不到這個資料庫，或 Token 沒有權限");
        await push(false); // 雲端還沒有資料：上傳手機的
      } else if (res.ok) {
        const j = await res.json();
        sync.sha = j.sha;
        if (confirm("雲端已經有資料了。\n按「確定」：用雲端的資料（取代這支手機的）\n按「取消」：用這支手機的資料（取代雲端的）")) useRemote(JSON.parse(b64decode(j.content)));
        else await push(false);
      } else throw new Error("連線失敗（" + res.status + "）");
    } catch (e) {
      sync = null;
      return e.message === "Failed to fetch" ? "沒有網路" : e.message;
    }
    sync.lastSync = Date.now();
    saveSync(); closeModal(); render(); toast("雲端同步已開啟 ☁️");
    return true;
  });
}

// ===== 備份 =====
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
    db.lastBackup = ymd(); save(); render(); toast("已匯出備份 ✅");
  } catch (e) {
    if (e.name !== "AbortError") toast("匯出失敗，試試「複製備份文字」");
  }
}

async function copyBackup() {
  try {
    await navigator.clipboard.writeText(JSON.stringify(db));
    db.lastBackup = ymd(); save(); render();
    toast("已複製，貼到備忘錄或 LINE 保存");
  } catch { toast("複製失敗"); }
}

function importData(text) {
  let d;
  try { d = JSON.parse(text); } catch { return toast("看不懂這個備份內容"); }
  if (!d || !d.version || !Array.isArray(d.schedules)) return toast("這不是 My HQ 的備份");
  if (!confirm("匯入會取代目前所有資料，確定嗎？")) return;
  db = { ...fresh(), ...d };
  save(); closeModal();
  ui.page = null; ui.tab = "today";
  render(); toast("匯入完成 ✅");
}

// ===== 按鈕動作 =====
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

  pickDay: id => { ui.day = Number(id); render(); },
  addClass: () => classForm(null),
  editClass: id => classForm(find(sched().classes, id)),
  newSched: () => form("新增課表", [
    { key: "name", label: "課表名稱", type: "text", required: true, ph: "例如：大一上學期" },
    { key: "from", label: "內容", type: "select", options: [["empty", "空白開始"], ["copy", "複製目前的課表"]] },
  ], {}, v => {
    const s = { id: uid(), name: v.name, classes: v.from === "copy" ? sched().classes.map(c => ({ ...c, id: uid() })) : [] };
    db.schedules.push(s);
    db.activeSchedule = s.id;
  }),
  schedMenu: () => {
    const s = sched();
    form("管理課表", [{ key: "name", label: "課表名稱", type: "text", required: true }], s,
      v => { s.name = v.name; },
      () => {
        if (db.schedules.length === 1) return "至少要保留一個課表";
        db.schedules = db.schedules.filter(x => x !== s);
        db.activeSchedule = db.schedules[0].id;
      });
  },

  addTask: () => taskForm(null),
  addTaskOn: date => taskForm(null, date),
  editTask: id => taskForm(find(db.tasks, id)),
  toggleTask: id => { const t = find(db.tasks, id); t.done = !t.done; save(); render(); if (t.done) toast("完成 ✅"); },

  startWork: () => startTimer("work"),
  startBreak: () => startTimer("break"),
  stopTimer: () => endTimer(true, false),
  cancelTimer: () => { if (confirm("放棄這次計時？不會記錄時間。")) endTimer(false, false); },
  focusSettings: () => form("計時長度", [
    { key: "work", label: "專注（分鐘）", type: "number", required: true },
    { key: "brk", label: "休息（分鐘）", type: "number", required: true },
  ], db.settings, v => {
    if (!(v.work >= 1 && v.brk >= 1)) return "至少要 1 分鐘";
    Object.assign(db.settings, { work: Math.round(v.work), brk: Math.round(v.brk) });
  }),
  delFocus: id => { if (confirm("刪除這筆紀錄？")) { db.focus = db.focus.filter(f => f.id !== id); save(); render(); } },

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
  syncOff: () => { if (confirm("中斷雲端同步？手機和雲端的資料都會保留。")) { sync = null; localStorage.removeItem(SYNC_KEY); render(); } },
  exportShare, copyBackup,
  pasteBackup: () => form("貼上備份文字", [{ key: "text", label: "把整段備份內容貼在這裡", type: "textarea", required: true }], {},
    v => { importData(v.text); return true; }),
  resetAll: () => {
    if (confirm("真的要清除這支手機的資料嗎？（雲端的資料不會被刪）") && confirm("最後確認：全部清除？")) {
      sync = null; localStorage.removeItem(SYNC_KEY);
      db = fresh(); localStorage.setItem(KEY, JSON.stringify(db));
      ui.page = null; ui.tab = "today"; render(); toast("已清除");
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
// 另一個視窗改了資料時，這邊跟著更新，避免舊資料蓋掉新資料
window.addEventListener("storage", e => { if (e.key === KEY) { db = load(); render(); } });
setInterval(tick, 1000);

render();
pullIfStale();

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js");
if (navigator.storage && navigator.storage.persist) navigator.storage.persist();
