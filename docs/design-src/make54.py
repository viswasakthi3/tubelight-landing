"""Builds V54.template.html (v5.4 design) from V53.template.html (v5.3) + v54.logic.js.
V53 files are only read, never changed."""
import re, os
D = os.path.dirname(os.path.abspath(__file__))
t = open(os.path.join(D, 'V53.template.html'), encoding='utf-8').read()

def rep(a, b, n=1):
    global t
    c = t.count(a)
    assert c == n, ('count', c, a[:90])
    t = t.replace(a, b)

def rex(pat, b, flags=re.S):
    global t
    t2, k = re.subn(pat, lambda m: b, t, count=1, flags=flags)
    assert k == 1, ('regex miss', pat[:90])
    t = t2

def drop_lines(prefixes):
    """remove whole CSS lines that start with one of the prefixes (each must match exactly once)"""
    global t
    for p in prefixes:
        lines = t.split('\n')
        hit = [i for i, l in enumerate(lines) if l.startswith(p)]
        assert len(hit) == (2 if p in ('.gpm{', '.gpm svg{') else 1), ('drop', p, len(hit))
        for i in reversed(hit): del lines[i]
        t = '\n'.join(lines)

SEARCH_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></svg>'
LOGO = '<img src="/_blob/af4ad0e670d21cd458db108d9b3ac54d" alt="" style="display: block; width: 20px; height: auto">'
MAXI = '<svg viewBox="0 0 24 24"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"></path></svg>'
SND = '<svg viewBox="0 0 24 24"><path d="M11 5 6 9H2v6h4l5 4z"></path><path d="{{sndPath}}"></path></svg>'
REPLAY = '<sc-if value="{{isDone}}" hint-placeholder-val="{{ false }}"><button type="button" class="ibtn" onClick="{{replay}}" aria-label="Replay the explanation"><svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 1 0 2.5-5.8"></path><path d="M4 4v4h4"></path></svg>Replay</button></sc-if>'
BTN_MAX = '<button type="button" class="ibtn" aria-label="Open in the big player" title="Maximise" onClick="{{heroMax}}">' + MAXI + '</button>'
BTN_SND = '<button type="button" class="ibtn" aria-pressed="{{soundOn}}" aria-label="{{sndLabel}}" onClick="{{toggleSound}}">' + SND + '</button>'
SEEK_H = ('<div class="{{seekCls}}" role="slider" tabindex="0" aria-label="Seek" aria-valuemin="0" aria-valuemax="{{seekMax}}" aria-valuenow="{{seekNow}}" aria-valuetext="{{seekText}}" '
          'onPointerDown="{{seekDown}}" onPointerMove="{{seekMove}}" onPointerUp="{{seekUp}}" onPointerCancel="{{seekUp}}" onKeyDown="{{seekKey}}">'
          '<span class="seek-track"><span class="seek-fill" style="width: {{pct}}%"></span></span><span class="seek-knob" aria-hidden="true" style="left: {{pct}}%"></span></div>')
SEEK_P = ('<div class="{{plSeekCls}}" role="slider" tabindex="0" aria-label="Seek" aria-valuemin="0" aria-valuemax="{{plSeekMax}}" aria-valuenow="{{plSeekNow}}" aria-valuetext="{{plSeekText}}" aria-disabled="{{plNoVideo}}" '
          'onPointerDown="{{plSeek}}" onPointerMove="{{plSeekMove}}" onPointerUp="{{plSeekUp}}" onPointerCancel="{{plSeekUp}}" onKeyDown="{{plSeekKey}}">'
          '<span class="seek-track"><span class="seek-fill" style="width: {{plPct}}%"></span></span><span class="seek-knob" aria-hidden="true" style="left: {{plPct}}%"></span></div>')

# ---------------- title / props ----------------
rep('<title>Tubelight — v5.3</title>', '<title>Tubelight — v5.4</title>')
rep('"waitlistCount":{"editor":"int","default":1240,', '"waitlistCount":{"editor":"int","default":1,')
rep('"joinedThisWeek":{"editor":"int","default":186,', '"joinedThisWeek":{"editor":"int","default":1,')
rep('"height":9400', '"height":9300')

# ---------------- CSS: drop the v5.3 play mark + old fixed pieces ----------------
drop_lines(['.gpm{', '.gpm svg{', '.gcard:hover .gpm,.tvplay:hover .gpm', '.sthumb .gpm{', '.sthumb .gpm svg{', '.tvplay .gpm{', '.tvplay .gpm svg{'])
rep('.segs{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px}', '.segs{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:6px}')
rex(r'\.xsell\{display:grid;[^}]*\}',
    ".xsell{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:28px;padding:clamp(24px,3.4vw,36px);border-radius:28px;"
    "background:radial-gradient(60% 90% at 100% 0%, rgba(214,234,255,.7), rgba(214,234,255,0) 60%), linear-gradient(120deg, #F4F0FF 0%, #FFF4E4 100%);"
    "box-shadow:inset 0 0 0 1px #E4DCFA}")
rep('.pvid video{display:block;width:100%;height:100%;object-fit:cover}', '.pvid video{display:block;width:100%;height:100%;object-fit:contain}')

CSS = r'''
/* ===== v5.4 ===== */
/* 8.7 a milder play mark: small dark-glass disc in the bottom-left corner, never over the middle of the picture */
.gpm{position:absolute;left:12px;bottom:12px;top:auto;width:40px;height:40px;margin:0;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(20,16,40,.38);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);box-shadow:none;transition:width .2s,height .2s,background .2s}
.gpm svg{width:15px;height:15px;margin-left:2px;fill:#FFFFFF;transition:fill .2s}
.gcard:hover .gpm,.gcard:focus-visible .gpm,.tvplay:hover .gpm,.tvplay:focus-visible .gpm,.sthumb:hover .gpm,.sthumb:focus-visible .gpm{width:44px;height:44px;background:#FFFFFF}
.gcard:hover .gpm svg,.gcard:focus-visible .gpm svg,.tvplay:hover .gpm svg,.tvplay:focus-visible .gpm svg,.sthumb:hover .gpm svg,.sthumb:focus-visible .gpm svg{fill:#6C4DF6}
.sthumb .gpm{left:8px;bottom:8px;width:32px;height:32px}
.sthumb .gpm svg{width:12px;height:12px}
.sthumb:hover .gpm,.sthumb:focus-visible .gpm{width:36px;height:36px}
.tvplay{position:relative;display:block;padding:0;border:0;border-radius:12px;overflow:hidden;cursor:pointer;background:#EEEAF6}
.tvplay img{display:block;width:100%;height:100%;object-fit:cover}
.tvplay:focus-visible{outline:2px solid #6C4DF6;outline-offset:3px}
.sthumb:focus-visible{outline:2px solid #6C4DF6;outline-offset:2px}
/* 8.1 seekable timeline: 6 px track in a 24 px hit area, 14 px knob on hover / focus / drag */
.seek{position:relative;flex:1;min-width:0;height:24px;cursor:pointer;touch-action:none;user-select:none;-webkit-user-select:none;border-radius:6px;-webkit-tap-highlight-color:transparent}
.seek:focus-visible{outline:2px solid #6C4DF6;outline-offset:2px}
.seek-track{position:absolute;left:0;right:0;top:9px;height:6px;border-radius:99px;background:#ECE7F6;overflow:hidden}
.seek-fill{display:block;height:100%;border-radius:99px;background:#6C4DF6;transition:width .25s linear}
.seek.drag .seek-fill{transition:none}
.seek.pl .seek-track{background:#E7E5F0}
.seek.pl .seek-fill{background:linear-gradient(90deg,#6C4DF6,#8E75FF)}
.seek-knob{position:absolute;top:5px;width:14px;height:14px;margin-left:-7px;border-radius:50%;background:#FFFFFF;box-shadow:0 0 0 2px #6C4DF6,0 2px 6px rgba(34,30,63,.3);opacity:0;transform:scale(.6);pointer-events:none;transition:opacity .15s,transform .15s,left .25s linear}
.seek.drag .seek-knob{transition:opacity .15s,transform .15s}
.seek:hover .seek-knob,.seek:focus-visible .seek-knob,.seek.drag .seek-knob{opacity:1;transform:none}
.pp{flex:none;display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;padding:0;border-radius:50%;border:0;background:#FFFFFF;color:#6C4DF6;cursor:pointer;box-shadow:0 0 0 1.5px #D9D0FB,0 4px 10px -4px rgba(108,77,246,.35);transition:background .2s,box-shadow .2s}
.pp:hover{background:#F6F3FF;box-shadow:0 0 0 1.5px #6C4DF6}
.pp:focus-visible{outline:2px solid #6C4DF6;outline-offset:2px}
.pp svg{width:16px;height:16px;fill:currentColor}
.ptime{flex:none;min-width:74px;text-align:right;font-size:12.5px;font-weight:500;color:#6F6B86;font-variant-numeric:tabular-nums}
/* 8.2 the app's pointer (BALL light), copied from the desktop app's .tl-spot-ball */
.tl-spot-ball{position:absolute;z-index:4;pointer-events:none;border-radius:50%;opacity:0;background:radial-gradient(circle,#ffffff 0 30%,#ff9a2e 34% 58%,rgba(255,154,46,.35) 72%,rgba(255,154,46,0) 100%);box-shadow:0 0 0 1.5px rgba(255,255,255,.85),0 0 14px 5px rgba(255,154,46,.55),0 0 34px 14px rgba(255,154,46,.22);transition:left 720ms cubic-bezier(.22,.61,.36,1),top 720ms cubic-bezier(.22,.61,.36,1),opacity 380ms ease}
.tl-spot-ball.ptr{z-index:3}
.tl-spot-ball.is-on{opacity:1;animation:tl-spot-breathe 2.6s ease-in-out infinite}
@keyframes tl-spot-breathe{0%,100%{box-shadow:0 0 0 1.5px rgba(255,255,255,.85),0 0 14px 5px rgba(255,154,46,.55),0 0 34px 14px rgba(255,154,46,.22)}50%{box-shadow:0 0 0 1.5px rgba(255,255,255,.9),0 0 18px 7px rgba(255,154,46,.68),0 0 44px 18px rgba(255,154,46,.3)}}
.pl-cc{z-index:5}
.mutepill{z-index:5}
.pl-cover{z-index:6}
/* 8.9 search mode: one wide window, then the app-style player */
.wask{flex:1 1 100%}
.desk:not(.ask) .wask{display:none}
.desk.ask .wdoc{display:none}
.desk.ask.play .wask{display:none}
.desk.ask:not(.play) .wpan{display:none}
.desk.ask.play .wpan{flex:1 1 100%;opacity:1;margin-left:0;transition:none}
.wask .askwrap{padding:28px clamp(18px,4vw,52px);gap:16px}
.wask .askwrap > .disp{font-size:clamp(22px,2.4vw,29px)}
.askrow{display:flex;gap:10px;align-items:stretch}
.askrow .askbox{flex:1;min-width:0}
.askrow .btn{min-height:56px;padding:0 20px;border-radius:16px}
.askin{flex:1;min-width:0;height:36px;padding:0;border:0;outline:0;background:transparent;color:#221E3F;font:400 16.5px 'DM Sans',ui-sans-serif,system-ui,sans-serif}
.enterkey{display:inline-flex;align-items:center;height:22px;padding:0 8px;border-radius:6px;background:rgba(255,255,255,.22);border:1px solid rgba(255,255,255,.55);border-bottom-width:2px;font:600 12px 'DM Sans',ui-sans-serif,sans-serif;transition:transform .12s}
.enterkey.pressed{transform:translateY(1px);border-bottom-width:1px}
.abar{gap:10px;padding-right:8px}
.abar > img{flex:none}
.spill{display:inline-flex;align-items:center;gap:8px;min-width:0;flex:1 1 auto;max-width:440px;height:34px;padding:0 14px 0 12px;border-radius:999px;border:0;background:#F4F1FA;color:#221E3F;cursor:pointer;text-align:left;font:500 14px 'DM Sans',ui-sans-serif,sans-serif}
.spill svg{width:16px;height:16px;flex:none;fill:none;stroke:#6C4DF6;stroke-width:2.2;stroke-linecap:round}
.spill span{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.spill:hover{background:#ECE6FF}
.spill:focus-visible{outline:2px solid #6C4DF6;outline-offset:2px}
.abar .grp{margin-left:auto;display:flex;align-items:center;gap:2px;flex:none}
.pmain{flex:1;display:flex;flex-direction:column;gap:10px;min-width:0}
.pbody.app{display:grid;grid-template-columns:minmax(0,1fr) 196px;gap:14px;padding:14px}
.pbody.app .pvid{border-radius:12px}
.prail-wrap{position:relative;min-height:0}
.prail-wrap .pl-rail{position:absolute;inset:0}
.prail-wrap .pl-list{flex-direction:column;overflow-x:hidden;overflow-y:auto}
.prail-wrap .pl-card{width:auto}
/* 8.4 questions with an Other box */
.qfield{display:flex;flex-direction:column;gap:6px}
.qlabel{font-size:14px;font-weight:600;color:#3A3655}
.qlabel span{font-weight:400;color:#6F6B86}
.qin{width:100%;min-height:46px;padding:0 14px;border-radius:12px;border:1px solid #E1DCEB;background:#FFFFFF;color:#221E3F;font:400 16px 'DM Sans',ui-sans-serif,sans-serif;outline:0}
.qin:focus{border-color:#6C4DF6;box-shadow:0 0 0 4px rgba(108,77,246,.14)}
.qin::placeholder{color:#7A7690}
@media (max-width:720px){
.mode{font-size:13.5px;gap:6px;padding:0 8px;white-space:nowrap}
.askrow{flex-direction:column}
.askrow .btn{width:100%}
.wask .askwrap{padding:18px 16px}
.desk.ask .wask{flex:none}
.desk.ask.play .wpan{flex:none;max-height:none;margin-top:0}
.pbody.app{grid-template-columns:minmax(0,1fr);padding:10px}
.prail-wrap{position:static}
.prail-wrap .pl-rail{position:static}
.prail-wrap .pl-list{flex-direction:row;overflow-x:auto;overflow-y:hidden}
.prail-wrap .pl-card{width:96px}
.abar{gap:6px;padding-left:10px}
.spill{max-width:none}
.ptime{min-width:64px}
}
@media (prefers-reduced-motion:reduce){
.tl-spot-ball{transition:none}
.tl-spot-ball.is-on{animation:none}
.seek-fill,.seek-knob{transition:none}
}
'''
rep('@media (prefers-reduced-motion:reduce){\n.caret{animation:none!important}', CSS + '@media (prefers-reduced-motion:reduce){\n.caret{animation:none!important}')

# ---------------- hero copy (8.5) ----------------
rep('Select any text and press <span class="kbd">Alt</span> + <span class="kbd">E</span>, or just type a topic. Tubelight explains it with pictures and a voice.',
    'Search a topic, or select any text and press <span class="kbd">Alt</span> + <span class="kbd">E</span>. Tubelight explains it with pictures and a voice in under 15 seconds.')
rex(r'<p class="real">.*?</p>',
    '<p class="real">Real Tubelight explanations in its own voice, made from the topics shown. In the app, Fast makes one in about 11 seconds (Rich takes up to 30); here they play straight away. The page in “Select text” is a sample. Use <span aria-hidden="true">⤢</span> to watch it big.</p>')
rep('About 10–30 seconds to make</span>', 'Under 15 seconds on Fast, up to 30 on Rich</span>')

# ---------------- mode switch (8.8) ----------------
rex(r'<div class="modeseg" role="group" aria-label="How do you want to ask\?">.*?</div>',
    '<div class="modeseg" role="group" aria-label="How do you want to ask?">\n'
    '<button type="button" class="{{modeAskCls}}" aria-pressed="{{isAsk}}" onClick="{{toAsk}}"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></svg>Search a topic</button>\n'
    '<button type="button" class="{{modeSelCls}}" aria-pressed="{{isSel}}" onClick="{{toSel}}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10M4 12h16M4 17h7"></path><path d="M15 15l5 5"></path></svg>Select text · Alt + E</button>\n'
    '</div>')

# ---------------- desk: doc window, search window, player window (8.1, 8.2, 8.9) ----------------
DESK = '''<div class="{{deskCls}}">
<div class="win wdoc">
<div class="wbar">
<span style="display: flex; align-items: center; gap: 9px; min-width: 0"><span aria-hidden="true" style="width: 12px; height: 12px; border-radius: 4px; flex: none; background: {{appColor}}"></span><span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis">{{appName}}</span></span>
<span aria-hidden="true" style="display: flex; gap: 14px; color: #A29DB5; font-size: 12px; font-weight: 500; flex: none">— ▢ ✕</span>
</div>
<div class="wbody">
<p style="margin: 0; font-size: 12px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #6F6B86">{{docKicker}}</p>
<p class="disp" style="margin: 0; font-size: 21px; line-height: 1.2; font-weight: 600; letter-spacing: -0.02em; color: #221E3F">{{docTitle}}</p>
<p class="wlead" style="margin: 0">{{docLead}}</p>
<p style="margin: 0"><span class="selx">{{docSel}}</span> {{docTail}}</p>
</div>
</div>

<div class="win wask">
<div class="wbar">
<span style="display: flex; align-items: center; gap: 9px; min-width: 0">__LOGO__<span style="white-space: nowrap">Tubelight</span></span>
<span aria-hidden="true" style="display: flex; gap: 14px; color: #A29DB5; font-size: 12px; font-weight: 500; flex: none">— ▢ ✕</span>
</div>
<form class="askwrap" role="search" onSubmit="{{heroSubmit}}">
<p class="disp" style="margin: 0; font-size: 21px; line-height: 1.2; font-weight: 600; letter-spacing: -0.02em; color: #221E3F">What do you want to understand?</p>
<div class="askrow">
<div class="askbox">__SEARCH__<label for="hero-q" class="sr">Search a topic</label><input id="hero-q" class="askin" type="text" autocomplete="off" maxlength="200" ref="{{setHq}}" value="{{hq}}" onChange="{{onHq}}" onFocus="{{onHqFocus}}"></div>
<button type="submit" class="btn go">Explain it<span class="{{enterCls}}" aria-hidden="true">Enter</span></button>
</div>
<p class="hint"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="3" width="8" height="4" rx="1"></rect><path d="M8 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"></path></svg>You can paste a whole paragraph too.</p>
<p class="hint"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"></path></svg>Your own topic? Press Enter for a free preview · about 20 s · email needed to watch</p>
</form>
</div>

<div class="win wpan" ref="{{setPanel}}">
<div class="wpan-in">
<sc-if value="{{isSel}}" hint-placeholder-val="{{ true }}">
<div class="wbar">
<span style="display: flex; align-items: center; gap: 8px; min-width: 0">__LOGO__<span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis">{{vidTitle}}</span></span>
<span style="display: flex; align-items: center; gap: 2px; flex: none">
__REPLAY____MAX____SND__
</span>
</div>
</sc-if>
<sc-if value="{{isAsk}}" hint-placeholder-val="{{ false }}">
<div class="wbar abar">
__LOGO__
<button type="button" class="spill" aria-label="{{pillAria}}" title="Search another topic" onClick="{{editTopic}}">__SEARCH__<span>{{pillTopic}}</span></button>
<span class="grp">
__REPLAY____SND____MAX__
</span>
</div>
</sc-if>
<div class="{{pbodyCls}}">
<div class="pmain">
<div class="pvid">
<video ref="{{setHeroVid}}" src="{{vidSrc}}" poster="{{vidPoster}}" playsInline="{{ true }}" muted="{{ true }}" preload="metadata" onTimeUpdate="{{heroTime}}" onEnded="{{heroEnded}}" onPlay="{{heroPlay}}" onPause="{{heroPause}}" aria-label="{{vidAria}}"></video>
<span class="{{hPtrCls}}" style="{{hPtrStyle}}" aria-hidden="true"></span>
<sc-if value="{{showUnmute}}" hint-placeholder-val="{{ false }}"><button type="button" class="mutepill" onClick="{{toggleSound}}"><svg viewBox="0 0 24 24"><path d="M11 5 6 9H2v6h4l5 4z"></path><path d="M16 9l5 6M21 9l-5 6"></path></svg>Tap for sound</button></sc-if>
</div>
<p class="caps" aria-live="polite">{{heroCap}}</p>
<div class="prog">
<button type="button" class="pp" aria-label="{{ppLabel}}" onClick="{{togglePlay}}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="{{ppPath}}"></path></svg></button>
__SEEKH__
<span class="ptime">{{time}} / {{total}}</span>
</div>
</div>
<sc-if value="{{isAsk}}" hint-placeholder-val="{{ false }}">
<div class="prail-wrap">
<div class="pl-rail">
<div class="pl-rail-h"><span>Slides</span><small>{{hRailBadge}}</small></div>
<div class="pl-list">
<sc-for list="{{hslides}}" as="hs" hint-placeholder-count="3">
<button type="button" class="{{hs.cls}}" aria-current="{{hs.on}}" aria-label="{{hs.aria}}" onClick="{{hs.pick}}">
<span class="pl-thumb"><img src="{{hs.thumb}}" alt=""><span class="pl-num">{{hs.num}}</span></span>
<span class="pl-ct">{{hs.title}}<sc-if value="{{hs.speaking}}" hint-placeholder-val="{{ false }}"><span class="pl-wave" aria-hidden="true"><i></i><i></i><i></i></span></sc-if></span>
<span class="pl-cs">{{hs.sub}}</span>
</button>
</sc-for>
</div>
</div>
</div>
</sc-if>
</div>
</div>
</div>
</div>

<sc-if value="{{isSel}}" hint-placeholder-val="{{ true }}">
<div class="keyrow">
<button type="button" class="{{keyCls}}" onClick="{{explain}}" aria-label="Press Alt plus E to explain the highlighted text"><span class="key">Alt</span><span aria-hidden="true" style="color: #A29DB5; font-size: 18px">+</span><span class="key">E</span><span style="margin-left: 6px">{{keyLabel}}</span></button>
</div>
</sc-if>
'''
DESK = (DESK.replace('__LOGO__', LOGO).replace('__SEARCH__', SEARCH_SVG).replace('__REPLAY__', REPLAY).replace('__MAX__', BTN_MAX)
        .replace('__SND__', BTN_SND).replace('__SEEKH__', SEEK_H))
rex(r'<div class="\{\{deskCls\}\}">.*?(?=<div class="tchips">)', DESK)

# ---------------- gallery (8.6) ----------------
rep('<span class="typed">You typed: <q>{{g.typed}}</q></span>\n', '')

# ---------------- big player: slider + pointer (8.1, 8.2) ----------------
rex(r'<button type="button" class="pl-seek" aria-label="Seek".*?</button>', SEEK_P)
rep('onClick="{{plToggle}}" onTimeUpdate="{{plTime}}" onPlay="{{plOnPlay}}" onPause="{{plOnPause}}" onEnded="{{plOnEnd}}" aria-label="{{plTitle}}"></video>\n',
    'onClick="{{plToggle}}" onTimeUpdate="{{plTime}}" onPlay="{{plOnPlay}}" onPause="{{plOnPause}}" onEnded="{{plOnEnd}}" aria-label="{{plTitle}}"></video>\n'
    '<span class="{{pPtrCls}}" style="{{pPtrStyle}}" aria-hidden="true"></span>\n')

# ---------------- questions (8.4) ----------------
rex(r'<p style="margin: 0; font-size: 14px; font-weight: 600; color: #6F6B86">Question \{\{qNum\}\} of 5\{\{qHint\}\}</p>.*?</sc-if>\n</div>\n<div style="display: flex; align-items: center; justify-content: space-between',
    '''<p style="margin: 0; font-size: 14px; font-weight: 600; color: #6F6B86">Question {{qNum}} of {{qTotal}}{{qHint}}</p>
<p class="disp" style="margin: 0; font-size: 22px; font-weight: 600; letter-spacing: -0.02em; text-wrap: balance">{{qText}}</p>
<div class="qchips"><sc-for list="{{qOpts}}" as="o" hint-placeholder-count="6"><button type="button" class="{{o.cls}}" aria-pressed="{{o.on}}" onClick="{{o.pick}}">{{o.label}}</button></sc-for></div>
<sc-if value="{{showOther}}" hint-placeholder-val="{{ false }}">
<div class="qfield">
<label for="q-other" class="qlabel">Tell us in a few words</label>
<input id="q-other" class="qin" type="text" maxlength="80" autocomplete="off" ref="{{setOther}}" value="{{otherText}}" onChange="{{onOther}}" onKeyDown="{{onOtherKey}}">
</div>
</sc-if>
<sc-if value="{{showAbout}}" hint-placeholder-val="{{ true }}">
<div class="qfield">
<label for="q-about" class="qlabel">What was it about? <span>(optional)</span></label>
<input id="q-about" class="qin" type="text" maxlength="120" autocomplete="off" placeholder="e.g. the Krebs cycle in my biology notes" value="{{about}}" onChange="{{onAbout}}">
</div>
</sc-if>
</div>
<div style="display: flex; align-items: center; justify-content: space-between''')

# ---------------- logic: inject v54.logic.js ----------------
props = re.search(r"data-props='([^']*)'", t).group(1)
JS = open(os.path.join(D, 'v54.logic.js'), encoding='utf-8').read()
rex(r'<script type="text/x-dc" data-dc-script.*?</script>',
    "<script type=\"text/x-dc\" data-dc-script data-props='" + props + "'>\n" + JS + "\n</script>")

open(os.path.join(D, 'V54.template.html'), 'w', encoding='utf-8').write(t)
print('ok', len(t))
