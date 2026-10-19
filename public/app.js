// Hockey Lab free workout creator: landing clips, quiz, email step, plan view and a hash router.
// Views: #q1..#q5 (quiz), #email, #plan?<answers> (plan), anything else = landing.
import { QUESTIONS, buildPlan, parse } from "./plan.js";

/* ---------- helpers ---------- */
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const el = (tag, text, className) => Object.assign(document.createElement(tag), { textContent: text, ...(className && { className }) });
const store = { // sessionStorage, but never throws (private mode, blocked storage)
  get(k) { try { return JSON.parse(sessionStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7"/></svg>';

/* ---------- answers (kept for the session, so Back and reloads keep progress) ---------- */
let answers = store.get("hl-answers") || {};
const saveAnswers = () => store.set("hl-answers", answers);
const answered = (q) => (q.multi ? answers[q.id]?.length > 0 : Boolean(answers[q.id]));
const planQuery = () => new URLSearchParams({ ...answers, where: answers.where.join(",") });

/* ---------- landing clips ----------
   Must start on the very first load in every browser (Chrome, Safari, Chrome/Google app on iOS,
   in-app browsers, Low Power Mode), so play() is retried until it sticks. */
const clips = [...document.querySelectorAll("#landing .clip video")];
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
let current = 0, wantPlay = false;

for (const v of clips) { v.muted = true; v.defaultMuted = true; v.playsInline = true; } // some engines check the properties, not the attributes

function tryPlay() {
  const v = clips[current];
  if (reducedMotion || !wantPlay || !v.paused || v.ended) return;
  v.play()?.catch(() => {}); // refused (still loading, Low Power Mode, in-app browser): the hooks below retry
}
function warmNext() {
  const next = clips[(current + 1) % clips.length];
  if (next.preload !== "auto") { next.preload = "auto"; next.load(); }
}
function showLive(i) { clips.forEach((c, k) => c.classList.toggle("live", k === i)); } // crossfade
function playClip(i) {
  const v = clips[i];
  if (i !== current || v.ended) v.currentTime = 0;
  current = i; wantPlay = true;
  clips.forEach((c, k) => { if (k !== i && !c.paused) c.pause(); });
  $("ctag").innerHTML = v.dataset.tag; // trusted, static markup from index.html
  if (reducedMotion) { showLive(i); return; } // show the poster, don't play
  tryPlay();
  v.addEventListener("playing", warmNext, { once: true }); // fetch the next clip only once this one runs, so they don't fight for bandwidth
}
function stopClips() { wantPlay = false; clips.forEach((c) => c.pause()); }

clips.forEach((c, i) => {
  c.addEventListener("ended", () => playClip((i + 1) % clips.length));
  c.addEventListener("playing", () => showLive(i)); // only visible once it's moving
  for (const ev of ["loadedmetadata", "loadeddata", "canplay", "suspend", "stalled"]) c.addEventListener(ev, () => i === current && tryPlay());
});
for (const ev of ["pointerdown", "touchstart", "keydown", "scroll"]) addEventListener(ev, tryPlay, { passive: true });
document.addEventListener("visibilitychange", () => !document.hidden && tryPlay());
addEventListener("pageshow", tryPlay); // back/forward cache restore
setInterval(tryPlay, 1200); // watchdog: a no-op while playing

/* ---------- quiz: one question per screen ---------- */
function showQuestion(i) {
  const q = QUESTIONS[i];
  const picked = (k) => (q.multi ? (answers[q.id] || []).includes(k) : answers[q.id] === k);
  $("qcount").textContent = `${i + 1} of ${QUESTIONS.length}`;
  $("qbar").style.transform = `scaleX(${(i + 1) / (QUESTIONS.length + 1)})`;
  $("qbody").innerHTML = `<div class="anim">
      <h2>${esc(q.q)}</h2>${q.help ? `<p class="help">${esc(q.help)}</p>` : ""}
      <div class="opts">${q.opts.map(([k, label]) =>
        `<button type="button" class="opt${q.multi ? " multi" : ""}" data-k="${k}" aria-pressed="${picked(k)}">${esc(label)}<span class="mk">${CHECK}</span></button>`).join("")}</div>
      ${q.multi ? `<button type="button" class="btn" id="qnext"${answered(q) ? "" : " disabled"}>Continue</button>` : ""}
    </div>`;
  const nextHash = i + 1 < QUESTIONS.length ? `#q${i + 2}` : "#email";

  for (const b of $("qbody").querySelectorAll(".opt")) b.addEventListener("click", () => {
    const k = b.dataset.k;
    if (q.multi) {
      const set = new Set(answers[q.id] || []);
      set.has(k) ? set.delete(k) : set.add(k);
      answers[q.id] = q.opts.map(([key]) => key).filter((key) => set.has(key)); // keep the option order
      saveAnswers();
      b.setAttribute("aria-pressed", set.has(k));
      $("qnext").disabled = !set.size;
    } else {
      answers[q.id] = k;
      saveAnswers();
      for (const o of $("qbody").querySelectorAll(".opt")) o.setAttribute("aria-pressed", o === b);
      setTimeout(() => (location.hash = nextHash), 220); // let the tick show before moving on
    }
  });
  if (q.multi) $("qnext").addEventListener("click", () => (location.hash = nextHash));
}
for (const b of document.querySelectorAll("[data-back]")) b.addEventListener("click", () => history.back());

/* ---------- email (12 and under: a parent's email, for COPPA) ---------- */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isKid = () => answers.age === "u13";

function showEmail() {
  $("lname").textContent = isKid() ? "Player's first name" : "First name";
  $("lemail").textContent = isKid() ? "Parent or guardian's email" : "Email";
  $("parentrow").hidden = !isKid();
  validateEmail();
}
function validateEmail() {
  const ok = $("ename").value.trim() && EMAIL.test($("eemail").value.trim()) && (!isKid() || $("eparent").checked);
  $("esubmit").disabled = !ok;
}
for (const id of ["ename", "eemail", "eparent"]) $(id).addEventListener("input", validateEmail);
$("eform").addEventListener("submit", (e) => {
  e.preventDefault();
  if ($("esubmit").disabled) return;
  // ponytail: no backend yet. Before launch, POST { name, email, tips: $("etips").checked, answers } to /api/lead (GoHighLevel contact).
  store.set("hl-name", $("ename").value.trim());
  location.hash = `#plan?${planQuery()}`;
});

/* ---------- plan: one simple workout, the same every session ---------- */
function showPlan(params) {
  const a = parse(params);
  if (!a) return false;
  const plan = buildPlan(a);
  const w = plan.workout;
  const name = store.get("hl-name");
  $("ptitle").textContent = name ? `${name}'s 1‑week plan` : "Your 1‑week plan";
  $("pchips").replaceChildren(...plan.summary.map((s) => el("span", s)));
  $("psched").replaceChildren(...plan.sessions.map((s) => {
    const li = document.createElement("li");
    li.append(el("b", s.day), el("span", s.place), el("span", `${s.minutes} min`, "a"));
    return li;
  }));
  $("prest").textContent = `Rest or team practice: ${plan.rest.join(", ")}`;
  $("pmin").textContent = `· ${w.minutes} min`;
  $("pdrills").replaceChildren(...w.drills.map((d) => {
    const li = document.createElement("li");
    li.append(el("span", d.name, "n"), el("span", d.amt, "a"));
    if (d.cue) li.append(el("span", d.cue, "c"));
    return li;
  }));
  $("pworkout").textContent = `"${w.title}"`;
  $("preel").href = w.reel;
  return true;
}
$("tlock").addEventListener("click", () => $("next").scrollIntoView({ behavior: "smooth", block: "start" }));
$("restart").addEventListener("click", () => { answers = {}; saveAnswers(); location.hash = ""; });

// 30-second test: day 1 vs day 7, kept for the session
const test = store.get("hl-test") || {};
$("t1").value = test.t1 ?? "";
$("t2").value = test.t2 ?? "";
function showGain() {
  const d1 = parseInt($("t1").value), d7 = parseInt($("t2").value);
  store.set("hl-test", { t1: $("t1").value, t2: $("t2").value });
  $("tgain").textContent = Number.isFinite(d1) && Number.isFinite(d7) ? `${d7 >= d1 ? "+" : ""}${d7 - d1} reps` : "";
}
for (const id of ["t1", "t2"]) $(id).addEventListener("input", showGain);
showGain();

/* ---------- router ---------- */
const VIEWS = { landing: $("landing"), quiz: $("quiz"), email: $("email"), plan: $("plan") };
function route() {
  const h = location.hash.slice(1);
  const q = Number(/^q(\d+)$/.exec(h)?.[1]);
  let view = "landing";
  if (q >= 1 && q <= QUESTIONS.length) { view = "quiz"; showQuestion(q - 1); }
  else if (h === "email" && QUESTIONS.every(answered)) { view = "email"; showEmail(); }
  else if (h.startsWith("plan?") && showPlan(new URLSearchParams(h.slice(5)))) view = "plan";
  for (const [name, section] of Object.entries(VIEWS)) section.hidden = name !== view;
  document.body.classList.toggle("lock", view !== "plan");
  if (view === "landing") playClip(current);
  else stopClips();
  scrollTo(0, 0);
}
addEventListener("hashchange", route);
route();
