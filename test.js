// node test.js: every answer combination must give a full, sensible 2-week plan.
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
    assert.equal(p.weeks.length, 2);
    for (const w of p.weeks) {
      assert(w.sessions.length >= 3);
      assert.equal(w.sessions.length + w.rest.length, 7);
      const total = w.sessions.reduce((s, x) => s + x.minutes, 0);
      assert(total >= Number(time) && total <= Math.max(Number(time), 180), `minutes ${total} vs ${time}`);
      for (const s of w.sessions) { const used = s.drills.reduce((m, d) => m + (/min$/.test(d.amt) ? parseInt(d.amt) : 0), 0); assert(used <= s.minutes, `${used} min of drills in a ${s.minutes} min session`); }
      for (const s of w.sessions) {
        assert(where.map((x) => ({ home: "Home", rink: "Rink", gym: "Gym" })[x]).includes(s.place));
        assert(s.drills.length >= 3 && s.drills.length <= 12, `${s.drills.length} drills`);
        for (const d of s.drills) assert(d.name && d.amt && d.reel.startsWith("https://www.instagram.com/reel/"), JSON.stringify(d));
        assert.equal(new Set(s.drills.map((d) => d.name)).size, s.drills.length, `duplicate drill in ${s.workout}`);
      }
    }
    n++;
  }
assert.equal(parse(new URLSearchParams("pos=X&age=13&level=rec&time=60&where=home")), null, "bad input rejected");
assert.equal(parse(new URLSearchParams("pos=F&age=13&level=rec&time=60&where=")), null, "no place rejected");
console.log(`ok: ${n} combinations`);
