# Inversion: Teacher Guide

**Inversion** is a 5-minute browser game for PWS 180 (Climate Change: Science and Solutions). Students scroll a fake Utah social feed and name the trick each post uses. The tricks are the five FLICC techniques of science denial: Fake experts, Logical fallacies, Impossible expectations, Cherry picking, and Conspiracy theories. Some posts are accurate, and students have to recognize those too.

- **Play:** https://inversion.jordanheaton.com/ (once published; see README.md)
- **Class link:** https://inversion.jordanheaton.com/?round=INVERSION gives everyone the same 9 posts (see "Rounds" below).
- **Time:** about 5 minutes, on phones or laptops
- **Setup:** none. No login or accounts, and students' answers aren't saved or sent anywhere. (The live site's host, Cloudflare, counts page visits; see "Accessibility and privacy.")

## Why it works, and how it differs from Cranky Uncle

The game uses **inoculation**: showing people a weakened dose of a misleading technique, and explaining why it misleads, makes them more resistant to it later. In Cook, Lewandowsky & Ecker (2017), explaining the flawed technique neutralized the effect of climate misinformation.

John Cook's *Cranky Uncle* uses the same idea. Inversion differs in three ways:

1. **Everything is local.** Students see the Great Salt Lake, Utah snowpack, Wasatch Front inversions, wildfire smoke, cloud seeding, and Lake Bonneville. Several sources are Utah agencies, and one is Prof. Abbott's own 2023 Great Salt Lake report.
2. **Discernment, not cynicism.** Every round has two accurate posts and at least one misleading post that *exaggerates* the problem (for example, "the lake is dying ONLY because of climate change"). A reanalysis of earlier inoculation games found they mostly made players doubt *all* news rather than sort true from false (Modirrousta-Galian & Higham, 2023; TODO: VERIFY). Accurate posts make players tell the difference. "Has a source" isn't a shortcut either: some misleading posts cite a real source and stretch it (Pete's snowpack record, Kai's NASA photo), and one accurate post names no source at all (Sam's air-quality post).
3. **Kind corrections.** On three posts per round, shared by a relative, roommate, or classmate, students choose how to reply from four believable drafts. Only one does everything well: it leads with what's true, explains the trick, and stays kind, following *The Debunking Handbook 2020*. Every set also has a warm, friendly draft that agrees with the myth, so "pick the nicest one" doesn't work. This ties to the course's Community and Belonging outcome: "We are not trying to win arguments but to win the future."

**What students see:**

- **A real photo of the Salt Lake Valley under a brown inversion "lid."** Each correct answer lifts the lid until the Capitol and the valley come through clear.
- **A fictional local social app called "basin."** Posts look like a real feed:
  - photos and screenshots: a quote-card meme, a weather-app forecast, an air-quality app, an infographic
  - link previews from (fictional) news outlets
  - a blue check on a fake expert's account
  - like and repost counts
- **A "What's the trick?" sheet** under every post.
- **A feedback note** after each answer. It **highlights the exact giveaway words** (the "tell") in the post or its graphic, then gives the real data with source links. After a wrong answer, it also says **why the student's pick wasn't it** (for example, Brody's post demands perfection from *people*, which is a false choice, not an Impossible Expectation of the science).
- **Half credit for a defensible second reading.** A couple of posts can fairly be read two ways. For example, the Sundance forecast post is also a false analogy. Picking the second reading earns half credit and a note that names the main trick.
- **Reply steps that work like texting someone you know.** The student picks one of four drafts, sends it, and sees how the person reacts. Good-but-flawed drafts earn partial credit.
- **An air-quality report at the end** (EPA AQI category names, Good to Hazardous). It shows badges for each technique and the student's blind spot. Then comes **"Review your misses,"** listing each missed post with the right answer, the clue, and why. It ends on one takeaway: reply warm, plus one fact.

## Learning objectives

After playing and discussing, students will be able to:

| Objective | Syllabus learning outcome |
|---|---|
| Identify the five FLICC techniques in realistic social media posts. | Global Environmental Issues: "Critically evaluate scientific claims and policy proposals" |
| Distinguish misleading posts from accurate ones, including misleading posts that exaggerate an environmental problem. | Scientific Principles and Reasoning |
| Use evidence to explain Utah issues: Great Salt Lake levels, snowpack trends, inversions, and wildfire. | Global Environmental Issues: "how the physical world influences local to global environmental issues" |
| Choose a correction that is accurate *and* charitable. | Community and Belonging: "compassionate, ethical, and even Christlike use of information" |

### Where it fits in the schedule

- **Best fit: Section 1, Information literacy.** Inoculation works best *before* students meet the misinformation, so playing early in the semester protects them for the rest of it.
- **Also fits Section 4, Persuasion, patience, and action.** Brody's "live in a cave or stop talking" post is built on the syllabus's "greatest false choice: personal action and systemic change."
- **Pairs with** the *Analysis of media or political coverage of climate change* enrichment activity. Students can hunt for FLICC techniques in the coverage they analyze.

## Rounds: same posts for the whole class, or new posts every time

The game holds a **bank of 21 posts**. Each play draws 9 of them. Every round has:

- every one of the five tricks at least once
- two accurate posts
- three reply steps
- at least one post that exaggerates the problem
- no more than two posts on the same topic

Each round has a short **round code**, shown on the end screen with a "copy the link to round …" button.

- **For class, give everyone the same link:** `https://inversion.jordanheaton.com/?round=INVERSION`. Everyone gets the same 9 posts in the same order, which makes discussion easy. The `INVERSION` round includes both Great Salt Lake posts (Aunt Deb's and Kai's), Brody's "live in a cave" post, Uncle Gary's Lake Bonneville post, and the Sundance forecast post, which the discussion questions below use. Its three reply steps are Uncle Gary, Aunt Deb, and Brody.
- **Any word works as a code** (`?round=SECTION2`, `?round=FALL26`). Codes aren't case-sensitive.
- **Without a code,** every play is a fresh random round, so students can replay for practice.
- **If you add or remove posts** in `content.json`, the posts behind each code change. Play your class code once after editing to see what it draws.

## 15-minute lesson plan

| Time | What happens | Notes |
|---|---|---|
| 0:00–2:00 | **Warm-up poll** (Poll Everywhere): "Think of a climate or environment post you saw recently. How did you decide whether to believe it?" Optional pre-test: show only the text of Aunt Deb's post ("Went out to the state park today and it's way up. Crisis over!!") and ask, "How convincing is this, 1–5?" | Keeps the before/after for the end. |
| 2:00–7:00 | **Play.** Project the class link (`?round=INVERSION`). Students play on their phones. | Early finishers can open "Sources" and read one source in full, or play a new round. |
| 7:00–9:00 | **Results poll:** "What air quality did you get?" (multiple choice) and "Which technique fooled you?" (word cloud). | The end screen names each student's blind spot. |
| 9:00–13:00 | **Discuss** Aunt Deb's and Kai's lake posts, which get the Great Salt Lake wrong from opposite directions (think-pair-share, 2 min). Then the reply step: why did reasonable-sounding drafts only get partial credit? | Questions 1 and 6 below. |
| 13:00–15:00 | **Wrap up.** Recap FLICC in one sentence each. Re-ask the 1–5 rating on Aunt Deb's post. | Post-test shift is a quick, low-stakes measure of impact. |

## Discussion questions

These refer to posts by account, so they work with the `INVERSION` class round. Most also work with any round.

1. **Aunt Deb ("crisis over!!") and Kai ("dying ONLY because of climate change")** both get the Great Salt Lake wrong, from opposite directions. Which would people you know be more likely to share? Why does it matter that misinformation also comes from people who care about the environment?
2. **Record snow, a rising lake, a −15° morning:** several posts point to one striking day or year. Why are single moments so persuasive? What would you need to see before calling something a trend?
3. **Fake experts:** a "Dr." who turns out to be a dentist, a "1,600 scientists" petition, a cousin who "works at the refinery." Whose expertise do you trust on climate, and why? Would a climate scientist be a "fake expert" on economics?
4. **Uncle Gary's Lake Bonneville post** starts with something true. Why are half-true claims harder to correct than flatly false ones?
5. **Brody's post** says you can't care about climate if you own a car and a phone. How does this connect to the course's "greatest false choice" between personal action and systemic change?
6. In the reply steps, several drafts earned only partial credit: one repeated the myth first, one was correct but cold, and one was friendly but quietly agreed with the myth. When has someone actually changed your mind? What did they do?
7. **Sources:** Kai cites NASA and still misleads; Maya and Priya cite sources and are accurate. (Other rounds include Pete, who cites a real state agency and misleads, and Sam, who cites nothing and is accurate.) Besides "is there a source?", what should you check? What's the risk of a game that teaches people to distrust everything?
8. The syllabus says, "We are not trying to win arguments but to win the future." What would that look like in a comment section?
9. After each answer, the game highlights the "tell": the exact words that give the trick away. Which tell would you be most likely to miss in your own feed?
10. **The Sundance forecast post** can fairly be called a false analogy *and* an impossible expectation. Which trick is doing the most work in it? Why does naming the main one help when you reply?

## How scoring works

- **Posts:** 100 points for naming the right technique on each of the 9 posts. A few posts accept a second, defensible reading for 50 points (see `alsoFair` below).
- **Reply steps (3 per round):** 50 points for the best draft, 25 for a good-but-flawed draft, and 0 for one that sounds polite but talks down to the person.
- **Rating:** the total out of 1,050 maps to an air-quality category: Good (80%+), Moderate (60%+), Unhealthy for Sensitive Groups (45%+), Unhealthy (30%+), Very Unhealthy (15%+), and Hazardous below that. One missed post with decent replies still rates Good.
- **End screen:** results by technique, the student's "blind spot" (the technique they missed most often), a "Review your misses" list, and a closing takeaway.

"Logical Fallacy" shows up most in the bank (6 posts) because it's the broadest category. Every trick is bad reasoning, so the game treats Logical Fallacy as the category for broken logic the other four don't name: one cause for everything, a false choice, "it happened naturally before," "someone else is worse, so nothing matters," and attacking the messenger. Impossible Expectations is limited to demanding *certainty from the science*. When a student picks a defensible-but-broader answer, the feedback note explains why the more specific trick fits.

## Accessibility and privacy

- Works with keyboard only: number keys to answer, Enter to move on (Tab works too).
- Screen readers get headings, labeled answer groups, and spoken results.
- Text contrast meets the 4.5:1 minimum. Right, partly right, and wrong answers use ✓ and ✗ marks as well as color.
- Every photo has alt text, and the built-in graphics have text descriptions for screen readers.
- Animations turn off when a device has "reduce motion" set.
- No cookies or accounts, and answers are never saved or sent anywhere. The game's own code makes no network calls beyond loading the page. On the live site, Cloudflare (which serves jordanheaton.com) adds its Web Analytics script, which counts page visits. It can be turned off in the Cloudflare dashboard under Web Analytics.

## Editing the content

Everything students see (posts, answers, explanations, sources, replies, round rules, and the air-quality ratings) lives in **one file: `content.json`**. You never need to touch the code.

### The easy way: edit on GitHub

1. Open the repository on GitHub and click `content.json`.
2. Click the pencil icon (Edit this file).
3. Make your change, then click **Commit changes**.
4. GitHub Pages republishes the site in about a minute.
5. Open the game with `?review` on the end of the URL (for example `https://inversion.jordanheaton.com/?review`) to check your edit (see "Check your work" below).

### What a post looks like

The `"posts"` list is the bank; rounds draw from it. To add a post, copy this template, paste it into the list, and change the text. Put a comma between posts and none after the last one.

```json
{
  "id": "short-unique-name",
  "topic": "gsl",
  "account": { "name": "Made-Up Name", "handle": "@madeup_handle", "initials": "MN" },
  "time": "4h",
  "text": "What the post says.",
  "tell": "the post says",
  "likes": 120,
  "shares": 30,
  "answer": "cherry-picking",
  "explanation": "One or two sentences on why this is (or isn't) misleading.",
  "fact": "The real data, in one sentence.",
  "sources": [
    {
      "label": "Title of the page or paper",
      "publisher": "Agency or journal",
      "year": 2026,
      "url": "https://...",
      "status": "TODO: VERIFY",
      "check": "What to confirm on the page."
    }
  ]
}
```

| Field | What it does |
|---|---|
| `id` | A unique short name. Students never see it. |
| `topic` | A short tag like `gsl`, `snowpack`, `air`, or `smoke`. A round never shows more than two posts with the same topic. |
| `side` | Optional. `"alarmist"` marks a misleading post that exaggerates the problem; every round includes at least one. |
| `account` | The fictional poster. Add `"relation": "Your cousin"` (or "Your roommate," "Your classmate") to show "Your cousin shared this" above the post. **Always use made-up names, never real people or organizations.** |
| `answer` | Must be one of: `fake-experts`, `logical-fallacies`, `impossible-expectations`, `cherry-picking`, `conspiracy`, `legit`. |
| `alsoFair` | Optional. A second answer a careful student could defend, worth half credit: `[{ "answer": "logical-fallacies", "note": "Why it's fair, and what the main trick is." }]`. Use it when a post honestly fits two tricks. Otherwise, rewrite the post so the tell points one way. |
| `explanation` | Shown after answering. Aim for 30 words or fewer. |
| `fact` | The "The facts:" line. Aim for 25 words or fewer. |
| `sources` | At least one. `status` must be exactly `"verified"` or `"TODO: VERIFY"`. `url` is optional (the syllabus source has none). |
| `tell` | Optional but recommended. The exact words that give the trick away, copied word-for-word from the post `text` or its graphic. They get highlighted after the student answers. On legit posts, mark the good sign instead (for example, the named source, or a claim that matches the data). `tellNote` optionally changes the little label. |
| `whyNot` | Optional. What to tell a student who picked a specific wrong answer: `{ "logical-fallacies": "Every trick is bad reasoning. This one demands an exact date, so it's Impossible Expectations." }`. Write one for each likely confusion. For other wrong picks, the game shows that technique's `notThis` line ("Conspiracy Theory needs a secret plot or a hidden “they.”"). |
| `account.avatar` | Optional. A profile photo, like `"assets/avatars/lake.webp"`. Leave it out for a letter avatar. **Never use a photo of a real person.** Use places, animals, or objects. |
| `account.verified` | Optional. `true` shows a blue check (the fake-expert account uses this to make the point that a badge isn't expertise). |
| `image` | Optional. A photo in the post: `{ "src": "assets/photos/name.webp", "alt": "What the photo shows", "credit": "Photo: Author, CC BY 4.0" }`. `alt` is required. |
| `graphic` | Optional (use `image` *or* `graphic`, not both). A built-in graphic (examples below the table). |
| `reply` | Optional. Adds a "how would you reply?" step after the post (see Aunt Deb's or Uncle Gary's post). Needs a `prompt` and 2 or more `options`. Each option has `text`, `feedback`, `points`, and an optional `reaction`. More in "Reply drafts" below. |

The `graphic` types:

- `{"type": "quote", "quote": "…", "attribution": "…"}`: a quote-card meme
- `{"type": "forecast", "place": "…", "day": "…", "amount": "…", "detail": "…"}`: a weather-app screenshot
- `{"type": "stat", "value": "95%", "caption": "…", "source": "…"}`: an infographic
- `{"type": "link", "outlet": "…", "headline": "…"}`: a news link preview. Its icon shows the outlet's first letter; add `"mark": "U"` to choose a different one.
- `{"type": "aqi", "place": "…", "value": "162", "category": "Unhealthy", "detail": "…"}`: an air-quality app

### Reply drafts

Give each reply step four drafts that all sound reasonable:

- **50 points:** the best draft. It leads with what's true, explains the trick, and is kind. It shouldn't be the longest or the most obviously "nice" one.
- **25 points:** flawed. For example, it repeats the myth first, it's correct but cold, or it's warm and friendly but agrees with the myth.
- **0 points:** sounds polite but talks down to the person.

Include at least one warm-sounding draft that's wrong, so students can't win by picking the nicest one. Keep drafts about the same length (around 15 words), and don't make the best one the longest. Don't reuse wording from the post's explanation or fact in the best draft: students read that card just before replying, so an echoed phrase gives the answer away. If you want an echo, put it in a 25-point draft. Exactly one draft must have the top score. The game shuffles draft order each round.

### Adding a photo

1. Use only photos you're allowed to reuse: public domain, CC0, or Creative Commons (Wikimedia Commons is a good place to look). Note the author and license.
2. Shrink it to about 960 pixels wide so it loads fast on phones (under ~200 KB), and put it in `assets/photos/`.
3. Add it to the post as `image` with a `src`, a short `alt` description, and a `credit` line.
4. Add an entry to `"about"` → `"photos"` (title, author, license, link) so it's listed on the Sources and credits screen. Creative Commons licenses require this credit.

### Other things you can change

- **Round rules** live in `"round"`:
  - `size`: posts per round
  - `legit`: accurate posts per round
  - `replies`: reply steps per round
  - `alarmist`: minimum exaggerating posts
  - `maxPerTopic`: most posts allowed on one topic

  Delete the whole `"round"` block to play every post in file order instead.
- **Technique names and hints** live in `"techniques"`. Change `name`, `hint`, `definition`, or `notThis` (what the trick needs, shown when a student picks it wrongly) freely. Keep the `id`s, since posts point to them. `icon` picks the symbol: `cap`, `chain`, `infinity`, `cherry`, `pins`, or `check`.
- **Points** live in `"scoring"` (`techniquePoints`, `alsoFairPoints`, `replyPoints`).
- **Air-quality ratings** live in `"ranks"`. `min` is the percentage of the maximum score needed. Keep one rank with `"min": 0`. An optional `short` label is used on the in-game meter when the full name is long (Unhealthy for Sensitive Groups shows as "Unhealthy (sensitive)").
- **Intro text, the privacy line, and the end screen's takeaway** live in `"meta"` (`intro`, `privacy`, `takeaway`).

### Check your work

Open the game with `?review` at the end of the URL. Review mode:

- **Tests the round rules:** it draws 500 practice rounds and confirms every one follows them.
- **Lists every post** in the bank with its answer, how often it shows up in rounds, explanation length, and sources. Each source is marked **verified** or **TODO: VERIFY**.
- **Flags long copy:** explanations over 30 words, facts over 25, and posts over 40.
- **Estimates play time** for an average round and the longest possible round, and warns if they run long. Reply drafts add up quickly, so keep each one short.

If something in the file is broken, the game shows a plain-English list of what to fix instead of a blank page. For example: *round.replies is 2, but only 1 post in the bank has a "reply" step.* Common JSON mistakes:

- Text must be in "double quotes". Curly quotes from a word processor break the file.
- Items in a list need a comma between them, and **no** comma after the last one.
- To use a double quote inside text, write `\"`.

## Sources and fact-checking

Every factual statement in the game cites a source, and every source carries a `status`:

- **verified**: the page was opened and the exact claim was confirmed on it. The `check` note quotes what it says.
- **TODO: VERIFY**: the source is real and expected to say this, but the automated check couldn't open the page (paywalls, logins, or blocked requests). Confirm these by hand before using the game in class.

The 6 sources still marked TODO: VERIFY are:

1. Utah Geological Survey FAQ, Lake Bonneville facts (Uncle Gary's post)
2. IPCC AR6 WGI Summary for Policymakers, statement A.1 (Uncle Gary's post)
3. Wurtsbaugh et al. 2017, *Nature Geoscience* (Kai's lake post)
4. IPCC AR6 WGIII Summary for Policymakers, statement C.10 (Brody's post)
5. Modirrousta-Galian & Higham 2023, *J. Exp. Psychology: General* (research background)
6. Roozenbeek & van der Linden 2019, *Palgrave Communications* (research background)

To mark one checked, change its `"status"` to `"verified"` and update its `"check"` note.

## Research behind the game

- Cook, J., Lewandowsky, S., & Ecker, U. K. H. (2017). Neutralizing misinformation through inoculation: Exposing misleading argumentation techniques reduces their influence. *PLOS ONE, 12*(5), e0175799. https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0175799
- Cook, J. (2020). A history of FLICC: The 5 techniques of science denial. *Skeptical Science.* https://skepticalscience.com/history-FLICC-5-techniques-science-denial.html
- Lewandowsky, S., Cook, J., Ecker, U. K. H., et al. (2020). *The Debunking Handbook 2020.* https://sks.to/db2020
- Modirrousta-Galian, A., & Higham, P. A. (2023). Gamified inoculation interventions do not improve discrimination between true and fake news. *Journal of Experimental Psychology: General, 152.* https://pubmed.ncbi.nlm.nih.gov/36996156/ (TODO: VERIFY)
- Roozenbeek, J., & van der Linden, S. (2019). Fake news game confers psychological resistance against online misinformation. *Palgrave Communications, 5*, 65. https://www.nature.com/articles/s41599-019-0279-9 (TODO: VERIFY)

The complete source list for every post is in the game under **Sources and credits**, and in `content.json`.

## Credits and AI disclosure

Created by Jordan Heaton for PWS 180 at BYU (Prof. Ben Abbott) as a supplemental teaching module. All accounts, people, and news outlets in the feed are fictional. Photos come from Wikimedia Commons under public-domain and Creative Commons licenses; each one is credited on the in-game Sources and credits screen. Typeface: Archivo by Omnibus-Type (SIL Open Font License).

> **TODO (Jordan):** The PWS 180 AI policy asks you to disclose how you used AI tools and to identify AI-generated text. Describe here how AI was used in building this module before you submit it.
