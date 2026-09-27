# Sasha Marxuach · CAS Experience Website

A custom, scroll-animated IB CAS website. It's built as one pinned "stage", so scrolling plays a sequence
of page transitions instead of just moving down a page:

1. **Cover:** "Sasha Marxuach CAS Experience Website" in black type wrapped in a soft blue glow that slowly
   breathes, over a live WebGL galaxy in blues that follows the mouse.
2. **What is CAS?** As you scroll, the title flies up and becomes the header while the camera flies into
   the galaxy: the white fades away and you land on a light-blue page with a few glowing stars. Hover (or tap) one of the
   three glass circles, Creativity, Activity or Service, and it moves to the centre and shows what that
   strand means.
3. **About me:** opens as a glowing portal out of the "CAS" centre. Scrolling (or swiping sideways) slides
   from the title and photos to the info panel as one continuous page.

No frameworks, no build step, no cost. It runs on free GitHub Pages.

```
CAS website/
├── index.html          ← all the text lives here (look for the EDIT comments)
└── assets/
    ├── img/            ← your photos: about-1.jpg, about-2.jpg, about-3.jpg
    ├── css/style.css
    └── js/
        ├── main.js     scroll choreography
        └── galaxy.js   the particle galaxy
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

## Edit the text

Open `CAS website/index.html` on GitHub, click the ✏️ pencil, and search for `EDIT:`. The marked spots are
the "What is CAS?" description, the three circle descriptions (currently the IB's own definitions of each
strand) and the About me text. Replace the words between the tags and commit.

## Add your photos

Go to `CAS website/assets/img` → **Add file → Upload files** and upload three photos named exactly:

| File name     | Where it appears                      |
|---------------|---------------------------------------|
| `about-1.jpg` | About me, large photo next to the title |
| `about-2.jpg` | About me, small photo next to the title |
| `about-3.jpg` | About me, photo beside your text        |

They replace the placeholders automatically. No code changes needed. Resize photos to under ~500 KB first so
the site stays fast.

## Preview locally

Double-click `CAS website/index.html`. Everything works offline except the Google Fonts.

## Accessibility & performance

- Respects *reduced motion*: ambient animations, blur and galaxy drift turn off; the scroll story still works.
- Without WebGL, the galaxy falls back to a soft animated gradient.
- The galaxy uses fewer particles on phones and stops rendering once you've scrolled past the cover.
- About me can be moved sideways with a trackpad swipe, a sideways touch swipe, or the ← → arrow keys.
