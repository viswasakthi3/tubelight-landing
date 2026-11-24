'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { get, post } from '@/lib/client';
import { ago, ms, n, stamp } from '@/lib/format';
import { DeviceId, Empty, ErrorNote, Who } from './bits';
import VideoDeckModal from './VideoDeckModal';

const KINDS = [
  { id: 'all', label: 'Everything' },
  { id: 'instant', label: 'Explanations' },
  { id: 'questions', label: 'Quick Searches (Tab+Q)' },
  { id: 'notes', label: 'User Notes' },
  { id: 'clarity', label: 'ClarityFrame' }
];

function ModeBadge({ level, profile }) {
  const lvl = Number(level) || 1;
  const name = lvl === 3 ? 'Rich' : lvl === 2 ? 'Mid' : 'Fast';
  return (
    <span className={`pill mode-${lvl}`} title={`Mode ${lvl} (${name})`}>
      Mode {lvl} · {name}
    </span>
  );
}

function SelectedTextBox({ text }) {
  if (!text) return null;
  return (
    <div
      style={{
        marginTop: 6,
        marginBottom: 6,
        background: 'var(--surface-2)',
        borderLeft: '3px solid var(--accent)',
        borderRadius: 'var(--radius-sm)',
        padding: '6px 10px',
        fontSize: 12
      }}
    >
      <div
        style={{
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'var(--accent)',
          fontWeight: 600,
          marginBottom: 2
        }}
      >
        Selected Text Highlighted
      </div>
      <div className="mono" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'var(--text)' }}>
        {text}
      </div>
    </div>
  );
}

export default function ItemsTab({ selected, onSelect }) {
  const [items, setItems] = useState<any>(null);
  const [kind, setKind] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<any>(null);
  const [detail, setDetail] = useState<any>(null);
  const [viewingImage, setViewingImage] = useState<any>(null);
  const [generatingId, setGeneratingId] = useState<any>(null);
  const [pullingId, setPullingId] = useState<any>(null);
  const [activeDeck, setActiveDeck] = useState<any>(null);

  const [search, setSearch] = useState('');
  const [matches, setMatches] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const searchRef = useRef(null);

  const deviceId = selected?.deviceId;
  const listController = useRef(null);
  const detailController = useRef(null);

  const load = useCallback(async () => {
    if (!deviceId) return;
    listController.current?.abort();
    const controller = new AbortController();
    listController.current = controller;
    setLoading(true);
    setError('');
    setItems(null);
    try {
      const result = await get(`user/${encodeURIComponent(deviceId)}/items?kind=${kind}&limit=100`, { signal: controller.signal });
      if (!controller.signal.aborted) setItems(result.items || []);
    } catch (err: any) {
      if (!controller.signal.aborted) setError(err.message);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [deviceId, kind]);

  useEffect(() => {
    setExpanded(null);
    setDetail(null);
    if (deviceId) load();
    else setItems(null);
    return () => { listController.current?.abort(); detailController.current?.abort(); };
  }, [deviceId, load]);

  useEffect(() => {
    setSearchError('');
    if (!search.trim()) {
      setMatches([]);
      return undefined;
    }
    const controller = new AbortController();
    searchRef.current?.abort();
    searchRef.current = controller;

    const id = setTimeout(async () => {
      setSearching(true);
      try {
        const result = await get(
          `user-list?q=${encodeURIComponent(search.trim())}&pageSize=8&exact=0&realOnly=0`,
          { signal: controller.signal }
        );
        if (!controller.signal.aborted) setMatches((result.users || []).filter(user => user.deviceId));
      } catch (err: any) {
        if (!controller.signal.aborted) { setMatches([]); setSearchError(err.message || 'Search is unavailable.'); }
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 300);

    return () => {
      clearTimeout(id);
      controller.abort();
    };
  }, [search]);

  async function expand(item) {
    detailController.current?.abort();
    if (expanded === item.id) {
      setExpanded(null);
      setDetail(null);
      return;
    }
    setExpanded(item.id);
    setDetail(null);
    const controller = new AbortController();
    detailController.current = controller;
    try {
      const result = await get(`user/${encodeURIComponent(deviceId)}/items/${encodeURIComponent(item.id)}`, { signal: controller.signal });
      if (!controller.signal.aborted) setDetail(result.item);
    } catch (err: any) {
      if (!controller.signal.aborted) setDetail({ error: err.message });
    }
  }

  async function generatePreview(id) {
    setGeneratingId(id);
    try {
      const res = await post(`preview-image/${encodeURIComponent(id)}`, {});
      if (res?.imageUrl) {
        setItems(prev => (prev || []).map(it => (it.id === id ? { ...it, imageUrl: res.imageUrl } : it)));
      }
    } catch (err: any) {
      alert(`Could not generate preview: ${err.message}`);
    } finally {
      setGeneratingId(null);
    }
  }

  async function handlePullMedia(item) {
    setPullingId(item.id);
    try {
      await post('request-media-pull', { deviceId, itemId: item.id });
      setItems(prev => (prev || []).map(it => (it.id === item.id ? { ...it, mediaPullStatus: 'pending' } : it)));
    } catch (err: any) {
      alert(`Could not request media from user: ${err.message}`);
    } finally {
      setPullingId(null);
    }
  }

  if (!deviceId) {
    return (
      <div className="card">
        <div className="card-body">
          <Empty title="Pick someone to see their saved work.">
            Saved items are scoped to an installation. Select a row from the Users tab, or search for
            someone below.
          </Empty>

          <div style={{ maxWidth: 460, margin: '14px auto 0' }}>
            <input
              className="input"
              style={{ width: '100%', maxWidth: 460 }}
              placeholder="Search by email, name or device ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              spellCheck={false}
              autoFocus
            />

            <div style={{ marginTop: 12 }}>
              <ErrorNote error={searchError} />
              {searching && <span className="cell-faint">Searching…</span>}

              {!searching &&
                matches.map(user => (
                  <div
                    key={user.deviceId}
                    className="rank-row"
                    style={{ cursor: 'pointer', gridTemplateColumns: '1fr auto' }}
                    onClick={() => onSelect(user, false)}
                  >
                    <span style={{ minWidth: 0 }}>
                      <Who user={user} />
                      <DeviceId id={user.deviceId} />
                    </span>
                    <span className="rank-meta">
                      {n(user.runCount)} runs · {ago(user.lastSeenAt)}
                    </span>
                  </div>
                ))}

              {!searching && !searchError && search.trim() && !matches.length && (
                <span className="cell-faint">Nobody matches that.</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="toolbar">
        <div style={{ minWidth: 0 }}>
          <Who user={selected} />
          <DeviceId id={deviceId} />
        </div>

        <div className="topbar-spacer" />

        <div className="seg">
          {KINDS.map(k => (
            <button key={k.id} aria-pressed={kind === k.id} onClick={() => setKind(k.id)}>
              {k.label}
            </button>
          ))}
        </div>

        <button className="btn small" onClick={load} disabled={loading}>
          {loading ? <span className="spinner" /> : null}
          <span>Refresh</span>
        </button>

        <button className="btn small ghost" onClick={() => onSelect(null, false)}>
          Pick someone else
        </button>
      </div>

      <ErrorNote error={error} onRetry={load} />

      {loading && !items ? (
        <div className="card">
          <div className="card-body">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <div className="skeleton" style={{ width: '45%', height: 13 }} />
                <div className="skeleton" style={{ width: '85%', height: 11, marginTop: 7 }} />
                <div className="skeleton" style={{ width: '30%', height: 10, marginTop: 7 }} />
              </div>
            ))}
          </div>
        </div>
      ) : !items?.length ? (
        <div className="card">
          <Empty title="Nothing recorded for this installation.">
            Runs are recorded server-side as they happen. An installation with none has either not
            generated anything yet, or did so before this record was kept.
          </Empty>
        </div>
      ) : (
        <>
          <p className="cell-faint" style={{ margin: '0 0 10px' }}>
            {n(items.length)} record{items.length === 1 ? '' : 's'} · newest first · click thumbnail to zoom
          </p>

          {items.map(item => {
            const isQuestion = item.kind === 'question';
            const isNote = item.kind === 'note';
            const isClarity = item.kind === 'clarity';

            return (
              <div className="item" key={`${item.kind}-${item.id}`}>
                <div className="item-with-media">
                  {/* Left thumbnail or type badge box */}
                  {isQuestion ? (
                    <div
                      className="item-thumb-box"
                      style={{
                        background: 'rgba(56, 189, 248, 0.08)',
                        border: '1px solid rgba(56, 189, 248, 0.25)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#38bdf8',
                        padding: 6,
                        textAlign: 'center'
                      }}
                    >
                      <span style={{ fontSize: 18, lineHeight: 1 }}>🔍</span>
                      <span style={{ fontSize: 10, fontWeight: 650, marginTop: 4 }}>
                        {item.surface === 'tabq' ? 'Tab+Q' : item.surface || 'Search'}
                      </span>
                    </div>
                  ) : isNote ? (
                    <div
                      className="item-thumb-box"
                      style={{
                        background: 'rgba(234, 179, 8, 0.08)',
                        border: '1px solid rgba(234, 179, 8, 0.25)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#eab308',
                        padding: 6,
                        textAlign: 'center'
                      }}
                    >
                      <span style={{ fontSize: 18, lineHeight: 1 }}>📝</span>
                      <span style={{ fontSize: 10, fontWeight: 650, marginTop: 4 }}>Note</span>
                    </div>
                  ) : (
                    <div className="item-thumb-box">
                      {item.mediaPullStatus === 'completed' ? (
                        <div
                          style={{ position: 'relative', width: '100%', height: '100%', cursor: 'pointer' }}
                          onClick={() => setActiveDeck(item)}
                          title="Click to watch video and view slides"
                        >
                          <img
                            src={`/api/media/item/${encodeURIComponent(item.id)}/${item.mediaAssets?.images?.[0] || 'image-0.png'}`}
                            alt={item.title || 'Slide'}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <div
                            style={{
                              position: 'absolute',
                              bottom: 3,
                              right: 3,
                              background: 'rgba(0,0,0,0.75)',
                              borderRadius: 3,
                              padding: '1px 4px',
                              fontSize: 9,
                              fontWeight: 700,
                              color: '#fff'
                            }}
                          >
                            ▶ PLAY
                          </div>
                        </div>
                      ) : item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.title || 'Explanation Image'}
                          onClick={() => setViewingImage({ url: item.imageUrl, title: item.title || item.preview })}
                          title="Click to view full image"
                        />
                      ) : (
                        <div className="item-thumb-placeholder">
                          <span>No image</span>
                          <button
                            className="btn small ghost"
                            style={{ fontSize: 10, padding: '2px 6px', marginTop: 4 }}
                            onClick={() => generatePreview(item.id)}
                            disabled={generatingId === item.id}
                          >
                            {generatingId === item.id ? <span className="spinner" /> : 'Render'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ minWidth: 0, width: '100%' }}>
                    {/* Top Row: Pills, Mode Badge, ID, Title */}
                    <div className="item-top" style={{ flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                      <span className={`pill ${isClarity ? 'dev' : isQuestion ? 'doubt' : isNote ? 'note' : 'plain'}`}>
                        {isClarity ? 'ClarityFrame' : isQuestion ? 'Quick Search' : isNote ? 'User Note' : 'Instant'}
                      </span>

                      {!isNote && (
                        <ModeBadge level={item.modeLevel || (isClarity ? 3 : 1)} profile={item.profile} />
                      )}

                      <span
                        className="mono cell-faint"
                        style={{
                          fontSize: 11,
                          background: 'var(--surface-2)',
                          padding: '2px 6px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--line-soft)'
                        }}
                        title={`Item ID: ${item.id}`}
                      >
                        {item.id}
                      </span>

                      {isNote && item.itemId && (
                        <span className="cell-faint" style={{ fontSize: 11 }}>
                          for: <code className="mono">{item.itemId}</code>
                        </span>
                      )}

                      <span className="item-title">
                        {isQuestion
                          ? (item.question || <em className="cell-faint">untitled search</em>)
                          : (item.title || <em className="cell-faint">untitled</em>)}
                      </span>

                      {isQuestion && item.verdict && (
                        <span className={`pill ${item.verdict === 'yes' ? 'ok' : item.verdict === 'no' ? 'bad' : 'plain'}`}>
                          Verdict: {item.verdict.toUpperCase()}
                        </span>
                      )}

                      {!isQuestion && !isNote && (
                        <span className={`pill ${item.status === 'ok' ? 'ok' : 'bad'}`}>
                          {item.status || 'unknown'}
                        </span>
                      )}

                      {/* Video Media Pull Action / Status Button */}
                      {!isQuestion && !isNote && (
                        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                          {item.mediaPullStatus === 'completed' ? (
                            <>
                              <span className="pill ok" style={{ fontSize: 11 }}>
                                ✓ Video Ready
                              </span>
                              <button
                                className="btn small"
                                style={{
                                  fontSize: 11,
                                  padding: '3px 9px',
                                  fontWeight: 650,
                                  background: 'var(--accent)',
                                  color: '#fff'
                                }}
                                onClick={() => setActiveDeck(item)}
                              >
                                ▶ Watch Video
                              </button>
                            </>
                          ) : item.mediaPullStatus === 'pending' ? (
                            <span
                              className="pill warn"
                              style={{ fontSize: 11 }}
                              title="Waiting for the user's desktop app to come online / connect"
                            >
                              ⏳ Pulling... (Waiting for user online)
                            </span>
                          ) : item.mediaPullStatus === 'missing' ? (
                            <span className="pill plain" style={{ fontSize: 11 }}>
                              ✕ Deleted on device
                            </span>
                          ) : (
                            <button
                              className="btn small ghost"
                              style={{ fontSize: 11, padding: '3px 9px' }}
                              onClick={() => handlePullMedia(item)}
                              disabled={pullingId === item.id}
                              title="Silently fetch the slides and audio from the user when their app connects"
                            >
                              {pullingId === item.id ? <span className="spinner" /> : '📹 Get Video'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Selected Text block if present */}
                    <SelectedTextBox text={item.selectedText} />

                    {/* Content previews */}
                    {isQuestion ? (
                      (item.answerPreview || item.answer) && (
                        <div
                          style={{
                            marginTop: 6,
                            marginBottom: 6,
                            fontSize: 12.5,
                            color: 'var(--text-dim)',
                            lineHeight: 1.5
                          }}
                        >
                          <strong style={{ color: 'var(--text)', marginRight: 6 }}>Answer:</strong>
                          {item.answerPreview || item.answer}
                        </div>
                      )
                    ) : isNote ? (
                      <div
                        style={{
                          marginTop: 6,
                          marginBottom: 6,
                          fontSize: 13,
                          lineHeight: 1.5,
                          background: 'var(--surface-2)',
                          borderLeft: '3px solid #eab308',
                          borderRadius: 'var(--radius-sm)',
                          padding: '8px 12px',
                          color: 'var(--text)',
                          whiteSpace: 'pre-wrap'
                        }}
                      >
                        {item.note || item.preview}
                      </div>
                    ) : (
                      item.preview && <p className="item-preview">{item.preview}</p>
                    )}

                    {/* Meta row */}
                    <div className="item-meta">
                      <span title={stamp(item.createdAt)}>{ago(item.createdAt)}</span>
                      {item.surface && <span className="dot">{item.surface}</span>}
                      {item.mode && <span className="dot">{item.mode}</span>}
                      {item.topic && <span className="dot">Topic: {item.topic}</span>}
                      {item.thinkingTier && <span className="dot">{item.thinkingTier}</span>}
                      {item.totalMs !== null && item.totalMs !== undefined && (
                        <span className="dot">{ms(item.totalMs)}</span>
                      )}

                      {item.kind === 'instant' && (
                        <>
                          <span className="dot">{item.imageOk ? 'image ✓' : 'image ✕'}</span>
                          <span className="dot">{item.voiceOk ? 'voice ✓' : 'voice ✕'}</span>
                          {item.beats ? <span className="dot">{n(item.beats)} beats</span> : null}
                        </>
                      )}

                      {isQuestion && (
                        <>
                          {item.hasImage ? <span className="dot">image ✓</span> : null}
                          {item.hasVoice ? <span className="dot">voice ✓</span> : null}
                        </>
                      )}

                      {isClarity && (
                        <>
                          {item.strategy && <span className="dot">{item.strategy}</span>}
                          {item.scenes ? <span className="dot">{n(item.scenes)} scenes</span> : null}
                          {item.meanScene !== null && <span className="dot">score {item.meanScene}</span>}
                          {item.feedback && (
                            <span className="pill ok" style={{ marginLeft: 4 }}>
                              {item.feedback.replace(/_/g, ' ')}
                            </span>
                          )}
                        </>
                      )}

                      {item.promptChars > 280 && (
                        <span className="dot">{n(item.promptChars)} chars</span>
                      )}

                      <span style={{ flex: 1 }} />

                      <button className="btn small ghost" onClick={() => expand(item)}>
                        {expanded === item.id ? 'Hide' : 'Details'}
                      </button>
                    </div>
                  </div>
                </div>

                {expanded === item.id && (
                  <div
                    style={{
                      marginTop: 10,
                      paddingTop: 10,
                      borderTop: '1px solid var(--line-soft)'
                    }}
                  >
                    {!detail ? (
                      <span className="cell-faint">
                        <span className="spinner" /> Reading…
                      </span>
                    ) : detail.error ? (
                      <span className="cell-faint">{detail.error}</span>
                    ) : (
                      <ItemDetail detail={detail} />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}

      {viewingImage && (
        <div className="lightbox-backdrop" onClick={() => setViewingImage(null)}>
          <div className="lightbox-content" onClick={e => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setViewingImage(null)}>✕</button>
            <img src={viewingImage.url} alt={viewingImage.title || 'Explanation Image'} />
            {viewingImage.title && <div className="lightbox-title">{viewingImage.title}</div>}
          </div>
        </div>
      )}

      {activeDeck && (
        <VideoDeckModal item={activeDeck} onClose={() => setActiveDeck(null)} />
      )}
    </div>
  );
}

function ItemDetail({ detail }) {
  const skip = new Set([
    'kind',
    'device_id',
    'prompt',
    'user_query',
    'payload_keys',
    'image_url',
    'selected_text',
    'question',
    'answer',
    'note'
  ]);
  const text = detail.question || detail.prompt || detail.user_query;
  const selText = detail.selected_text || detail.selectedText;

  return (
    <div>
      {selText && (
        <div style={{ marginBottom: 12 }}>
          <div className="stat-label" style={{ marginBottom: 5 }}>
            Highlighted Selected Text
          </div>
          <div
            style={{
              background: 'var(--surface-2)',
              borderLeft: '3px solid var(--accent)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 12px',
              fontSize: 12.5,
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}
          >
            {selText}
          </div>
        </div>
      )}

      {text && (
        <div style={{ marginBottom: 12 }}>
          <div className="stat-label" style={{ marginBottom: 5 }}>
            {detail.question ? 'Question asked' : 'What was asked'}
          </div>
          <div
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--line-soft)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 12px',
              fontSize: 12.5,
              lineHeight: 1.6,
              maxHeight: 260,
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}
          >
            {text}
          </div>
        </div>
      )}

      {detail.answer && (
        <div style={{ marginBottom: 12 }}>
          <div className="stat-label" style={{ marginBottom: 5 }}>
            Generated Answer
          </div>
          <div
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--line-soft)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 12px',
              fontSize: 12.5,
              lineHeight: 1.6,
              maxHeight: 300,
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}
          >
            {detail.answer}
          </div>
        </div>
      )}

      {detail.note && (
        <div style={{ marginBottom: 12 }}>
          <div className="stat-label" style={{ marginBottom: 5 }}>
            User Note
          </div>
          <div
            style={{
              background: 'var(--surface-2)',
              borderLeft: '3px solid #eab308',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 12px',
              fontSize: 13,
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}
          >
            {detail.note}
          </div>
        </div>
      )}

      <dl className="kv" style={{ fontSize: 12.5 }}>
        {Object.entries(detail)
          .filter(([key, value]) => !skip.has(key) && value !== null && value !== '')
          .map(([key, value]) => (
            <span key={key} style={{ display: 'contents' }}>
              <dt>{key.replace(/_/g, ' ')}</dt>
              <dd className="mono">
                {Array.isArray(value)
                  ? value.join(', ')
                  : typeof value === 'object'
                    ? JSON.stringify(value)
                    : String(value)}
              </dd>
            </span>
          ))}
      </dl>

      {detail.payload_keys?.length ? (
        <p className="cell-faint" style={{ marginTop: 10, marginBottom: 0 }}>
          The full plan and storyboard are in this run&apos;s <code>payload</code> column (
          {detail.payload_keys.join(', ')}) — tens of kilobytes of JSON.
        </p>
      ) : null}
    </div>
  );
}
