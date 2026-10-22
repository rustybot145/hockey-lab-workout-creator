# Hockey Lab: Free Workout Creator

Free lead magnet for Wyatt Beck's Hockey Lab ([@whockeylab](https://www.instagram.com/whockeylab/)), built by Truepoint Digital.

**Flow:** landing → 5 questions → email → a simple 1-week stickhandling plan → Puck Control Academy (week 2 is locked).

Every session is the same 4-drill workout from Wyatt's most-viewed reel ("20 minutes using 4 drills"). More weekly time means more sessions and longer drills; more time or a higher level means more reps on the fakes.

## Files

```
public/
  index.html   markup + all styles (tokens → base → shared → landing → quiz/email → plan → program card → breakpoints)
  app.js       landing clips, quiz, email step, plan view, hash router (#q1..#q5, #email, #plan?<answers>)
  plan.js      plan engine: questions, answer validation, buildPlan(). Pure: answers in, plan out
  clips/       three 4-7s loops cut from Wyatt's reels, cut on his own edit points, + the first clip's poster
  fonts/       Big Shoulders Display + Archivo (variable WOFF2, SIL OFL)
  logo-*.webp  Hockey Lab logo traced from his profile picture (2x / 3x)
test.js        runs all 896 answer combinations through plan.js
vercel.json    static hosting from public/, strict CSP + security headers, cache rules
```

- **Rule-based, no AI, no database, no accounts, no dependencies.** Answers live in the URL and `plan.js` rebuilds the plan from them.
- Players 12 and under must enter a parent's email and tick a guardian box (COPPA).
- The landing video retries `play()` until it starts, so it plays on the first load in Chrome, Safari and iPhone browsers (WebKit). The next clip only downloads once the current one is fully buffered, so on a phone connection they never split bandwidth and stall.
- Hover effects only apply on mouse devices (`@media (hover: hover)`); touch gets `:active` press states instead.

```
npm test                                  # plan engine, every answer combination
python3 serve.py                          # local preview at http://localhost:4310 (supports video byte ranges; python -m http.server stalls Safari/iPhone)
```

## Before launch

Email delivery (`/api/lead`, see the `ponytail:` note in `app.js`), Whop checkout link, Wyatt's upsell video, privacy and terms pages. Each is marked `[PLACEHOLDER]` in `index.html`.
