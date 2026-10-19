// Hockey Lab plan engine. Rule-based (no AI). One simple workout, the same every session:
// Wyatt's "20 minutes using 4 drills" (his most-viewed reel). More time = longer drills + more reps.

const reel = (code) => `https://www.instagram.com/reel/${code}/`;
export const WORKOUT = { title: "20 minutes, 4 drills", reel: reel("DSqhOCvkhwC") };

/* ---------- answers ---------- */
export const QUESTIONS = [
  { id: "pos", q: "What position do you play?", opts: [["F", "Forward"], ["D", "Defense"]] },
  { id: "age", q: "How old are you?", opts: [["u13", "12 or under"], ["13", "13 to 15"], ["16", "16 to 18"], ["adult", "19 or older"]] },
  { id: "level", q: "What level do you play?", opts: [["new", "Just starting"], ["rec", "House or rec"], ["comp", "A or AA"], ["elite", "AAA or higher"]] },
  { id: "time", q: "How much time can you train each week?", help: "On your own, outside team practice.", opts: [["60", "1 hour"], ["120", "2 hours"], ["180", "3 hours"], ["300", "5 hours or more"]] },
  { id: "where", q: "Where can you train?", help: "Pick all that work.", multi: true, opts: [["home", "At home"], ["rink", "At the rink"], ["gym", "At the gym"]] },
];
const valid = (id, v) => QUESTIONS.find((q) => q.id === id).opts.some(([k]) => k === v);

// sessions per week × minutes per session
const SCHEDULE = { 60: [3, 20], 120: [4, 30], 180: [6, 30], 300: [6, 50] };
const DAYS = { 3: ["Mon", "Wed", "Sat"], 4: ["Mon", "Tue", "Thu", "Sat"], 6: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] };
const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const PLACE = { home: "Home", rink: "Rink", gym: "Gym" };
// fakes per side in a 20-minute session (his reel: "FH/BH fakes 10 each side"), by level
const REPS = { new: 10, rec: 10, comp: 15, elite: 20 };

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
  const block = Math.floor(minutes / 4); // his 20-minute workout = 4 drills × 5 min; the last drill takes what's left
  const reps = Math.max(10, Math.round((REPS[a.level] * minutes) / 20 / 5) * 5);
  const drills = [
    { name: "Front narrow", amt: `${block} min` },
    { name: "Front wide", amt: `${block} min` },
    { name: "Forehand / backhand fakes", amt: `${reps} each side` },
    { name: "Creative handling", amt: `${minutes - 3 * block} min`, cue: "Be powerful, fast, deceptive." },
  ];
  const label = (id) => QUESTIONS.find((q) => q.id === id).opts.find(([k]) => k === a[id])[1];
  return {
    summary: [label("pos"), label("level"), `${n} × ${minutes} min a week`, order.map((p) => PLACE[p]).join(" + ")],
    sessions: days.map((day, i) => ({ day, place: PLACE[order[i % order.length]], minutes })),
    rest: WEEK.filter((d) => !days.includes(d)),
    workout: { ...WORKOUT, minutes, drills },
  };
}
