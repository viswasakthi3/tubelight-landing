'use client';

import { credits, meterState, n, shortId } from '@/lib/format';

/* The small pieces every tab uses. Kept together because each one is a handful of lines
   and a file per component would be twelve files of imports. */

export function Stat({ label, value, sub, tone }: { label?: any; value?: any; sub?: any; tone?: any }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className={`stat-value${tone ? ` is-${tone}` : ''}`}>{value}</div>
      {sub ? <div className="stat-sub">{sub}</div> : null}
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Onboarding — what each installation was shown about its three shortcuts.
   The app decides it (t2u_app/renderer/lib/featureTips.js); the backend summarises
   it per device (t2u_backend/onboarding.js); these draw the summary.
   --------------------------------------------------------------------------- */

export const ONBOARDING_FEATURES = [
  { id: 'alt-e', short: 'Alt+E', name: 'Alt + E' },
  { id: 'tab-q', short: 'Tab+Q', name: 'Tab + Q' },
  { id: 'tab-r', short: 'Tab+R', name: 'Tab + R' }
];

/* One status per shortcut, as a tone, a word and a sentence for the tooltip. The tone
   carries an icon as well as a colour, so the states differ in shape, not hue alone. */
export function onboardingState(feature, f) {
  const short = ONBOARDING_FEATURES.find(x => x.id === feature)?.short || feature;
  if (!f || f.status === 'none') {
    return {
      tone: 'none',
      text: short,
      title: feature === 'alt-e' ? 'Tutorial not recorded yet' : 'Tip not shown yet'
    };
  }
  if (f.status === 'using') {
    return { tone: 'using', text: short, title: 'Using it' };
  }
  if (feature === 'alt-e') {
    if (f.status === 'finished') return { tone: 'demo', text: short, title: 'Finished the tutorial, no real use yet' };
    if (f.status === 'skipped') return { tone: 'skipped', text: `${short} skipped`, title: 'Left the tutorial before the end' };
    return { tone: 'tip', text: short, title: 'Tutorial shown, not finished' };
  }
  if (f.status === 'demo') return { tone: 'demo', text: short, title: 'Watched the demo, not used yet' };
  return {
    tone: 'tip',
    text: `${short} ${Math.min(f.tipShows || 0, 2)}/2`,
    title: `Tip shown ${f.tipShows === 1 ? 'once' : `${f.tipShows} times`}, not used yet`
  };
}

function OnboardingIcon({ tone }) {
  if (tone === 'using') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
    );
  }
  if (tone === 'demo') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }
  if (tone === 'tip') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" aria-hidden="true">
        <circle cx="12" cy="12" r="8" />
      </svg>
    );
  }
  if (tone === 'skipped') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" aria-hidden="true">
        <path d="M5 12h14" />
      </svg>
    );
  }
  return null;
}

export function OnboardingBadge({ feature, summary }: any) {
  const state = onboardingState(feature, summary);
  return (
    <span className={`ob-badge is-${state.tone}`} title={state.title}>
      <OnboardingIcon tone={state.tone} />
      {state.text}
    </span>
  );
}

/** The list's three badges. A dash for a device whose app has sent nothing yet. */
export function OnboardingBadges({ onboarding }: any) {
  if (!onboarding) return <span className="cell-faint">—</span>;
  return (
    <div className="ob-badges">
      {ONBOARDING_FEATURES.map(f => (
        <OnboardingBadge key={f.id} feature={f.id} summary={onboarding.features?.[f.id]} />
      ))}
    </div>
  );
}

/* The tier badge. `unlimited` outranks the tier itself — see `tierOf` — because to
   somebody scanning a list it is the most important thing about the row. */
export function TierPill({ tier }: any) {
  const label = String(tier || 'free');
  return <span className={`pill ${label}`}>{label}</span>;
}

/**
 * Credits used against credits available.
 *
 * The bar exists because "12 of 15" makes the reader do the division and a column of
 * forty of them makes them do it forty times. An unlimited device gets no bar at all
 * rather than a full one — a full bar means "out of credits", which is the opposite.
 */
export function Meter({ used, limit, unlimited }: any) {
  if (unlimited || limit === null || limit === undefined) {
    return (
      <div className="meter">
        <div className="meter-top">
          <b>{credits(used)}</b>
          <span>used · no ceiling</span>
        </div>
      </div>
    );
  }

  const { pct, tone } = meterState(used, limit);
  const remaining = Math.max(0, Math.round(((Number(limit) || 0) - (Number(used) || 0)) * 100) / 100);
  return (
    <div className="meter">
      <div className="meter-top">
        <b style={{ color: remaining === 0 ? 'var(--danger, #ef4444)' : 'inherit' }}>
          {credits(remaining)} left
        </b>
        <span>
          ({credits(used)}/{credits(limit)} used)
        </span>
      </div>
      <div className="meter-track">
        <div className={`meter-fill ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* A device id, shortened, with the whole thing in the title attribute and a click to
   copy. An operator needs the full id to paste into a query often enough that making
   them select 40 characters of monospace out of a table cell is a real papercut. */
export function DeviceId({ id }: any) {
  return (
    <button
      className="device-id"
      style={{ background: 'none', border: 0, padding: 0, cursor: 'copy', textAlign: 'left' }}
      title={`${id}\n(click to copy)`}
      onClick={event => {
        event.stopPropagation();
        navigator.clipboard?.writeText(id).catch(() => {});
      }}
    >
      {shortId(id)}
    </button>
  );
}

/** Somebody's name and address, or an honest admission that we have neither. */
export function Who({ user }: any) {
  const name = user?.name || user?.account?.username;
  const email = user?.email || user?.account?.email;

  if (user?.isOwn) {
    return (
      <div style={{ minWidth: 0 }}>
        <div className="cell-strong" style={{ color: 'var(--accent)' }}>
          {name || 'Dev Machine'} <span className="pill small" style={{ marginLeft: 4, background: 'var(--accent-soft)', color: 'var(--accent)', fontSize: 10, padding: '1px 5px' }}>Our Team</span>
        </div>
        {email ? (
          <div className="cell-faint" style={{ wordBreak: 'break-all' }}>
            {email}
          </div>
        ) : null}
      </div>
    );
  }

  if (!name && !email) {
    return <span className="cell-faint">anonymous install</span>;
  }

  return (
    <div style={{ minWidth: 0 }}>
      {name ? <div className="cell-strong">{name}</div> : null}
      {email ? (
        <div className={name ? 'cell-faint' : 'cell-strong'} style={{ wordBreak: 'break-all' }}>
          {email}
        </div>
      ) : null}
    </div>
  );
}

/* A ranked bar list — surfaces, tiers, strategies. The fill sits behind the label rather
   than beside it, so the name stays readable at any length and the widths are still
   comparable down the column. */
export function RankList({ rows, valueKey = 'runs', renderMeta }: any) {
  if (!rows?.length) return <div className="empty">Nothing recorded yet.</div>;
  const max = Math.max(...rows.map(r => Number(r[valueKey]) || 0), 1);

  return (
    <div>
      {rows.map(row => (
        <div className="rank-row" key={row.name}>
          <div className="rank-fill" style={{ width: `${((Number(row[valueKey]) || 0) / max) * 100}%` }} />
          <span className="rank-name">{row.name}</span>
          <span className="rank-meta">{renderMeta ? renderMeta(row) : n(row[valueKey])}</span>
        </div>
      ))}
    </div>
  );
}

/* While the first fetch is in flight. Rows of grey blocks rather than a spinner, because
   they hold the table's layout still — a spinner that becomes a table makes the whole
   page jump, and an operator who was already reaching for a row loses it. */
export function TableSkeleton({ rows = 6, cols = 5 }: any) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r}>
          {Array.from({ length: cols }).map((__, c) => (
            <td key={c}>
              <div className="skeleton" style={{ width: c === 0 ? '70%' : `${40 + ((r + c) % 3) * 15}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

export function Empty({ title, subtitle, children }: { title?: any; subtitle?: any; children?: any }) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      {subtitle ? <p>{subtitle}</p> : null}
      {children ? <p>{children}</p> : null}
    </div>
  );
}

/* One error component for every tab, so a backend that is down looks the same wherever
   you happen to be standing when it goes down. */
export function ErrorNote({ error, onRetry }: { error?: any; onRetry?: any }) {
  if (!error) return null;
  return (
    <div className="notice bad">
      <span style={{ flex: 1 }}>{error}</span>
      {onRetry ? (
        <button className="btn small" onClick={onRetry}>
          Retry
        </button>
      ) : null}
    </div>
  );
}
