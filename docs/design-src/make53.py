"""Builds V53.template.html (v5.3 design) from V5.template.html (v5.2)."""
import re, sys, os
D = os.path.dirname(os.path.abspath(__file__))
t = open(os.path.join(D, 'V5.template.html'), encoding='utf-8').read()

def rep(a, b, n=1):
    global t
    c = t.count(a)
    assert c == n, ('count', c, a[:80])
    t = t.replace(a, b)

def rex(pat, b, flags=re.S):
    global t
    t2, k = re.subn(pat, lambda m: b, t, count=1, flags=flags)
    assert k == 1, ('regex miss', pat[:80])
    t = t2

rep('<title>Tubelight — v5</title>', '<title>Tubelight — v5.3</title>')

SEARCH = 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-3.5-3.5'
PLAY = 'M8 5.5v13l10.5-6.5z'
SPARK = 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z'
MAXI = 'M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7'

# ---------------- CSS ----------------
CSS = r'''
/* ===== v5.3: play mark ===== */
.gpm{position:absolute;left:50%;top:50%;width:58px;height:58px;margin:-29px 0 0 -29px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.86);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);box-shadow:0 12px 30px -10px rgba(0,0,0,.5),inset 0 0 0 1px rgba(255,255,255,.7);transition:transform .25s cubic-bezier(.2,.8,.2,1),background .25s}
.gpm svg{width:20px;height:20px;margin-left:3px;fill:#6C4DF6}
.gcard:hover .gpm,.tvplay:hover .gpm,.sthumb:hover .gpm{transform:scale(1.08);background:#FFFFFF}
.glen{position:absolute;right:10px;top:10px;padding:3px 9px;border-radius:999px;background:rgba(15,23,42,.68);color:#FFFFFF;font-size:12px;font-weight:600;font-variant-numeric:tabular-nums}
.sthumb .gpm{width:32px;height:32px;margin:-16px 0 0 -16px}
.sthumb .gpm svg{width:12px;height:12px;margin-left:2px}
.tvplay{position:relative;display:block;padding:0;border:0;border-radius:12px;overflow:hidden;cursor:pointer;background:#EEEAF6}
.tvplay img{display:block;width:100%;height:100%;object-fit:cover}
.tvplay .gpm{width:44px;height:44px;margin:-22px 0 0 -22px}
.tvplay .gpm svg{width:15px;height:15px}
.tvplay:focus-visible{outline:2px solid #6C4DF6;outline-offset:3px}
/* ===== v5.3: search like the app ===== */
.sbox{position:relative;max-width:780px}
.btn.go{background:linear-gradient(135deg,#7A5CFA,#5B8CFF);box-shadow:inset 0 1px 0 rgba(255,255,255,.25),0 10px 24px -10px rgba(91,140,255,.7)}
.btn.go:hover{background:linear-gradient(135deg,#6C4DF6,#4C7DF5)}
.btn svg{width:18px;height:18px;flex:none;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
.sugg{position:absolute;left:0;right:0;top:calc(100% + 8px);z-index:30;padding:6px;border-radius:20px;background:#FFFFFF;box-shadow:0 0 0 1px #E6E1EF,0 28px 60px -24px rgba(34,30,63,.45);animation:rise .2s ease both}
.sg{display:flex;align-items:center;gap:12px;width:100%;min-height:52px;padding:8px 12px;border:0;border-radius:14px;background:transparent;text-align:left;cursor:pointer;font:inherit;color:#221E3F}
.sg.on,.sg:hover{background:#F4F0FF}
.sg-ic{flex:none;width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:#F4F1FA;color:#6C4DF6}
.sg-ic svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.sg.watch .sg-ic{background:#221E3F;color:#FFFFFF}
.sg.watch .sg-ic svg{fill:currentColor;stroke:none}
.sg.make .sg-ic{background:linear-gradient(135deg,#7A5CFA,#5B8CFF);color:#FFFFFF}
.sg-t{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}
.sg-t b{font-weight:500;font-size:15.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sg-t b mark{background:none;color:#221E3F;font-weight:700}
.sg-t small{font-size:13px;color:#6F6B86;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sg-badge{flex:none;font-size:12px;font-weight:600;color:#4B33B8;background:#EFEAFF;border-radius:999px;padding:3px 10px}
.sugg-foot{margin:6px 10px 4px;font-size:12px;color:#7A7690}
.sfine{margin:14px 0 30px;font-size:14.5px;color:#6F6B86}
/* ===== v5.3: player (mirrors the desktop app) ===== */
.ovl.dark.pl-ovl{padding:18px}
.pl{position:relative;width:100%;max-width:1260px;max-height:calc(100vh - 36px);display:flex;flex-direction:column;gap:12px;padding:14px 16px 12px;border-radius:24px;background:#F7F6FB;box-shadow:0 40px 90px -30px rgba(0,0,0,.6);animation:pop .35s cubic-bezier(.2,.9,.3,1.1) both;outline:none;overflow:auto}
.pl.max{max-width:none;width:100vw;height:100vh;max-height:none;border-radius:0}
.pl-ovl.maxed{padding:0}
.pl-head{display:flex;align-items:center;gap:12px;min-height:44px;padding:0 2px}
.pl-title{min-width:0;font:700 20px/1.2 'DM Sans',ui-sans-serif,sans-serif;color:#0F172A;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pl-time{flex:none;font-size:13px;font-weight:500;color:#64748B;font-variant-numeric:tabular-nums}
.pl-made{margin-left:auto;display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:500;color:#64748B;white-space:nowrap}
.pl-made svg{width:14px;height:14px;fill:none;stroke:#22B573;stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round}
.pl-making{margin-left:auto;display:inline-flex;align-items:center;gap:8px;min-height:30px;padding:0 12px;border-radius:999px;background:#EFEAFF;color:#4B33B8;font-size:13px;font-weight:600;white-space:nowrap}
.spin{display:inline-block;width:13px;height:13px;flex:none;border-radius:50%;border:2px solid rgba(75,51,184,.25);border-top-color:#4B33B8;animation:spin .8s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.pl-x{flex:none;display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:50%;border:0;background:#FFFFFF;color:#334155;cursor:pointer;box-shadow:0 0 0 1px #E2E8F0}
.pl-x:hover{background:#F4F1FA}
.pl-x svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round}
.pl-row{display:grid;grid-template-columns:minmax(0,1fr) 250px;gap:16px;min-height:0}
.pl.max .pl-row{flex:1}
.pl-stage{display:flex;flex-direction:column;min-width:0;border:1px solid rgba(226,232,240,.95);border-radius:16px;overflow:hidden;background:#FFFFFF;box-shadow:0 1px 3px rgba(0,0,0,.04),0 12px 28px -6px rgba(45,27,105,.06)}
.pl-frame{position:relative;aspect-ratio:16 / 9;background:#F8F6F0;display:flex;align-items:center;justify-content:center;overflow:hidden}
.pl.max .pl-frame{aspect-ratio:auto;flex:1;min-height:0}
.pl-frame video{display:block;width:100%;height:100%;object-fit:contain;cursor:pointer;background:#F8F6F0}
.pl-cc{position:absolute;left:50%;bottom:6.5%;transform:translateX(-50%);width:max-content;max-width:min(92%,46ch);text-align:center;pointer-events:none;font:400 clamp(14px,1.55vw,19px)/1.4 Roboto,Arial,'DM Sans',sans-serif}
.pl.max .pl-cc{font-size:clamp(17px,2.6vh,30px)}
.pl-cc span{display:block}
.pl-cc b{display:inline;padding:.1em .4em;background:rgba(8,8,8,.75);color:#FFFFFF;font-weight:400;box-decoration-break:clone;-webkit-box-decoration-break:clone}
.demo-tag{position:absolute;left:10px;top:10px;padding:5px 11px;border-radius:999px;background:rgba(15,23,42,.74);color:#FFFFFF;font-size:12px;font-weight:600}
.pl-bar{padding:2px 14px 6px;border-top:1px solid #EEF0F4}
.pl-seek{position:relative;display:block;width:100%;height:16px;padding:0;border:0;background:transparent;cursor:pointer}
.pl-seek i{position:absolute;left:0;right:0;top:5px;height:5px;border-radius:99px;background:#E7E5F0}
.pl-seek b{position:absolute;left:0;top:5px;height:5px;border-radius:99px;background:linear-gradient(90deg,#6C4DF6,#8E75FF)}
.pl-seek:hover i,.pl-seek:hover b{top:4px;height:7px}
.pl-ctrl{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
.pl-grp{display:flex;align-items:center;gap:2px}
.pb{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-width:40px;height:40px;padding:0 8px;border-radius:10px;border:0;background:transparent;color:#334155;cursor:pointer;font:600 13.5px 'DM Sans',ui-sans-serif,sans-serif}
.pb:hover{background:#F4F1FA;color:#0F172A}
.pb:disabled{opacity:.4;cursor:default;background:transparent}
.pb svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.pb.fillic svg{fill:currentColor;stroke:none}
.pb.cc{font:800 12px 'DM Sans',sans-serif;letter-spacing:.04em}
.pb.cc span{display:inline-flex;align-items:center;justify-content:center;min-width:28px;height:20px;border-radius:5px;border:1.8px solid currentColor}
.pb.cc.on{color:#4B33B8}
.pb:focus-visible,.pl-card:focus-visible,.pl-x:focus-visible,.pl-seek:focus-visible{outline:2px solid #6C4DF6;outline-offset:2px}
.pl-tm{font-size:13px;color:#475569;font-variant-numeric:tabular-nums;padding:0 8px;white-space:nowrap}
.pl-sn{font-size:13px;font-weight:600;color:#475569;font-variant-numeric:tabular-nums;min-width:40px;text-align:center}
.pl-rail{display:flex;flex-direction:column;min-height:0;border:1px solid #E2E8F0;border-radius:16px;background:#FFFFFF;overflow:hidden}
.pl-rail-h{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:11px 12px;border-bottom:1px solid #EEF0F4;font-size:13px;font-weight:700;color:#0F172A}
.pl-rail-h small{font-size:12px;font-weight:600;color:#64748B}
.pl-list{flex:1;overflow:auto;display:flex;flex-direction:column;gap:8px;padding:10px}
.pl-card{display:flex;flex-direction:column;gap:6px;flex:none;padding:6px;border:1.5px solid #E2E8F0;border-radius:12px;background:#FFFFFF;cursor:pointer;text-align:left;font:inherit;color:#0F172A;transition:border-color .2s,background .2s}
.pl-card.on{border-color:#6C4DF6;background:#F6F3FF;box-shadow:0 0 0 1px #6C4DF6,0 4px 14px rgba(99,102,241,.15)}
.pl-card.wait{border-style:dashed;cursor:default}
.pl-thumb{position:relative;aspect-ratio:16 / 9;border-radius:8px;overflow:hidden;background:#F1EEF8;display:flex;align-items:center;justify-content:center}
.pl-thumb img{display:block;width:100%;height:100%;object-fit:cover}
.pl-num{position:absolute;left:6px;top:6px;min-width:20px;height:20px;padding:0 6px;border-radius:6px;background:#4F46E5;color:#FFFFFF;font-size:11px;font-weight:800;display:inline-flex;align-items:center;justify-content:center}
.pl-ready{width:28px;height:28px;border-radius:50%;background:#E1F6EC;display:flex;align-items:center;justify-content:center}
.pl-ready svg{width:15px;height:15px;fill:none;stroke:#146B44;stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round}
.pl-ct{font-size:12.5px;font-weight:600;line-height:1.3;padding:0 2px}
.pl-cs{font-size:11.5px;color:#64748B;padding:0 2px 2px}
.pl-wave{display:inline-flex;align-items:flex-end;gap:2px;height:10px;margin-left:6px}
.pl-wave i{width:2px;height:4px;border-radius:1px;background:#6C4DF6;animation:wave .9s ease-in-out infinite}
.pl-wave i:nth-child(2){animation-delay:.15s}.pl-wave i:nth-child(3){animation-delay:.3s}
.pl-foot{margin:0;padding:0 4px;font-size:13px;color:#64748B}
.pl-making-stage{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:24px;text-align:center}
.pl-making-stage .disp{font-size:clamp(20px,2.4vw,28px);font-weight:600;letter-spacing:-.02em;color:#221E3F;max-width:30ch;text-wrap:balance}
.stage-line{display:inline-flex;align-items:center;gap:10px;min-height:36px;padding:0 14px;border-radius:999px;background:#EFEAFF;color:#4B33B8;font-size:14.5px;font-weight:600}
.pl-cover{position:absolute;inset:0;z-index:2;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(248,246,240,.78);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
.gate{width:100%;max-width:460px;display:flex;flex-direction:column;gap:12px;padding:22px;border-radius:20px;background:#FFFFFF;box-shadow:0 24px 50px -24px rgba(34,30,63,.45)}
.gate .signup{max-width:none}
@media (max-width:1100px){
.pl-row{grid-template-columns:minmax(0,1fr)}
.pl-list{flex-direction:row;overflow-x:auto;overflow-y:hidden}
.pl-card{width:160px}
}
@media (max-width:720px){
.ovl.dark.pl-ovl{padding:0;align-items:stretch}
.pl{max-height:none;height:100%;border-radius:0;padding:10px 10px 12px}
.pl-title{font-size:17px}
.pl-made,.pl-time{display:none}
.pl-card{width:132px}
.pl-cc{font-size:13px;bottom:4%}
.gpm{width:46px;height:46px;margin:-23px 0 0 -23px}
.gpm svg{width:16px;height:16px}
.glen{top:7px;right:7px;font-size:11px}
.pb.hide-xs{display:none}
.sugg{position:static;margin-top:8px}
}
'''
rep('@media (max-width:1060px){', CSS + '\n@media (max-width:1060px){')

# ---------------- hero ----------------
HERO_LINKS = ('<div style="display: flex; flex-wrap: wrap; align-items: center; gap: 2px 22px; margin-top: 2px">\n'
  '<a href="#how" class="linkbtn"><svg viewBox="0 0 24 24" aria-hidden="true" style="width: 18px; height: 18px; fill: #4B33B8"><path d="M7 4.5v15l12.5-7.5z"></path></svg>Watch the demo (1:21)</a>\n'
  '<a href="#examples" class="linkbtn" onClick="{{tryOwn}}"><svg viewBox="0 0 24 24" aria-hidden="true" style="width: 18px; height: 18px; fill: none; stroke: #4B33B8; stroke-width: 2.2; stroke-linecap: round"><path d="' + SEARCH + '"></path></svg>Try it with your own topic</a>\n'
  '</div>')
rex(r'<a href="#how" class="linkbtn" style="align-self: flex-start; margin-top: 2px">.*?Watch the demo \(1:21\)</a>', HERO_LINKS)
rep('<button type="button" class="ibtn" aria-pressed="{{soundOn}}" aria-label="{{sndLabel}}" onClick="{{toggleSound}}">',
    '<button type="button" class="ibtn" aria-label="Open in the big player" title="Maximise" onClick="{{heroMax}}"><svg viewBox="0 0 24 24"><path d="' + MAXI + '"></path></svg></button>\n'
    '<button type="button" class="ibtn" aria-pressed="{{soundOn}}" aria-label="{{sndLabel}}" onClick="{{toggleSound}}">')
rep('<p class="real">Real Tubelight explanations in its own voice, made from exactly the topics shown in “Type or paste”. Making one takes about 10–30 seconds; here it plays straight away. The page in “Select text” is a sample.</p>',
    '<p class="real">Real Tubelight explanations in its own voice, made from exactly the topics shown in “Type or paste”. Making one takes about 10–30 seconds; here it plays straight away. The page in “Select text” is a sample. Use <span aria-hidden="true">⤢</span> to watch it big.</p>')

# ---------------- examples: search like the app + new play mark ----------------
rep('<p class="lede">Type a topic, or press play on one Tubelight already made. Every one below is real — pictures, voice and all.</p>',
    '<p class="lede">Search any topic and Tubelight makes a free preview video for you, right here. Or press play on one it already made — every one below is real.</p>')
SEARCHBLOCK = '''<div class="sbox">
<form class="search" role="search" onSubmit="{{onSearch}}">
<svg viewBox="0 0 24 24" aria-hidden="true"><path d="''' + SEARCH + '''"></path></svg>
<label for="topic-q" class="sr">What do you want to understand?</label>
<input id="topic-q" class="search-in" type="text" role="combobox" aria-expanded="{{sOpen}}" aria-controls="topic-sugg" aria-autocomplete="list" aria-activedescendant="{{sActive}}" autocomplete="off" placeholder="{{ph}}" value="{{q}}" ref="{{setQ}}" onChange="{{onQ}}" onKeyDown="{{onQKey}}" onFocus="{{onQFocus}}" onBlur="{{onQBlur}}">
<button type="submit" class="btn go"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="''' + SEARCH + '''"></path></svg>Explain it</button>
</form>
<sc-if value="{{sOpen}}" hint-placeholder-val="{{ false }}">
<div class="sugg" id="topic-sugg" role="listbox" aria-label="Suggestions">
<sc-for list="{{sugg}}" as="sg" hint-placeholder-count="5"><button type="button" id="{{sg.id}}" role="option" aria-selected="{{sg.on}}" class="{{sg.cls}}" onMouseDown="{{sg.pick}}"><span class="sg-ic" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="{{sg.icon}}"></path></svg></span><span class="sg-t"><b>{{sg.pre}}<mark>{{sg.mid}}</mark>{{sg.post}}</b><small>{{sg.hint}}</small></span><sc-if value="{{sg.hasBadge}}" hint-placeholder-val="{{ false }}"><span class="sg-badge">{{sg.badge}}</span></sc-if></button></sc-for>
<p class="sugg-foot">Suggestions from Wikipedia. Your video is made fresh for your topic.</p>
</div>
</sc-if>
</div>
<p class="sfine">Free preview: one a day, about 20 seconds to make, and you’ll enter your email to watch it. Your topic is sent to our servers to make the video.</p>
<div class="gal">'''
rex(r'<form class="search" role="search" onSubmit="\{\{onSearch\}\}">.*?<div class="gal">', SEARCHBLOCK)
rep('<span class="gpic"><img src="{{g.thumb}}" alt=""><span class="gplay" aria-hidden="true"><i><svg viewBox="0 0 24 24"><path d="M7 4.5v15l12.5-7.5z"></path></svg></i>{{g.len}}</span></span>',
    '<span class="gpic"><img src="{{g.thumb}}" alt=""><span class="gpm" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="' + PLAY + '"></path></svg></span><span class="glen" aria-hidden="true">{{g.len}}</span></span>')
rep('<span class="gplay" aria-hidden="true"><i><svg viewBox="0 0 24 24"><path d="M7 4.5v15l12.5-7.5z"></path></svg></i></span></button>',
    '<span class="gpm" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="' + PLAY + '"></path></svg></span></button>')

# ---------------- features: new videos, clickable ----------------
rep('<img class="hide-sm" src="__THUMB_rocket__" alt="" style="display: block; width: 200px; height: 112px; object-fit: cover; border-radius: 12px; flex: none">',
    '<button type="button" class="tvplay hide-sm" onClick="{{fKidneys}}" aria-label="Play: How your kidneys filter blood" style="width: 200px; height: 112px; flex: none"><img src="__SHEET_kidneys_0__" alt=""><span class="gpm" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="' + PLAY + '"></path></svg></span></button>')
rex(r'<div class="tv" aria-hidden="true" style="align-items: stretch; justify-content: stretch">\n<img src="__THUMB_ocean__".*?Captions follow the voice\.</span>\n</div>',
    '<button type="button" class="tv tvplay" onClick="{{fZombie}}" aria-label="Play: Why zombie cells make us age" style="width: 100%; border-radius: 18px">\n<img src="__SHEET_zombie-cells_1__" alt="">\n<span class="gpm" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="' + PLAY + '"></path></svg></span>\n<span style="position: absolute; left: 10px; right: 10px; bottom: 10px; padding: 8px 10px; border-radius: 10px; background: rgba(255,255,255,0.94); color: #221E3F; font-size: 13px; font-weight: 500; text-align: center">Captions follow the voice.</span>\n</button>')
# the bento's aria-hidden on tile 1 tv would hide the new button: drop it there
rep('<div class="tv" aria-hidden="true" style="background: #FFFFFF; gap: 16px; padding: 0 22px; justify-content: space-between">',
    '<div class="tv" style="background: #FFFFFF; gap: 16px; padding: 0 22px; justify-content: space-between">')

# ---------------- FAQ ----------------
m = re.search(r'<details class="qa"><summary>When will I get access\?.*?</details>', t, re.S)
assert m
t = t[:m.end()] + ('\n<details class="qa"><summary>Can I try it before I’m invited?<span class="plus" aria-hidden="true"></span></summary>'
    '<p>Yes. Type a topic in the search box under “Curious about anything?” and Tubelight makes a free preview video right on this page — one a day. '
    'You’ll need your email to watch it, which also puts you on the waitlist.</p></details>') + t[m.end():]

# ---------------- player replaces the old lightbox ----------------
PLAYER = '''<!-- PLAYER (mirrors the desktop app: stage + slide rail + transport) -->
<sc-if value="{{plOpen}}" hint-placeholder-val="{{ false }}">
<div class="{{plOvlCls}}" onClick="{{plBackdrop}}">
<div class="{{plCls}}" role="dialog" aria-modal="true" aria-labelledby="pl-title" tabindex="-1" ref="{{setPlBox}}" onKeyDown="{{plKey}}">
<div class="pl-head">
<span id="pl-title" class="pl-title">{{plTitle}}</span>
<sc-if value="{{plHasTime}}" hint-placeholder-val="{{ true }}"><span class="pl-time">{{plRun}}</span></sc-if>
<sc-if value="{{plMakingNow}}" hint-placeholder-val="{{ false }}"><span class="pl-making"><span class="spin" aria-hidden="true"></span>{{plStage}}</span></sc-if>
<sc-if value="{{plDoneMark}}" hint-placeholder-val="{{ true }}"><span class="pl-made"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 5 5 9-10"></path></svg>{{plMadeText}}</span></sc-if>
<button type="button" class="pl-x" aria-label="Close player" onClick="{{closePl}}"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"></path></svg></button>
</div>
<div class="pl-row">
<div class="pl-stage">
<div class="pl-frame">
<sc-if value="{{plIsVideo}}" hint-placeholder-val="{{ true }}">
<video ref="{{setPlVid}}" src="{{plSrc}}" poster="{{plPoster}}" playsInline="{{ true }}" preload="auto" onClick="{{plToggle}}" onTimeUpdate="{{plTime}}" onPlay="{{plOnPlay}}" onPause="{{plOnPause}}" onEnded="{{plOnEnd}}" aria-label="{{plTitle}}"></video>
<sc-if value="{{plShowCC}}" hint-placeholder-val="{{ true }}"><div class="pl-cc" aria-hidden="true"><sc-for list="{{plCC}}" as="ln" hint-placeholder-count="2"><span><b>{{ln.text}}</b></span></sc-for></div></sc-if>
<sc-if value="{{plStandIn}}" hint-placeholder-val="{{ false }}"><span class="demo-tag">Design demo: a saved video stands in for the new one</span></sc-if>
</sc-if>
<sc-if value="{{plIsLive}}" hint-placeholder-val="{{ false }}">
<div class="pl-making-stage">
<span class="sg-ic" aria-hidden="true" style="width: 52px; height: 52px; border-radius: 16px; background: linear-gradient(135deg, #7A5CFA, #5B8CFF); color: #FFFFFF"><svg viewBox="0 0 24 24" style="width: 24px; height: 24px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linejoin: round"><path d="''' + SPARK + '''"></path></svg></span>
<p class="disp" style="margin: 0">“{{liveTopic}}”</p>
<span class="stage-line" role="status"><span class="spin" aria-hidden="true"></span>{{plStage}}</span>
</div>
</sc-if>
<sc-if value="{{showGate}}" hint-placeholder-val="{{ false }}">
<div class="pl-cover">
<div class="gate fade">
<p class="disp" style="margin: 0; font-size: 22px; line-height: 1.2; font-weight: 600; letter-spacing: -0.02em">Your video is being made.</p>
<p style="margin: 0; color: #57536E">Enter your email to watch it when it’s ready — usually about 20 seconds.</p>
<form class="signup" onSubmit="{{gateSubmit}}">
<label for="em-gate" class="sr">Email address</label>
<input id="em-gate" name="email" class="email-in" type="email" autocomplete="email" placeholder="Your email" value="{{email}}" onChange="{{onEmail}}">
<button type="submit" class="btn">Watch my video</button>
</form>
<sc-if value="{{hasErr}}" hint-placeholder-val="{{ false }}"><p class="err" role="alert">{{err}}</p></sc-if>
<p class="micro">This also puts you on the Tubelight waitlist. We’ll only email you about your invite.</p>
</div>
</div>
</sc-if>
<sc-if value="{{showEnd}}" hint-placeholder-val="{{ false }}">
<div class="pl-cover">
<div class="gate fade" style="align-items: flex-start">
<p class="disp" style="margin: 0; font-size: 22px; line-height: 1.2; font-weight: 600; letter-spacing: -0.02em">{{endTitle}}</p>
<p style="margin: 0; color: #57536E">{{endBody}}</p>
<div style="display: flex; flex-wrap: wrap; gap: 10px">
<button type="button" class="btn" onClick="{{endCta}}">{{endCtaLabel}}</button>
<button type="button" class="btn ghost" onClick="{{replayPl}}">Watch again</button>
</div>
</div>
</div>
</sc-if>
</div>
<div class="pl-bar">
<button type="button" class="pl-seek" aria-label="Seek" onClick="{{plSeek}}" disabled="{{plNoVideo}}"><i></i><b style="width: {{plPct}}%"></b></button>
<div class="pl-ctrl">
<div class="pl-grp">
<button type="button" class="pb fillic" aria-label="{{plPlayLabel}}" onClick="{{plToggle}}" disabled="{{plNoVideo}}"><svg viewBox="0 0 24 24"><path d="{{plPlayPath}}"></path></svg><span class="hide-xs">{{plPlayLabel}}</span></button>
<button type="button" class="pb" aria-label="Previous picture" onClick="{{plPrev}}" disabled="{{plNoVideo}}"><svg viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"></path></svg></button>
<span class="pl-sn">{{plSlideNum}}</span>
<button type="button" class="pb" aria-label="Next picture" onClick="{{plNext}}" disabled="{{plNoVideo}}"><svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"></path></svg></button>
<span class="pl-tm">{{plClock}}</span>
</div>
<div class="pl-grp">
<button type="button" class="pb" aria-label="{{plSndLabel}}" onClick="{{plMute}}"><svg viewBox="0 0 24 24"><path d="M11 5 6 9H2v6h4l5 4z"></path><path d="{{plSndPath}}"></path></svg></button>
<button type="button" class="{{plCCCls}}" aria-pressed="{{plCCOn}}" aria-label="Captions" onClick="{{plCCToggle}}"><span>CC</span></button>
<button type="button" class="pb" aria-label="{{plMaxLabel}}" title="{{plMaxLabel}}" onClick="{{plMaxToggle}}"><svg viewBox="0 0 24 24"><path d="{{plMaxPath}}"></path></svg></button>
</div>
</div>
</div>
</div>
<div class="pl-rail">
<div class="pl-rail-h"><span>Slides</span><small>{{railBadge}}</small></div>
<div class="pl-list">
<sc-for list="{{slides}}" as="sl" hint-placeholder-count="3">
<button type="button" class="{{sl.cls}}" aria-current="{{sl.on}}" aria-label="{{sl.aria}}" onClick="{{sl.pick}}" disabled="{{sl.wait}}">
<span class="pl-thumb">
<sc-if value="{{sl.hasImg}}" hint-placeholder-val="{{ true }}"><img src="{{sl.thumb}}" alt=""></sc-if>
<sc-if value="{{sl.isReady}}" hint-placeholder-val="{{ false }}"><span class="pl-ready" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m5 12 5 5 9-10"></path></svg></span></sc-if>
<sc-if value="{{sl.isWait}}" hint-placeholder-val="{{ false }}"><span class="spin" aria-hidden="true"></span></sc-if>
<span class="pl-num">{{sl.num}}</span>
</span>
<span class="pl-ct">{{sl.title}}<sc-if value="{{sl.speaking}}" hint-placeholder-val="{{ false }}"><span class="pl-wave" aria-hidden="true"><i></i><i></i><i></i></span></sc-if></span>
<span class="pl-cs">{{sl.sub}}</span>
</button>
</sc-for>
</div>
</div>
</div>
<p class="pl-foot">{{plFoot}}</p>
</div>
</div>
</sc-if>

'''
rex(r'<!-- VIDEO LIGHTBOX -->.*?(?=<!-- WAITLIST DIALOG -->)', PLAYER)

# ---------------- logic: replace the whole script ----------------
props = re.search(r"data-props='([^']*)'", t).group(1)
JS = open(os.path.join(D, 'v53.logic.js'), encoding='utf-8').read()
rex(r'<script type="text/x-dc" data-dc-script.*?</script>',
    "<script type=\"text/x-dc\" data-dc-script data-props='" + props.replace('"height":8600', '"height":9400') + "'>\n" + JS + "\n</script>")

open(os.path.join(D, 'V53.template.html'), 'w', encoding='utf-8').write(t)
print('ok', len(t))
