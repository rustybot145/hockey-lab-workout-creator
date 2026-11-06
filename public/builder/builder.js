// AI Workout Builder page: asks the questions in plan.js one at a time, then draws buildPlan()'s week.
const STORE = "hl-builder";
const $ = (s) => document.querySelector(s);
const screens = { intro: $("#intro"), question: $("#question"), result: $("#result") };
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };

let A = {};       // answers
let at = 0;       // index into steps()
const steps = () => stepsFor(A);

function show(name) {
  for (const [key, s] of Object.entries(screens)) s.hidden = key !== name;
  scrollTo(0, 0);
}

// ---- asking ----
function ask() {
  const all = steps(), st = all[at];
  $("[data-step]").textContent = `Question ${at + 1} of ${all.length}`;
  $("[data-title]").textContent = st.title;
  $("[data-how]").hidden = !st.how;
  $("[data-how]").textContent = st.how || "";
  for (const box of document.querySelectorAll("#question [data-type]")) box.hidden = box.dataset.type !== (st.type === "multi" ? "choice" : st.type);
  $(".progress").replaceChildren(...all.map((_, i) => { const seg = el("i"); seg.style.setProperty("--p", i < at ? 1 : 0); return seg; }));

  if (st.type === "number") {
    $("[data-ask]").textContent = st.ask;
    $("[data-unit]").textContent = st.unit;
    $("[data-value]").value = A[st.id] ?? "";
  }
  if (st.type === "choice" || st.type === "multi") renderChoices(st);

  // single choices move on by themselves; everything else needs Next
  $("[data-next]").hidden = st.type === "choice";
  $("[data-next]").textContent = at === all.length - 1 ? "Build my plan" : "Next";
  $("[data-skip]").hidden = !st.optional;
  screens.question.classList.toggle("typing", st.type === "number");
  show("question");
  const card = screens.question;
  card.classList.remove("enter"); void card.offsetWidth; card.classList.add("enter");
  if (st.type === "number") $("[data-value]").focus({ preventScroll: true });
}

function renderChoices(st) {
  const multi = st.type === "multi", picked = multi ? (A[st.id] || []) : [A[st.id]];
  $("[data-type=choice]").dataset.layout = st.layout || "";
  $("[data-type=choice]").replaceChildren(...st.options.map((o) => {
    const b = el("button", "choice");
    b.type = "button";
    b.setAttribute("aria-pressed", picked.includes(o.v));
    b.append(el("b", "", o.l), ...(o.d ? [el("span", "", o.d)] : []));
    b.addEventListener("click", () => {
      if (multi) { A[st.id] = picked.includes(o.v) ? picked.filter((x) => x !== o.v) : [...picked, o.v]; renderChoices(st); }
      else { A[st.id] = o.v; next(); }
    });
    return b;
  }));
}

// store this step's answer; false = nothing usable typed yet
function capture() {
  const st = steps()[at];
  if (st.type === "number") {
    const raw = $("[data-value]").value;
    if (raw === "") return false;
    A[st.id] = Math.min(st.max, Number(raw));
  }
  return true;
}

function next() {
  at++;
  if (at < steps().length) ask(); else build(true);
}
function nudge() { screens.question.classList.add("nudge"); setTimeout(() => screens.question.classList.remove("nudge"), 400); }

// ---- the plan ----
let plan = null, view = { pi: 0, kind: "hands" };  // which 2 weeks and which workout (at home / gym) is on screen

function build(fresh) {
  // a gym-only player has no stickhandling answers: drop stale ones from an earlier build
  if (A.where === "gym") { delete A.focus; delete A.minutes; delete A.test; }
  if (fresh) { try { localStorage.setItem(STORE, JSON.stringify({ at: Date.now(), A })); } catch {} }
  plan = buildPlan(A);

  const hands = plan.week.filter((x) => x.kind === "hands").length, gym = plan.week.filter((x) => x.kind === "gym").length;
  $("[data-summary]").textContent = [hands && `${hands} stickhandling`, gym && `${gym} gym`].filter(Boolean).join(" + ") + ` days a week for ${plan.weeks} weeks.`;
  // the switch between the at-home stickhandling and the gym workouts, when the plan has both
  view = { pi: 0, kind: hands ? "hands" : "gym" };
  $("[data-kinds]").hidden = !(hands && gym);
  $("[data-kinds]").replaceChildren(...[["hands", "At-home stickhandling"], ["gym", "Gym"]].map(([k, label]) => {
    const b = el("button", "", label);
    b.type = "button";
    b.dataset.kind = k;
    b.addEventListener("click", () => { view.kind = k; sessions(); });
    return b;
  }));
  $("[data-phases]").replaceChildren(...plan.phases.map((ph, i) => {
    const b = el("button", "", ph.weeks);
    b.type = "button";
    b.addEventListener("click", () => { view.pi = i; sessions(); });
    return b;
  }));
  sessions();
  $("[data-rest]").textContent = "Rest days: let your hands and legs recover. Stay consistent.";
  calendarLinks();

  $("[data-score-block]").hidden = A.test === undefined;
  $("[data-score]").textContent = A.test !== undefined ? `${A.test} clean touches in 30 seconds. Retest every 2 weeks and beat it.` : "";
  show("result");
}

// one card per session of the chosen workout: which days, then every drill (stickhandling ones with Wyatt's clip)
function sessions() {
  const ph = plan.phases[view.pi], gym = view.kind === "gym";
  [...$("[data-phases]").children].forEach((b, i) => b.setAttribute("aria-pressed", i === view.pi));
  [...$("[data-kinds]").children].forEach((b) => b.setAttribute("aria-pressed", b.dataset.kind === view.kind));
  $("[data-phase-name]").textContent = gym ? ph.gymName : ph.name;
  $("[data-sessions]").replaceChildren(...ph.sessions.filter((s) => !!s.gym === gym).map((s) => {
    const box = el("div", "session" + (s.gym ? " gym" : "")), head = el("header"), ol = el("ol");
    head.append(el("span", "kind", s.label), el("h4", "", s.title), el("span", "on", s.on.join(" · ") + (s.minutes ? ` · ${s.minutes} min` : "")));
    const items = [...(s.warmup ? s.warmup.drills.map((d) => ({ ...d, warm: true })) : []), ...s.drills];
    ol.append(...items.map((it, k) => {
      const li = el("li", "ex" + (it.warm ? " warm" : "")), txt = el("span");
      txt.append(el("b", "", it.name), el("span", "", [it.rx, it.cue].filter(Boolean).join(". ")));
      li.append(el("span", "n", k + 1), txt);
      if (it.clip) {
        const b = el("button", "demo", "Watch");
        b.type = "button";
        b.setAttribute("aria-label", `Watch Wyatt: ${it.name}`);
        b.addEventListener("click", () => play(items, k));
        li.append(b);
      }
      return li;
    }));
    box.append(head);
    if (s.warmup) box.append(el("p", "sub", `First: ${s.warmup.title}, 3 min`));
    box.append(ol);
    const notes = [s.gear && `You need ${s.gear}.`, s.note].filter(Boolean);
    if (notes.length) box.append(el("p", "sub", notes.join(" ")));
    if (s.reel) {
      const a = el("a", "src", "From Wyatt's reel ↗");
      Object.assign(a, { href: s.reel, target: "_blank", rel: "noopener" });
      box.append(a);
    }
    if (items.some((it) => it.clip)) {
      const b = el("button", "cta watch", "▶  Watch the workout");
      b.type = "button";
      b.addEventListener("click", () => play(items, items.findIndex((it) => it.clip)));
      box.append(b);
    }
    return box;
  }));
}

// ---- Wyatt doing it ----
const player = $("[data-player]"), video = $("[data-video]");
let queue = [], qi = 0;
function play(items, k) {
  queue = items.filter((it) => it.clip);
  qi = queue.indexOf(items[k]);
  clip();
  if (!player.open) player.showModal();
}
function clip() {
  const it = queue[qi];
  video.src = `/builder/clips/${it.clip}.mp4`;
  video.poster = `/builder/clips/${it.clip}.jpg`;
  video.play().catch(() => {});
  $("[data-count]").textContent = `${qi + 1} of ${queue.length}`;
  $("[data-pname]").textContent = it.name;
  $("[data-prx]").textContent = [it.rx, it.cue].filter(Boolean).join(". ");
  $("[data-prev]").disabled = qi === 0;
  $("[data-fwd]").textContent = qi === queue.length - 1 ? "Done" : "Next";
}
$("[data-prev]").addEventListener("click", () => { if (qi > 0) { qi--; clip(); } });
$("[data-fwd]").addEventListener("click", () => { if (qi < queue.length - 1) { qi++; clip(); } else player.close(); });
$("[data-close]").addEventListener("click", () => player.close());
player.addEventListener("close", () => { video.pause(); video.removeAttribute("src"); video.load(); });
player.addEventListener("click", (e) => { if (e.target === player) player.close(); });  // tap outside

// ---- calendar: a weekly repeating event per training day, for the plan's weeks ----
const ICS_DAY = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
const stamp = (d) => d.toISOString().replace(/[-:]/g, "").slice(0, 15);
const local = (d) => stamp(new Date(d.getTime() - d.getTimezoneOffset() * 6e4));
function firstOn(dow, hh, mm) {
  const d = new Date(); d.setHours(hh, mm, 0, 0); d.setDate(d.getDate() + 1);
  while (d.getDay() !== dow) d.setDate(d.getDate() + 1);
  return d;
}
function calendarEvents() {
  const [hh, mm] = ($("[data-time]").value || "17:00").split(":").map(Number);
  return plan.week.filter((p) => p.kind !== "off").map((p) => {
    const startAt = firstOn(p.d, hh, mm);
    return { p, startAt, endAt: new Date(startAt.getTime() + (p.kind === "gym" ? 60 : (A.minutes || 20) + 5) * 6e4),
      title: p.kind === "gym" ? "Hockey Lab: gym" : "Hockey Lab: stickhandling" };
  });
}
function calendarLinks() {
  const evs = calendarEvents(), first = evs.reduce((a, b) => (a.startAt < b.startAt ? a : b));
  const q = new URLSearchParams({
    action: "TEMPLATE", text: "Hockey Lab workout",
    dates: `${local(first.startAt)}/${local(first.endAt)}`,
    recur: `RRULE:FREQ=WEEKLY;BYDAY=${evs.map((e) => ICS_DAY[e.p.d]).join(",")};COUNT=${evs.length * plan.weeks}`,
    details: "Your workout is in the AI Workout Builder in the Puck Control Academy. Stay consistent.",
  });
  $("[data-gcal]").href = `https://calendar.google.com/calendar/render?${q}`;
  $("[data-cal-note]").textContent = `Repeats every week for ${plan.weeks} weeks, starting tomorrow.`;
}
$("[data-time]").addEventListener("change", calendarLinks);
$("[data-ics]").addEventListener("click", () => {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Hockey Lab//AI Workout Builder//EN", "CALSCALE:GREGORIAN",
    ...calendarEvents().flatMap((e) => ["BEGIN:VEVENT", `UID:hl-${e.p.d}-${Date.now()}@hockey-lab-workout-creator.vercel.app`, `DTSTAMP:${stamp(new Date())}Z`,
      `DTSTART:${local(e.startAt)}`, `DTEND:${local(e.endAt)}`, `RRULE:FREQ=WEEKLY;COUNT=${plan.weeks}`,
      `SUMMARY:${e.title}`, "DESCRIPTION:Your workout is in the AI Workout Builder. Stay consistent.", "END:VEVENT"]),
    "END:VCALENDAR"];
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/calendar" })), download: "hockey-lab-workouts.ics" });
  document.body.append(a); a.click(); a.remove();
});

// ---- keyboard: keep the answer and Next in view when it opens ----
function keepNextVisible() {
  const a = document.activeElement;
  if (!a || a.tagName !== "INPUT" || screens.question.hidden) return;
  $("[data-next]").scrollIntoView({ block: "nearest", behavior: "smooth" });
}
window.visualViewport?.addEventListener("resize", keepNextVisible);
document.addEventListener("focusin", () => setTimeout(keepNextVisible, 300));

// ---- wiring ----
$("[data-start]").addEventListener("click", () => { A = {}; at = 0; ask(); });
$("[data-next]").addEventListener("click", () => (capture() ? next() : nudge()));
$("[data-skip]").addEventListener("click", () => { delete A[steps()[at].id]; next(); });
$("[data-back]").addEventListener("click", () => { if (at === 0) show("intro"); else { at--; ask(); } });
$("[data-value]").addEventListener("input", (e) => { e.target.value = e.target.value.replace(/\D/g, "").slice(0, 3); });
$("[data-value]").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); $("[data-next]").click(); } });
$("[data-rebuild]").addEventListener("click", () => { at = 0; ask(); });
$("[data-clear]").addEventListener("click", () => { try { localStorage.removeItem(STORE); } catch {} A = {}; show("intro"); });

// came back later: show their plan; "Rebuild" starts from their saved answers
try { const saved = JSON.parse(localStorage.getItem(STORE)); if (saved?.A?.level && saved.A.where) { A = saved.A; build(false); } } catch {}
