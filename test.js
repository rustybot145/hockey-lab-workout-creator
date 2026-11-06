// Runs every answer combination through the AI Workout Builder's plan logic (public/builder/plan.js)
// and checks each plan is complete: right number of days, every session filled, every clip on disk.
const fs = require("fs"), path = require("path");
const { QUESTIONS, stepsFor, buildPlan } = require("./public/builder/plan.js");
const clips = new Set(fs.readdirSync(path.join(__dirname, "public/builder/clips")));
const opts = (id) => QUESTIONS.find((q) => q.id === id).options.map((o) => o.v);
const subsets = (xs) => xs.reduce((all, x) => [...all, ...all.map((s) => [...s, x])], [[]]);
const assert = (ok, msg, a) => { if (!ok) { console.error("FAIL:", msg, JSON.stringify(a)); process.exit(1); } };

let n = 0;
for (const level of opts("level")) for (const age of opts("age")) for (const where of opts("where"))
for (const focus of subsets(opts("focus"))) for (const days of opts("days")) for (const minutes of opts("minutes")) for (const test of [undefined, 42]) {
  const a = { level, age, where, focus, days, minutes, test };
  const p = buildPlan(a);
  const train = p.week.filter((x) => x.kind !== "off");
  assert(train.length === days, "training days", a);
  assert(train.every((x) => (where === "home" ? x.kind === "hands" : where === "gym" ? x.kind === "gym" : true)), "day kinds", a);
  if (where === "both") assert(train.some((x) => x.kind === "hands") && train.some((x) => x.kind === "gym"), "both kinds", a);
  assert(p.phases.length === 3, "3 phases", a);
  for (const ph of p.phases) {
    assert(ph.sessions.length > 0, "sessions", a);
    for (const s of ph.sessions) {
      assert(s.on.length > 0 && s.drills.length > 0, "session filled", a);
      for (const d of [...s.drills, ...(s.warmup?.drills || [])]) {
        assert(d.name && d.rx && !/NaN|undefined/.test(d.rx), `drill dose: ${d.name} ${d.rx}`, a);
        if (d.clip) assert(clips.has(`${d.clip}.mp4`) && clips.has(`${d.clip}.jpg`), `clip ${d.clip}`, a);
      }
      if (age === "kid" && s.gym) assert(!s.drills.some((d) => /Goblet|Romanian|Dumbbell|lat pulldown/i.test(d.name)), "kid gym is bodyweight", a);
      if (!s.gym && focus.includes("feet")) assert(s.warmup, "footwork warm-up", a);
    }
  }
  assert(stepsFor(a).some((q) => q.id === "minutes") === (where !== "gym"), "gym-only skips stickhandling questions", a);
  n++;
}
console.log(`ok: ${n} combinations`);
