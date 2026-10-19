// node test.js: every answer combination must give a simple, consistent 1-week plan.
import assert from "node:assert";
import { QUESTIONS, buildPlan, parse } from "./public/plan.js";

const opts = (id) => QUESTIONS.find((q) => q.id === id).opts.map(([k]) => k);
const wheres = [["home"], ["rink"], ["gym"], ["home", "rink"], ["home", "gym"], ["rink", "gym"], ["home", "rink", "gym"]];
let n = 0;
for (const pos of opts("pos")) for (const age of opts("age")) for (const level of opts("level"))
  for (const time of opts("time")) for (const where of wheres) {
    const a = parse(new URLSearchParams({ pos, age, level, time, where: where.join(",") }));
    assert(a, "valid answers parse");
    const p = buildPlan(a);
    assert.equal(p.sessions.length + p.rest.length, 7);
    assert.equal(p.sessions.reduce((s, x) => s + x.minutes, 0), Number(time), "week totals the time picked");
    for (const s of p.sessions) assert(where.map((x) => ({ home: "Home", rink: "Rink", gym: "Gym" })[x]).includes(s.place));
    const w = p.workout;
    assert.equal(w.drills.length, 4, "same 4 drills every session");
    assert(w.reel.startsWith("https://www.instagram.com/reel/"));
    const mins = w.drills.filter((d) => /min$/.test(d.amt)).map((d) => parseInt(d.amt));
    assert(mins.every((m) => m >= 5), "each timed drill gets at least 5 min");
    assert(mins.reduce((x, y) => x + y, 0) <= w.minutes, "timed drills fit the session");
    assert(/^\d+ each side$/.test(w.drills[2].amt));
    n++;
  }
// more time or a higher level never means fewer reps
const reps = (level, time) => parseInt(buildPlan(parse(new URLSearchParams({ pos: "F", age: "13", level, time, where: "home" }))).workout.drills[2].amt);
assert(reps("rec", "60") <= reps("rec", "300") && reps("rec", "60") <= reps("elite", "60"));
assert.equal(parse(new URLSearchParams("pos=X&age=13&level=rec&time=60&where=home")), null, "bad input rejected");
assert.equal(parse(new URLSearchParams("pos=F&age=13&level=rec&time=60&where=")), null, "no place rejected");
console.log(`ok: ${n} combinations`);
