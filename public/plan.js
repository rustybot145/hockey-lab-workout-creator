// Hockey Lab plan engine. Rule-based (no AI), no network, no state: answers in, plan out.
// One simple workout, the same every session: Wyatt's "20 minutes using 4 drills" (his most-viewed reel).
// More weekly time = more sessions and longer drills; more time or a higher level = more fake reps.

export const QUESTIONS = [
  { id: "pos", q: "What position do you play?", opts: [["F", "Forward"], ["D", "Defense"]] },
  { id: "age", q: "How old are you?", opts: [["u13", "12 or under"], ["13", "13 to 15"], ["16", "16 to 18"], ["adult", "19 or older"]] },
  { id: "level", q: "What level do you play?", opts: [["new", "Just starting"], ["rec", "House or rec"], ["comp", "A or AA"], ["elite", "AAA or higher"]] },
  { id: "time", q: "How much time can you train each week?", help: "On your own, outside team practice.", opts: [["60", "1 hour"], ["120", "2 hours"], ["180", "3 hours"], ["300", "5 hours or more"]] },
  { id: "where", q: "Where can you train?", help: "Pick all that work.", multi: true, opts: [["home", "At home"], ["rink", "At the rink"], ["gym", "At the gym"]] },
];

const WORKOUT = { title: "20 minutes, 4 drills", reel: "https://www.instagram.com/reel/DSqhOCvkhwC/" };
const SCHEDULE = { 60: [3, 20], 120: [4, 30], 180: [6, 30], 300: [6, 50] }; // weekly minutes -> [sessions, minutes each]
const DAYS = { 3: ["Mon", "Wed", "Sat"], 4: ["Mon", "Tue", "Thu", "Sat"], 6: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] };
const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const PLACE = { home: "Home", rink: "Rink", gym: "Gym" };
const REPS = { new: 10, rec: 10, comp: 15, elite: 20 }; // fakes per side in 20 minutes (his reel: "FH/BH fakes 10 each side")

const question = (id) => QUESTIONS.find((q) => q.id === id);
const isOption = (id, v) => question(id).opts.some(([k]) => k === v);
const label = (id, v) => question(id).opts.find(([k]) => k === v)[1];

// URL params -> validated answers, or null if anything is missing or unknown
export function parse(params) {
  const a = {};
  for (const id of ["pos", "age", "level", "time"]) {
    const v = params.get(id);
    if (!isOption(id, v)) return null;
    a[id] = v;
  }
  a.where = (params.get("where") || "").split(",").filter((v) => isOption("where", v));
  return a.where.length ? a : null;
}

export function buildPlan(a) {
  const [sessions, minutes] = SCHEDULE[a.time];
  const days = DAYS[sessions];
  const places = Object.keys(PLACE).filter((p) => a.where.includes(p));
  const block = Math.floor(minutes / 4); // 20 min = 4 drills × 5 min; creative handling takes whatever is left
  const reps = Math.max(10, Math.round((REPS[a.level] * minutes) / 20 / 5) * 5);
  return {
    summary: [label("pos", a.pos), label("level", a.level), `${sessions} × ${minutes} min a week`, places.map((p) => PLACE[p]).join(" + ")],
    sessions: days.map((day, i) => ({ day, place: PLACE[places[i % places.length]], minutes })),
    rest: WEEK.filter((d) => !days.includes(d)),
    workout: {
      ...WORKOUT,
      minutes,
      drills: [
        { name: "Front narrow", amt: `${block} min` },
        { name: "Front wide", amt: `${block} min` },
        { name: "Forehand / backhand fakes", amt: `${reps} each side` },
        { name: "Creative handling", amt: `${minutes - 3 * block} min`, cue: "Be powerful, fast, deceptive." },
      ],
    },
  };
}
