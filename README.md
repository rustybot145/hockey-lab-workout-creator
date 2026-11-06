# Hockey Lab: Puck Control Academy site

Wyatt Beck's Hockey Lab ([@whockeylab](https://www.instagram.com/whockeylab/)), built by Truepoint Digital. `/` redirects to the sales page.

| Path | What |
|---|---|
| `/academy` | $48 sales page: offer → VSL → buy → value stack → info → FAQ (Knewave + Barlow, lab green) |
| `/builder` | **AI Workout Builder**, embedded in Whop as a private app on the Academy (same lab green as the sales page) |

## AI Workout Builder
Questions (level, age, where you train, focus, days, session length, optional 30-second touch test) → a 6-week plan in three 2-week phases: an At-home stickhandling / Gym switch, week tabs, session cards, Wyatt's demo clips, a calendar export and saved answers.

- **Stickhandling**: every drill, amount and cue is read off the captions of 9 of Wyatt's reels, and every clip in `builder/clips/` is cut from that reel (`plan.js` links each workout's post). Amounts scale to 15/20/30-minute sessions.
- **Gym**: standard hockey strength work written for the tool (not from Wyatt's videos), with lighter versions for 13-15 and bodyweight only for 12 and under. Wyatt needs to approve it.
- Rule-based: the same answers give the same plan. No model, no network, no accounts.
- `/builder` may be framed by `*.whop.com` only; everything else is `frame-ancestors 'none'`.

```
npm test                 # every answer combination through builder/plan.js (8,640)
python3 serve.py 4310    # local preview: /academy/ and /builder.html (byte ranges for video)
```

## Before launch
- Whop checkout link on every `.cta` / `.sticky` in `academy/index.html` (now `#`), Wyatt's VSL in the empty `.frame`.
- Paste `https://hockey-lab-workout-creator.vercel.app/builder` into the AI Workout Builder app in Whop (dashboard only).
- Wyatt approves the copy, the gym workouts and the "AI" name (§4).
