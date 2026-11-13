const NO = (
  <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="10" fill="#F1EEF6" />
    <path d="M8 12h8" stroke="#8C88A2" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const YES = (
  <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="10" fill="#22B573" />
    <path d="m7.5 12.5 3 3 6-7" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ROWS: [string, string, string][] = [
  ["Where you go", "A new tab — and you lose your place", "Nowhere. It opens beside your page"],
  ["What you do", "Type a question, then dig through results", "Press Alt + E, or type a topic"],
  ["What you get", "Long articles, long videos or a wall of text", "Pictures and a voice about exactly what you selected"],
  ["How long", "Minutes", "Under 15 seconds on Fast, up to 30 on Rich"],
];

export function Comparison() {
  return (
    <section className="sec" style={{ paddingTop: 0 }}>
      <div className="wrapx">
        <div className="head">
          <h2 className="h2">Why not just Google it?</h2>
          <p className="lede">Or ask ChatGPT? Both pull you away from what you’re reading. Tubelight explains it right where you are.</p>
        </div>
        <div className="cmp">
          <div className="crow chead">
            <span className="ck" />
            <span className="cold" style={{ color: "#6F6B86" }}>Googling or ChatGPT</span>
            <span className="cnew">
              <img src="/brand/mark.png" alt="" style={{ display: "block", width: 20, height: "auto" }} />
              Tubelight
            </span>
          </div>
          {ROWS.map(([k, a, b]) => (
            <div className="crow" key={k}>
              <span className="ck">{k}</span>
              <span className="cold">{NO}{a}</span>
              <span className="cnew">{YES}{b}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
