import { DemoMount, Film, GetButton } from "./client";
import { DEMO_QUESTIONS, type DemoQuestion } from "./demo";
import { Back, Bolt, Check, Fwd, Mark, Mic, Pc, Reload, Search, User } from "./icons";

export const QS_FAQ: { q: string; a: string }[] = [
  {
    q: "Is it really free?",
    a: "Yes. You get 50 searches every day, refilled at midnight. No account, no card. Copying text out of a screenshot is done on your PC and doesn’t use a search.",
  },
  {
    q: "Will it mess with my Tab key?",
    a: "No. Tap Tab and you get a normal Tab. Alt + Tab, Ctrl + Tab and Shift + Tab work as always. Quick Search only steps in when you hold Tab and press Q or S.",
  },
  {
    q: "Is it listening all the time?",
    a: "No. The microphone listens only while you hold Tab + Q. Let go and it stops. Prefer typing? Open the app and type your question.",
  },
  {
    q: "Where do my questions go?",
    a: "Your question is sent to find the answer. Your history is saved only on your PC, and you can clear it any time in Settings.",
  },
  {
    q: "Does it work on a Mac or my phone?",
    a: "Not yet. Quick Search runs on Windows 10 and 11. On your phone now? Send the link to your PC and install it there.",
  },
];

const TABS = [
  "#ea4335", "#4285f4", "#f4b400", "#7e57c2", "#0f9d58", "#ff7043", "#26a69a", "#ec407a",
  "#5c6bc0", "#8d6e63", "#29b6f6", "#9ccc65", "#ab47bc", "#ffa726", "#42a5f5", "#ef5350",
];

function Bars() {
  return <span className="qs-bars" aria-hidden="true"><i /><i /><i /><i /><i /></span>;
}

function Eggs() {
  return (
    <div className="qs-eggs">
      <span className="qs-egg soft"><i /><b>6 min</b><small>runny</small></span>
      <span className="qs-egg jammy"><i /><b>7 min</b><small>jammy</small></span>
      <span className="qs-egg hard"><i /><b>10 min</b><small>hard</small></span>
    </div>
  );
}

function Answer({ d }: { d: DemoQuestion }) {
  return (
    <div className="qs-ans" data-for={d.id}>
      <p className="qs-q"><span className="n">Q1</span>{d.said}</p>
      <div className="qs-pic">
        {d.pic ? <img src={d.pic} alt="" /> : <Eggs />}
        <span className="count">{d.count}</span>
      </div>
      <p className="qs-big">{d.big}</p>
      <p className="qs-sub">{d.sub}</p>
      <div className="qs-meta">
        {d.sources.map((s) => (
          <span className="qs-chip" key={s.name}><i style={{ background: s.color }}>{s.letter}</i>{s.name}</span>
        ))}
        <span className="qs-chip tts"><Bars />Reading aloud</span>
      </div>
    </div>
  );
}

export function SearchLanding() {
  const first = DEMO_QUESTIONS[0];
  return (
    <div className="qs" id="top">
      {/* ============ HERO ============ */}
      <header className="qs-hero">
        <nav className="qs-nav" aria-label="Main">
          <div className="qs-wrap">
            <a className="qs-brand" href="#top">
              <Mark size={38} />
              <span><b>Quick Search AI</b><span className="by">by Tubelight</span></span>
            </a>
            <div className="qs-nav-links">
              <a className="nl qs-hide-sm" href="#how">How it works</a>
              <a className="nl qs-hide-sm" href="#faq">FAQ</a>
              <GetButton where="nav" size="sm" />
            </div>
          </div>
        </nav>

        <div className="qs-wrap qs-hero-grid">
          <div className="qs-hero-words">
            <p className="qs-pill"><span className="qs-tube" aria-hidden="true" />Free AI answers for Windows</p>
            <h1 className="qs-h1">Stop opening <span className="v">new tabs.</span></h1>
            <p className="qs-hero-sub">
              Hold <kbd>Tab</kbd> + <kbd>Q</kbd> in any app and just ask, out loud. Let go, and the answer pops up in the
              corner of your screen.
            </p>
            <div className="qs-cta">
              <div className="qs-cta-row">
                <GetButton where="hero" />
                <a className="qs-film-link" href="#film"><span className="ring"><svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor" /></svg></span>Watch it work · 48s</a>
              </div>
            </div>
            <ul className="qs-ticks">
              <li><Check />No account</li>
              <li><Check />50 free searches a day</li>
              <li><Check />Reads answers out loud</li>
            </ul>
          </div>

          <DemoMount>
            <figure className="qs-stage">
              <figcaption className="qs-sr">
                A browser with 31 open tabs. Quick Search answers in the corner: {first.big} {first.sub}
              </figcaption>
              <div className="qs-browser" aria-hidden="true">
                <div className="qs-tabs">
                  <div className="qs-tabs-strip">
                    <span className="qs-tab wide"><i style={{ background: "#c0392b" }} /><span>Search results</span></span>
                    {TABS.map((c, i) => (<span key={i} className="qs-tab"><i style={{ background: c }} /></span>))}
                  </div>
                  <span className="qs-tabcount">31 tabs</span>
                </div>
                <div className="qs-addr">
                  <Back /><Fwd /><Reload />
                  <div><Search /><span data-addr="">{first.addr}</span></div>
                </div>
                <div className="qs-page">
                  <span className="site" data-site="">{first.site}</span>
                  <span className="junk" data-junk="">{first.junk}</span>
                  <span className="bar" style={{ width: "100%" }} />
                  <span className="bar" style={{ width: "88%" }} />
                  <span className="ad">ADVERTISEMENT</span>
                  <span className="bar" style={{ width: "94%" }} />
                </div>
              </div>

              <div className="qs-card" aria-live="polite">
                <div className="qs-card-head"><Mark size={22} /><b>Quick Search</b><span className="esc">Esc</span></div>
                <div className="qs-card-body">
                  <div className="qs-listen">
                    <span className="lab">Listening</span>
                    <p className="said" data-said="">{first.said}</p>
                    <span className="wave" aria-hidden="true">{Array.from({ length: 26 }, (_, i) => <i key={i} style={{ animationDelay: `${-((i * 137) % 700)}ms` }} />)}</span>
                    <span className="hint">Let go to ask</span>
                  </div>
                  <div className="qs-answer">
                    {DEMO_QUESTIONS.map((d) => <Answer key={d.id} d={d} />)}
                  </div>
                </div>
                <div className="qs-floor" aria-hidden="true"><Search /><span>Ask a follow-up…</span><i className="mic"><Mic size={16} /></i></div>
              </div>
            </figure>

            <div className="qs-try">
              <button type="button" className="qs-keys" data-keys="" aria-label="Hold to ask a sample question, then let go">
                <span className="qs-key wide">Tab</span><span className="plus" aria-hidden="true">+</span><span className="qs-key">Q</span>
              </button>
              <div className="qs-try-words">
                <b>Try it right here</b>
                <span data-hint="">Hold Tab + Q on your keyboard, or press the keys. Then let go.</span>
              </div>
            </div>
            <div className="qs-pick" role="group" aria-label="Sample questions">
              {DEMO_QUESTIONS.map((d, i) => (
                <button type="button" key={d.id} data-pick="" aria-pressed={i === 0}>{d.pick}</button>
              ))}
            </div>
          </DemoMount>
        </div>
      </header>

      <main id="main">
        {/* ============ FILM ============ */}
        <section className="qs-band white" aria-labelledby="film-h">
          <div className="qs-wrap qs-film">
            <div className="qs-head center">
              <p className="qs-eyebrow">See it for real</p>
              <h2 className="qs-h2" id="film-h">48 seconds. <span className="v">Sound on.</span></h2>
              <p className="qs-lede">Watch a pile of tabs turn into one answer, read out loud.</p>
            </div>
            <Film />
          </div>
        </section>

        {/* ============ HOW ============ */}
        <section className="qs-band tint" id="how" aria-labelledby="how-h">
          <div className="qs-wrap">
            <div className="qs-head center">
              <p className="qs-eyebrow">How it works</p>
              <h2 className="qs-h2" id="how-h">Three ways to ask. <span className="v">In any app.</span></h2>
              <p className="qs-lede">It sits on top of whatever you have open. Nothing to switch to.</p>
            </div>

            <div className="qs-ways">
              <article className="qs-way">
                <div className="qs-scene lav" aria-hidden="true">
                  <span className="floatkeys"><kbd>Tab</kbd><kbd>Q</kbd></span>
                  <div className="qs-bubble">
                    <span className="lab">Listening <Bars /></span>
                    <b>“Is April a good time to visit Tokyo?”</b>
                  </div>
                  <div className="qs-reply">
                    <img src="/search/pic-blossom.webp" alt="" />
                    <span>Yes. It’s cherry blossom season.<em>Book hotels early.</em></span>
                  </div>
                </div>
                <div className="qs-way-text">
                  <span className="keys"><kbd>Tab</kbd>+<kbd>Q</kbd></span>
                  <h3>Ask out loud</h3>
                  <p>Hold the keys, say your question, let go.</p>
                </div>
              </article>

              <article className="qs-way">
                <div className="qs-scene mint" aria-hidden="true">
                  <p className="qs-paper">A strong solar storm is on its way. After dark you may see the <mark>Northern Lights</mark>.</p>
                  <div className="qs-minicard">
                    <img src="/search/pic-aurora.webp" alt="" />
                    <div><b>Northern Lights</b>Glowing curtains of light near the poles.</div>
                  </div>
                </div>
                <div className="qs-way-text">
                  <span className="keys"><kbd>Select</kbd>then<kbd>Tab</kbd>+<kbd>Q</kbd></span>
                  <h3>Look up words you see</h3>
                  <p>Highlight a word on any page. It’s explained right there.</p>
                </div>
              </article>

              <article className="qs-way">
                <div className="qs-scene peach" aria-hidden="true">
                  <div className="qs-dlg">
                    <span className="box" />
                    <span className="x">×</span>
                    <span><b>Location is not available</b>D:\Clients is not accessible.<code>Error 0x80070005</code></span>
                  </div>
                  <div className="qs-acts">
                    <span className="qs-act"><Bolt size={14} />Explain image</span>
                    <span className="qs-act ok"><Check size={14} />Text copied · free</span>
                  </div>
                  <div className="qs-reply">
                    <span>You don’t have permission for this folder.<em>Ask its owner, or change it in Properties › Security.</em></span>
                  </div>
                </div>
                <div className="qs-way-text">
                  <span className="keys"><kbd>Tab</kbd>+<kbd>S</kbd></span>
                  <h3>Ask about your screen</h3>
                  <p>Box an error, a chart or a photo. Or copy text out of it, free.</p>
                </div>
              </article>
            </div>

            <p className="qs-note"><Check size={18} /><span><b>Your Tab key still works.</b> Tap it and you get a normal Tab. Quick Search only steps in when you hold Tab with Q or S.</span></p>
          </div>
        </section>

        {/* ============ WHAT COMES BACK ============ */}
        <section className="qs-band white" aria-labelledby="back-h">
          <div className="qs-wrap">
            <div className="qs-head center">
              <p className="qs-eyebrow">What comes back</p>
              <h2 className="qs-h2" id="back-h">One short answer. <span className="v">With proof.</span></h2>
              <p className="qs-lede">No ten blue links. No life story before the recipe.</p>
            </div>

            <div className="qs-back">
              <figure className="qs-thread">
                <figcaption className="qs-sr">A Quick Search conversation. Q1: How far away is the Moon? About 384,400 km away on average. Q2: How long would it take to drive there? About 160 days at 100 km/h.</figcaption>
                <div className="qs-card-head" aria-hidden="true"><Mark size={22} /><b>Quick Search</b><span className="esc">Esc</span></div>
                <div className="qs-card-body" aria-hidden="true">
                  <div className="turn">
                    <p className="qs-q"><span className="n">Q1</span>How far away is the Moon?</p>
                    <div className="qs-pic"><img src="/search/pic-moon.webp" alt="" /><i className="qs-mk">1</i><span className="count">1 / 10</span></div>
                    <p className="qs-big">About 384,400 km away.</p>
                    <div className="qs-meta">
                      <span className="qs-mkgrp"><i className="qs-mk">2</i><span className="qs-chip"><i style={{ background: "#1f4fbf" }}>N</i>nasa.gov</span></span>
                      <span className="qs-chip"><i style={{ background: "#22356b" }}>R</i>rmg.co.uk</span>
                      <span className="qs-mkgrp"><i className="qs-mk">3</i><span className="qs-chip tts"><Bars />Reading aloud</span></span>
                    </div>
                  </div>
                  <div className="turn">
                    <p className="qs-q"><span className="n">Q2</span><span>How long would it take to drive <span className="there">there</span>?</span><i className="qs-mk">4</i></p>
                    <p className="qs-big">About 160 days, nonstop at 100 km/h.</p>
                  </div>
                </div>
                <div className="qs-floor" aria-hidden="true"><Search /><span>Ask a follow-up…</span><i className="mic"><Mic size={16} /></i></div>
              </figure>

              <ol className="qs-points">
                <li><span className="num">1</span><span><b>A picture first</b><span>Real photos from the pages it read, so you get it at a glance.</span></span></li>
                <li><span className="num">2</span><span><b>Sources you can open</b><span>Every answer shows where it came from.</span></span></li>
                <li><span className="num">3</span><span><b>Read out loud</b><span>Keep your eyes on your work. Turn the voice off any time.</span></span></li>
                <li><span className="num">4</span><span><b>Keep asking</b><span>It knows “there” means the Moon. No need to repeat yourself.</span></span></li>
              </ol>
            </div>
          </div>
        </section>

        {/* ============ FREE ============ */}
        <section className="qs-band tint" id="free" aria-labelledby="free-h">
          <div className="qs-wrap">
            <div className="qs-free">
              <div className="qs-fifty">
                <p className="qs-eyebrow">Free, every day</p>
                <p className="n" aria-hidden="true">50</p>
                <h2 className="w" id="free-h"><span className="qs-sr">50 </span>free searches,<br />every day.</h2>
              </div>
              <ul className="qs-facts">
                <li><span className="ic a"><User /></span><span><b>No account, no sign-up</b><span>Install it and ask. That’s all.</span></span></li>
                <li><span className="ic b"><Pc /></span><span><b>Your history stays on your PC</b><span>Clear it any time in Settings.</span></span></li>
                <li><span className="ic c"><Reload size={20} /></span><span><b>Refills every midnight</b><span>Use them up today, get 50 more tomorrow.</span></span></li>
              </ul>
            </div>
          </div>
        </section>

        {/* ============ FAQ ============ */}
        <section className="qs-band white" id="faq" aria-labelledby="faq-h">
          <div className="qs-wrap">
            <div className="qs-head center">
              <p className="qs-eyebrow">Before you install</p>
              <h2 className="qs-h2" id="faq-h">Good questions.</h2>
            </div>
            <div className="qs-faq">
              {QS_FAQ.map((f, i) => (
                <details key={f.q} open={i === 0}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ============ FINAL ============ */}
        <section className="qs-final-wrap" id="get" aria-labelledby="get-h">
          <div className="qs-wrap">
            <div className="qs-final">
              <span className="keys" aria-hidden="true"><span className="qs-key wide">Tab</span><span className="plus">+</span><span className="qs-key">Q</span></span>
              <h2 id="get-h">One tab. Finally.</h2>
              <p className="qs-lede">Download Quick Search AI free, then hold Tab + Q and ask your first question.</p>
              <div className="qs-cta"><GetButton where="final" tone="white" /></div>
              <ul className="qs-ticks">
                <li><Check />No account</li>
                <li><Check />50 free searches a day</li>
                <li><Check />Windows 10 &amp; 11</li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer className="qs-foot">
        <div className="qs-wrap">
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}><Mark size={24} />Quick Search AI is made by Tubelight.</span>
          <nav aria-label="Footer">
            <a className="fl" href="https://tubelight.net" target="_blank" rel="noopener">Tubelight</a>
            <a className="fl" href="mailto:contact@tubelight.net">contact@tubelight.net</a>
            <span>© 2026 Tubelight</span>
          </nav>
        </div>
      </footer>
    </div>
  );
}
