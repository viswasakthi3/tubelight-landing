'use client';

import { ago, n, stamp } from '@/lib/format';
import { ONBOARDING_FEATURES, OnboardingBadge } from './bits';

/* One installation's onboarding, in the detail drawer.
 *
 * The question it answers is the operator's: "did this person see the Alt + E
 * walkthrough, the Tab + Q tip, the Read Aloud tip — and what did they do?" So it is
 * three short histories, one per shortcut, oldest first, each ending in what happens
 * next. App opens and individual Alt + E runs are counts at the top rather than rows;
 * a hundred "opened the app" lines would bury the five that matter.
 *
 * The "what happens next" lines restate the app's rules (lib/featureTips.js in
 * t2u_app). If those change, change these with them.
 */

const HOW = {
  later: 'Pressed Maybe later',
  'no-thanks': 'Pressed No thanks',
  close: 'Closed it (×)',
  'not-now': 'Left with Not now — offered again next open',
  'skip-button': 'Skipped the tutorial',
  logo: 'Left through the logo'
};

const FROM = {
  tip: 'from the tip',
  switcher: 'from the tutorial switcher',
  tutorials: 'from Tutorials'
};

function describe(event) {
  const d = event.detail || {};
  switch (event.kind) {
    case 'tutorial_shown':
      return { text: d.firstRun ? 'Tutorial shown (first run)' : 'Tutorial shown' };
    case 'tutorial_finished':
      return { text: 'Finished → home screen', tone: 'accent' };
    case 'tutorial_skipped':
      return { text: HOW[d.how] || 'Left the tutorial before the end', tone: 'warn' };
    case 'tip_shown':
      return { text: `Tip shown, ${d.showing || 1} of 2` };
    case 'tip_demo':
      return { text: 'Clicked Show demo' };
    case 'tip_dismissed':
      return { text: HOW[d.how] || 'Dismissed the tip' };
    case 'demo_opened':
      return { text: `Opened the demo page ${FROM[d.from] || ''}`.trim() };
    case 'demo_watched':
      return { text: 'Watched a third of the demo video', tone: 'accent' };
    case 'demo_finished':
      return { text: 'Finished the demo (Done)', tone: 'accent' };
    case 'feature_used':
      return { text: event.feature === 'alt-e' ? 'First real use' : 'First real use — tip retired', tone: 'good' };
    default:
      return { text: event.kind.replace(/_/g, ' ') };
  }
}

function nextStep(feature, f, summary) {
  if (!f || f.used) return null;
  if (feature === 'alt-e') {
    if (f.tutorial === 'skipped' || f.tutorial === 'shown') return 'Tutorial is offered again on the next open until it is finished';
    return null;
  }
  const shows = f.tipShows || 0;
  if (shows >= 2) return 'Shown twice without use — retired';
  if (shows === 1) return 'One last reminder, on an open 3+ days after the first';
  if (feature === 'tab-q') {
    return `Waits for open 3 and 3 successful Alt + E before an open (now ${n(summary.opens)} opens, ${n(summary.altEUses)} uses)`;
  }
  return `Waits for open 4, 5 successful Alt + E and the Tab + Q tip on an earlier day (now ${n(summary.opens)} opens, ${n(summary.altEUses)} uses)`;
}

export default function OnboardingSection({ summary, events }) {
  if (!summary && !events?.length) {
    return (
      <div className="drawer-section">
        <h3>Onboarding</h3>
        <span className="cell-faint">
          Nothing recorded yet — this installation is on an app version before onboarding history, or has
          not been opened since.
        </span>
      </div>
    );
  }

  const byFeature = { 'alt-e': [], 'tab-q': [], 'tab-r': [] };
  for (const event of events || []) {
    if (byFeature[event.feature]) byFeature[event.feature].push(event);
  }

  return (
    <div className="drawer-section">
      <h3>Onboarding</h3>
      {summary && (
        <div className="ob-stats">
          <div className="ob-stat">
            <span>App opens</span>
            <b>{n(summary.opens)}</b>
          </div>
          <div className="ob-stat">
            <span>Alt + E uses</span>
            <b>{n(summary.altEUses)}</b>
          </div>
          <div className="ob-stat">
            <span>Last tip</span>
            <b title={stamp(summary.lastTipAt)}>{summary.lastTipAt ? ago(summary.lastTipAt) : '—'}</b>
          </div>
        </div>
      )}

      {ONBOARDING_FEATURES.map(({ id, name }) => {
        const f = summary?.features?.[id];
        /* Newest first from the server; read top to bottom as it happened. */
        const list = [...byFeature[id]].reverse();
        const next = summary ? nextStep(id, f, summary) : null;
        return (
          <section className="ob-feature" key={id}>
            <div className="ob-feature-head">
              <span>
                {name} <small>· {id === 'alt-e' ? 'tutorial' : 'tip'}</small>
              </span>
              <OnboardingBadge feature={id} summary={f} />
            </div>
            {list.length ? (
              <div className="ob-events">
                {list.map(event => {
                  const { text, tone } = describe(event);
                  return (
                    <span key={event.id} style={{ display: 'contents' }}>
                      <time dateTime={event.at} title={stamp(event.at)}>
                        {stamp(event.at)}
                      </time>
                      <span className={tone ? `is-${tone}` : ''}>
                        {text}
                        {event.open ? <span className="cell-faint"> — open {event.open}</span> : null}
                      </span>
                    </span>
                  );
                })}
                {next && (
                  <>
                    <time className="is-next">next</time>
                    <span className="is-next">{next}</span>
                  </>
                )}
              </div>
            ) : (
              <div className="ob-empty">{next || 'Nothing yet.'}</div>
            )}
          </section>
        );
      })}
    </div>
  );
}
