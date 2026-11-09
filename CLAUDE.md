# CAS website: notes for Claude

Sasha Marxuach's IB CAS (Creativity, Activity, Service) portfolio site. It's a personal school
project that the IB coordinator and examiners will see, so it should feel polished and personal,
not like a template.

## Hard constraints
- **Plain HTML, CSS and JS only.** No frameworks, no npm dependencies in the site, no build step.
  The site must keep working by double-clicking `CAS website/index.html`.
- **Free hosting on GitHub Pages.** `.github/workflows/deploy-pages.yml` publishes the `CAS website/`
  folder on every push to the default branch. Nothing outside that folder is deployed, and nothing
  in it may need a server.
- **Phones matter as much as desktop.** Classmates and teachers will mostly open it on a phone.
  No horizontal page scroll, and every hover interaction needs a tap equivalent.
- Keep `prefers-reduced-motion` support and the no-WebGL fallback working (see README).

## How it's built
- `CAS website/index.html`: all text. User-editable spots are marked `EDIT:`; keep those markers.
- `assets/js/main.js`: the whole site is one pinned viewport (`.stage__sticky`). Scroll becomes a
  progress value **P (0 → 1)** and every scene is drawn from it in `render(p)`. The timeline
  (segments `SEG`, jump points `STOPS`) is documented at the top of the file. To change *when*
  something happens, change these ranges; don't add scroll listeners or a second animation system.
  `window.CASSite` exposes `progress()`, `go(p)` and `open(strand)` for testing.
- `assets/js/galaxy.js`: the WebGL particle galaxy (`window.Galaxy.setWarp/setNight/setVisible`).
- `assets/css/style.css`: all styling. The title-bar colour follows the page via
  `theme-home / theme-cas / theme-about` classes on `<html>`.
- Photos: `assets/img/about-1.jpg`, `about-2.jpg` and `about-3.jpg`. Until they exist, gradient
  placeholders show. That's expected, not a bug.

## Design language (keep it consistent)
- Palette: blues → teal → green (`#1f6bff`, `#0fb5a6`, `#2fcf7f`) on white/mint pages, with dark
  navy text. Black display type with a soft blue glow on the cover.
- Fonts: Unbounded for display headings, Figtree for body text (Google Fonts).
- Feel: smooth, cinematic and calm. Transitions are continuous and scroll-driven, never sudden.
  Glassy circles and cards, small sharp stars, big faint background words ("CAS ✦", "About me ✦").
- Don't make it generic: no stock "portfolio template" sections, emoji icons, or default
  Bootstrap/Tailwind look.

## Check visually before saying something is done
This site is almost entirely visual, so reading the code isn't enough. After any change to HTML,
CSS or JS:

```
node tools/screenshots.js          # desktop + phone, every scroll stage → screenshots/
node tools/screenshots.js tablet   # optional: one device only (desktop | tablet | phone)
```

Then **look at the screenshots** for the stages you touched, on both desktop and phone. Check for
overlapping or cut-off text, broken transitions, a horizontal scrollbar on phones, and anything
that changed that shouldn't have. The script also fails on JS errors and missing files (except the
not-yet-uploaded photos). If the change is about motion, also screenshot between stages (pass other
P values to `goTo` in the script). Report what you actually saw, including problems you didn't fix.

## Working style
- The owner is a student, not a developer. Explain changes in plain language, and say honestly
  when something is a trade-off or looks worse.
- Prefer small, targeted edits over rewrites. Many details (hover locks, measurement in
  `measure()`, cached style writes in `css()`) fix real bugs. Understand them before changing.
- Don't fill in the placeholder text or invent CAS experiences. That content must be Sasha's own.
