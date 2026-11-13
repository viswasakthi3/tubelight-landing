var V = __DATA__;
var HERO = [
  { slug: 'rocket', label: 'Rockets', color: '#FF6F4F', app: 'Rockets.pdf', kicker: 'Physics · Chapter 4', title: 'How rockets fly',
    lead: 'A rocket carries everything it needs to burn, because there is no air in space.',
    sel: 'Liquid fuel and liquid oxygen are pumped into the combustion chamber, where they burn and rush out through the nozzle.', tail: 'The hot gas going down pushes the rocket up.',
    typed: 'how rocket engine works' },
  { slug: 'headaches', label: 'Headaches', color: '#22B573', app: 'Health article', kicker: 'Wellbeing', title: 'Small habits, better weeks',
    lead: 'Keep a bottle of water on your desk and take a short walk after lunch.',
    sel: 'Why do headaches happen if the brain itself can’t feel pain?', tail: 'The answer is in the layers around it.',
    typed: 'why headaches happen' },
  { slug: 'dna', label: 'DNA', color: '#3B8EF0', app: 'Biology notes.docx', kicker: 'Biology · Unit 3', title: 'Genetics',
    lead: 'Every living cell carries a full set of instructions for life.',
    sel: 'DNA is built from nucleotides that pair up and twist into a double helix.', tail: 'Its base pairs spell out the genetic code.',
    typed: 'teach me about dna and its fasinating details' }
];
/* typed = the exact words someone typed into Tubelight to make each video (from the saved library) */
var GALLERY = [
  { slug: 'rocket', tag: 'Science', bg: '#FFEDE7', fg: '#A63A1E', typed: 'how rocket engine works', kw: 'rocket rockets engine engines space fuel thrust nozzle launch physics' },
  { slug: 'headaches', tag: 'Health', bg: '#E3F6EC', fg: '#146B44', typed: 'why headaches happen', kw: 'headache headaches migraine brain pain head health' },
  { slug: 'ocean', tag: 'Geography', bg: '#E6F1FF', fg: '#1E5AA8', typed: 'Ocean currents', kw: 'ocean oceans current currents sea water coriolis climate geography' },
  { slug: 'tv', tag: 'Tech', bg: '#F1ECFF', fg: '#4B33B8', typed: 'how does modern tv worsk so good and high in quality', kw: 'tv television screen oled led pixels display picture tech' },
  { slug: 'polar-bear', tag: 'Nature', bg: '#FFF4D6', fg: '#8A5A00', typed: 'life cycle of a polar bear', kw: 'polar bear bears arctic animal animals cubs ice nature' },
  { slug: 'insurance', tag: 'Money', bg: '#FFEDE7', fg: '#A63A1E', typed: 'how lic policy works', kw: 'insurance lic policy premium money finance life' }
];
/* other ready-made videos that search can find (features section) */
var MORE = [
  { slug: 'kidneys', kw: 'kidney kidneys blood filter urine nephron bladder body medical' },
  { slug: 'zombie-cells', kw: 'zombie senescent cell cells ageing aging inflammation medical' },
  { slug: 'neurons', kw: 'neuron neurons memory memories brain synapse learning' },
  { slug: 'appendix', kw: 'appendix gut bacteria intestine digestion body medical' },
  { slug: 'supernova', kw: 'supernova star stars black hole holes space explosion' },
  { slug: 'dark-matter', kw: 'dark matter galaxy galaxies gravity space universe' }
];
var SAVED = ['neurons', 'appendix', 'supernova', 'dark-matter'];
var PH = ['how memory works', 'why is the sky blue?', 'how vaccines train your body', 'what is compound interest?'];
/* stand-in for Wikipedia title suggestions (the live page asks Wikipedia; a design can’t) */
var SEEDS = [
  ['Black hole', 'Region of spacetime where nothing, not even light, escapes'],
  ['Blood pressure', 'Pressure of circulating blood on the walls of arteries'],
  ['Blood sugar', 'How much glucose is in your blood'],
  ['Photosynthesis', 'How plants turn light into chemical energy'],
  ['Compound interest', 'Interest earned on interest'],
  ['Vaccine', 'A preparation that trains the immune system'],
  ['Immune system', 'The body’s network of defences'],
  ['Insulin', 'Hormone that lets cells take in sugar'],
  ['Inflation', 'A general rise in prices over time'],
  ['Quantum entanglement', 'Particles that share one state at a distance'],
  ['Machine learning', 'Computers learning patterns from data'],
  ['Heart', 'The muscle that pumps blood through the body'],
  ['Heart attack', 'Blocked blood flow to the heart muscle'],
  ['Memory', 'How the brain stores and recalls information'],
  ['Sky', 'Why is the sky blue? Rayleigh scattering'],
  ['Volcano', 'Where molten rock reaches the surface'],
  ['Stock market', 'Where shares of companies are bought and sold'],
  ['Electricity', 'The flow of electric charge'],
  ['Gravity', 'The pull between masses'],
  ['Sleep', 'Why the body and brain need rest']
];
var QS = [
  { q: 'Which best describes you?', multi: false, opts: ['Student', 'Working professional', 'Teacher', 'Researcher', 'Just curious'] },
  { q: 'What would you use it for?', multi: true, opts: ['School & board exams', 'JEE or NEET', 'College subjects', 'Research papers', 'Coding', 'Work documents', 'News & everyday reading'] },
  { q: 'Where do you read most?', multi: true, opts: ['PDFs', 'Websites', 'Word or Google Docs', 'Notion', 'Slack or Teams', 'Somewhere else'] },
  { q: 'How often do you get stuck on something you’re reading?', multi: false, opts: ['Every day', 'A few times a week', 'Now and then'] },
  { q: 'What’s one thing you wish someone would explain to you?', text: true }
];
var IC_SEARCH = 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-3.5-3.5';
var IC_PLAY = 'M8 5.5v13l10.5-6.5z';
var IC_SPARK = 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z';
var IC_MAX = 'M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7';
var IC_MIN = 'M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7';
var STOP = { the: 1, how: 1, why: 1, what: 1, does: 1, and: 1, are: 1, for: 1, with: 1, about: 1, work: 1, works: 1, that: 1, this: 1, from: 1, into: 1, your: 1, explain: 1, teach: 1 };
var LIVE_STEPS = ['Writing the story…', 'Planning 3 pictures…', 'Drawing the pictures…', 'Recording the voice…', 'Ready'];

function words(t) { return String(t || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(function (w) { return w.length > 2 && !STOP[w]; }); }
function mmss(s) { s = Math.max(0, Math.floor(s || 0)); var m = Math.floor(s / 60), r = s % 60; return m + ':' + (r < 10 ? '0' : '') + r; }
function cueAt(cues, t) { if (!cues) return ''; for (var i = 0; i < cues.length; i++) { if (t >= cues[i].start && t < cues[i].end) return cues[i].text; } return ''; }
/* two caption lines, like the app (about 40–46 characters each) */
function wrap2(text) {
  var w = String(text || '').trim().split(/\s+/); if (!w[0]) return [];
  var max = Math.max(40, Math.ceil(text.length / 2) + 4), lines = [''];
  w.forEach(function (x) { var l = lines[lines.length - 1]; if (l && (l + ' ' + x).length > max && lines.length < 2) lines.push(x); else lines[lines.length - 1] = l ? l + ' ' + x : x; });
  return lines.map(function (x) { return { text: x }; });
}
function cap(s) { s = String(s || '').trim(); return s.charAt(0).toUpperCase() + s.slice(1); }

class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = {
      topic: 0, mode: 'idle', vt: 0, pressed: false, touched: false, muted: true, paused: true,
      demoOn: false, inMode: 'select', tn: 0, q: '', ph: 'Search a topic or paste text…', coarse: false,
      sOpen: false, sIdx: -1,
      pl: null, pt: 0, pPaused: true, pMuted: false, pCC: true, pMax: false, pEnded: false,
      live: null,
      email: '', sent: false, err: '', modal: null, qi: 0, picked: [], wish: '', answers: [], boost: 0, shown: 0, delta: false
    };
    this.setPanel = (el) => { this.panelEl = el; };
    this.setDlg = (el) => { this.dlgEl = el; };
    this.setHeroVid = (el) => { this.hv = el; };
    this.setDemoVid = (el) => { this.dv = el; };
    this.setPlVid = (el) => { this.pv = el; };
    this.setPlBox = (el) => { this.plEl = el; };
    this.setQ = (el) => { this.qEl = el; };
    this.lt = [];
  }
  componentDidMount() {
    try { if (window.matchMedia('(pointer: coarse)').matches) this.setState({ coarse: true }); } catch (e) {}
    var reduce = false;
    try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    this.reduce = reduce;
    if (!reduce) this.cyclePh(0, 0); else this.setState({ ph: 'Search a topic or paste text…  e.g. ' + PH[0] });
    if (this.props.autoplay === false || reduce) return;
    this.a1 = setTimeout(() => { if (!this.state.touched) this.go(false); }, 1800);
  }
  componentWillUnmount() {
    clearTimeout(this.a1); clearTimeout(this.p1); clearInterval(this.tk); clearTimeout(this.dt); clearTimeout(this.nq); clearTimeout(this.fo);
    clearInterval(this.ty); clearTimeout(this.phT); clearTimeout(this.ae); clearTimeout(this.bl); this.clearLive();
  }
  vid(slug) { return V[slug] || {}; }

  /* placeholder: app wording, the example types itself */
  cyclePh(i, n) {
    var ex = PH[i % PH.length];
    var next = n < ex.length ? [i, n + 1, 60] : [i + 1, 0, 2200];
    this.setState({ ph: 'Search a topic or paste text…  e.g. ' + ex.slice(0, n) });
    this.phT = setTimeout(() => { this.cyclePh(next[0], next[1]); }, next[2]);
  }

  /* ---------- hero ---------- */
  setMode(m) {
    clearTimeout(this.a1); clearInterval(this.ty); clearTimeout(this.ae);
    try { if (this.hv) this.hv.pause(); } catch (e) {}
    this.setState({ inMode: m, mode: 'idle', vt: 0, touched: true, tn: 0 });
    if (m === 'type') this.typeTopic();
  }
  typeTopic() {
    clearInterval(this.ty); clearTimeout(this.ae);
    var full = HERO[this.state.topic].typed;
    var pressEnter = () => { this.ae = setTimeout(() => { if (this.state.inMode === 'type' && this.state.mode === 'idle') this.go(true); }, 650); };
    if (this.reduce) { this.setState({ tn: full.length }); pressEnter(); return; }
    this.setState({ tn: 0 });
    this.ty = setInterval(() => {
      var n = this.state.tn + 1;
      this.setState({ tn: n });
      if (n >= full.length) { clearInterval(this.ty); pressEnter(); }
    }, 45);
  }
  go(byUser) {
    clearTimeout(this.a1); clearTimeout(this.p1);
    var patch = { pressed: true, mode: 'playing', vt: 0 };
    if (byUser) { patch.touched = true; patch.muted = false; }
    this.setState(patch);
    this.p1 = setTimeout(() => { this.setState({ pressed: false }); }, 260);
    var el = this.hv;
    if (el) {
      try { el.muted = byUser ? false : true; el.currentTime = 0; var p = el.play(); if (p && p.catch) p.catch(() => { el.muted = true; this.setState({ muted: true }); el.play().catch(() => {}); }); } catch (e) {}
    }
    if (byUser && this.panelEl && typeof window !== 'undefined' && window.innerWidth < 720) {
      setTimeout(() => { try { this.panelEl.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {} }, 350);
    }
  }
  pickTopic(i) {
    clearTimeout(this.a1); clearTimeout(this.ae);
    try { if (this.hv) this.hv.pause(); } catch (e) {}
    this.setState({ touched: true, topic: i, mode: 'idle', vt: 0 });
    if (this.state.inMode === 'type') setTimeout(() => { this.typeTopic(); }, 0);
  }

  /* ---------- search (like the app’s home box) ---------- */
  findMatches(q) {
    var ws = words(q); if (!ws.length) return [];
    var self = this;
    return GALLERY.concat(MORE).map(function (g) {
      var v = self.vid(g.slug);
      var hay = ' ' + words(v.title + ' ' + (g.typed || '') + ' ' + (g.tag || '') + ' ' + g.kw).join(' ') + ' ';
      var score = 0;
      ws.forEach(function (w) { if (hay.indexOf(' ' + w) >= 0) score++; });
      return { g: g, score: score };
    }).filter(function (x) { return x.score > 0; }).sort(function (a, b) { return b.score - a.score; });
  }
  suggestions() {
    var q = (this.state.q || '').trim(), self = this, out = [];
    var split = function (title) {
      var i = q ? title.toLowerCase().indexOf(q.toLowerCase()) : -1;
      return i < 0 ? { pre: title, mid: '', post: '' } : { pre: title.slice(0, i), mid: title.slice(i, i + q.length), post: title.slice(i + q.length) };
    };
    if (!q) {
      ['rocket', 'kidneys', 'supernova'].forEach(function (k) { var v = self.vid(k); out.push(Object.assign({ kind: 'watch', slug: k, title: v.title, hint: 'Ready-made video · ' + mmss(v.duration), badge: 'Watch', icon: IC_PLAY }, split(v.title))); });
      return out;
    }
    this.findMatches(q).slice(0, 2).forEach(function (m) { var v = self.vid(m.g.slug); out.push(Object.assign({ kind: 'watch', slug: m.g.slug, title: v.title, hint: 'Ready-made video · ' + mmss(v.duration), badge: 'Watch', icon: IC_PLAY }, split(v.title))); });
    var ql = q.toLowerCase();
    SEEDS.filter(function (s) { var tl = s[0].toLowerCase(); return tl.indexOf(ql) === 0 || (ql.length > 2 && tl.indexOf(ql) >= 0); }).slice(0, 4)
      .forEach(function (s) { out.push(Object.assign({ kind: 'topic', title: s[0], hint: s[1], badge: '', icon: IC_SEARCH }, split(s[0]))); });
    if (q.length >= 2) out.push({ kind: 'make', title: q, pre: 'Make a video about “', mid: '', post: q.slice(0, 80) + '”', hint: 'Free preview · about 20 s · email needed to watch', badge: 'New', icon: IC_SPARK });
    return out;
  }
  pickSug(item) {
    this.setState({ sOpen: false, sIdx: -1 });
    if (item.kind === 'watch') this.openPlayer(item.slug, 0);
    else this.startLive(item.title);
  }

  /* ---------- player ---------- */
  pauseOthers() { try { if (this.hv) this.hv.pause(); } catch (e) {} try { if (this.dv) this.dv.pause(); } catch (e) {} }
  focusPl() { clearTimeout(this.fo); this.fo = setTimeout(() => { try { if (this.plEl) this.plEl.focus({ preventScroll: true }); } catch (e) {} }, 60); }
  openPlayer(slug, t, extra) {
    this.pauseOthers(); this.clearLive();
    this.setState({ pl: Object.assign({ kind: 'video', slug: slug }, extra || {}), live: null, pt: t || 0, pEnded: false, pPaused: true });
    this.focusPl();
    setTimeout(() => { var el = this.pv; if (!el) return; try { el.currentTime = t || 0; el.muted = this.state.pMuted; el.play().catch(() => {}); } catch (e) {} }, 80);
  }
  closePlayer() {
    try { if (this.pv) this.pv.pause(); } catch (e) {}
    this.clearLive();
    try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) {}
    this.setState({ pl: null, live: null, pMax: false, pEnded: false });
  }
  toggleMax() {
    var on = !this.state.pMax;
    this.setState({ pMax: on });
    try { if (on && this.plEl && this.plEl.requestFullscreen) this.plEl.requestFullscreen().catch(function () {}); else if (!on && document.fullscreenElement) document.exitFullscreen(); } catch (e) {}
  }
  seekTo(t) { var el = this.pv; if (el) { try { el.currentTime = Math.max(0, t); if (el.paused) el.play().catch(function () {}); } catch (e) {} } this.setState({ pt: t, pEnded: false }); }
  curSlide() {
    var P = this.state.pl; if (!P || P.kind !== 'video') return 0;
    var sh = this.vid(P.slug).sheets || [], i = 0;
    for (var k = 0; k < sh.length; k++) { if (this.state.pt + 0.05 >= sh[k].start) i = k; }
    return i;
  }

  /* ---------- live preview (simulated here; the live page streams a real one) ---------- */
  clearLive() { (this.lt || []).forEach(function (x) { clearTimeout(x); }); this.lt = []; }
  startLive(topic) {
    topic = String(topic || '').trim().slice(0, 200); if (topic.length < 2) return;
    this.pauseOthers(); this.clearLive();
    this.setState({ pl: { kind: 'live', topic: topic }, live: { topic: topic, step: 0, imgs: 0, n: 3 }, pEnded: false, err: '', sOpen: false, sIdx: -1, wish: topic });
    this.focusPl();
    var plan = [[1800, { step: 1 }], [3400, { step: 2, imgs: 1 }], [5000, { imgs: 2 }], [6600, { imgs: 3, step: 3 }], [9000, { step: 4 }]];
    this.lt = plan.map((x) => setTimeout(() => {
      var L = this.state.live; if (!L) return;
      this.setState({ live: Object.assign({}, L, x[1]) });
      setTimeout(() => { this.maybeReveal(); }, 0);
    }, x[0]));
  }
  maybeReveal() {
    var L = this.state.live;
    if (L && L.step >= 4 && this.state.sent) this.openPlayer('kidneys', 0, { standIn: true, topic: L.topic });
  }

  /* ---------- waitlist ---------- */
  count() { var n = parseInt(this.props.waitlistCount == null ? 1240 : this.props.waitlistCount, 10); return isNaN(n) || n < 0 ? 0 : n; }
  week() { var n = parseInt(this.props.joinedThisWeek == null ? 186 : this.props.joinedThisWeek, 10); return isNaN(n) || n < 0 ? 0 : n; }
  spots() { var n = parseInt(this.props.spotsPerAnswer == null ? 60 : this.props.spotsPerAnswer, 10); return isNaN(n) || n < 0 ? 60 : n; }
  focusDlg() { clearTimeout(this.fo); this.fo = setTimeout(() => { try { if (this.dlgEl) this.dlgEl.focus({ preventScroll: true }); } catch (e) {} }, 60); }
  openModal() { var s = this.state; this.setState({ modal: !s.sent ? 'email' : (s.qi >= QS.length ? 'done' : 'q'), err: '' }); this.focusDlg(); }
  validEmail() { var v = (this.state.email || '').trim(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { this.setState({ err: 'That email doesn’t look quite right — mind checking it?' }); return false; } return true; }
  tickTo(target) {
    clearInterval(this.tk);
    var from = this.state.shown, start = Date.now(), d = 700;
    this.tk = setInterval(() => { var p = Math.min(1, (Date.now() - start) / d); var e = 1 - Math.pow(1 - p, 3); this.setState({ shown: Math.round(from + (target - from) * e) }); if (p >= 1) clearInterval(this.tk); }, 30);
  }
  advance(value, counted) {
    var qi = this.state.qi, answers = this.state.answers.slice();
    answers[qi] = value;
    var nb = this.state.boost + (counted ? this.spots() : 0);
    var next = qi + 1;
    this.setState({ boost: nb, qi: next, picked: [], answers: answers, delta: counted });
    if (counted) { this.tickTo(nb); clearTimeout(this.dt); this.dt = setTimeout(() => { this.setState({ delta: false }); }, 1400); }
    if (next >= QS.length) { setTimeout(() => { this.setState({ modal: 'done' }); this.focusDlg(); }, counted ? 900 : 0); }
  }
  pick(label) {
    var q = QS[this.state.qi];
    if (q.multi) {
      var p = this.state.picked.slice(), at = p.indexOf(label);
      if (at >= 0) p.splice(at, 1); else p.push(label);
      this.setState({ picked: p });
      return;
    }
    if (this.state.picked.length) return;
    this.setState({ picked: [label] });
    clearTimeout(this.nq);
    this.nq = setTimeout(() => { this.advance(label, true); }, 320);
  }

  renderVals() {
    var s = this.state, self = this;
    var tp = HERO[s.topic], hv = this.vid(tp.slug);
    var idle = s.mode === 'idle', playing = s.mode === 'playing' && !s.paused, done = s.mode === 'done';
    var dur = hv.duration || 0, cues = hv.cues;
    var fmt = function (n) { try { return Number(n).toLocaleString('en-IN'); } catch (e) { return String(n); } };
    var cnt = this.count(), hasCount = cnt > 0, wk = this.week();
    var pos = Math.max(1, cnt + 1 - s.shown), finalPos = Math.max(1, cnt + 1 - s.boost);
    var q = QS[Math.min(s.qi, QS.length - 1)];
    var ask = s.inMode === 'type', typedFull = tp.typed, typedDone = s.tn >= typedFull.length;

    /* search */
    var sugg = s.sOpen ? this.suggestions() : [];
    var sIdx = Math.min(s.sIdx, sugg.length - 1);

    /* player */
    var P = s.pl, isVideo = !!(P && P.kind === 'video'), isLive = !!(P && P.kind === 'live');
    var pvd = isVideo ? this.vid(P.slug) : {}, L = s.live || {};
    var sheets = pvd.sheets || [], cur = this.curSlide();
    var pdur = pvd.duration || 0;
    var slides = isVideo
      ? sheets.map(function (sh, i) {
          var on = i === cur;
          return { num: i + 1, thumb: sh.thumb, hasImg: true, isReady: false, isWait: false, wait: false, on: on, speaking: on && !s.pPaused,
            title: sh.title || ('Picture ' + (i + 1)), sub: mmss(sh.start), cls: 'pl-card' + (on ? ' on' : ''),
            aria: 'Picture ' + (i + 1) + (sh.title ? ': ' + sh.title : '') + ', starts at ' + mmss(sh.start), pick: function () { self.seekTo(sh.start); } };
        })
      : (isLive ? [0, 1, 2].map(function (i) {
          var ready = (L.imgs || 0) > i;
          return { num: i + 1, thumb: '', hasImg: false, isReady: ready, isWait: !ready, wait: true, on: false, speaking: false,
            title: 'Picture ' + (i + 1), sub: ready ? 'Drawn' : ((L.imgs || 0) === i && L.step >= 2 ? 'Being drawn…' : 'Queued'),
            cls: 'pl-card' + (ready ? '' : ' wait'), aria: 'Picture ' + (i + 1) + (ready ? ' drawn' : ' not ready yet'), pick: function () {} };
        }) : []);
    var stageText = isLive ? (L.step === 2 ? 'Drawing picture ' + Math.min(3, (L.imgs || 0) + 1) + ' of 3…' : LIVE_STEPS[L.step || 0]) : '';
    var ended = isVideo && s.pEnded;

    return {
      /* hero */
      isSel: !ask, isAsk: ask,
      modeSelCls: 'mode' + (ask ? '' : ' on'), modeAskCls: 'mode' + (ask ? ' on' : ''),
      toSel: function () { self.setMode('select'); }, toAsk: function () { self.setMode('type'); },
      typedNow: typedFull.slice(0, s.tn),
      deskCls: 'desk' + (idle ? '' : ' split'),
      appName: ask ? 'Tubelight' : tp.app, appColor: ask ? '#6C4DF6' : tp.color,
      docKicker: tp.kicker, docTitle: tp.title, docLead: tp.lead, docSel: tp.sel, docTail: tp.tail,
      vidTitle: hv.title || '', vidSrc: hv.src, vidPoster: hv.poster, vidAria: 'Tubelight explanation: ' + (hv.title || ''),
      heroCap: idle ? (ask ? (typedDone ? 'Pressing Enter…' : ' ') : 'Press Alt + E to explain the highlighted text.') : (cueAt(cues, s.vt) || ' '),
      pct: dur ? Math.min(100, Math.round(s.vt / dur * 1000) / 10) : 0,
      time: mmss(s.vt), total: mmss(dur),
      waveCls: 'wave' + (playing && !s.muted ? ' live' : ''),
      isDone: done,
      showUnmute: !idle && s.muted,
      keyCls: 'keybtn' + (idle && (!ask || typedDone) ? ' ready' : '') + (s.pressed ? ' pressed' : ''),
      keyLabel: !idle ? 'Explain it again' : (ask ? (s.coarse ? 'Tap to explain my topic' : 'Explain my topic') : (s.coarse ? 'Tap to explain the highlighted text' : 'Explain the highlighted text')),
      explain: function () { self.go(true); },
      replay: function () { self.go(true); },
      ppLabel: s.paused ? 'Play' : 'Pause',
      ppPath: s.paused ? 'M7 4.5v15l12.5-7.5z' : 'M8 5v14M16 5v14',
      togglePlay: function () {
        if (idle) { self.go(true); return; }
        var el = self.hv; if (!el) return;
        try { if (el.paused) { el.play().catch(function () {}); } else { el.pause(); } } catch (e) {}
      },
      soundOn: !s.muted,
      sndLabel: s.muted ? 'Sound off — turn on' : 'Sound on — turn off',
      sndPath: s.muted ? 'M16 9l5 6M21 9l-5 6' : 'M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14',
      toggleSound: function () {
        var m = !self.state.muted, el = self.hv;
        if (el) { try { el.muted = m; if (!m && el.paused && self.state.mode !== 'idle') el.play().catch(function () {}); } catch (e) {} }
        self.setState({ muted: m, touched: true });
      },
      heroMax: function () { var t0 = 0; try { t0 = self.hv ? self.hv.currentTime : 0; } catch (e) {} self.openPlayer(tp.slug, t0); },
      heroTime: function (e) { self.setState({ vt: e.target.currentTime }); },
      heroEnded: function () { self.setState({ mode: 'done', paused: true }); },
      heroPlay: function () { self.setState({ paused: false }); },
      heroPause: function () { self.setState({ paused: true }); },
      setHeroVid: this.setHeroVid, setPanel: this.setPanel,
      topics: HERO.map(function (x, i) { var on = s.topic === i; return { label: x.label, color: x.color, cls: 'tchip' + (on ? ' on' : ''), pressed: on, pick: function () { self.pickTopic(i); } }; }),
      onKey: function (e) {
        if (!e) return;
        if (!ask && e.altKey && (e.code === 'KeyE' || e.key === 'e' || e.key === 'E')) { e.preventDefault(); self.go(true); }
        if (ask && e.key === 'Enter' && e.target && e.target.tagName !== 'BUTTON') { e.preventDefault(); self.go(true); }
      },
      tryOwn: function (e) {
        if (e && e.preventDefault) e.preventDefault();
        try { var sec = document.getElementById('examples'); if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (x) {}
        setTimeout(function () { try { if (self.qEl) self.qEl.focus({ preventScroll: true }); } catch (x) {} }, 500);
      },

      /* demo film */
      setDemoVid: this.setDemoVid,
      demoCover: !s.demoOn, demoControls: s.demoOn,
      playDemo: function () {
        try { if (self.hv) self.hv.pause(); } catch (e) {}
        self.setState({ demoOn: true });
        var el = self.dv; if (el) { try { el.muted = false; el.play().catch(function () {}); } catch (e) {} }
      },
      demoPlay: function () { if (!self.state.demoOn) self.setState({ demoOn: true }); },
      demoEnded: function () {},

      /* examples + search */
      gallery: GALLERY.map(function (g) { var v = self.vid(g.slug); return { thumb: v.thumb, title: v.title, typed: g.typed, len: mmss(v.duration), tag: g.tag, bg: g.bg, fg: g.fg, aria: 'Play: ' + v.title + ', ' + mmss(v.duration) + '. Made from the typed topic: ' + g.typed, open: function () { self.openPlayer(g.slug, 0); } }; }),
      saved: SAVED.map(function (k) { var v = self.vid(k); return { thumb: v.thumb, aria: 'Play saved explanation: ' + v.title, open: function () { self.openPlayer(k, 0); } }; }),
      fKidneys: function () { self.openPlayer('kidneys', 0); },
      fZombie: function () { self.openPlayer('zombie-cells', 0); },
      q: s.q, ph: s.ph, setQ: this.setQ,
      sOpen: s.sOpen && sugg.length > 0,
      sActive: sIdx >= 0 ? 'sg-' + sIdx : '',
      sugg: sugg.map(function (it, i) {
        return { id: 'sg-' + i, on: i === sIdx, cls: 'sg ' + it.kind + (i === sIdx ? ' on' : ''), icon: it.icon, pre: it.pre, mid: it.mid, post: it.post, hint: it.hint, badge: it.badge, hasBadge: !!it.badge,
          pick: function (e) { if (e && e.preventDefault) e.preventDefault(); self.pickSug(it); } };
      }),
      onQ: function (e) { self.setState({ q: e.target.value.slice(0, 200), sOpen: true, sIdx: -1 }); },
      onQFocus: function () { clearTimeout(self.bl); self.setState({ sOpen: true }); },
      onQBlur: function () { clearTimeout(self.bl); self.bl = setTimeout(function () { self.setState({ sOpen: false, sIdx: -1 }); }, 150); },
      onQKey: function (e) {
        var list = self.suggestions(), n = list.length;
        if (e.key === 'ArrowDown') { e.preventDefault(); self.setState({ sOpen: true, sIdx: n ? (Math.max(-1, self.state.sIdx) + 1) % n : -1 }); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); self.setState({ sOpen: true, sIdx: n ? (self.state.sIdx <= 0 ? n - 1 : self.state.sIdx - 1) : -1 }); }
        else if (e.key === 'Escape') { self.setState({ sOpen: false, sIdx: -1 }); }
        else if (e.key === 'Tab' && self.state.sOpen && self.state.sIdx >= 0 && list[self.state.sIdx] && list[self.state.sIdx].kind === 'topic') { e.preventDefault(); self.setState({ q: list[self.state.sIdx].title, sIdx: -1 }); }
      },
      onSearch: function (e) {
        if (e && e.preventDefault) e.preventDefault();
        var list = self.suggestions();
        if (self.state.sOpen && self.state.sIdx >= 0 && list[self.state.sIdx]) { self.pickSug(list[self.state.sIdx]); return; }
        var t = (self.state.q || '').trim(); if (t.length < 2) return;
        var m = self.findMatches(t);
        if (m.length && m[0].score >= Math.max(1, words(t).length)) self.openPlayer(m[0].g.slug, 0);
        else self.startLive(t);
      },

      /* player */
      plOpen: !!P,
      plOvlCls: 'ovl dark pl-ovl' + (s.pMax ? ' maxed' : ''),
      plCls: 'pl' + (s.pMax ? ' max' : ''),
      setPlBox: this.setPlBox, setPlVid: this.setPlVid,
      plTitle: isVideo ? (pvd.title || '') : (isLive ? 'Making your video…' : ''),
      plHasTime: isVideo, plRun: mmss(pdur),
      plMakingNow: isLive, plStage: stageText,
      plDoneMark: isVideo, plMadeText: P && P.standIn ? 'Made just now' : 'Made by Tubelight',
      plIsVideo: isVideo, plIsLive: isLive, plNoVideo: !isVideo, plStandIn: !!(P && P.standIn),
      plSrc: pvd.src, plPoster: pvd.poster,
      plShowCC: isVideo && s.pCC && !ended, plCC: isVideo ? wrap2(cueAt(pvd.cues, s.pt)) : [],
      plTime: function (e) { self.setState({ pt: e.target.currentTime }); },
      plOnPlay: function () { self.setState({ pPaused: false, pEnded: false }); },
      plOnPause: function () { self.setState({ pPaused: true }); },
      plOnEnd: function () { self.setState({ pPaused: true, pEnded: true }); },
      plToggle: function () { var el = self.pv; if (!el) return; try { if (el.paused) el.play().catch(function () {}); else el.pause(); } catch (e) {} },
      plPct: pdur ? Math.min(100, Math.round(s.pt / pdur * 1000) / 10) : 0,
      plSeek: function (e) { var r = e.currentTarget.getBoundingClientRect(); var f = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)); self.seekTo(f * pdur); },
      plPlayLabel: s.pPaused ? 'Play' : 'Pause',
      plPlayPath: s.pPaused ? 'M8 5.5v13l10.5-6.5z' : 'M7 5h3.5v14H7zM13.5 5H17v14h-3.5z',
      plPrev: function () { var sh = self.vid(P && P.slug).sheets || [], c = self.curSlide(); if (!sh.length) return; var t0 = self.state.pt - sh[c].start > 2 ? sh[c].start : (sh[Math.max(0, c - 1)] || sh[0]).start; self.seekTo(t0); },
      plNext: function () { var sh = self.vid(P && P.slug).sheets || [], c = self.curSlide(); if (c + 1 < sh.length) self.seekTo(sh[c + 1].start); },
      plSlideNum: isVideo ? (cur + 1) + ' / ' + sheets.length : '– / 3',
      plClock: isVideo ? mmss(s.pt) + ' / ' + mmss(pdur) : '0:00 / –',
      plSndLabel: s.pMuted ? 'Sound off — turn on' : 'Sound on — turn off',
      plSndPath: s.pMuted ? 'M16 9l5 6M21 9l-5 6' : 'M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14',
      plMute: function () { var m = !self.state.pMuted; try { if (self.pv) self.pv.muted = m; } catch (e) {} self.setState({ pMuted: m }); },
      plCCCls: 'pb cc' + (s.pCC ? ' on' : ''), plCCOn: s.pCC,
      plCCToggle: function () { self.setState({ pCC: !self.state.pCC }); },
      plMaxLabel: s.pMax ? 'Exit full screen' : 'Full screen',
      plMaxPath: s.pMax ? IC_MIN : IC_MAX,
      plMaxToggle: function () { self.toggleMax(); },
      closePl: function () { self.closePlayer(); },
      plBackdrop: function (e) { if (e && e.target === e.currentTarget) self.closePlayer(); },
      plKey: function (e) {
        if (!e) return;
        var tag = e.target && e.target.tagName;
        if (tag === 'INPUT') { if (e.key === 'Escape') self.closePlayer(); return; }
        if (e.key === 'Escape') { if (self.state.pMax) self.toggleMax(); else self.closePlayer(); }
        else if (e.key === ' ' && tag !== 'BUTTON') { e.preventDefault(); var el = self.pv; if (el) { try { if (el.paused) el.play().catch(function () {}); else el.pause(); } catch (x) {} } }
        else if (e.key === 'ArrowRight') { var sh = self.vid(P && P.slug).sheets || [], c = self.curSlide(); if (c + 1 < sh.length) self.seekTo(sh[c + 1].start); }
        else if (e.key === 'ArrowLeft') { var sh2 = self.vid(P && P.slug).sheets || [], c2 = self.curSlide(); if (sh2.length) self.seekTo(sh2[Math.max(0, c2 - 1)].start); }
        else if (e.key === 'c' || e.key === 'C') self.setState({ pCC: !self.state.pCC });
        else if (e.key === 'f' || e.key === 'F') self.toggleMax();
      },
      slides: slides,
      railBadge: isVideo ? sheets.length + ' slides' : (L.imgs || 0) + ' of 3 ready',
      liveTopic: L.topic || '',
      showGate: isLive && !s.sent,
      gateSubmit: function (e) {
        if (e && e.preventDefault) e.preventDefault();
        if (!self.validEmail()) return;
        self.setState({ sent: true, err: '', wish: (self.state.live && self.state.live.topic) || self.state.wish });
        setTimeout(function () { self.maybeReveal(); }, 0);
      },
      showEnd: ended,
      endTitle: P && P.standIn ? 'That’s your first Tubelight video.' : 'Want to make your own?',
      endBody: P && P.standIn ? 'Want an earlier invite? Tell us how you’ll use Tubelight — every answer moves you up the line.' : 'Join the waitlist, or type any topic in the search box and Tubelight makes a free preview for you.',
      endCtaLabel: P && P.standIn ? 'Move up the line' : (s.sent ? 'Move up the line' : 'Join the waitlist'),
      endCta: function () { self.closePlayer(); self.openModal(); },
      replayPl: function () { self.seekTo(0); },
      plFoot: isLive || (P && P.standIn)
        ? 'Your topic is sent to our servers to make the video. It’s made by AI — if something looks off, ask a follow-up in the app.'
        : 'Unedited output from the Windows app.  Space play/pause · ← → pictures · C captions · F full screen',

      /* waitlist */
      email: s.email, emailShown: (s.email || '').trim(),
      sent: s.sent, notSent: !s.sent, err: s.err, hasErr: !!s.err,
      onEmail: function (e) { self.setState({ email: e.target.value, err: '' }); },
      submit: function (e) {
        if (e && e.preventDefault) e.preventDefault();
        if (!self.validEmail()) return;
        self.setState({ sent: true, err: '', modal: 'q', qi: 0, picked: [], boost: 0, shown: 0 });
        self.focusDlg();
      },
      proofMain: hasCount ? fmt(cnt) + ' people' : 'Invites go out in batches',
      proofRest: hasCount ? ' are already waiting' : ' — earlier sign-ups get in first',
      hasWeek: hasCount && wk > 0, weekText: fmt(wk),
      navCta: s.sent ? 'Your spot' : 'Join the waitlist',
      posShort: hasCount ? ' — #' + fmt(finalPos) + ' in line' : '',
      moveUpLabel: s.qi >= QS.length ? 'See your spot' : 'Move up the line →',
      openModal: function () { self.openModal(); },
      closeModal: function () { self.setState({ modal: null }); },
      dlgKey: function (e) { if (e && e.key === 'Escape') self.setState({ modal: null }); },
      setDlg: this.setDlg,
      modalOpen: !!s.modal, isEmailStep: s.modal === 'email', isQStep: s.modal === 'q', isDoneStep: s.modal === 'done',
      segs: QS.map(function (x, i) { return { cls: 'seg' + (s.qi > i ? ' on' : '') }; }),
      qNum: Math.min(s.qi + 1, QS.length), qText: q.q, qHint: q.multi ? ' · pick any' : (q.text ? ' · optional' : ''),
      qIsChips: !q.text, qIsText: !!q.text,
      qOpts: (q.opts || []).map(function (label) { var on = s.picked.indexOf(label) >= 0; return { label: label, on: on, cls: 'qchip' + (on ? ' on' : ''), pick: function () { self.pick(label); } }; }),
      qNeedsNext: !!(q.multi || q.text),
      qNextOff: q.multi ? s.picked.length === 0 : !(s.wish || '').trim(),
      qNextLabel: q.text ? 'Finish' : 'Next',
      nextQ: function () { var qq = QS[self.state.qi]; if (qq.text) self.advance((self.state.wish || '').trim(), true); else self.advance(self.state.picked.slice(), true); },
      wish: s.wish, onWish: function (e) { self.setState({ wish: e.target.value.slice(0, 200) }); },
      skipQ: function () { self.advance(null, false); },
      hasCount: hasCount, posText: '#' + fmt(pos), showDelta: hasCount && s.delta, spotsText: fmt(this.spots()),
      doneTitle: s.boost > 0 ? 'You moved up ' + fmt(s.boost) + ' spots!' : 'You’re all set!'
    };
  }
}
