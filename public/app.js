// Hockey Lab free workout creator: router, quiz, email step, plan view.
import { QUESTIONS, buildPlan, parse } from "./plan.js";

const $ = (id) => document.getElementById(id);
const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7"/></svg>';
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const store = { get(k) { try { return JSON.parse(sessionStorage.getItem(k)); } catch { return null; } },
                set(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch {} } };
let answers = store.get("hl-answers") || {};
const save = () => store.set("hl-answers", answers);
const query = () => new URLSearchParams({ ...answers, where: (answers.where || []).join(",") });

/* landing clip: must start on the very first load in every browser
   (Chrome, Safari, Chrome/Google app on iOS, in-app browsers, Low Power Mode) */
const clips = [...document.querySelectorAll("#landing .clip video")];
const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
clips.forEach((v) => { v.muted = true; v.defaultMuted = true; v.playsInline = true; }); // properties, not just attributes (some engines only check these)
let ci = 0, wantPlay = false;
function tryPlay() {
  const v = clips[ci];
  if (still || !wantPlay || !v.paused || v.ended) return;
  const p = v.play();
  if (p) p.catch(() => {}); // refused (Low Power Mode, data saver, in-app browser): the hooks below retry
}
function warmNext() { const n = clips[(ci + 1) % clips.length]; if (n.preload !== "auto") { n.preload = "auto"; n.load(); } }
function playClip(i) {
  const v = clips[i];
  if (i !== ci || v.ended) v.currentTime = 0;
  ci = i; wantPlay = true;
  clips.forEach((c, k) => { c.classList.toggle("on", k === i); if (k !== i && !c.paused) c.pause(); });
  $("ctag").innerHTML = v.dataset.tag;
  if (still) { clips.forEach((c, k) => c.classList.toggle("live", k === i)); return; } // reduced motion: show the poster, don't play
  tryPlay();
  v.addEventListener("playing", warmNext, { once: true }); // fetch the next clip only once this one runs, so they don't fight for bandwidth
}
function stopClips() { wantPlay = false; clips.forEach((c) => c.pause()); }
clips.forEach((c, i) => {
  c.addEventListener("ended", () => playClip((i + 1) % clips.length));
  c.addEventListener("playing", () => clips.forEach((o, k) => o.classList.toggle("live", k === i))); // crossfade in only when moving
  for (const ev of ["loadedmetadata", "loadeddata", "canplay", "suspend", "stalled"]) c.addEventListener(ev, () => { if (i === ci) tryPlay(); });
});
for (const ev of ["pointerdown", "touchstart", "keydown", "scroll"]) addEventListener(ev, tryPlay, { passive: true });
document.addEventListener("visibilitychange", () => { if (!document.hidden) tryPlay(); });
addEventListener("pageshow", tryPlay); // back/forward cache restore
setInterval(tryPlay, 1200); // watchdog: no-op while playing

/* quiz */
function showQuestion(i) {
  const q = QUESTIONS[i];
  $("qcount").textContent = `${i + 1} of ${QUESTIONS.length}`;
  $("qbar").style.transform = `scaleX(${(i + 1) / (QUESTIONS.length + 1)})`;
  const picked = (k) => (q.multi ? (answers.where || []).includes(k) : answers[q.id] === k);
  $("qbody").innerHTML = `<div class="anim">
      <h2>${esc(q.q)}</h2>${q.help ? `<p class="help">${esc(q.help)}</p>` : ""}
      <div class="opts">${q.opts.map(([k, label]) =>
        `<button type="button" class="opt${q.multi ? " multi" : ""}" data-k="${k}" aria-pressed="${picked(k)}">${esc(label)}<span class="mk">${CHECK}</span></button>`).join("")}</div>
      ${q.multi ? `<button type="button" class="btn" id="qnext" ${(answers.where || []).length ? "" : "disabled"}>Continue</button>` : ""}
    </div>`;
  $("qbody").querySelectorAll(".opt").forEach((b) => b.addEventListener("click", () => {
    const k = b.dataset.k;
    if (q.multi) {
      const set = new Set(answers.where || []); set.has(k) ? set.delete(k) : set.add(k);
      answers.where = ["home", "rink", "gym"].filter((x) => set.has(x)); save();
      b.setAttribute("aria-pressed", set.has(k)); $("qnext").disabled = !set.size;
    } else {
      answers[q.id] = k; save();
      $("qbody").querySelectorAll(".opt").forEach((o) => o.setAttribute("aria-pressed", o === b));
      setTimeout(() => (location.hash = i + 1 < QUESTIONS.length ? `#q${i + 2}` : "#email"), 220);
    }
  }));
  if (q.multi) $("qnext").addEventListener("click", () => (location.hash = "#email"));
}
$("qback").addEventListener("click", () => history.back());
$("eback").addEventListener("click", () => history.back());

/* email (under 13: a parent's email, COPPA) */
function showEmail() {
  const kid = answers.age === "u13";
  $("lname").textContent = kid ? "Player's first name" : "First name";
  $("lemail").textContent = kid ? "Parent or guardian's email" : "Email";
  $("parentrow").hidden = !kid;
  validate();
}
function validate() {
  const ok = $("ename").value.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($("eemail").value.trim()) && (answers.age !== "u13" || $("eparent").checked);
  $("esubmit").disabled = !ok;
}
["ename", "eemail", "eparent"].forEach((id) => $(id).addEventListener("input", validate));
$("eform").addEventListener("submit", (e) => {
  e.preventDefault(); if ($("esubmit").disabled) return;
  // ponytail: no backend yet. Before launch, POST {name, email, tips, answers} to /api/lead (GoHighLevel contact).
  store.set("hl-name", $("ename").value.trim());
  location.hash = "#plan?" + query();
});

/* plan: one simple workout, the same every session */
let plan;
function showPlan(params) {
  const a = parse(params);
  if (!a) { location.hash = ""; return; }
  plan = buildPlan(a);
  const name = store.get("hl-name");
  $("ptitle").textContent = name ? `${name}'s 1\u2011week plan` : "Your 1\u2011week plan";
  $("pchips").innerHTML = plan.summary.map((s) => `<span>${esc(s)}</span>`).join("");
  $("ptabs").innerHTML = `<button type="button" role="tab" aria-selected="true">Week 1</button>`
    + `<button type="button" class="locked" id="tlock" aria-label="Week 2 is inside the program">Week 2 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg></button>`;
  $("tlock").addEventListener("click", () => $("next").scrollIntoView({ behavior: "smooth", block: "start" }));
  const w = plan.workout;
  $("pweek").innerHTML = `
    <h3 class="pl-h">Your week</h3>
    <ol class="sched">${plan.sessions.map((s) => `<li><b>${s.day}</b><span>${s.place}</span><span class="a">${s.minutes} min</span></li>`).join("")}</ol>
    <p class="rest">Rest or team practice: ${plan.rest.join(", ")}</p>
    <h3 class="pl-h">Every session <span>· ${w.minutes} min</span></h3>
    <ol class="drills flat">${w.drills.map((d) => `<li><span class="n">${esc(d.name)}</span><span class="a">${esc(d.amt)}</span>${d.cue ? `<span class="c">${esc(d.cue)}</span>` : ""}</li>`).join("")}</ol>
    <p class="src">Wyatt's "${esc(w.title)}" workout · <a href="${w.reel}" target="_blank" rel="noopener">Watch it</a></p>`;
}
const tests = store.get("hl-test") || {};
$("t1").value = tests.t1 ?? ""; $("t2").value = tests.t2 ?? "";
function gain() {
  const a = parseInt($("t1").value), b = parseInt($("t2").value);
  store.set("hl-test", { t1: $("t1").value, t2: $("t2").value });
  $("tgain").textContent = Number.isFinite(a) && Number.isFinite(b) ? `${b - a >= 0 ? "+" : ""}${b - a} reps` : "";
}
["t1", "t2"].forEach((id) => $(id).addEventListener("input", gain)); gain();
$("restart").addEventListener("click", () => { answers = {}; save(); location.hash = ""; });

/* router: #q1..#q5, #email, #plan?..., else landing */
function route() {
  const h = location.hash.slice(1);
  const views = { landing: $("landing"), quiz: $("quiz"), email: $("email"), plan: $("plan") };
  let view = "landing";
  if (/^q[1-5]$/.test(h)) { view = "quiz"; showQuestion(+h.slice(1) - 1); }
  else if (h === "email") { view = Object.keys(answers).length >= QUESTIONS.length ? "email" : "landing"; if (view === "email") showEmail(); }
  else if (h.startsWith("plan?")) { view = "plan"; showPlan(new URLSearchParams(h.slice(5))); }
  for (const [k, el] of Object.entries(views)) el.hidden = k !== view;
  document.body.classList.toggle("lock", view !== "plan");
  if (view === "landing") playClip(ci); else stopClips();
  scrollTo(0, 0);
}
addEventListener("hashchange", route);
route();
