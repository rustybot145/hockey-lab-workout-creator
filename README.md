# Hockey Lab: Free Workout Creator

Free lead magnet for Wyatt Beck's Hockey Lab ([@whockeylab](https://www.instagram.com/whockeylab/)), built by Truepoint Digital.

Landing → 5 questions → email → a 1-week, day-by-day stickhandling plan (week 2 locked) → the Puck Control Academy.

- **Rule-based, no AI, no database, no accounts.** Answers live in the URL (`#plan?pos=F&age=13&...`), and `public/plan.js` rebuilds the plan from them.
- Every drill and its order comes from the on-screen captions of Wyatt's own Instagram workouts; each session links to the reel it came from.
- Players 12 and under must enter a parent's email and tick a guardian box.
- Static files only (`public/`). Fonts are self-hosted (SIL OFL, see `public/fonts/`).

```
npm test          # runs all 896 answer combinations through the plan engine
python3 -m http.server 4310 -d public   # local preview at http://localhost:4310
```

Not wired yet: email delivery (`/api/lead`), Whop checkout link, upsell video, privacy and terms pages.
