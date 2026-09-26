# CAS Portfolio

An IB CAS (Creativity, Activity, Service) portfolio: a custom static website with a live WebGL
particle universe that morphs into the letters **C**, **A** and **S** as you scroll, frosted-glass cards
that tilt in 3D, a spinnable 3D ring of interests, and a magazine-style page for every reflection.

No frameworks, no build step, no cost. It runs on free GitHub Pages.

```
CAS website/
├── content.js          ← THE ONLY FILE YOU EDIT (all your text lives here)
├── index.html          homepage
├── reflections.html    all reflections, filterable by strand
├── reflection.html     one reflection (reflection.html?id=…)
└── assets/
    ├── img/            ← upload your photos here
    ├── files/          ← upload your CAS Personal Profile PDF here
    ├── css/style.css
    └── js/             render.js · ui.js · scene.js (particles)
```

## Publish it (one time, ~2 minutes)

1. On GitHub, open this repo → **Settings** → **Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. Go to the **Actions** tab → **Deploy CAS website** → **Run workflow**.
4. When it goes green, the site is live at
   **https://marxuachsasha-beep.github.io/CAS-website/**

After that, every change you commit to the `CAS website` folder republishes automatically in about a minute.

If the deploy says the branch "is not allowed to deploy to github-pages", go to **Settings → Environments →
github-pages** and add your default branch under *Deployment branches*.

## Update your content

Everything is in **`CAS website/content.js`**. Open it on GitHub, click the ✏️ pencil, edit, commit.

- Text starting with **✎** is a placeholder. It shows on the site with an amber dashed underline so you can
  find what still needs writing. Delete the ✎ when you replace it.
- Formatting: `*italic*`, `**bold**`, `[link text](https://…)`.
- **Photos:** in the `CAS website/assets/img` folder use **Add file → Upload files**, then reference them as
  `"assets/img/your-photo.jpg"`. Keep photos under ~500 KB (resize them first) so the site stays fast.
- **New quarterly reflection:** copy the whole `{ … }` block of the last reflection in `reflections: [ … ]`,
  paste it underneath, give it a new `id`, and fill in each section. It automatically appears on the homepage
  timeline, the reflections page, the strand counts and the learning-outcome tracker.
- If you break the file (usually a missing comma or quote), the site shows a "content.js needs fixing"
  message instead of a blank page.

## Preview locally

Double-click `CAS website/index.html`. Everything works offline except the Google Fonts.

## Accessibility & performance

- Respects *reduced motion*: animations, particle drift and the custom cursor turn off.
- Falls back to an animated gradient background if WebGL isn't available.
- Particle count drops automatically on phones and low-power devices; rendering pauses in background tabs.
