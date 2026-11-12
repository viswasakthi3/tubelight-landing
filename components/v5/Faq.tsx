import { FAQS } from "@/lib/faqs";

export function V5Faq() {
  return (
    <section id="faq" className="sec" style={{ paddingTop: 0, scrollMarginTop: 76 }}>
      <div className="wrapx" style={{ maxWidth: 900 }}>
        <div className="head">
          <h2 className="h2">Questions, answered.</h2>
        </div>
        <div>
          {FAQS.map((f) => (
            <details className="qa" key={f.q}>
              <summary>
                {f.q}
                <span className="plus" aria-hidden="true" />
              </summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
