// Hockey Lab plan engine. Rule-based (no AI). Every drill, its order and every cue is taken from the
// on-screen captions of Wyatt's own Instagram workouts; the reel each one comes from is linked.

const reel = (code) => `https://www.instagram.com/reel/${code}/`;

/* ---------- Wyatt's workouts (drill names + cues exactly as captioned) ---------- */
const D = (name, cue = "", amt = "") => ({ name, cue, amt });
export const WORKOUTS = {
  ten: { title: "10-minute at-home workout", code: "DRTKEpuDGg0", drills: [
    D("Front dribble"), D("Forehand dribble", "Use as much space as possible."),
    D("Quick lateral pulls"), D("Dribble with sweep fakes"), D("Quick touches", "Until your forearms burn."),
  ] },
  top5: { title: "Top 5 drills for speed and puck control", code: "DSYkNg7j99K", drills: [
    D("Front dribble", "Head up, eyes up. Rapid touches. Controlled body."),
    D("Short to wide dribble", "Shift weight with the puck. Shoulders over toes. Head up."),
    D("High lateral lunge dribble", "Slow, controlled movement. Body and puck move together."),
    D("Flip to pull fakes", "Powerful movements. Fake with your lower and upper body.", "Both sides"),
    D("Flips back and forth", "Keep the puck inside your body. Stay controlled."),
    D("Quick touches", "Be creative."),
  ] },
  twenty: { title: "20-minute workout, 4 drills", code: "DSqhOCvkhwC", drills: [
    D("Front narrow"), D("Front wide"), D("Forehand / backhand fakes", "", "10 each side"),
    D("Creative handling", "Be powerful, fast, deceptive."),
  ] },
  pucks: { title: "3 pucks, 6 drills", code: "DWSG6f6AeBC", drills: [
    D("Circular pushes"), D("Circular toe drags"), D("Circular backhand toe drags"),
    D("Figure eights"), D("Wide handle between pucks"), D("Quick dribble between pucks"),
  ] },
  hard8: { title: "Challenging 8-drill workout", code: "DT240QGEf5S", drills: [
    D("Quick handles through stick"), D("Repeat with eyes closed"), D("Add a second stick"),
    D("Toe drag around puck"), D("Pushes around puck"), D("Handle + toe drag through stick"),
    D("Repeat with backhand toe drag"), D("Figure 8's through stick"),
  ] },
  ice7: { title: "7-drill workout, at home or on ice", code: "DTi4TI_j0j9", drills: [
    D("Front quick dribble"), D("Rotational dribble"), D("Circular pulls around an obstacle"),
    D("Circular pushes around an obstacle"), D("Backhand toe drags using an obstacle"),
    D("Figure 8's"), D("Quick touches with hard fakes"),
  ] },
  feet: { title: "Footwork + hands together", code: "DVU06-9EUMh", drills: [
    D("Two step shuffle", "Hands moving the whole time."), D("Single leg bounds", "Hands moving the whole time."),
    D("Lateral crossovers", "Hands moving the whole time."),
  ] },
};

/* ---------- answers ---------- */
export const QUESTIONS = [
  { id: "pos", q: "What position do you play?", opts: [["F", "Forward"], ["D", "Defense"]] },
  { id: "age", q: "How old are you?", opts: [["u13", "12 or under"], ["13", "13 to 15"], ["16", "16 to 18"], ["adult", "19 or older"]] },
  { id: "level", q: "What level do you play?", opts: [["new", "Just starting"], ["rec", "House or rec"], ["comp", "A or AA"], ["elite", "AAA or higher"]] },
  { id: "time", q: "How much time can you train each week?", help: "On your own, outside team practice.", opts: [["60", "1 hour"], ["120", "2 hours"], ["180", "3 hours"], ["300", "5 hours or more"]] },
  { id: "where", q: "Where can you train?", help: "Pick all that work.", multi: true, opts: [["home", "At home"], ["rink", "At the rink"], ["gym", "At the gym"]] },
];
const valid = (id, v) => QUESTIONS.find((q) => q.id === id).opts.some(([k]) => k === v);

// sessions per week × minutes, from the time they have (Wyatt's workouts run 10-30 min; longer sessions give each drill more time)
const SCHEDULE = { 60: [3, 20], 120: [4, 30], 180: [6, 30], 300: [6, 50] };
const DAYS = { 3: ["Mon", "Wed", "Sat"], 4: ["Mon", "Tue", "Thu", "Sat"], 6: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] };
const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const PLACE = { home: "Home", rink: "Rink", gym: "Gym" };

// which of his workouts to use: by place, then by level, week 2 steps one up
const LADDER = {
  home: { 10: ["ten", "ten", "twenty"], 20: ["twenty", "top5", "pucks", "hard8"], 30: ["top5", "pucks", "hard8", "hard8"] },
  rink: ["ice7", "pucks", "hard8"],
  gym: ["feet"],
};
const TIER = { new: 0, rec: 0, comp: 1, elite: 2 };

function workoutFor(place, minutes, tier, week) {
  if (place === "gym") return "feet";
  if (place === "rink") return LADDER.rink[Math.min(tier + week, 2)];
  const steps = LADDER.home[minutes] || LADDER.home[minutes >= 30 ? 30 : 20];
  return steps[Math.min(tier + week, steps.length - 1)];
}

function session(place, minutes, tier, step, pos) {
  const key = workoutFor(place, minutes, tier, step);
  const w = WORKOUTS[key];
  let drills = w.drills.map((d) => ({ ...d }));
  if (place === "gym") { // footwork + hands, then his stationary handling drills to fill the time
    drills = drills.concat(WORKOUTS.top5.drills.slice(0, minutes >= 30 ? 3 : 1).map((d) => ({ ...d, from: "top5" })));
  }
  // fit drill count to the time: at least 3 minutes a drill, so the session never runs over
  const max = Math.max(3, Math.floor(minutes / 3));
  if (drills.length > max) drills = drills.slice(0, max - 1).concat(drills.at(-1)); // keep his finisher
  // position tweak, using his own drills: D gets a wide-reach drill, F gets a fake
  const has = (re) => drills.some((d) => re.test(d.name));
  const swapIn = (d) => { const i = Math.max(1, drills.length - 2); drills[i] = { ...d, from: "top5" }; };
  if (pos === "D" && !has(/wide|lateral|lunge/i)) swapIn(WORKOUTS.top5.drills[1]);
  if (pos === "F" && !has(/fake|toe drag/i)) swapIn(WORKOUTS.top5.drills[3]);
  const each = Math.max(1, Math.floor(minutes / drills.length));
  drills = drills.map((d) => ({ ...d, amt: d.amt || `${each} min`, reel: reel(WORKOUTS[d.from || key].code) }));
  return { place: PLACE[place], minutes, workout: w.title, reel: reel(w.code), drills };
}

export function parse(params) {
  const a = {};
  for (const id of ["pos", "age", "level", "time"]) { const v = params.get(id); if (!valid(id, v)) return null; a[id] = v; }
  a.where = (params.get("where") || "").split(",").filter((v) => valid("where", v));
  if (!a.where.length) return null;
  return a;
}

export function buildPlan(a) {
  const [n, minutes] = SCHEDULE[a.time];
  const days = DAYS[n];
  const order = ["home", "rink", "gym"].filter((p) => a.where.includes(p));
  const tier = TIER[a.level];
  // free plan = week 1 only; week 2 and on are the paid program
  const weeks = [0].map((week) => {
    const seen = {}; // second visit to the same place that week gets his next workout up, so days don't repeat
    const sessions = days.map((day, i) => {
      const place = order[i % order.length];
      const bump = (seen[place] = (seen[place] ?? -1) + 1) % 2;
      return { day, ...session(place, minutes, tier, week + bump, a.pos) };
    });
    return { label: `Week ${week + 1}`, sessions, rest: WEEK.filter((d) => !days.includes(d)) };
  });
  const label = (id) => QUESTIONS.find((q) => q.id === id).opts.find(([k]) => k === a[id])[1];
  return {
    summary: [label("pos"), label("level"), `${n} × ${minutes} min a week`, order.map((p) => PLACE[p]).join(" + ")],
    weeks,
  };
}
