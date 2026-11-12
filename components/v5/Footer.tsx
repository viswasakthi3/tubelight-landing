export function V5Footer() {
  return (
    <footer style={{ borderTop: "1px solid #ECE7F3", padding: "36px 0 48px" }}>
      <div className="wrapx" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 18 }}>
        <span style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px 16px" }}>
          <img src="/brand/logo.png" alt="Tubelight" style={{ display: "block", height: 26, width: "auto" }} />
          <span style={{ fontSize: 15, color: "#6F6B86" }}>Understand anything in seconds.</span>
        </span>
        <span style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 24, fontSize: 15 }}>
          <a href="#how" className="nl" style={{ fontSize: 15 }}>How it works</a>
          <a href="#examples" className="nl" style={{ fontSize: 15 }}>Examples</a>
          <a href="#faq" className="nl" style={{ fontSize: 15 }}>FAQ</a>
          <a href="https://search.tubelight.net" target="_blank" rel="noopener" className="nl" style={{ fontSize: 15 }}>Quick Search AI</a>
          <span style={{ color: "#6F6B86" }}>© 2026 Tubelight</span>
        </span>
      </div>
    </footer>
  );
}
