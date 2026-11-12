const itemStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 14 };
const h: React.CSSProperties = { margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em" };
const p: React.CSSProperties = { margin: 0, color: "#57536E" };

export function Who() {
  return (
    <section className="sec" style={{ paddingTop: 0 }}>
      <div className="wrapx">
        <div className="head">
          <h2 className="h2">Made for people who read hard things.</h2>
        </div>
        <div className="who">
          <div style={itemStyle}>
            <span className="whoi" style={{ background: "#FFF4D6", color: "#8A5A00" }}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 9l10-5 10 5-10 5z" /><path d="M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" /></svg>
            </span>
            <p className="disp" style={h}>Students</p>
            <p style={p}>JEE, NEET, boards or college. Stuck at 1 a.m. with no teacher to ask? Select it and keep going.</p>
          </div>
          <div style={itemStyle}>
            <span className="whoi" style={{ background: "#E6F1FF", color: "#1E5AA8" }}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6" /><path d="M10 3v6L4.5 18.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3" /></svg>
            </span>
            <p className="disp" style={h}>Engineers &amp; researchers</p>
            <p style={p}>New paper, new jargon. Get the gist of a term without losing your place.</p>
          </div>
          <div style={itemStyle}>
            <span className="whoi" style={{ background: "#E3F6EC", color: "#146B44" }}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z" /></svg>
            </span>
            <p className="disp" style={h}>Curious minds</p>
            <p style={p}>Reading about money, space or health? Finally get the parts that never quite made sense.</p>
          </div>
        </div>
        <p style={{ margin: "40px 0 0", fontSize: 16, color: "#6F6B86" }}>Works wherever you can select text — Chrome, Edge, PDF readers, Word, Notion, Slack, VS Code — on Windows 10 and 11.</p>
      </div>
    </section>
  );
}
