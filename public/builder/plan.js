// AI Workout Builder: the questions, the workouts and the plan logic. Pure: answers in, plan out
// (builder.js draws it, test.js checks every answer combination). Rule-based on purpose: same answers, same plan.
//
// Stickhandling: every drill, amount and cue is read off the burned-in captions of Wyatt's reels (`reel` = the post),
// and every clip is cut from that reel. Amounts scale to the player's session length.
// Gym: standard hockey strength work, written for this tool (Ben, 2026-11-06). Not from Wyatt's videos; he approves it (§4).

const REEL = (id) => `https://www.instagram.com/reel/${id}/`;

// amt: { min } minutes, { reps, each } reps (each side), or none = an equal share of what's left
const HANDS = {
  w20: { title: "20 minutes, 4 drills", reel: REEL("DSqhOCvkhwC"), base: 20, drills: [
    { name: "Front narrow", clip: "w1-front-narrow", amt: { min: 5 } },
    { name: "Front wide", clip: "w1-front-wide", amt: { min: 5 } },
    { name: "Forehand / backhand fakes", clip: "w1-fakes", amt: { reps: 10, each: true } },
    { name: "Creative handling", clip: "w1-creative", amt: { min: 5 }, cue: "Be powerful, fast, deceptive." },
  ] },
  w10: { title: "10-minute at-home workout", reel: REEL("DRTKEpuDGg0"), base: 10, drills: [
    { name: "Front dribble", clip: "w4-front-dribble" },
    { name: "Forehand dribble", clip: "w4-forehand-dribble" },
    { name: "Front dribble, wide", clip: "w4-front-space", cue: "Use as much space as possible." },
    { name: "Forehand dribble, wide", clip: "w4-forehand-space", cue: "Use as much space as possible." },
    { name: "Quick lateral pulls", clip: "w4-lateral-pulls" },
    { name: "Dribble with sweep fakes", clip: "w4-sweep-fakes" },
    { name: "Quick touches", clip: "w4-quick-touches", cue: "Until your forearms burn." },
  ] },
  pucks: { title: "3 pucks, 6 drills", reel: REEL("DWSG6f6AeBC"), base: 18, gear: "3 pucks", drills: [
    { name: "Circular pushes", clip: "w2-circular-pushes" },
    { name: "Circular toe drags", clip: "w2-circular-toe-drags" },
    { name: "Circular backhand toe drags", clip: "w2-backhand-toe-drags" },
    { name: "Figure eights", clip: "w2-figure-eights" },
    { name: "Wide handle between pucks", clip: "w2-wide-handle" },
    { name: "Quick dribble between pucks", clip: "w2-quick-dribble" },
  ] },
  q20: { title: "20-minute stickhandling workout", reel: REEL("DdVae0ox6xF"), base: 20, drills: [
    { name: "Quick tight handles", clip: "w6-tight-handles" },
    { name: "Wide handles", clip: "w6-wide-handles" },
    { name: "Rapid touches", clip: "w6-rapid-touches" },
    { name: "Figure 8 with handles", clip: "w6-figure-8-handles" },
    { name: "Figure 8s", clip: "w6-figure-8s" },
    { name: "Circular pulls and pushes", clip: "w6-pulls-pushes" },
    { name: "Quick touches with head fakes", clip: "w6-head-fakes" },
  ] },
  seven: { title: "7-drill workout", reel: REEL("DTi4TI_j0j9"), base: 21, gear: "a cone or any obstacle", drills: [
    { name: "Front quick dribble", clip: "w7-front-dribble" },
    { name: "Rotational dribble", clip: "w7-rotational" },
    { name: "Circular pulls around an obstacle", clip: "w7-pulls-obstacle" },
    { name: "Circular pushes around an obstacle", clip: "w7-pushes-obstacle" },
    { name: "Backhand toe drags using an obstacle", clip: "w7-backhand-toe-drags" },
    { name: "Figure 8s", clip: "w7-figure-8s" },
    { name: "Quick touches with hard fakes", clip: "w7-hard-fakes" },
  ] },
  w30: { title: "30-minute workout", reel: REEL("DTJSQImEgY0"), base: 30, gear: "a passer or rebounder and an obstacle",
    note: "Add creative stickwork in between exercises.", drills: [
    { name: "Creative warm-up", clip: "w5-warm-up", amt: { min: 5 } },
    { name: "Hard fake into a pass", clip: "w5-fake-pass", amt: { reps: 30 } },
    { name: "Toe drag", clip: "w5-toe-drag", amt: { reps: 20 } },
    { name: "Forehand push around an obstacle", clip: "w5-push-around", amt: { reps: 20 } },
    { name: "Pull, push", clip: "w5-pull-push", amt: { reps: 30 } },
    { name: "One-touch passes", clip: "w5-one-touch", amt: { reps: 50 } },
    { name: "Quick touches", clip: "w5-quick-touches", amt: { min: 5 }, cue: "Until your forearms burn." },
  ] },
  hard: { title: "Challenging 8-drill workout", reel: REEL("DT240QGEf5S"), base: 24, gear: "a second stick and a few pucks", drills: [
    { name: "Quick handles through a stick", clip: "w3-through-stick" },
    { name: "Repeat, eyes closed", clip: "w3-eyes-closed" },
    { name: "Add a second stick", clip: "w3-second-stick" },
    { name: "Toe drag around a puck", clip: "w3-toe-drag-around" },
    { name: "Pushes around a puck", clip: "w3-pushes-around" },
    { name: "Handle + toe drag through the stick", clip: "w3-handle-toe-drag" },
    { name: "Repeat with a backhand toe drag", clip: "w3-backhand-toe-drag" },
    { name: "Figure 8s through the stick", clip: "w3-figure-8s" },
  ] },
  toe: { title: "4 drills for your toe drags", reel: REEL("DXTVN6kEcWn"), base: 12, gear: "2 sticks or obstacles", drills: [
    { name: "Toe drag drill 1", clip: "w9-toe-drag-1" },
    { name: "Toe drag drill 2", clip: "w9-toe-drag-2" },
    { name: "Toe drag drill 3", clip: "w9-toe-drag-3" },
    { name: "Toe drag drill 4", clip: "w9-toe-drag-4" },
  ] },
};
// "Footwork + hands": 3 drills off the ice, run first as a warm-up when it's a focus
const FOOTWORK = { title: "Footwork + hands warm-up", reel: REEL("DVU06-9EUMh"), drills: [
  { name: "Two-step shuffle", clip: "w8-two-step", rx: "1 min" },
  { name: "Single-leg bounds", clip: "w8-bounds", rx: "1 min" },
  { name: "Lateral crossovers", clip: "w8-crossovers", rx: "1 min" },
] };

// 2 weeks per phase; each phase has a session A and B (B becomes the toe drag workout when that's a focus)
const PHASES = [
  { name: "Build the base", a: "w20", b: "w10" },
  { name: "Quicker hands", a: "q20", b: "pucks" },
  { name: "Game speed", a: "seven", b: "hard" },
  { name: "Full workouts", a: "w30", b: "hard" },
];
const START = { new: 0, rec: 0, comp: 1, elite: 1 };  // level -> first phase; the plan covers 3 phases (6 weeks)
const WEEKS = 6;

// gym: [name, rx for 16+, rx for 13-15, bodyweight swap for 12 and under]
const GYM = {
  a: { title: "Legs + power", drills: [
    ["Goblet squat", "3 × 8", "3 × 8, light", ["Bodyweight squat", "3 × 12"]],
    ["Box jump", "3 × 5, step down", "3 × 5, step down", ["Box jump (low box)", "3 × 5, step down"]],
    ["Skater bounds", "3 × 6 each side. Stick the landing.", "3 × 6 each side. Stick the landing.", null],
    ["Split squat", "3 × 8 each leg", "3 × 8 each leg, light", ["Split squat, bodyweight", "3 × 8 each leg"]],
    ["Dumbbell Romanian deadlift", "3 × 8", "3 × 8, light", ["Single-leg reach", "3 × 8 each leg"]],
    ["Copenhagen plank", "3 × 20s each side", "3 × 15s each side", ["Side plank", "3 × 20s each side"]],
  ] },
  b: { title: "Upper body + core", drills: [
    ["Push-ups", "3 × 10 to 15", "3 × 10 to 15", null],
    ["Dumbbell row", "3 × 10 each arm", "3 × 10 each arm, light", ["Band row", "3 × 12"]],
    ["Pull-ups or lat pulldown", "3 × 8", "3 × 8, band or light", ["Inverted row", "3 × 8"]],
    ["Med ball rotational throw", "3 × 6 each side", "3 × 6 each side, light ball", ["Med ball rotational throw, light ball", "3 × 6 each side"]],
    ["Plank", "3 × 40s", "3 × 30s", null],
    ["Pallof press", "3 × 10 each side", "3 × 10 each side", ["Band Pallof press", "3 × 10 each side"]],
  ] },
};
// gym progression over the 3 phases (gym-only plans use these names too)
const GYM_PHASES = [
  { name: "Learn the moves", note: "" },
  { name: "Add weight", note: " Add a little weight when the last set feels easy." },
  { name: "Add a set", note: " One more set on everything." },
];
const GYM_NOTE = {
  adult: "Warm up 5 to 10 minutes first. Pick a weight you could lift 2 more times. Rest 90 seconds between sets.",
  teen: "Warm up 5 to 10 minutes first. Light weights and perfect form; have a coach check your form. Rest 90 seconds between sets.",
  kid: "Bodyweight and light bands only, with an adult around. Warm up first. Rest 60 to 90 seconds between sets.",
};

const QUESTIONS = [
  { id: "level", type: "choice", title: "Your level", options: [
    { v: "new", l: "Just starting" }, { v: "rec", l: "House or rec" }, { v: "comp", l: "A or AA" }, { v: "elite", l: "AAA or higher" }] },
  { id: "age", type: "choice", title: "Your age", how: "Sets the gym work for your age.", options: [
    { v: "kid", l: "12 or under" }, { v: "teen", l: "13 to 15" }, { v: "adult", l: "16 or older" }] },
  { id: "where", type: "choice", title: "Where you train", options: [
    { v: "home", l: "At home", d: "Stickhandling drills" }, { v: "gym", l: "At the gym", d: "Strength and power" },
    { v: "both", l: "Both", d: "Stickhandling + gym" }] },
  { id: "focus", type: "multi", title: "What to work on", optional: true, layout: "two", hands: true, how: "Pick any. Skip it for a balanced plan.", options: [
    { v: "hands", l: "Quicker hands" }, { v: "toe", l: "Toe drags" }, { v: "feet", l: "Footwork + hands" }] },
  { id: "days", type: "choice", title: "Training days", how: "How many days a week can you train?", layout: "nums",
    options: [2, 3, 4, 5, 6].map((n) => ({ v: n, l: String(n), d: "days" })) },
  { id: "minutes", type: "choice", title: "Stickhandling time", how: "How long is each stickhandling session?", layout: "three", hands: true,
    options: [15, 20, 30].map((n) => ({ v: n, l: String(n), d: "minutes" })) },
  { id: "test", type: "number", title: "Quick test", optional: true, hands: true, ask: "Clean stickhandling touches in 30 seconds",
    how: "Optional. Set a timer for 30 seconds and count clean touches, side to side. Retest every 2 weeks.", unit: "touches", max: 300 },
];
// the steps that apply: no stickhandling questions for gym only
const stepsFor = (a) => QUESTIONS.filter((q) => !q.hands || a.where !== "gym");

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TRAIN_DAYS = { 2: [1, 4], 3: [1, 3, 5], 4: [1, 2, 4, 5], 5: [1, 2, 3, 4, 5], 6: [1, 2, 3, 4, 5, 6] };

// scale one drill to the session: fixed amounts by length, shares split what's left
function dose(d, minutes, base, share) {
  if (d.rx) return d.rx;
  const f = minutes / base;
  if (!d.amt) return `${share} min`;
  if (d.amt.min) return `${Math.max(1, Math.round(d.amt.min * f))} min`;
  const reps = Math.max(5, Math.round((d.amt.reps * f) / 5) * 5);
  return d.amt.each ? `${reps} each side` : `${reps} reps`;
}
function handsSession(key, minutes) {
  const w = HANDS[key], fixed = w.drills.filter((d) => d.amt?.min).reduce((t, d) => t + d.amt.min * (minutes / w.base), 0);
  const free = w.drills.filter((d) => !d.amt), share = free.length ? Math.max(1, Math.round((minutes - fixed) / free.length)) : 0;
  return { title: w.title, reel: w.reel, gear: w.gear, note: w.note, minutes,
    drills: w.drills.map((d) => ({ name: d.name, clip: d.clip, cue: d.cue, rx: dose(d, minutes, w.base, share) })) };
}
function gymSession(key, age, p) {
  const g = GYM[key], col = age === "adult" ? 1 : 2, sets = (rx) => (p === 2 ? rx.replace(/^3 ×/, "4 ×") : rx);
  return { title: g.title, gym: true, note: GYM_NOTE[age] + (age === "kid" && p === 1 ? "" : GYM_PHASES[p].note),
    drills: g.drills.map((r) => (age === "kid" && r[3] ? { name: r[3][0], rx: sets(r[3][1]) } : { name: r[0], rx: sets(age === "kid" ? r[2] : r[col]) })) };
}

// the whole plan: the week (which day is what) and, per 2-week phase, each session's workout
function buildPlan(a) {
  const days = TRAIN_DAYS[a.days] || TRAIN_DAYS[3], where = a.where || "home", focus = a.focus || [];
  const kinds = days.map((_, i) => (where === "home" ? "hands" : where === "gym" ? "gym" : i % 2 ? "gym" : "hands"));
  let h = 0, g = 0;
  const week = [1, 2, 3, 4, 5, 6, 0].map((d) => {
    const i = days.indexOf(d);
    if (i < 0) return { d, kind: "off" };
    const kind = kinds[i], slot = kind === "hands" ? "ab"[h++ % 2] : "ab"[g++ % 2];
    return { d, kind, slot };
  });
  const first = START[a.level] ?? 0;
  const phases = [0, 1, 2].map((p) => {
    const ph = PHASES[Math.min(first + p, PHASES.length - 1)], sessions = [];
    for (const slot of "ab") {
      const on = week.filter((x) => x.kind === "hands" && x.slot === slot).map((x) => DAY_NAMES[x.d]);
      if (!on.length) continue;
      const key = slot === "b" && focus.includes("toe") && p > 0 ? "toe" : ph[slot];
      sessions.push({ label: `Stickhandling ${slot.toUpperCase()}`, on, warmup: focus.includes("feet") ? FOOTWORK : null, ...handsSession(key, a.minutes || 20) });
    }
    for (const slot of "ab") {
      const on = week.filter((x) => x.kind === "gym" && x.slot === slot).map((x) => DAY_NAMES[x.d]);
      if (on.length) sessions.push({ label: `Gym ${slot.toUpperCase()}`, on, ...gymSession(slot, a.age || "adult", p) });
    }
    return { weeks: `Weeks ${p * 2 + 1}–${p * 2 + 2}`, name: where === "gym" ? GYM_PHASES[p].name : ph.name, gymName: GYM_PHASES[p].name, sessions };
  });
  return { week, phases, weeks: WEEKS, train: days.length, test: a.test };
}

if (typeof module !== "undefined") module.exports = { QUESTIONS, HANDS, FOOTWORK, GYM, stepsFor, buildPlan, DAY_NAMES };
