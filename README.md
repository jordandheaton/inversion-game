# Inversion

A 5-minute browser game about spotting climate misinformation, set in Utah. Players scroll a fake social feed and name the trick each post uses: the five FLICC techniques (Fake experts, Logical fallacies, Impossible expectations, Cherry picking, Conspiracy theories), or "looks legit." The examples are the Great Salt Lake, snowpack, Wasatch Front inversions, wildfire smoke, cloud seeding, and Lake Bonneville.

Each play draws 10 posts from a bank of 21, and two of those posts ask the player to pick the best of four replies to a relative who shared them. A round code in the URL (`?round=INVERSION`) gives a whole class the same posts.

Built as a supplemental teaching module for BYU's PWS 180 (Climate Change: Science and Solutions). For learning objectives, a 15-minute lesson plan, discussion questions, and how to edit the content, see **[TEACHER_GUIDE.md](TEACHER_GUIDE.md)**.

The feed lives in a fictional local app called "basin," shown over a real photo of the Salt Lake Valley. A brown inversion layer over the valley lifts as the player scores, and the game ends with an air-quality report.

- Static site: HTML, CSS, and vanilla JavaScript. No build step, no dependencies, no backend. About 1.3 MB of images and fonts, all self-hosted.
- No login, cookies, analytics, or saved data.
- Works on phones, and with keyboard only.

## Files

| File | What it is |
|---|---|
| `index.html` | The page shell, photo backdrop, and icon set. |
| `styles.css`, `valley.css` | Base components and the Valley visual theme, including responsive layouts and answer feedback. |
| `game.js` | Loads and validates `content.json`, draws each round from the post bank, then runs the game. |
| `content.json` | **All the content**: the post bank, round rules, answers, explanations, sources, reply drafts, ratings, photo credits. The only file you need to edit. |
| `assets/photos/`, `assets/avatars/` | Wikimedia Commons photos (public domain and Creative Commons), resized to WebP. Credits are in `content.json` and on the in-game Sources and credits screen. |
| `assets/fonts/` | Archivo (SIL Open Font License), self-hosted so the game makes no outside requests. |
| `favicon.svg` | Browser tab icon. |
| `CNAME`, `.nojekyll` | GitHub Pages settings: the site's domain, and "serve the files as they are." |
| `TEACHER_GUIDE.md` | Classroom guide and content-editing instructions. |

## Run it locally

The game loads `content.json` with `fetch()`, which browsers block for pages opened straight from a file (`file://`). Serve the folder instead. From the repository folder:

```bash
python -m http.server 8000
```

Then open http://localhost:8000. Any static server works, such as VS Code's Live Server extension.

Add `?review` to the URL (http://localhost:8000/?review) to see review mode. It shows:

- every post in the bank, with its sources and verification status
- how often each post appears in rounds
- copy-length warnings
- estimated play time for an average and a worst-case round

Add `?round=ANYWORD` to replay a specific round.

## Deploy

It's a plain static folder, so any free static host works.

### The live site

This repository (`jordandheaton/inversion-game`) is published by GitHub Pages from `main` at:

**https://inversion.jordanheaton.com/**

The `CNAME` file sets that domain. A CNAME record for `inversion` in the jordanheaton.com DNS (Cloudflare) points at `jordandheaton.github.io`. Pushing to `main` updates the site within a minute or two.

### A copy the professor controls: GitHub Pages

1. Create a new public repository on GitHub, for example `inversion-game`.
2. Upload the contents of this folder (not the folder itself) to the repository root: **Add file → Upload files**, then commit. **Leave out `CNAME`**, which belongs to the live site's domain.
3. Go to **Settings → Pages**. Under "Build and deployment," choose **Deploy from a branch**, branch `main`, folder `/ (root)`, and save.
4. After a minute the site is live at `https://<username>.github.io/inversion-game/`.

### A copy the professor controls: Vercel

1. Put the folder in a GitHub repository (steps 1–2 above).
2. On vercel.com, choose **Add New → Project** and import the repository.
3. Set Framework Preset to **Other**, leave the build command empty, and leave the output directory as the repository root.
4. Deploy. Vercel gives you a `*.vercel.app` URL and redeploys on every push.

With either host, editing `content.json` on GitHub and committing redeploys the game automatically.

## Content rules

- Every factual statement cites a source. Each source has `"status": "verified"` (the claim was confirmed on the page) or `"status": "TODO: VERIFY"` (still needs a manual check). Review mode lists them all.
- All posters and news outlets are fictional. Never use real people or organizations as accounts, and never use a real person's photo as an avatar. Real agencies appear only on accurate posts that cite them.
- Every photo needs `alt` text and a credit in `about.photos`.
- The game checks `content.json` when it loads. If anything is malformed, it shows a list of what to fix instead of a blank page.

## Browser support

Current versions of Chrome, Safari, Firefox, and Edge, on desktop and mobile.
