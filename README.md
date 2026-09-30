# Zetdle

A daily mental-maths sprint: Zetamac's arithmetic drill with Wordle's "everyone
gets the same puzzle today" twist. 120 seconds, 300 problems waiting, one score
to share.

No accounts, no backend, no database. It is a fully static site — the daily
puzzle is generated in the browser from the date, so every player's browser
independently produces the identical list of problems.

## Running it locally

You need [Node.js](https://nodejs.org) 18 or newer.

```bash
npm install
```

```bash
npm run dev
```

Then open **http://localhost:5173** in your browser. The page reloads itself
whenever you save a file. Press `Ctrl-C` in the terminal to stop the server.

## The other commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server with live reload (use this while building) |
| `npm test` | Runs the unit tests once and prints the results |
| `npm run test:watch` | Re-runs tests automatically as you edit |
| `npm run build` | Produces the optimised static site in `dist/` |
| `npm run preview` | Serves the built `dist/` folder, to check the real build |

## How the daily puzzle works

This is the part worth understanding, because it is what makes the game shared.

1. **The date.** `src/lib/date.ts` asks `Intl` what the date is *in Asia/Singapore*
   right now, and formats it as `"2026-09-22"`. It never uses the player's own
   timezone, so the puzzle rolls over at midnight Singapore time for everyone on
   the planet at the same instant.
2. **The seed.** That date string is hashed into a single number.
3. **The generator.** `src/lib/rng.ts` has `mulberry32`, a tiny "seeded" random
   number generator. Ordinary `Math.random()` gives a different sequence every
   time, which would give every player different problems. A seeded generator
   gives the *same* sequence every time for the same seed — so the same date
   always produces byte-for-byte identical problems, in the same order, on every
   device.
4. **The problems.** `src/lib/problems.ts` draws 300 problems from that
   generator using Zetamac's default ranges.

The puzzle number is simply "how many days since `LAUNCH_DATE`, plus one".

Practice mode uses plain `Math.random()` instead, so it is different every time
and deliberately not shareable.

## What gets shared

"Copy result" puts four lines on the clipboard:

```
🧮 Zetdle #42 — 58
⏱ 2.1s per answer
🐌 84 ÷ 7 — 6.2s
https://zetdle.vercel.app
```

The third line is the single problem that took you longest, and how long it
took. It is left out entirely if you did not answer anything, so a blank round
shares three lines instead of four. The link comes from `SITE_URL` in
`src/config.ts`, and the three marker emoji are written directly in
`buildShareText` in `src/lib/results.ts` if you want to change them.

On phones a "Share" button also appears when the browser offers a native share
sheet. If the clipboard cannot be written to, the text is shown in a dialog so
it can still be copied by hand.

## Keeping today's result

Closing or reloading the page should not lose a score you wanted to share, so
Zetdle remembers your result for the current puzzle.

- It is kept in `localStorage` on your own device under the single key
  `zetdle:daily-result:v1`. Nothing is sent anywhere, there is still no backend,
  and it is the only thing the site stores.
- Open the site again on the same day and you land straight on your result,
  ready to copy.
- **Your best run of the day is the one kept.** You can replay as often as you
  like; a worse replay never overwrites a better score. If two runs tie on
  score, the quicker one wins.
- After a replay that did not beat your best, the results screen shows your best
  run and notes what the latest attempt scored, so what is on screen is always
  exactly what "Copy result" copies.
- A result from a previous puzzle is ignored, so each new day starts clean.
- Practice runs are never saved.

If `localStorage` is unavailable (a private window, or blocked site data), the
game still works exactly as before - the result simply is not remembered, rather
than the page breaking. `src/lib/storage.ts` handles all of this.

## The easter egg for scripts

Answering every problem in the list inside a single 120-second round is not
something hands can do - it means an automated script. When that happens the
game skips the results screen entirely and shows `public/nice-try.jpg` full
screen instead, and **the run is not saved**, so a script can never turn itself
into a shareable score.

- The trigger is simply "the problem list ran out", so it follows
  `PROBLEMS_PER_DAY` automatically if you ever change that number.
- The image is quietly preloaded once a player passes 80% of the list, so it
  appears instantly. Ordinary players never get near that, so they never
  download it.
- There is no way off the screen: no button, no click, no key press. Reloading
  the page is the only escape.
- To change the picture, replace the file or point `CHEAT_IMAGE_URL` in
  `src/config.ts` somewhere else.

Everything in `public/` is served publicly, so the image also sits at
`<your-site>/nice-try.jpg` and is visible in the repository. It is a prank, not
a secret.

## Accounts (optional)

Accounts are an **optional extra**. With no Supabase credentials configured the
game is exactly what it has always been - no sign-in button, no network
requests, and the Supabase code is stripped out of the build entirely. Anyone
who never signs in plays exactly as before, forever.

Signing in with Google adds a daily streak, an all-time high score, a "New high
score!" callout, a graph of the last 30 days on the results screen, and a streak
line in the shared text.

### Setting it up

**1. Make a Supabase project** at [supabase.com](https://supabase.com) (free, no
card). Then open the **SQL editor**, paste in the whole of
[`supabase/schema.sql`](supabase/schema.sql), and run it once.

**2. Get your Google OAuth credentials.** In the
[Google Cloud Console](https://console.cloud.google.com): create a project, fill
in **APIs & Services -> OAuth consent screen** (User type *External*, default
scopes are fine so no review is needed), then **Credentials -> Create
credentials -> OAuth client ID -> Web application**.

Under **Authorized redirect URIs** put exactly **one** entry, and make it
Supabase's callback, *not* your own site:

```
https://<your-project-ref>.supabase.co/auth/v1/callback
```

Supabase prints this exact URL on its Google provider page - copy it from there.
Putting your own site URL here instead is the single most common mistake and
produces `redirect_uri_mismatch`. Leave *Authorized JavaScript origins* empty.

Keep the consent screen on **Testing** and add your friends' Gmail addresses as
test users (up to 100). That gives you an invite-only app with no extra code.

**3. Tell Supabase about Google.** Authentication -> Providers -> Google:
enable it, paste in the client ID and secret.

**4. Set the URLs.** Authentication -> URL Configuration:

- *Site URL*: `https://zetdle.vercel.app`
- *Redirect URLs*, one per line:
  - `http://localhost:5173/**`
  - `https://zetdle.vercel.app/**`
  - `https://zetdle-*-<your-vercel-scope>.vercel.app/**` (for preview deploys)

Never use `https://*.vercel.app/**` - that would let any site on vercel.app
receive auth codes for your project.

**5. Add the keys.** The quickest way to find them: the green **Connect**
button at the top of the Supabase dashboard -> **App Frameworks** -> Vite. It
prints a ready-made `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` block you can
paste straight into `.env.local` (copy `.env.example` to make it). They also
live under Project Settings -> API Keys, where the browser-safe one may be
labelled either *anon public* or *publishable* depending on how new your
project is - both work. Never use the *service_role* or *secret* key. On Vercel, add the same two variables under
Settings -> Environment Variables, ticked for **Production, Preview and
Development** - and redeploy, because Vercel bakes them in at build time.

### Things that will trip you up

- **Sign-in on a preview deploy lands you on production.** That is what a
  missing redirect URL looks like: Supabase does not error, it silently falls
  back to the Site URL. Check the allow-list first, always.
- **The Google consent screen says `<ref>.supabase.co`**, not "Zetdle". Cosmetic,
  and only fixable on a paid Supabase plan.
- **Google blocks embedded browsers.** Anyone who opens a shared Zetdle link
  inside Instagram or Messenger and taps sign in gets a wall, with no fix from
  our side. They have to open it in a real browser.
- **Supabase pauses a free project after 7 days of inactivity.** The game keeps
  working - it just falls back to signed-out - but streaks freeze until someone
  un-pauses it in the dashboard.
- **Scores are forgeable.** Any signed-in player can write a plausible score
  from the browser console, or backfill fake history. The database constraints
  only force a forgery to *look* plausible. Genuinely preventing it needs a
  server that generates the problems and marks the answers, which this project
  deliberately does not have. Fine for streaks among friends; not a foundation
  for a public leaderboard.
- **The bundle roughly doubles** once credentials are set (about 50 KB to 112 KB
  gzipped) because the Supabase SDK is included. With no credentials it is
  stripped out completely, so signed-out visitors never pay for it.

### How the streak is defined

- **Playing counts, the score does not.** A zero still marks the day as played.
- **Today is a grace day**: the streak counts back from today if you have
  played, otherwise from yesterday, so it never looks broken first thing in the
  morning. It only breaks once a whole day has been missed.
- Practice runs never count, and never touch your history.

## Changing the configuration

Everything you are likely to want to tweak lives in **`src/config.ts`**:

| Setting | Meaning |
| --- | --- |
| `LAUNCH_DATE` | The day that counts as Zetdle #1. Change this and every puzzle number shifts. |
| `PUZZLE_TIMEZONE` | The timezone whose midnight starts a new puzzle. |
| `GAME_DURATION_SECONDS` | Length of a round. Default 120. |
| `COUNTDOWN_SECONDS` | The 3-2-1 before the timer starts. |
| `PROBLEMS_PER_DAY` | How many problems are generated. 300 is far more than anyone finishes. |
| `SITE_URL` | The link pasted into the shared result. **Update this after deploying.** |
| `WRONG_ANSWER_COOLDOWN_MS` | How long a wrong guess stays red before the box clears. |
| `HISTORY_CHART_DAYS` | How many days the results-screen graph covers. |
| `AUTH_TIMEOUT_MS` | How long to wait for sign-in state before assuming signed out. |
| `RANGES` | The number ranges for each operation, copied from Zetamac's defaults. |

Changing `LAUNCH_DATE`, `PROBLEMS_PER_DAY` or `RANGES` changes the puzzle itself.
A test in `src/lib/problems.test.ts` holds a snapshot of the first few problems
and will fail if the generated puzzle changes — that is on purpose, so you never
change everyone's puzzle by accident. If the change was intended, run
`npx vitest run -u` to accept the new snapshot.

## Game rules

Four operations, each equally likely:

- **Addition** — `a + b`, with `a` and `b` from 2 to 100
- **Subtraction** — addition in reverse: `(a + b) − a`, so answers are never negative
- **Multiplication** — `a × b`, with `a` from 2 to 12 and `b` from 2 to 100
- **Division** — multiplication in reverse: `(a × b) ÷ a`, so answers are always whole

A guess counts as **wrong** once you have typed as many digits as the answer
has. For an answer of 91, typing `8` is still in progress, but `80` is a real
guess: the box turns red, freezes for 0.2 seconds, then clears itself so you
retype from scratch. That is what stops people brute-forcing 91, 92, 93 until
one is accepted - a patient script gets about 4 guesses a second instead of
dozens, which is slower than simply doing the arithmetic. The delay lives in
`WRONG_ANSWER_COOLDOWN_MS` in `src/config.ts`.

Typing the correct answer advances immediately — no Enter key. A wrong answer
just sits in the box until you fix it: no penalty, no skipping.

## Project layout

```
src/
  config.ts              all the tunable settings
  App.tsx                which screen is showing (start / countdown / play / results)
  lib/
    rng.ts               seeded random number generator
    date.ts              Singapore date and puzzle numbering
    problems.ts          problem generation (pure, no React)
    results.ts           scoring and the shareable text
    clipboard.ts         copy-to-clipboard with an old-browser fallback
    storage.ts           remembering your best run of the day
    judge.ts             right, wrong, or still being typed
    streak.ts            streaks and personal bests (pure)
    chart.ts             working out what the graph should show (pure)
    supabase.ts          the client, or null when accounts are off
    history.ts           reading and writing day-by-day history
  components/
    Start.tsx            "press any key to start"
    Countdown.tsx        3 - 2 - 1
    Game.tsx             the timer, the problem, the typing
    Keypad.tsx           on-screen number pad for touch devices
    NiceTry.tsx          what a script gets instead of a score
    AccountPanel.tsx     streak, personal best, sign in / out
    ScoreChart.tsx       the 30-day graph, hand-rolled SVG
  hooks/
    useSession.ts        who is signed in
    useHistory.ts        their day-by-day history
    Results.tsx          score breakdown, copy and share
    TopBar.tsx           title and clock
  styles.css             all the styling
public/
  nice-try.jpg           the easter egg image
supabase/
  schema.sql             paste into the Supabase SQL editor once
```

The logic in `src/lib/` is deliberately free of React so it can be tested
directly. `npm test` covers the generator's determinism, the number ranges, the
subtraction and division guarantees, the Singapore midnight rollover, the
share-text format, and the saved-result rules (including that a worse replay
never overwrites a better score).

## Deploying

The site is static, so any static host works. `npm run build` writes everything
into `dist/`. For Vercel, import the repository and accept the detected Vite
settings — then put the resulting URL into `SITE_URL` in `src/config.ts`.
