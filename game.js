/*
 * Inversion: a 5-minute climate misinformation game.
 * All posts, answers, explanations, photos, and sources live in content.json;
 * this file only loads, validates, and plays them.
 *
 * Each play draws a "round" of posts from the bank in content.json. A round code
 * (?round=ANYWORD in the URL) makes the draw repeatable, so a class can share one.
 */
(function () {
  'use strict';

  const CONTENT_URL = 'content.json';
  const SOURCE_STATUSES = ['verified', 'TODO: VERIFY'];
  const LEGIT_ID = 'legit';
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const ICON_NAMES = ['cap', 'chain', 'infinity', 'cherry', 'pins', 'check'];
  const DEFAULT_ICONS = {
    'fake-experts': 'cap',
    'logical-fallacies': 'chain',
    'impossible-expectations': 'infinity',
    'cherry-picking': 'cherry',
    conspiracy: 'pins',
    legit: 'check',
  };
  // Fields each built-in post graphic needs, and the ones a "tell" may be found in.
  const GRAPHIC_FIELDS = {
    quote: ['quote', 'attribution'],
    forecast: ['place', 'day', 'amount'],
    stat: ['value', 'caption'],
    link: ['outlet', 'headline'],
    aqi: ['place', 'value', 'category'],
  };
  const TELL_FIELDS = ['quote', 'attribution', 'headline', 'outlet', 'caption', 'detail'];
  const SIDES = ['alarmist'];
  const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const COUNT_WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six'];

  // Review mode flags copy over these lengths and estimates play time, so edits keep a round near 5 minutes.
  const MAX_EXPLANATION_WORDS = 30;
  const MAX_FACT_WORDS = 25;
  const MAX_POST_WORDS = 40;
  const TARGET_MINUTES = 5;
  const READING_WPM = 250;
  const SECONDS_PER_DECISION = 5;
  const SECONDS_PER_CLICK = 2;
  const REACTION_DELAY_MS = 900;
  const SIMULATED_ROUNDS = 500;

  const root = document.getElementById('root');
  const announcer = document.getElementById('announcer');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  let content = null;
  let techById = {};
  let bankStats = null;
  let state = null;

  /* ---------- small DOM helpers ---------- */

  function h(tag, props, ...children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(props || {})) {
      if (value == null || value === false) continue;
      if (key === 'class') node.className = value;
      else if (key === 'style') node.style.cssText = value;
      else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
      else node.setAttribute(key, value === true ? '' : value);
    }
    for (const child of children.flat(Infinity)) {
      if (child == null || child === false) continue;
      node.append(child instanceof Node ? child : String(child));
    }
    return node;
  }

  function icon(name, extraClass) {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', `icon ${extraClass || ''}`.trim());
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const use = document.createElementNS(SVG_NS, 'use');
    use.setAttribute('href', `#i-${name}`);
    svg.append(use);
    return svg;
  }

  function screen(name, ...nodes) {
    document.body.dataset.screen = name;
    root.replaceChildren(...nodes);
    window.scrollTo(0, 0);
  }

  function focusOn(node, scroll) {
    if (!node) return;
    if (scroll) node.scrollIntoView({ block: 'start', behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    node.focus({ preventScroll: true });
  }

  function announce(message) {
    announcer.textContent = '';
    window.setTimeout(() => { announcer.textContent = message; }, 50);
  }

  function wordCount(text) {
    return String(text || '').trim().split(/\s+/).filter(Boolean).length;
  }

  function formatCount(n) {
    if (!Number.isFinite(n)) return '0';
    return n >= 10000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K' : n.toLocaleString('en-US');
  }

  function avatarColor(seed) {
    let hash = 0;
    for (const ch of String(seed)) hash = (hash * 31 + ch.codePointAt(0)) >>> 0;
    return `hsl(${hash % 360} 45% 30%)`; // 30% lightness keeps white initials above 4.5:1 for every hue
  }

  function textColorOn(hex) {
    const rgb = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map(c => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
    const lum = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
    return (lum + 0.05) / 0.05 >= 1.05 / (lum + 0.05) ? '#111111' : '#ffffff';
  }

  function techIcon(tech) {
    return tech.icon || DEFAULT_ICONS[tech.id] || 'flag';
  }

  /* ---------- seeded randomness and round draws ---------- */

  // xmur3 string hash feeding mulberry32: small, fast, and the same in every browser.
  function seededRandom(seed) {
    let h = 1779033703 ^ seed.length;
    for (let i = 0; i < seed.length; i++) {
      h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    let a = (h ^= h >>> 16) >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffle(list, rng) {
    const out = [...list];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  function newRoundCode() {
    let code = '';
    for (let i = 0; i < 4; i++) code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    return code;
  }

  function cleanCode(raw) {
    return String(raw || '').toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 24);
  }

  // Null when content.json has no "round" block: then every post plays, in file order.
  function roundConfig(c) {
    if (!c.round) return null;
    const r = c.round;
    return {
      size: Math.min(r.size ?? 10, c.posts.length),
      legit: r.legit ?? 0,
      replies: r.replies ?? 0,
      alarmist: r.alarmist ?? 0,
      maxPerTopic: r.maxPerTopic ?? Infinity,
    };
  }

  function tryDraw(c, cfg, rng) {
    const pool = shuffle(c.posts, rng);
    const tricks = c.techniques.map(t => t.id).filter(id => id !== LEGIT_ID);
    const chosen = [];
    const perTopic = {};
    const isLegit = p => p.answer === LEGIT_ID;
    const count = test => chosen.filter(test).length;
    const fits = p => !chosen.includes(p) && (!p.topic || (perTopic[p.topic] || 0) < cfg.maxPerTopic);
    const take = p => { chosen.push(p); if (p.topic) perTopic[p.topic] = (perTopic[p.topic] || 0) + 1; };
    const fill = (test, until) => {
      for (const p of pool) {
        if (until()) return;
        if (fits(p) && test(p)) take(p);
      }
    };

    fill(p => p.reply && !isLegit(p), () => count(p => p.reply) >= cfg.replies);
    fill(p => p.side === 'alarmist' && !p.reply && !isLegit(p), () => count(p => p.side === 'alarmist') >= cfg.alarmist);
    for (const id of tricks) fill(p => p.answer === id && !p.reply, () => chosen.some(p => p.answer === id));
    fill(p => isLegit(p) && !p.reply, () => count(isLegit) >= cfg.legit);
    fill(p => !isLegit(p) && !p.reply, () => chosen.length >= cfg.size);

    const ok = chosen.length === cfg.size
      && count(p => p.reply) === cfg.replies
      && count(isLegit) === cfg.legit
      && count(p => p.side === 'alarmist') >= cfg.alarmist
      && tricks.every(id => chosen.some(p => p.answer === id));
    return ok ? chosen : null;
  }

  // The posts for one round, or null if the bank can't meet the round rules.
  function drawRound(c, code) {
    const cfg = roundConfig(c);
    if (!cfg) return [...c.posts];
    for (let attempt = 0; attempt < 40; attempt++) {
      const rng = seededRandom(`${code}:${attempt}`);
      const picked = tryDraw(c, cfg, rng);
      if (picked) return shuffle(picked, rng);
    }
    return null;
  }

  /* ---------- loading and validation ---------- */

  class ContentError extends Error {
    constructor(problems) {
      super(problems[0]);
      this.problems = problems;
    }
  }

  async function loadContent() {
    let response;
    try {
      response = await fetch(CONTENT_URL, { cache: 'no-cache' });
    } catch (err) {
      throw new ContentError([`The browser couldn't read ${CONTENT_URL}.`]);
    }
    if (!response.ok) throw new ContentError([`Couldn't load ${CONTENT_URL} (HTTP ${response.status}).`]);
    const raw = await response.text();
    try {
      return JSON.parse(raw);
    } catch (err) {
      throw new ContentError([`${CONTENT_URL} isn't valid JSON${jsonErrorLocation(err, raw)}: ${err.message}`]);
    }
  }

  function jsonErrorLocation(err, raw) {
    const match = /position (\d+)/.exec(err.message);
    if (!match || /line \d+/.test(err.message)) return '';
    const line = raw.slice(0, Number(match[1])).split('\n').length;
    return ` (near line ${line})`;
  }

  function replyPointsMax(c) {
    return (c.scoring && c.scoring.replyPoints) ?? 50;
  }

  function optionPoints(option, max) {
    if (typeof option.points === 'number') return option.points;
    return option.best ? max : 0;
  }

  function tellField(post) {
    if (!post.tell) return null;
    if (post.text && post.text.includes(post.tell)) return 'text';
    const g = post.graphic;
    if (g) return TELL_FIELDS.find(k => typeof g[k] === 'string' && g[k].includes(post.tell)) || null;
    return null;
  }

  function validateContent(c) {
    const errors = [];
    const warnings = [];
    const isObj = v => v !== null && typeof v === 'object' && !Array.isArray(v);
    const isText = v => typeof v === 'string' && v.trim() !== '';
    const isNum = v => typeof v === 'number' && Number.isFinite(v);

    if (!isObj(c)) return { errors: ['The file must contain a single JSON object: { ... }.'], warnings };

    if (!isObj(c.meta) || !isText(c.meta.title)) errors.push('meta.title is missing.');

    if (c.scoring !== undefined) {
      if (!isObj(c.scoring)) errors.push('scoring must be an object.');
      else {
        for (const key of ['techniquePoints', 'alsoFairPoints', 'replyPoints']) {
          if (c.scoring[key] !== undefined && !(isNum(c.scoring[key]) && c.scoring[key] >= 0)) {
            errors.push(`scoring.${key} must be a number 0 or higher.`);
          }
        }
      }
    }
    const replyMax = replyPointsMax(c);

    const techIds = new Set();
    if (!Array.isArray(c.techniques) || c.techniques.length < 2) {
      errors.push('techniques must be a list with at least 2 entries.');
    } else {
      c.techniques.forEach((t, i) => {
        const where = `techniques[${i}]`;
        if (!isObj(t)) return errors.push(`${where} must be an object.`);
        if (!isText(t.id)) errors.push(`${where} is missing an "id".`);
        else if (techIds.has(t.id)) errors.push(`${where}: the id "${t.id}" is used twice.`);
        else techIds.add(t.id);
        if (!isText(t.name)) errors.push(`${where} ("${t.id}") is missing a "name".`);
        if (!isText(t.hint)) errors.push(`${where} ("${t.id}") is missing a "hint".`);
        if (t.notThis !== undefined && !isText(t.notThis)) errors.push(`${where} ("${t.id}") "notThis" must be text: what this trick needs, shown when it's picked wrongly.`);
        if (t.icon !== undefined && !ICON_NAMES.includes(t.icon)) {
          errors.push(`${where} ("${t.id}") "icon" must be one of: ${ICON_NAMES.join(', ')}.`);
        }
      });
    }

    const checkSources = (sources, where) => {
      if (!Array.isArray(sources) || sources.length === 0) {
        errors.push(`${where} needs at least one source in "sources".`);
        return;
      }
      sources.forEach((s, k) => {
        const sw = `${where} sources[${k}]`;
        if (!isObj(s)) return errors.push(`${sw} must be an object.`);
        if (!isText(s.label)) errors.push(`${sw} is missing a "label".`);
        if (s.url !== undefined && !(isText(s.url) && /^https?:\/\//.test(s.url))) {
          errors.push(`${sw} has a "url" that doesn't start with https:// or http://.`);
        }
        if (!SOURCE_STATUSES.includes(s.status)) {
          errors.push(`${sw} "status" must be "verified" or "TODO: VERIFY".`);
        } else if (s.status !== 'verified') {
          warnings.push(`${sw} ("${s.label || 'no label'}") is marked ${s.status}.`);
        }
      });
    };

    const postIds = new Set();
    if (!Array.isArray(c.posts) || c.posts.length === 0) {
      errors.push('posts must be a list with at least 1 post.');
    } else {
      c.posts.forEach((p, i) => {
        const where = `posts[${i}] (${p && isText(p.id) ? `"${p.id}"` : `post ${i + 1}`})`;
        if (!isObj(p)) return errors.push(`${where} must be an object.`);
        if (!isText(p.id)) errors.push(`${where} is missing an "id".`);
        else if (postIds.has(p.id)) errors.push(`${where}: the id "${p.id}" is used twice.`);
        else postIds.add(p.id);
        if (!isObj(p.account) || !isText(p.account.name) || !isText(p.account.handle)) {
          errors.push(`${where} needs "account" with a "name" and a "handle".`);
        } else {
          if (p.account.avatar !== undefined && !isText(p.account.avatar)) errors.push(`${where} account "avatar" must be a file path like "assets/avatars/lake.webp".`);
          if (p.account.verified !== undefined && typeof p.account.verified !== 'boolean') errors.push(`${where} account "verified" must be true or false.`);
        }
        if (!isText(p.text)) errors.push(`${where} is missing its post "text".`);
        if (!techIds.has(p.answer)) {
          errors.push(`${where} has answer "${p.answer}", which isn't a technique id. Use one of: ${[...techIds].join(', ')}.`);
        }
        if (!isText(p.explanation)) errors.push(`${where} is missing an "explanation".`);
        if (!isText(p.fact)) errors.push(`${where} is missing a "fact".`);
        if (p.topic !== undefined && !isText(p.topic)) errors.push(`${where} "topic" must be a short word like "gsl".`);
        if (p.side !== undefined && !SIDES.includes(p.side)) errors.push(`${where} "side" can only be "alarmist".`);
        for (const key of ['likes', 'shares', 'replies']) {
          if (p[key] !== undefined && !isNum(p[key])) errors.push(`${where} "${key}" must be a number.`);
        }
        if (p.image !== undefined && p.graphic !== undefined) errors.push(`${where} has both "image" and "graphic". Use one.`);
        if (p.image !== undefined) {
          if (!isObj(p.image) || !isText(p.image.src)) errors.push(`${where} "image" needs a "src" file path.`);
          else if (!isText(p.image.alt)) errors.push(`${where} "image" needs "alt" text describing the photo for screen readers.`);
        }
        if (p.graphic !== undefined) {
          const g = p.graphic;
          if (!isObj(g) || !GRAPHIC_FIELDS[g.type]) {
            errors.push(`${where} "graphic" "type" must be one of: ${Object.keys(GRAPHIC_FIELDS).join(', ')}.`);
          } else {
            const missing = GRAPHIC_FIELDS[g.type].filter(k => !isText(g[k]));
            if (missing.length) errors.push(`${where} "${g.type}" graphic is missing: ${missing.join(', ')}.`);
            if (g.mark !== undefined && !(isText(g.mark) && g.mark.length <= 2)) errors.push(`${where} graphic "mark" must be 1 or 2 characters, like "U".`);
          }
        }
        if (p.tell !== undefined) {
          if (!isText(p.tell)) errors.push(`${where} "tell" must be text copied exactly from the post.`);
          else if (isText(p.text) && !tellField(p)) {
            errors.push(`${where} "tell" ("${p.tell}") doesn't appear word-for-word in the post text or its graphic. Copy it exactly, including punctuation.`);
          }
        }
        if (p.alsoFair !== undefined) {
          if (!Array.isArray(p.alsoFair)) errors.push(`${where} "alsoFair" must be a list like [{ "answer": "logical-fallacies", "note": "..." }].`);
          else p.alsoFair.forEach((f, k) => {
            if (!isObj(f) || !techIds.has(f.answer) || f.answer === p.answer) {
              errors.push(`${where} alsoFair[${k}] needs an "answer": a technique id other than the post's own answer.`);
            }
            if (!isObj(f) || !isText(f.note)) errors.push(`${where} alsoFair[${k}] needs a "note" saying why it's fair and what the main trick is.`);
          });
        }
        if (p.whyNot !== undefined) {
          if (!isObj(p.whyNot)) errors.push(`${where} "whyNot" must look like { "logical-fallacies": "Why that pick isn't it." }.`);
          else Object.entries(p.whyNot).forEach(([id, text]) => {
            if (!techIds.has(id) || id === p.answer) errors.push(`${where} whyNot "${id}" must be a technique id other than the post's own answer.`);
            if (!isText(text)) errors.push(`${where} whyNot "${id}" must be text.`);
          });
        }
        checkSources(p.sources, where);

        if (p.reply !== undefined) {
          const r = p.reply;
          if (!isObj(r) || !isText(r.prompt) || !Array.isArray(r.options) || r.options.length < 2) {
            errors.push(`${where} "reply" needs a "prompt" and at least 2 "options".`);
          } else {
            r.options.forEach((o, k) => {
              if (!isObj(o) || !isText(o.text) || !isText(o.feedback)) {
                errors.push(`${where} reply option ${k + 1} needs "text" and "feedback".`);
                return;
              }
              if (o.reaction !== undefined && !isText(o.reaction)) errors.push(`${where} reply option ${k + 1} "reaction" must be text.`);
              if (o.points !== undefined && !(isNum(o.points) && o.points >= 0 && o.points <= replyMax)) {
                errors.push(`${where} reply option ${k + 1} "points" must be a number from 0 to ${replyMax}.`);
              }
            });
            const scores = r.options.filter(isObj).map(o => optionPoints(o, replyMax));
            const top = Math.max(...scores);
            if (!(top > 0)) errors.push(`${where} reply needs one option worth points (use "points" or "best": true).`);
            else if (scores.filter(s => s === top).length !== 1) errors.push(`${where} reply has more than one top-scoring option. Exactly one draft should be the best.`);
          }
        }

        if (wordCount(p.explanation) > MAX_EXPLANATION_WORDS) {
          warnings.push(`${where} explanation is ${wordCount(p.explanation)} words (aim for ${MAX_EXPLANATION_WORDS} or fewer).`);
        }
        if (wordCount(p.fact) > MAX_FACT_WORDS) {
          warnings.push(`${where} fact is ${wordCount(p.fact)} words (aim for ${MAX_FACT_WORDS} or fewer).`);
        }
        if (wordCount(p.text) > MAX_POST_WORDS) {
          warnings.push(`${where} post text is ${wordCount(p.text)} words (aim for ${MAX_POST_WORDS} or fewer).`);
        }
      });
    }

    if (!Array.isArray(c.ranks) || c.ranks.length === 0) {
      errors.push('ranks must be a list with at least 1 entry.');
    } else {
      c.ranks.forEach((r, i) => {
        const where = `ranks[${i}]`;
        if (!isObj(r)) return errors.push(`${where} must be an object.`);
        if (!isNum(r.min) || r.min < 0 || r.min > 100) errors.push(`${where} "min" must be a percent from 0 to 100.`);
        if (!isText(r.label)) errors.push(`${where} is missing a "label".`);
        if (r.short !== undefined && !isText(r.short)) errors.push(`${where} "short" must be text: a shorter label for the in-game meter.`);
        if (r.color !== undefined && !/^#[0-9a-f]{6}$/i.test(r.color)) errors.push(`${where} "color" must look like "#00e400".`);
      });
      if (!c.ranks.some(r => r && r.min === 0)) errors.push('ranks needs one entry with "min": 0 so every score gets a rating.');
    }

    if (c.about !== undefined && isObj(c.about)) {
      if (c.about.research !== undefined) checkSources(c.about.research, 'about.research');
      if (c.about.photos !== undefined) {
        if (!Array.isArray(c.about.photos)) errors.push('about.photos must be a list.');
        else c.about.photos.forEach((ph, i) => {
          if (!isObj(ph) || !isText(ph.title) || !isText(ph.license)) errors.push(`about.photos[${i}] needs a "title" and a "license".`);
        });
      }
    }

    if (c.round !== undefined) {
      if (!isObj(c.round)) errors.push('round must be an object like { "size": 10, "legit": 2, "replies": 2 }.');
      else {
        for (const key of ['size', 'legit', 'replies', 'alarmist', 'maxPerTopic']) {
          const v = c.round[key];
          if (v !== undefined && !(Number.isInteger(v) && v >= 0)) errors.push(`round.${key} must be a whole number 0 or higher.`);
        }
      }
    }

    // Only simulate rounds once the posts themselves are sound.
    if (!errors.length) {
      const stats = simulateRounds(c);
      if (stats.problems.length) errors.push(...stats.problems);
      else {
        if (stats.averageMinutes > TARGET_MINUTES) {
          warnings.push(`An average round takes about ${stats.averageMinutes.toFixed(1)} minutes, over the ${TARGET_MINUTES}-minute target. Shorten some posts or lower round.size.`);
        }
        if (stats.longestMinutes > TARGET_MINUTES + 0.5) {
          warnings.push(`The longest possible round takes about ${stats.longestMinutes.toFixed(1)} minutes. Shorten the wordiest posts or reply drafts.`);
        }
      }
      bankStats = stats;
    }

    return { errors, warnings };
  }

  // Draws many rounds to prove the bank can meet the round rules, and measures coverage and play time.
  function simulateRounds(c) {
    const cfg = roundConfig(c);
    const problems = [];
    if (cfg) {
      const tricks = c.techniques.map(t => t.id).filter(id => id !== LEGIT_ID);
      const replyPosts = c.posts.filter(p => p.reply && p.answer !== LEGIT_ID).length;
      const legitPosts = c.posts.filter(p => p.answer === LEGIT_ID && !p.reply).length;
      const alarmistPosts = c.posts.filter(p => p.side === 'alarmist').length;
      if (cfg.size > c.posts.length) problems.push(`round.size is ${cfg.size}, but the bank only has ${c.posts.length} posts.`);
      const posts = n => `${n} post${n === 1 ? '' : 's'}`;
      if (replyPosts < cfg.replies) problems.push(`round.replies is ${cfg.replies}, but only ${posts(replyPosts)} in the bank have a "reply" step.`);
      if (legitPosts < cfg.legit) problems.push(`round.legit is ${cfg.legit}, but only ${posts(legitPosts)} in the bank are "legit" (without a reply step).`);
      if (alarmistPosts < cfg.alarmist) problems.push(`round.alarmist is ${cfg.alarmist}, but only ${posts(alarmistPosts)} in the bank have "side": "alarmist".`);
      tricks.forEach(id => {
        if (!c.posts.some(p => p.answer === id)) problems.push(`No post in the bank uses "${id}", so rounds can't include every trick.`);
      });
    }
    const appearances = Object.fromEntries(c.posts.map(p => [p.id, 0]));
    let total = 0;
    let longest = 0;
    let failed = 0;
    const rounds = cfg ? SIMULATED_ROUNDS : 1;
    if (!problems.length) {
      for (let i = 0; i < rounds; i++) {
        const posts = drawRound(c, `SIM${i}`);
        if (!posts) { failed++; continue; }
        posts.forEach(p => { appearances[p.id]++; });
        const minutes = estimateMinutes(c, posts);
        total += minutes;
        longest = Math.max(longest, minutes);
      }
      if (failed) {
        problems.push(`${failed} of ${rounds} test rounds couldn't meet the round rules (check round.maxPerTopic and the mix of topics, legit posts, and reply posts).`);
      }
    }
    const done = rounds - failed;
    return {
      problems,
      rounds,
      averageMinutes: done ? total / done : 0,
      longestMinutes: longest,
      appearances: Object.fromEntries(Object.entries(appearances).map(([id, n]) => [id, done ? n / done : 0])),
    };
  }

  // Everything a careful player reads once in a round, at READING_WPM, plus time to decide and click.
  function estimateMinutes(c, posts) {
    let words = wordCount(c.meta.intro) + c.techniques.reduce((n, t) => n + wordCount(t.name) + wordCount(t.hint), 0);
    let decisions = 0;
    for (const p of posts) {
      words += wordCount(p.text) + wordCount(p.explanation) + wordCount(p.fact);
      if (p.graphic) words += wordCount(p.graphic.quote) + wordCount(p.graphic.caption) + wordCount(p.graphic.headline);
      decisions += 1;
      if (p.reply) {
        words += wordCount(p.reply.prompt) + p.reply.options.reduce((n, o) => n + wordCount(o.text), 0)
          + Math.max(...p.reply.options.map(o => wordCount(o.feedback) + wordCount(o.reaction)));
        decisions += 1;
      }
    }
    const seconds = (words / READING_WPM) * 60 + decisions * (SECONDS_PER_DECISION + SECONDS_PER_CLICK) + SECONDS_PER_CLICK;
    return seconds / 60;
  }

  /* ---------- scoring ---------- */

  function points() {
    const s = content.scoring || {};
    return {
      technique: s.techniquePoints ?? 100,
      alsoFair: s.alsoFairPoints ?? 50,
      reply: s.replyPoints ?? 50,
    };
  }

  function bestReplyPoints(post) {
    return Math.max(...post.reply.options.map(o => optionPoints(o, points().reply)));
  }

  function maxScore() {
    const p = points();
    return state.posts.reduce((sum, post) => sum + p.technique + (post.reply ? bestReplyPoints(post) : 0), 0) || 1;
  }

  // Best rating first: Good, Moderate, ... Hazardous.
  function sortedRanks() {
    return [...content.ranks].sort((a, b) => b.min - a.min);
  }

  function rankFor(score) {
    const pct = (score / maxScore()) * 100;
    const ranks = sortedRanks();
    return ranks.find(r => pct >= r.min) || ranks[ranks.length - 1];
  }

  // Marker position on the AQI meter, 0 (best, left) to 1 (worst, right), inside the current rating's segment.
  function meterPosition(score) {
    const pct = (score / maxScore()) * 100;
    const ranks = sortedRanks();
    let i = ranks.findIndex(r => pct >= r.min);
    if (i === -1) i = ranks.length - 1;
    const upper = i === 0 ? 100 : ranks[i - 1].min;
    const lower = ranks[i].min;
    const frac = upper === lower ? 0.5 : (upper - pct) / (upper - lower);
    return (i + Math.min(0.92, Math.max(0.08, frac))) / ranks.length;
  }

  function setHaze(level) {
    document.documentElement.style.setProperty('--haze', Math.max(0, Math.min(1, level)).toFixed(3));
  }

  function meter() {
    const ranks = sortedRanks();
    return h('div', { class: 'meter', 'aria-hidden': 'true' },
      ranks.map(r => h('span', { class: 'meter-seg', style: `background:${r.color || '#c9d1d8'}` })),
      h('span', { class: 'meter-marker' }));
  }

  function roundProgress() {
    return h('div', { class: 'round-progress', role: 'progressbar', 'aria-label': 'Posts checked', 'aria-valuemin': 0, 'aria-valuemax': state.posts.length, 'aria-valuenow': 0 },
      state.posts.map((_, i) => h('span', { 'data-step': i, 'aria-hidden': 'true' })));
  }

  function updateHud() {
    const total = state.posts.length;
    const rank = rankFor(state.score);
    const color = rank.color || '#dddddd';
    const set = (key, value) => document.querySelectorAll(`[data-hud="${key}"]`).forEach(el => { el.textContent = value; });
    set('level', rank.short || rank.label);
    set('progress', `Post ${Math.min(state.index + 1, total)} of ${total}`);
    set('score', `${state.score} pts`);
    document.querySelectorAll('.round-progress').forEach(bar => {
      bar.setAttribute('aria-valuenow', state.answers.length);
      bar.querySelectorAll('[data-step]').forEach((step, i) => {
        const a = state.answers[i];
        step.dataset.state = a ? (a.correct ? 'right' : a.partial ? 'partial' : 'wrong') : i === state.index ? 'current' : 'waiting';
      });
    });
    document.querySelectorAll('[data-hud="chip"]').forEach(el => {
      el.textContent = rank.short || rank.label;
      el.style.background = color;
      el.style.color = textColorOn(color);
    });
    document.documentElement.style.setProperty('--pos', meterPosition(state.score).toFixed(4));
    document.querySelectorAll('[data-guide]').forEach(li => {
      const caught = state.answers.some(a => a.answer === li.dataset.guide && a.correct);
      li.classList.toggle('is-earned', caught);
      const mark = li.querySelector('.guide-caught');
      if (mark) mark.textContent = caught ? 'Caught' : '';
    });
    setHaze(1 - state.score / maxScore());
  }

  /* ---------- feed pieces ---------- */

  function avatarFor(account, size) {
    const style = size ? `width:${size}px;height:${size}px` : null;
    if (account.avatar) return h('img', { class: 'avatar', src: account.avatar, alt: '', width: 44, height: 44, loading: 'lazy', style });
    const initials = account.initials || account.name.replace(/[^\p{L}\s]/gu, '').trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
    return h('span', { class: 'avatar avatar-letter', 'aria-hidden': 'true', style: `background:${avatarColor(account.handle)};${style || ''}` }, initials);
  }

  function tellLabel(post) {
    if (post.tellNote) return post.tellNote;
    return post.answer === LEGIT_ID ? 'Good sign' : `Tell · ${techById[post.answer].name}`;
  }

  // A string with #hashtags styled; when the tell is revealed and appears in it, the tell is marked and labeled.
  function richText(text, post, reveal) {
    const parts = [];
    const pushText = s => s.split(/(#[\p{L}\p{N}_]+)/u).forEach((seg, i) => {
      if (seg) parts.push(i % 2 ? h('span', { class: 'tag' }, seg) : seg);
    });
    const at = reveal && post.tell ? text.indexOf(post.tell) : -1;
    if (at < 0) {
      pushText(text);
      return parts;
    }
    const good = post.answer === LEGIT_ID;
    pushText(text.slice(0, at));
    parts.push(h('mark', { class: `tell ${good ? 'is-good' : ''}` }, post.tell));
    parts.push(h('span', { class: `tell-tag ${good ? 'is-good' : ''}` }, tellLabel(post)));
    pushText(text.slice(at + post.tell.length));
    return parts;
  }

  function postImage(image) {
    return h('figure', { class: 'post-media' },
      h('img', { src: image.src, alt: image.alt, loading: 'lazy', decoding: 'async', width: 960, height: 640 }),
      image.credit ? h('figcaption', {}, image.credit) : null);
  }

  function rankColorFor(label) {
    const match = content.ranks.find(r => r.label.toLowerCase() === String(label).toLowerCase());
    return (match && match.color) || '#c9d1d8';
  }

  // Graphics are drawn in HTML. Their visible text is aria-hidden; the wrapper's label carries it for screen readers.
  function postGraphic(post, reveal) {
    const g = post.graphic;
    const txt = value => richText(value, post, reveal);
    if (g.type === 'quote') {
      return h('div', { class: 'graphic g-quote', role: 'img', 'aria-label': `Quote graphic: "${g.quote}" ${g.attribution}` },
        h('span', { class: 'g-quote-mark', 'aria-hidden': 'true' }, '“'),
        h('p', { class: 'g-quote-text', 'aria-hidden': 'true' }, txt(g.quote)),
        h('p', { class: 'g-quote-by', 'aria-hidden': 'true' }, '— ', txt(g.attribution)));
    }
    if (g.type === 'forecast') {
      return h('div', { class: 'graphic g-forecast', role: 'img', 'aria-label': `Weather app screenshot: ${g.place}, ${g.day}, ${g.amount}. ${g.detail || ''}` },
        h('div', { class: 'g-forecast-top', 'aria-hidden': 'true' },
          h('span', { class: 'g-forecast-place' }, g.place), h('span', { class: 'g-forecast-day' }, g.day)),
        h('div', { class: 'g-forecast-main', 'aria-hidden': 'true' },
          icon('snow'), h('span', { class: 'g-forecast-amount' }, g.amount)),
        g.detail ? h('p', { class: 'g-forecast-detail', 'aria-hidden': 'true' }, txt(g.detail)) : null,
        g.note ? h('p', { class: 'g-forecast-note', 'aria-hidden': 'true' }, g.note) : null);
    }
    if (g.type === 'link') {
      // The band shows the outlet's initial, like a site icon, unless content.json gives a "mark".
      const mark = g.mark || (g.outlet.replace(/^the\s+/i, '').match(/[\p{L}\p{N}]/u) || [''])[0].toUpperCase();
      return h('div', { class: 'graphic g-link', role: 'img', 'aria-label': `Shared article from ${g.outlet}: ${g.headline}` },
        h('div', { class: 'g-link-band', 'aria-hidden': 'true' },
          h('span', { class: 'g-link-mark' }, mark)),
        h('div', { class: 'g-link-body', 'aria-hidden': 'true' },
          h('p', { class: 'g-link-outlet' }, txt(g.outlet)),
          h('p', { class: 'g-link-headline' }, txt(g.headline)),
          g.blurb ? h('p', { class: 'g-link-blurb' }, g.blurb) : null));
    }
    if (g.type === 'aqi') {
      const color = g.color || rankColorFor(g.category);
      return h('div', { class: 'graphic g-aqi', role: 'img', 'aria-label': `Air quality app screenshot: ${g.place}, AQI ${g.value}, ${g.category}. ${g.detail || ''}` },
        h('div', { class: 'g-aqi-top', 'aria-hidden': 'true' }, h('span', {}, g.place), h('span', {}, g.time || 'Now')),
        h('div', { class: 'g-aqi-main', 'aria-hidden': 'true' },
          h('span', { class: 'g-aqi-value' }, g.value),
          h('span', { class: 'g-aqi-category', style: `background:${color};color:${textColorOn(color)}` }, g.category)),
        g.detail ? h('p', { class: 'g-aqi-detail', 'aria-hidden': 'true' }, txt(g.detail)) : null);
    }
    const share = parseFloat(g.value);
    const filled = Number.isFinite(share) && share <= 100 ? Math.round(share / 5) : 0;
    return h('div', { class: 'graphic g-stat', role: 'img', 'aria-label': `Infographic: ${g.value} ${g.caption}. ${g.source ? `Source: ${g.source}.` : ''}` },
      h('p', { class: 'g-stat-value', 'aria-hidden': 'true' }, g.value),
      h('p', { class: 'g-stat-caption', 'aria-hidden': 'true' }, txt(g.caption)),
      filled ? h('div', { class: 'g-stat-drops', 'aria-hidden': 'true' },
        Array.from({ length: 20 }, (_, i) => icon('drop', i < filled ? '' : 'is-empty'))) : null,
      g.source ? h('p', { class: 'g-stat-source', 'aria-hidden': 'true' }, `Source: ${g.source}`) : null);
  }

  function postActions(post) {
    const likes = post.likes || 0;
    const shares = post.shares || 0;
    const replies = post.replies ?? Math.round(likes * 0.07);
    const action = (name, count) => h('span', { class: 'post-action', 'aria-hidden': 'true' }, icon(name), count);
    return h('div', { class: 'post-actions' },
      h('span', { class: 'visually-hidden' }, `${formatCount(replies)} replies, ${formatCount(shares)} reposts, ${formatCount(likes)} likes`),
      action('reply', formatCount(replies)),
      action('repost', formatCount(shares)),
      action('heart', formatCount(likes)),
      action('share', ''));
  }

  function postCard(post, n) {
    const a = post.account;
    const total = state.posts.length;
    return h('article', { class: 'post', id: `post-${n}`, 'aria-labelledby': `post-${n}-title` },
      h('h2', { class: 'visually-hidden', id: `post-${n}-title`, tabindex: '-1' }, `Post ${n} of ${total}, by ${a.name}`),
      a.relation ? h('p', { class: 'post-relation' }, icon('people'), `${a.relation} shared this`) : null,
      h('div', { class: 'post-head' },
        avatarFor(a),
        h('div', { class: 'post-who' },
          h('span', { class: 'post-name' }, a.name,
            a.verified ? [icon('verified', 'verified'), h('span', { class: 'visually-hidden' }, ' (verified account)')] : null),
          h('span', { class: 'post-handle' }, [a.handle, post.time].filter(Boolean).join(' · '))),
        icon('more', 'post-more')),
      h('p', { class: 'post-text' }, richText(post.text, post, false)),
      post.image ? postImage(post.image) : post.graphic ? postGraphic(post, false) : null,
      postActions(post));
  }

  function choiceButton(index, name, hint, iconName, isLegit, onPick) {
    return h('button', { class: 'choice', type: 'button', onclick: onPick },
      iconName ? h('span', { class: `choice-icon ${isLegit ? 'is-legit' : ''}` }, icon(iconName)) : null,
      h('span', { class: 'choice-text' },
        h('span', { class: 'choice-name' }, name),
        hint ? h('span', { class: 'visually-hidden' }, `. ${hint}`) : null),
      h('span', { class: 'choice-key', 'aria-hidden': 'true' }, String(index + 1)),
      h('span', { class: 'choice-mark', 'aria-hidden': 'true' }));
  }

  // kind: 'right' | 'partial' | 'wrong'
  function markChoice(button, kind, srText) {
    button.classList.add(`is-${kind}`);
    button.querySelector('.choice-mark').replaceChildren(icon(kind === 'wrong' ? 'cross' : 'tick'));
    button.append(h('span', { class: 'visually-hidden' }, ` (${srText})`));
  }

  function lockChoices(group) {
    group.classList.add('is-locked');
    group.querySelectorAll('button').forEach(b => { b.disabled = true; });
  }

  function sourceChips(sources) {
    return h('ul', { class: 'chips', 'aria-label': 'Sources' }, sources.map(s => {
      const text = [s.publisher || s.label, s.year].filter(Boolean).join(', ');
      return h('li', {}, s.url
        ? h('a', { class: 'chip', href: s.url, target: '_blank', rel: 'noopener', title: s.label },
          h('span', {}, text), icon('external'), h('span', { class: 'visually-hidden' }, ` (${s.label}, opens in a new tab)`))
        : h('span', { class: 'chip', title: s.label }, h('span', {}, text)));
    }));
  }

  function nextLabel() {
    return state.index === state.posts.length - 1 ? 'See your air quality report' : 'Next post';
  }

  function roundLink(code) {
    return `${location.origin}${location.pathname}?round=${encodeURIComponent(code)}`;
  }

  /* ---------- screens ---------- */

  function urlRoundCode() {
    return cleanCode(new URLSearchParams(location.search).get('round'));
  }

  function wordmark() {
    return h('p', { class: 'site-wordmark' }, content.meta.title, h('span', { 'aria-hidden': 'true' }, '.'));
  }

  function fieldGuide() {
    return h('details', { class: 'field-guide' },
      h('summary', {}, icon('cap'), 'Field guide'),
      h('ul', { class: 'guide' }, content.techniques.map(t => h('li', { 'data-guide': t.id },
        h('span', { class: 'trick-icon' }, icon(techIcon(t))),
        h('span', { class: 'guide-text' }, h('strong', {}, t.name), h('span', {}, t.hint)),
        h('span', { class: 'guide-caught' })))));
  }

  function renderIntro() {
    setHaze(1);
    const meta = content.meta;
    const tricks = content.techniques.filter(t => t.id !== LEGIT_ID);
    const classCode = urlRoundCode();
    const cfg = roundConfig(content);
    const roundSize = cfg ? cfg.size : content.posts.length;
    const replySteps = cfg ? cfg.replies : content.posts.filter(p => p.reply).length;
    const replyNote = replySteps === 1 ? ' One post also asks you to choose a helpful reply.'
      : replySteps > 1 ? ` ${COUNT_WORDS[replySteps] || replySteps} posts also ask you to choose a helpful reply.` : '';
    const title = h('h1', { class: 'cover-title', tabindex: '-1' }, 'See through', h('span', {}, 'the noise.'));
    screen('intro', h('div', { class: 'cover' },
      h('header', { class: 'cover-header' }, wordmark(),
        meta.course ? h('p', { class: 'course-credit' }, meta.course) : null),
      h('div', { class: 'cover-top' },
        h('p', { class: 'scene-location' }, icon('basin'), 'Salt Lake Valley'),
        title,
        h('p', { class: 'cover-subtitle' }, meta.subtitle),
        h('p', { class: 'cover-description' }, 'A familiar feed. A few hidden tricks. Catch the misinformation and clear the valley.'),
        h('div', { class: 'cover-actions' },
          h('button', { class: 'btn btn-primary btn-lg', type: 'button', onclick: () => startGame(classCode || newRoundCode()) }, 'Open the feed', icon('arrow')),
          h('span', { class: 'cover-time' }, `${roundSize} posts · about 5 minutes`)),
        classCode ? h('p', { class: 'cover-round' }, h('span', {}, 'Class round'), h('span', { class: 'round-code' }, classCode),
          h('span', {}, 'Same link, same posts.')) : null),
      h('section', { class: 'cover-panel', 'aria-label': 'How to play' },
        h('p', { class: 'label' }, 'Before you scroll'),
        h('h2', { class: 'cover-lede' }, 'Can you spot the trick?'),
        meta.intro ? h('p', { class: 'cover-intro' }, meta.intro) : null,
        h('h2', { class: 'label' }, `${tricks.length} tricks to catch`),
        h('ul', { class: 'trick-grid' }, tricks.map(t => h('li', { class: 'trick' },
          h('span', { class: 'trick-icon' }, icon(techIcon(t))),
          h('span', { class: 'trick-text' }, h('strong', {}, t.name), h('span', {}, t.hint))))),
        techById[LEGIT_ID] ? h('p', { class: 'cover-note' }, icon('check'),
          h('span', {}, h('strong', {}, 'Some posts are legit. '), 'Skepticism means checking, not rejecting everything.')) : null,
        h('p', { class: 'cover-scoring' }, `Each correct answer earns points and lifts the haze.${replyNote}`)),
      h('footer', { class: 'cover-footer' },
        h('p', { class: 'fine' },
          meta.privacy ? `${meta.privacy} ` : '',
          h('button', { class: 'link-button', type: 'button', onclick: () => renderSources(renderIntro) }, 'Sources and photo credits')))
    ));
    focusOn(title);
  }

  function startGame(code) {
    const posts = drawRound(content, code);
    if (!posts) {
      showError(['This round couldn\'t be drawn from the post bank. Open the game with ?review to see what to fix.']);
      return;
    }
    const replyOrder = {};
    posts.filter(p => p.reply).forEach(p => {
      replyOrder[p.id] = shuffle(p.reply.options.map((_, i) => i), seededRandom(`${code}:reply:${p.id}`));
    });
    state = { code, posts, replyOrder, index: 0, score: 0, answers: [] };
    renderPlay();
    appendPost();
  }

  function renderPlay() {
    screen('play', h('div', { class: 'play' },
      h('aside', { class: 'status', 'aria-label': 'Game status' },
        wordmark(),
        h('p', { class: 'scene-location' }, icon('basin'), 'Salt Lake Valley'),
        h('h1', { class: 'status-title' }, 'See through', h('span', {}, 'the noise.')),
        h('p', { class: 'status-description' }, 'Catch the trick. Check the facts. Clear the valley.'),
        h('div', { class: 'status-card' },
          h('div', { class: 'status-air' }, h('p', { class: 'label' }, "Your feed’s air"),
            h('p', { class: 'air-level', 'data-hud': 'level' })),
          meter(),
          h('div', { class: 'meter-ends', 'aria-hidden': 'true' }, h('span', {}, 'Clear'), h('span', {}, 'Socked in')),
          h('p', { class: 'status-meta' }, h('span', { 'data-hud': 'progress' }), h('span', { 'data-hud': 'score' })),
          roundProgress(),
          h('p', { class: 'status-note' }, 'Your points lift the haze. This is your game score.'),
          h('p', { class: 'status-round' }, 'Round ', h('span', { class: 'round-code' }, state.code))),
        fieldGuide()),
      h('div', { class: 'device' },
        h('div', { class: 'app', id: 'app-scroll' },
          h('header', { class: 'appbar' },
            h('div', { class: 'appbar-row' },
              h('span', { class: 'logo' }, icon('basin'), 'basin'),
              h('span', { class: 'appbar-place' }, 'Salt Lake Valley'),
              h('span', { class: 'appbar-progress', 'data-hud': 'progress' })),
            h('div', { class: 'appbar-sub' },
              roundProgress(), h('span', { class: 'appbar-score', 'data-hud': 'score' }))),
          h('main', { class: 'feed', id: 'feed', 'aria-label': 'Feed' })))
    ));
  }

  function currentPost() {
    return state.posts[state.index];
  }

  function currentArticle() {
    return document.getElementById(`post-${state.index + 1}`);
  }

  function appendPost() {
    const post = currentPost();
    const n = state.index + 1;
    const article = postCard(post, n);
    article.append(h('section', { class: 'sheet', 'aria-labelledby': `sheet-${n}` },
      h('h3', { class: 'sheet-title', id: `sheet-${n}` }, "What's the trick?"),
      h('p', { class: 'sheet-help' }, 'Some posts are accurate. Look at the reasoning.', h('span', { class: 'key-tip' }, ` Keys 1–${content.techniques.length} pick; Enter moves on.`)),
      h('div', { class: 'choices', role: 'group', 'aria-labelledby': `sheet-${n}` },
        content.techniques.map((t, i) => choiceButton(i, t.name, t.hint, techIcon(t), t.id === LEGIT_ID, () => answerPost(t.id))))));
    document.getElementById('feed').replaceChildren(article);
    updateHud();
    if (n > 1) scrollPostIntoView(article);
    focusOn(article.querySelector('h2'));
  }

  // Puts the post's top edge just below the sticky app bar. (Scrolling the bar itself does nothing
  // once it's stuck, which left the author and text hidden under it.)
  function scrollPostIntoView(article) {
    const bar = document.querySelector('.appbar');
    const top = article.getBoundingClientRect().top + window.scrollY - (bar ? bar.offsetHeight : 0);
    window.scrollTo({ top: Math.max(0, top), behavior: reducedMotion.matches ? 'auto' : 'smooth' });
  }

  // Why the player's wrong pick isn't it: the post's own line for that pick, else what that trick needs.
  function whyNot(post, pickedId) {
    return (post.whyNot && post.whyNot[pickedId]) || techById[pickedId].notThis || '';
  }

  function revealTell(post, article) {
    const where = tellField(post);
    if (where === 'text') article.querySelector('.post-text').replaceChildren(...richText(post.text, post, true));
    else if (where) article.querySelector('.graphic').replaceWith(postGraphic(post, true));
  }

  function answerPost(pickedId) {
    const post = currentPost();
    const article = currentArticle();
    const group = article.querySelector('.sheet .choices');
    if (!group || group.classList.contains('is-locked')) return;
    const correct = pickedId === post.answer;
    // A defensible second reading ("alsoFair") earns partial credit and a note naming the main trick.
    const fair = correct ? null : (post.alsoFair || []).find(f => f.answer === pickedId);
    const earned = correct ? points().technique : fair ? points().alsoFair : 0;
    const kind = correct ? 'right' : fair ? 'partial' : 'wrong';
    state.score += earned;
    state.answers.push({ postId: post.id, answer: post.answer, picked: pickedId, correct, partial: !!fair, replyPoints: null, replyBest: null });

    lockChoices(group);
    group.querySelectorAll('button').forEach((button, i) => {
      const id = content.techniques[i].id;
      if (id === post.answer) markChoice(button, 'right', correct ? 'your answer, correct' : 'correct answer');
      else if (id === pickedId) markChoice(button, kind, fair ? 'your answer, partly right' : 'your answer');
    });
    revealTell(post, article);
    article.classList.add(correct ? 'answered-right' : 'answered-wrong');
    updateHud();

    const tech = techById[post.answer];
    const n = state.index + 1;
    const outcome = h('h3', { class: 'note-status-title', id: `note-${n}`, tabindex: '-1' }, { right: 'Correct!', partial: 'Partly right', wrong: 'Not quite' }[kind]);
    const verdict = h('h4', { class: 'note-verdict' },
      h('span', { class: `choice-icon ${post.answer === LEGIT_ID ? 'is-legit' : ''}` }, icon(techIcon(tech))),
      tech.name);
    const result = {
      right: post.answer === LEGIT_ID ? 'You checked the facts.' : 'You spotted the trick.',
      partial: 'Fair read, but there’s a bigger trick.',
      wrong: 'Here’s what to look for.',
    }[kind];
    article.querySelector('.sheet').replaceWith(h('section', { class: `note is-${kind}`, 'aria-labelledby': `note-${n}` },
      h('div', { class: 'note-head' },
        h('span', { class: 'outcome-icon', 'aria-hidden': 'true' }, icon(kind === 'wrong' ? 'cross' : 'tick')),
        h('div', {}, outcome, h('p', { class: 'note-result' }, result)),
        h('span', { class: 'note-points' }, earned ? `+${earned} points` : '0 points')),
      h('div', { class: 'note-body' },
        verdict,
        fair ? h('p', {}, h('strong', {}, `${techById[pickedId].name} is fair. `), fair.note)
          : correct ? null : h('p', { class: 'note-picked' }, `You picked ${techById[pickedId].name}. `, whyNot(post, pickedId)),
        post.tell ? h('p', { class: 'note-tell' }, h('span', { class: 'label' }, post.answer === LEGIT_ID ? 'Good sign' : 'The tell'), ` “${post.tell}”`) : null,
        h('p', {}, post.explanation),
        h('div', { class: 'note-facts' }, h('span', { class: 'label' }, 'The facts'), h('p', {}, post.fact)),
        sourceChips(post.sources),
        h('button', { class: 'btn btn-primary btn-block', type: 'button', onclick: post.reply ? openComposer : nextPost },
          post.reply ? `Reply to ${post.account.name}` : nextLabel(), icon('arrow')))));
    focusOn(outcome, true);
    announce(`${{ right: 'Correct', partial: 'Partly right', wrong: 'Not quite' }[kind]}${earned ? `, plus ${earned} points` : ''}. Air quality: ${rankFor(state.score).label}.`);
  }

  function openComposer() {
    const post = currentPost();
    const article = currentArticle();
    const n = state.index + 1;
    const order = state.replyOrder[post.id];
    article.querySelector('.note .btn').remove();
    const prompt = h('h3', { class: 'composer-prompt', id: `composer-${n}`, tabindex: '-1' }, post.reply.prompt);
    article.append(h('section', { class: 'composer', 'aria-labelledby': `composer-${n}` },
      h('p', { class: 'composer-to' }, 'Replying to ', h('span', { class: 'composer-handle' }, post.account.handle)),
      prompt,
      h('p', { class: 'sheet-help' }, 'Pick a draft to send.', h('span', { class: 'key-tip' }, ` Keys 1–${order.length} work too.`)),
      h('div', { class: 'choices drafts', role: 'group', 'aria-labelledby': `composer-${n}` },
        order.map((optionIndex, i) => choiceButton(i, post.reply.options[optionIndex].text, null, null, false, () => answerReply(optionIndex)))),
      h('div', { class: 'thread' })));
    focusOn(prompt, true);
  }

  function answerReply(pickedIndex) {
    const post = currentPost();
    const article = currentArticle();
    const group = article.querySelector('.composer .choices');
    if (!group || group.classList.contains('is-locked')) return;
    const max = points().reply;
    const options = post.reply.options;
    const top = bestReplyPoints(post);
    const best = options.find(o => optionPoints(o, max) === top);
    const picked = options[pickedIndex];
    const earned = optionPoints(picked, max);
    const kind = earned === top ? 'right' : earned > 0 ? 'partial' : 'wrong';
    state.score += earned;
    Object.assign(state.answers[state.answers.length - 1], { replyPoints: earned, replyBest: kind === 'right' });

    lockChoices(group);
    const order = state.replyOrder[post.id];
    group.querySelectorAll('button').forEach((button, i) => {
      const option = options[order[i]];
      if (option === best) markChoice(button, 'right', kind === 'right' ? 'your reply, the best one' : 'best reply');
      else if (order[i] === pickedIndex) markChoice(button, kind, kind === 'partial' ? 'your reply, partly right' : 'your reply');
    });
    updateHud();

    group.hidden = true;
    article.querySelector('.composer .sheet-help').remove();

    const thread = article.querySelector('.thread');
    thread.append(h('p', { class: 'bubble bubble-you' }, picked.text));

    const n = state.index + 1;
    const headline = { right: 'Great reply!', partial: 'A useful start', wrong: 'Try a different approach' }[kind];
    const result = { right: 'You chose the most helpful reply.', partial: 'There’s a stronger way to make the point.', wrong: 'Here’s a more helpful way to respond.' }[kind];
    const finish = () => {
      thread.querySelector('.typing')?.remove();
      if (picked.reaction) {
        thread.append(h('div', { class: 'bubble bubble-them' }, avatarFor(post.account, 28),
          h('p', {}, h('span', { class: 'visually-hidden' }, `${post.account.name} replied: `), picked.reaction)));
      }
      const verdict = h('h3', { class: 'note-status-title', id: `reply-note-${n}`, tabindex: '-1' }, headline);
      article.querySelector('.composer').append(h('section', { class: `note is-${kind}`, 'aria-labelledby': `reply-note-${n}` },
        h('div', { class: 'note-head' },
          h('span', { class: 'outcome-icon', 'aria-hidden': 'true' }, icon(kind === 'right' ? 'tick' : kind === 'partial' ? 'reply' : 'cross')),
          h('div', {}, verdict, h('p', { class: 'note-result' }, result)),
          h('span', { class: 'note-points' }, `+${earned} points`)),
        h('div', { class: 'note-body' },
          h('p', {}, picked.feedback),
          kind === 'right' ? null : h('div', { class: 'note-facts' }, h('span', { class: 'label' }, 'A stronger reply'), h('p', {}, best.text), h('p', { class: 'reply-rationale' }, best.feedback)),
          h('button', { class: 'btn btn-primary btn-block', type: 'button', onclick: nextPost }, nextLabel(), icon('arrow')))));
      focusOn(verdict, true);
      announce(`${picked.reaction ? `${post.account.name} replied: ${picked.reaction} ` : ''}${headline}. ${earned ? `Plus ${earned} points.` : ''}`);
    };

    if (picked.reaction && !reducedMotion.matches) {
      thread.append(h('p', { class: 'typing' }, `${post.account.name} is typing…`));
      window.setTimeout(finish, REACTION_DELAY_MS);
    } else {
      finish();
    }
  }

  function nextPost() {
    state.index += 1;
    if (state.index >= state.posts.length) renderEnd();
    else appendPost();
  }

  function techniqueResults() {
    return content.techniques
      .map(t => {
        const seen = state.answers.filter(a => a.answer === t.id);
        return { tech: t, total: seen.length, correct: seen.filter(a => a.correct).length };
      })
      .filter(r => r.total > 0);
  }

  function renderEnd() {
    updateHud();
    const max = maxScore();
    const rank = rankFor(state.score);
    const color = rank.color || '#dddddd';
    const total = state.posts.length;
    const spotted = state.answers.filter(a => a.correct).length;
    const replyTotal = state.posts.filter(p => p.reply).length;
    const replyBest = state.answers.filter(a => a.replyBest === true).length;
    const results = techniqueResults();
    const missRate = r => (r.total - r.correct) / r.total;
    const blind = results
      .filter(r => r.correct < r.total)
      .sort((a, b) => missRate(b) - missRate(a) || (b.total - b.correct) - (a.total - a.correct))[0];
    const status = h('p', { class: 'share-status', role: 'status' });
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const heading = h('h1', { class: 'visually-hidden', tabindex: '-1' }, `Air quality report: ${rank.label}`);

    screen('end', h('div', { class: 'report' },
      h('section', { class: 'report-card', 'aria-labelledby': 'report-title' },
        heading,
        h('div', { class: 'report-head' },
          h('span', { class: 'label', id: 'report-title' }, 'Air quality report'),
          h('span', { class: 'report-where' }, `Salt Lake Valley · ${today} · Round ${state.code}`)),
        h('div', { class: 'report-rating', style: `background:${color};color:${textColorOn(color)}`, 'aria-hidden': 'true' },
          h('p', { class: 'report-rating-label' }, "Your feed's air"),
          h('p', { class: 'report-rating-value' }, rank.label)),
        meter(),
        h('div', { class: 'meter-ends', 'aria-hidden': 'true' }, h('span', {}, 'Clear'), h('span', {}, 'Socked in')),
        rank.blurb ? h('p', { class: 'report-blurb' }, rank.blurb) : null,
        h('dl', { class: 'report-stats' },
          h('div', {}, h('dt', {}, 'Score'), h('dd', {}, `${state.score}`, h('small', {}, ` /${max}`))),
          h('div', {}, h('dt', {}, 'Correct answers'), h('dd', {}, `${spotted}`, h('small', {}, ` /${total}`))),
          replyTotal ? h('div', {}, h('dt', {}, 'Best replies'), h('dd', {}, `${replyBest}`, h('small', {}, ` /${replyTotal}`))) : null),
        h('h2', { class: 'label' }, 'Badges'),
        h('ul', { class: 'badges' }, results.map(r => {
          const earned = r.correct === r.total;
          return h('li', { class: `badge ${earned ? '' : 'is-missed'}` },
            h('span', { class: 'badge-icon' }, icon(techIcon(r.tech))),
            h('span', { class: 'badge-name' }, r.tech.name),
            h('span', { class: 'badge-score' }, `${r.correct}/${r.total}${earned ? '' : ' · missed'}`));
        })),
        h('p', { class: 'blind-spot' }, blind
          ? [h('strong', {}, `Blind spot: ${blind.tech.name}. `), `${blind.tech.hint}.`]
          : h('strong', {}, 'No blind spots this round. Clear skies.')),
        missesReview(),
        content.meta.takeaway ? h('div', { class: 'takeaway' },
          h('h2', { class: 'label' }, 'One thing to keep'),
          h('p', {}, content.meta.takeaway)) : null,
        h('div', { class: 'report-actions' },
          h('button', { class: 'btn btn-primary', type: 'button', onclick: playNewRound }, 'Play a new round'),
          h('button', { class: 'btn btn-quiet', type: 'button', onclick: () => shareResult(rank, status) }, icon('share'), 'Share'),
          h('button', { class: 'btn btn-quiet', type: 'button', onclick: () => renderSources(renderEnd) }, 'Sources')),
        h('p', { class: 'report-round' },
          'Same posts for your class: ',
          h('button', { class: 'link-button', type: 'button', onclick: () => copyRoundLink(status) }, `copy the link to round ${state.code}`)),
        status,
        h('p', { class: 'report-foot' }, [content.meta.title, content.meta.course].filter(Boolean).join(' · ')))
    ));
    focusOn(heading);
    announce(`Finished. Your feed's air quality: ${rank.label}. ${state.score} of ${max} points.`);
  }

  // Each post the player didn't fully get: the post, the right answer, the clue, and why.
  function missesReview() {
    const misses = state.answers.map((a, i) => ({ a, post: state.posts[i] })).filter(m => !m.a.correct);
    return h('section', { class: 'misses', 'aria-labelledby': 'misses-title' },
      h('h2', { class: 'label', id: 'misses-title' }, misses.length ? `Review your misses (${misses.length})` : 'Review your misses'),
      misses.length
        ? h('ol', { class: 'miss-list' }, misses.map(({ a, post }) => h('li', { class: `miss ${a.partial ? 'is-partial' : ''}` },
          h('p', { class: 'miss-who' }, avatarFor(post.account, 28), h('strong', {}, post.account.name)),
          h('p', { class: 'miss-text' }, post.text),
          h('p', { class: 'miss-answer' }, `Answer: ${techById[post.answer].name}`,
            h('span', {}, ` · you picked ${techById[a.picked].name}${a.partial ? ' (partly right)' : ''}`)),
          a.partial ? null : h('p', { class: 'miss-why' }, whyNot(post, a.picked)),
          post.tell ? h('p', { class: 'miss-clue' }, h('span', { class: 'label' }, post.answer === LEGIT_ID ? 'Good sign' : 'The clue'), ` “${post.tell}”`) : null,
          h('p', { class: 'miss-why' }, post.explanation))))
        : h('p', { class: 'miss-none' }, 'Nothing to review: you named every post correctly.'));
  }

  // A new round drops any ?round= code from the address so the next draw is fresh.
  function playNewRound() {
    if (urlRoundCode()) history.replaceState(null, '', location.pathname);
    startGame(newRoundCode());
  }

  async function copyText(text, status, success) {
    try {
      await navigator.clipboard.writeText(text);
      status.textContent = success;
    } catch (err) {
      status.textContent = `Copy this: ${text}`;
    }
  }

  function copyRoundLink(status) {
    copyText(roundLink(state.code), status, `Link to round ${state.code} copied. Anyone who opens it gets these same posts.`);
  }

  async function shareResult(rank, status) {
    const url = location.origin + location.pathname;
    const text = `My feed's air quality: ${rank.label} (${state.score}/${maxScore()}) in ${content.meta.title}, a 5-minute game about spotting climate misinformation in Utah.`;
    if (navigator.share) {
      try {
        await navigator.share({ title: content.meta.title, text, url });
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }
    copyText(`${text} ${url}`, status, 'Copied to your clipboard.');
  }

  function sourceList(sources, review) {
    return h('ul', { class: 'source-list' }, sources.map(s => h('li', {},
      review ? h('span', { class: `status-badge ${s.status === 'verified' ? 'is-ok' : 'is-todo'}` }, s.status) : null,
      s.url
        ? h('a', { href: s.url, target: '_blank', rel: 'noopener' }, s.label, h('span', { class: 'visually-hidden' }, ' (opens in a new tab)'))
        : h('span', {}, s.label),
      s.publisher || s.year ? h('span', { class: 'source-pub' }, ` · ${[s.publisher, s.year].filter(Boolean).join(', ')}`) : null,
      review && s.check ? h('span', { class: 'source-check' }, s.check) : null
    )));
  }

  function photoCredits(photos) {
    return h('ul', { class: 'credits' }, photos.map(p => h('li', {},
      p.url ? h('a', { href: p.url, target: '_blank', rel: 'noopener' }, p.title, h('span', { class: 'visually-hidden' }, ' (opens in a new tab)')) : p.title,
      ` by ${p.author || 'unknown'}, `,
      p.licenseUrl ? h('a', { href: p.licenseUrl, target: '_blank', rel: 'noopener' }, p.license) : p.license,
      p.use ? h('span', { class: 'source-pub' }, ` · ${p.use}`) : null)));
  }

  function sourceGroup(post, label) {
    return h('div', { class: 'source-group' },
      h('h2', {}, label),
      h('p', { class: 'source-fact' }, post.fact),
      sourceList(post.sources));
  }

  function renderSources(back) {
    const heading = h('h1', { tabindex: '-1' }, 'Sources and credits');
    const about = content.about || {};
    const inRound = state ? state.posts : [];
    const rest = content.posts.filter(p => !inRound.includes(p));
    screen('page', h('div', { class: 'page' }, h('section', { class: 'page-card' },
      heading,
      h('p', {}, 'Every factual claim in the game links to where it came from.'),
      inRound.length ? [h('h2', {}, `This round (${state.code})`), inRound.map((p, i) => sourceGroup(p, `Post ${i + 1}: ${p.account.name}`))] : null,
      rest.length ? [h('h2', {}, inRound.length ? 'More posts in the bank' : 'Every post in the bank'), rest.map(p => sourceGroup(p, p.account.name))] : null,
      about.research ? [h('h2', {}, 'Research behind the game'), sourceList(about.research)] : null,
      about.photos ? [h('h2', {}, 'Photo credits'),
        about.photosNote ? h('p', { class: 'source-fact' }, about.photosNote) : null,
        photoCredits(about.photos)] : null,
      about.credit ? h('p', { class: 'fine' }, about.credit) : null,
      h('div', { class: 'page-actions' }, h('button', { class: 'btn btn-quiet', type: 'button', onclick: back }, 'Back')))));
    focusOn(heading);
  }

  function renderReview(warnings) {
    setHaze(0);
    const all = content.posts.flatMap(p => p.sources).concat((content.about && content.about.research) || []);
    const todo = all.filter(s => s.status !== 'verified').length;
    const cfg = roundConfig(content);
    const stats = bankStats;
    const heading = h('h1', { tabindex: '-1' }, 'Review mode');
    screen('page', h('div', { class: 'page review' }, h('section', { class: 'page-card' },
      heading,
      h('p', {}, `content.json loaded with no errors. ${content.posts.length} posts in the bank; ${all.length} sources: ${all.length - todo} verified, ${todo} marked TODO: VERIFY.`),
      cfg
        ? h('p', {}, `Each round draws ${cfg.size} posts: every trick at least once, ${cfg.legit} legit, ${cfg.replies} with a reply step, ${cfg.alarmist}+ alarmist, at most ${cfg.maxPerTopic} per topic. ${stats.rounds} test rounds all drew successfully.`)
        : h('p', {}, 'No "round" settings, so every post plays in file order.'),
      h('p', {}, `Estimated play time: about ${stats.averageMinutes.toFixed(1)} minutes for an average round, ${stats.longestMinutes.toFixed(1)} for the longest `,
        h('span', { class: 'source-pub' }, `(reading every word at ${READING_WPM} words per minute, plus ${SECONDS_PER_DECISION} seconds per decision; target ${TARGET_MINUTES}).`)),
      warnings.length ? [h('h2', {}, `Warnings (${warnings.length})`),
        h('ul', { class: 'warnings' }, warnings.map(w => h('li', {}, w)))] : h('p', {}, 'No warnings.'),
      h('div', { class: 'table-wrap' }, h('table', {},
        h('thead', {}, h('tr', {}, ['Post', 'Answer', 'In rounds', 'Explanation', 'Sources'].map(t => h('th', { scope: 'col' }, t)))),
        h('tbody', {}, content.posts.map(p => {
          const words = wordCount(p.explanation);
          return h('tr', {},
            h('td', {}, h('strong', {}, p.id), h('br'), p.account.name,
              p.topic ? [h('br'), `Topic: ${p.topic}${p.side ? ` · ${p.side}` : ''}`] : null,
              p.tell ? [h('br'), h('span', { class: 'tell-cell' }, `Tell: "${p.tell}"`)] : null,
              p.alsoFair ? [h('br'), `Also fair: ${p.alsoFair.map(f => techById[f.answer].name).join(', ')}`] : null,
              p.image ? [h('br'), `Photo: ${p.image.src}`] : p.graphic ? [h('br'), `Graphic: ${p.graphic.type}`] : null,
              p.reply ? [h('br'), h('span', { class: 'status-badge' }, `reply step · ${p.reply.options.length} drafts`)] : null),
            h('td', {}, techById[p.answer].name),
            h('td', {}, `${Math.round((stats.appearances[p.id] || 0) * 100)}%`),
            h('td', { class: words > MAX_EXPLANATION_WORDS ? 'is-long' : '' }, `${words} words`),
            h('td', {}, sourceList(p.sources, true)));
        })))),
      content.about && content.about.research
        ? [h('h2', {}, 'Research sources'), sourceList(content.about.research, true)] : null,
      h('div', { class: 'page-actions' }, h('button', { class: 'btn btn-primary', type: 'button', onclick: renderIntro }, 'Play the game')))));
    focusOn(heading);
  }

  function showError(problems) {
    const heading = h('h1', { tabindex: '-1' }, "The game couldn't load its content");
    const fromFile = location.protocol === 'file:';
    screen('page', h('div', { class: 'page' }, h('section', { class: 'page-card' },
      heading,
      h('ul', { class: 'warnings' }, problems.map(p => h('li', {}, p))),
      fromFile
        ? h('p', {}, 'This page was opened straight from a file, and browsers block pages opened that way from reading content.json. Run it through a web server instead: see "Run it locally" in README.md.')
        : h('p', {}, 'If you just edited content.json, the messages above say what to fix. JSON is strict: text goes in "double quotes", items in a list need a comma between them, and there is no comma after the last item.'))));
    focusOn(heading);
  }

  /* ---------- keyboard shortcuts ---------- */

  document.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
    if (event.key === 'Enter') {
      // Enter continues after an answer, unless focus is on a control Enter already activates.
      if (document.activeElement && document.activeElement.closest('button, a, summary, input, select, textarea')) return;
      const continues = root.querySelectorAll('.note .btn-primary');
      const next = continues[continues.length - 1];
      if (next) {
        event.preventDefault();
        next.click();
      }
      return;
    }
    const n = Number(event.key);
    if (!Number.isInteger(n) || n < 1) return;
    const group = root.querySelector('.choices:not(.is-locked)');
    const button = group && group.querySelectorAll('button')[n - 1];
    if (button) {
      event.preventDefault();
      button.click();
    }
  });

  /* ---------- start ---------- */

  async function init() {
    try {
      const loaded = await loadContent();
      const { errors, warnings } = validateContent(loaded);
      if (errors.length) throw new ContentError(errors);
      content = loaded;
      techById = Object.fromEntries(content.techniques.map(t => [t.id, t]));
      if (new URLSearchParams(location.search).has('review')) renderReview(warnings);
      else renderIntro();
    } catch (err) {
      showError(err instanceof ContentError ? err.problems : [`Unexpected error: ${err.message}`]);
    }
  }

  // Exposed for review and testing in the browser console.
  window.Inversion = { validateContent, showError, drawRound };

  init();
})();
