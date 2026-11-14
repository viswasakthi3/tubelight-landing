import { DemoMount, Film, GetButton, PageMount } from "./client";
import { DEMO_QUESTIONS, type DemoQuestion } from "./demo";
import { Back, Bolt, Check, Copy, Fwd, Mark, Mic, Pc, Plus, Reload, Search, User } from "./icons";

export const QS_FAQ: { q: string; a: string }[] = [
  {
    q: "Is it really free?",
    a: "Yes. Each device gets 50 searches per day, with no account or card required. Copying text out of a screenshot happens on your PC and doesn’t use a search.",
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
    a: "Your question is sent online to generate an answer. Your search history is saved on your PC, and you can clear it any time in Settings.",
  },
  {
    q: "Does it work on a Mac or my phone?",
    a: "Not yet. Quick Search runs on Windows 10 and 11. On your phone now? Send the link to your PC and install it there.",
  },
];

/* The crowded tab strip: the same question searched again and again. The first three tabs can still be
   read; the rest are squeezed down to their icons, as in a real browser with 31 tabs. */
const TAB_C = ["#ea4335", "#4285f4", "#6c4df6", "#34a853", "#fa7b17", "#12b5cb", "#e52592", "#a142f4"];
const TAB_N = 26;
const TAB_READ = 3;

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
          <div className="qs-wrap qs-wide">
            <a className="qs-brand" href="#top">
              <Mark size={38} />
              <span><b>Quick Search AI</b><span className="by">by Tubelight</span></span>
            </a>
            <div className="qs-nav-links">
              <a className="nl" href="#how">How it works</a>
              <a className="nl" href="#faq">FAQ</a>
            </div>
          </div>
        </nav>

        <div className="qs-wrap qs-wide qs-hero-grid">
          <div className="qs-hero-words">
            <p className="qs-pill"><span className="qs-tube" aria-hidden="true" />Free AI answers for Windows</p>
            <h1 className="qs-h1">Stop opening <span className="v">new tabs.</span></h1>
            <p className="qs-hero-sub">
              Hold <kbd>Tab</kbd> + <kbd>Q</kbd> in any app and ask out loud. Let go, and the answer pops up in the corner.
            </p>
            <div className="qs-cta" data-hero-cta="">
              <div className="qs-cta-row">
                <GetButton where="hero" />
                <a className="qs-film-link" href="#film" data-film-link=""><span className="ring"><svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor" /></svg></span>Watch it work · 55s</a>
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
                A browser with 31 tabs, each one the same question searched again, and results that disagree.
                Quick Search answers in the corner: {first.big} {first.sub}
              </figcaption>
              <div className="qs-browser" aria-hidden="true">
                <div className="qs-tabs">
                  <div className="qs-tabs-strip">
                    {Array.from({ length: TAB_N }, (_, i) => (
                      <span key={i} className={`qs-tab${i === 0 ? " on" : ""}${i < TAB_READ ? ` w${i + 1}` : ""}`}>
                        <i style={{ background: TAB_C[i % TAB_C.length] }} />
                        {i < TAB_READ && <span data-tab="">{first.tabs[i]}</span>}
                      </span>
                    ))}
                  </div>
                  <span className="qs-newtab"><Plus size={16} /></span>
                  <span className="qs-tabcount">31 tabs</span>
                </div>
                <div className="qs-addr">
                  <Back /><Fwd /><Reload />
                  <div><Search /><span data-addr="">{first.addr}</span></div>
                </div>
                <div className="qs-results">
                  {first.results.map((r) => (
                    <div className="qs-res" key={r.url}>
                      <span className="u" data-res-url="">{r.url}</span>
                      <span className="t" data-res-title="">{r.title}</span>
                      <span className="s" />
                    </div>
                  ))}
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
                <b>Try it here</b>
                <span data-hint="">Hold Tab + Q on your keyboard, or press the keys.</span>
              </div>
              <div className="qs-pick" role="group" aria-label="Sample questions">
                {DEMO_QUESTIONS.map((d, i) => (
                  <button type="button" key={d.id} data-pick="" aria-pressed={i === 0}>{d.pick}</button>
                ))}
              </div>
            </div>
          </DemoMount>
        </div>
      </header>

      {/* a slim bar with the one button, only once the hero button has scrolled away */}
      <div className="qs-sticky" data-sticky="" data-show="false" inert>
        <div className="qs-wrap qs-wide">
          <a className="qs-brand" href="#top"><Mark size={30} /><span><b>Quick Search AI</b></span></a>
          <GetButton where="sticky" size="sm" />
        </div>
      </div>
      <PageMount />

      <main id="main">
        {/* ============ FILM ============ */}
        <section className="qs-band white" aria-labelledby="film-h">
          <div className="qs-wrap qs-film">
            <div className="qs-head center">
              <p className="qs-eyebrow">See it for real</p>
              <h2 className="qs-h2" id="film-h">55 seconds. <span className="v">Sound on.</span></h2>
              <p className="qs-lede">A pile of tabs becomes one answer, read out loud.</p>
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
              <p className="qs-lede">Works on top of any app. Nothing to switch to.</p>
            </div>

            <div className="qs-ways">
              <article className="qs-way lav">
                <div className="qs-scene" aria-hidden="true">
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
                  <span className="keys"><kbd>Tab</kbd><i>+</i><kbd>Q</kbd></span>
                  <h3>Ask out loud</h3>
                  <p>Hold the keys, ask, let go.</p>
                </div>
              </article>

              <article className="qs-way mint">
                <div className="qs-scene" aria-hidden="true">
                  <p className="qs-paper">A strong solar storm is on its way. After dark you may see the <mark>Northern Lights</mark>.</p>
                  <div className="qs-minicard">
                    <img src="/search/pic-aurora.webp" alt="" />
                    <div><b>Northern Lights</b>Glowing curtains of light near the poles.</div>
                  </div>
                </div>
                <div className="qs-way-text">
                  <span className="keys"><kbd>Select</kbd><i>then</i><kbd>Tab</kbd><i>+</i><kbd>Q</kbd></span>
                  <h3>Look up words you see</h3>
                  <p>Highlight a word on any page. It’s explained right there.</p>
                </div>
              </article>

              <article className="qs-way peach">
                <div className="qs-scene" aria-hidden="true">
                  <div className="qs-snip">
                    <div className="qs-dlg">
                      <span className="x">×</span>
                      <span><b>Location is not available</b>D:\Clients is not accessible.<code>Error 0x80070005</code></span>
                    </div>
                    <span className="sel" />
                    <span className="tag">Tab + S</span>
                    <svg className="cross" width="22" height="22" viewBox="0 0 22 22"><path d="M11 1v20M1 11h20" stroke="#1f1d2b" strokeWidth="2.2" strokeLinecap="round" /></svg>
                  </div>
                  <div className="qs-att">
                    <div className="top">
                      <span className="thumb" />
                      <span><b>Screenshot attached</b>What do you want to do?</span>
                    </div>
                    <div className="choices">
                      <span className="qs-act"><Bolt size={14} />Ask about it</span>
                      <span className="or">or</span>
                      <span className="qs-act line"><Copy size={14} />Copy text</span>
                    </div>
                  </div>
                </div>
                <div className="qs-way-text">
                  <span className="keys"><kbd>Tab</kbd><i>+</i><kbd>S</kbd></span>
                  <h3>Ask about your screen</h3>
                  <p>Box any part of your screen. Ask about it, or copy the text out, free.</p>
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

            <figure className="qs-anno">
              <figcaption className="qs-sr">A Quick Search conversation. Q1: How far away is the Moon? About 384,400 km away, from nasa.gov and rmg.co.uk. Q2: How long would it take to drive there? About 160 days at 100 km/h.</figcaption>
              <span className="qs-anno-bg" aria-hidden="true" />
              <div className="r r-head" aria-hidden="true"><div className="qs-card-head"><Mark size={22} /><b>Quick Search</b><span className="esc">Esc</span></div></div>
              <div className="r r-q" aria-hidden="true"><p className="qs-q"><span className="n">Q1</span>How far away is the Moon?</p></div>
              <div className="r r-pic" aria-hidden="true"><div className="qs-pic"><img src="/search/pic-moon.webp" alt="" /><span className="count">1 / 10</span></div><i className="qs-mk">1</i></div>
              <div className="r r-big" aria-hidden="true"><p className="qs-big">About 384,400 km away.</p></div>
              <div className="r r-src" aria-hidden="true">
                <div className="qs-meta">
                  <span className="qs-chip"><i style={{ background: "#1f4fbf" }}>N</i>nasa.gov</span>
                  <span className="qs-chip"><i style={{ background: "#22356b" }}>R</i>rmg.co.uk</span>
                </div>
                <i className="qs-mk">2</i>
              </div>
              <div className="r r-q2" aria-hidden="true"><p className="qs-q"><span className="n">Q2</span><span>How long would it take to drive <span className="there">there</span>?</span></p><i className="qs-mk">3</i></div>
              <div className="r r-big2" aria-hidden="true"><p className="qs-big">About 160 days, nonstop at 100 km/h.</p></div>
              <div className="r r-floor" aria-hidden="true">
                <div className="qs-floor"><Search /><span>Ask a follow-up…</span><span className="qs-chip tts"><Bars />Reading aloud</span><i className="mic"><Mic size={16} /></i></div>
                <i className="qs-mk">4</i>
              </div>

              <p className="qs-call c1"><span className="in"><span className="num">1</span><span><b>A picture first</b><span>Real photos from the pages it read.</span></span></span></p>
              <p className="qs-call c2"><span className="in"><span className="num">2</span><span><b>Sources you can open</b><span>Every answer shows where it came from.</span></span></span></p>
              <p className="qs-call c3"><span className="in"><span className="num">3</span><span><b>Keep asking</b><span>It knows “there” means the Moon.</span></span></span></p>
              <p className="qs-call c4"><span className="in"><span className="num">4</span><span><b>Read out loud</b><span>Turn the voice off any time.</span></span></span></p>
            </figure>
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
