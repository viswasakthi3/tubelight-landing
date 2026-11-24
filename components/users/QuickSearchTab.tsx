'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { get } from '@/lib/client';
import { ago, n } from '@/lib/format';
import { Empty, ErrorNote, Stat } from './bits';

interface QuickSearchUser {
  deviceId: string;
  email: string | null;
  name: string | null;
  platform: string;
  appVersion: string;
  totalSearches: number;
  voiceSearches: number;
  textSearches: number;
  searchesToday: number;
  searches7d: number;
  firstSearch: string | null;
  lastSearch: string | null;
  usageFrequency: 'High Frequency' | 'Moderate' | 'Occasional';
  isTest: boolean;
}

interface QuickSearchItem {
  id: string;
  deviceId: string;
  email: string | null;
  userName: string | null;
  question: string;
  answer: string | null;
  topic: string | null;
  inputMode: string;
  hasVoice: boolean;
  hasImage: boolean;
  surface: string;
  status: string;
  ms: number;
  transcribeMs: number | null;
  transcribeProvider: string | null;
  voiceSearchId: string | null;
  createdAt: string | null;
  platform: string | null;
  appVersion: string | null;
}

interface QuickSearchVoiceRecording {
  id: string;
  deviceId: string;
  provider: string;
  transcript: string;
  confidence: number | null;
  durationSec: number | null;
  createdAt: string | null;
}

interface QuickSearchSummary {
  totalSearches: number;
  voiceSearches: number;
  textSearches: number;
  totalUsers: number;
  activeToday: number;
  active7d: number;
  avgLatencyMs: number;
}

export default function QuickSearchTab({ onPickDevice }: { onPickDevice?: (device: any) => void }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<QuickSearchSummary | null>(null);
  const [users, setUsers] = useState<QuickSearchUser[]>([]);
  const [searches, setSearches] = useState<QuickSearchItem[]>([]);
  const [voiceRecordings, setVoiceRecordings] = useState<QuickSearchVoiceRecording[]>([]);

  // Filtering states
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [modeFilter, setModeFilter] = useState<'all' | 'voice' | 'text'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewTab, setViewTab] = useState<'stream' | 'users' | 'voice'>('stream');

  const loadData = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError('');
    try {
      const res = await get('quicksearch', { signal });
      if (res?.ok) {
        setSummary(res.summary || null);
        setUsers(res.users || []);
        setSearches(res.searches || []);
        setVoiceRecordings(res.voiceRecordings || []);
      } else {
        setError(res?.error || 'Could not load Quick Search data.');
      }
    } catch (err: any) {
      if (!signal?.aborted) {
        setError(err?.message || 'Failed to fetch Quick Search records.');
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);
    return () => controller.abort();
  }, [loadData]);

  // Filtered searches
  const filteredSearches = useMemo(() => {
    return searches.filter(item => {
      if (selectedUser && item.deviceId !== selectedUser) return false;
      if (modeFilter === 'voice' && !item.hasVoice) return false;
      if (modeFilter === 'text' && item.hasVoice) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchQ = item.question?.toLowerCase().includes(q);
        const matchT = item.topic?.toLowerCase().includes(q);
        const matchU = item.deviceId?.toLowerCase().includes(q) || item.email?.toLowerCase().includes(q);
        if (!matchQ && !matchT && !matchU) return false;
      }
      return true;
    });
  }, [searches, selectedUser, modeFilter, searchQuery]);

  const activeUserObj = useMemo(() => {
    if (!selectedUser) return null;
    return users.find(u => u.deviceId === selectedUser) || null;
  }, [users, selectedUser]);

  const voicePercent = summary?.totalSearches ? Math.round((summary.voiceSearches / summary.totalSearches) * 100) : 0;
  const textPercent = summary?.totalSearches ? Math.round((summary.textSearches / summary.totalSearches) * 100) : 0;

  return (
    <div className="quicksearch-page" style={{ color: 'var(--text)' }}>
      <ErrorNote error={error} onRetry={() => loadData()} />

      {/* Header with Snitch branding */}
      <div className="page-intro" style={{ marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ margin: 0 }}>Quick Search</h1>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '3px 10px',
                borderRadius: 999,
                background: 'rgba(139, 92, 246, 0.15)',
                border: '1px solid rgba(139, 92, 246, 0.4)',
                color: '#a78bfa',
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase'
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#a78bfa', boxShadow: '0 0 8px #a78bfa' }} />
              Snitch Monitor
            </span>
          </div>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-dim)', fontSize: 13 }}>
            Real-time search telemetry across all users — inspect text queries, spoken voice searches, and frequency analytics.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn small" onClick={() => loadData()} disabled={loading}>
            {loading ? <span className="spinner" /> : null}
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Snitch Metric KPI Cards */}
      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <Stat
          label="Total Searchers"
          value={n(summary?.totalUsers ?? users.length)}
          sub={`${n(summary?.activeToday ?? 0)} active today · ${n(summary?.active7d ?? 0)} this week`}
          tone="ok"
        />
        <Stat
          label="Total Searches"
          value={n(summary?.totalSearches ?? searches.length)}
          sub="All recorded queries across platforms"
          tone="ok"
        />
        <div className="stat" style={{ borderLeft: '3px solid #8b5cf6' }}>
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>🎤 Voice Searches</span>
          </div>
          <div className="stat-value" style={{ color: '#c084fc' }}>
            {n(summary?.voiceSearches ?? 0)}
          </div>
          <div className="stat-sub">
            {voicePercent}% of searches · {n(voiceRecordings.length)} audio transcripts
          </div>
        </div>
        <div className="stat" style={{ borderLeft: '3px solid #06b6d4' }}>
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>⌨️ Text / Typed</span>
          </div>
          <div className="stat-value" style={{ color: '#38bdf8' }}>
            {n(summary?.textSearches ?? 0)}
          </div>
          <div className="stat-sub">{textPercent}% of queries typed manually</div>
        </div>
        <Stat
          label="Avg Latency"
          value={summary?.avgLatencyMs ? `${(summary.avgLatencyMs / 1000).toFixed(1)}s` : '—'}
          sub="End-to-end response delivery"
        />
      </div>

      {/* Sub-navigation tabs: Live Stream vs Users Directory vs Voice Audio */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--line)', paddingBottom: 12, marginBottom: 16 }}>
        <button
          className={`tab ${viewTab === 'stream' ? 'active' : ''}`}
          style={{
            background: viewTab === 'stream' ? 'var(--surface-2)' : 'transparent',
            border: viewTab === 'stream' ? '1px solid var(--accent-line)' : '1px solid transparent',
            color: viewTab === 'stream' ? 'var(--text)' : 'var(--text-dim)',
            fontWeight: 600,
            padding: '6px 14px',
            borderRadius: 6,
            cursor: 'pointer'
          }}
          onClick={() => setViewTab('stream')}
        >
          🔍 Live Searches ({filteredSearches.length})
        </button>
        <button
          className={`tab ${viewTab === 'users' ? 'active' : ''}`}
          style={{
            background: viewTab === 'users' ? 'var(--surface-2)' : 'transparent',
            border: viewTab === 'users' ? '1px solid var(--accent-line)' : '1px solid transparent',
            color: viewTab === 'users' ? 'var(--text)' : 'var(--text-dim)',
            fontWeight: 600,
            padding: '6px 14px',
            borderRadius: 6,
            cursor: 'pointer'
          }}
          onClick={() => setViewTab('users')}
        >
          👥 User Directory & Frequency ({users.length})
        </button>
        {voiceRecordings.length > 0 && (
          <button
            className={`tab ${viewTab === 'voice' ? 'active' : ''}`}
            style={{
              background: viewTab === 'voice' ? 'var(--surface-2)' : 'transparent',
              border: viewTab === 'voice' ? '1px solid var(--accent-line)' : '1px solid transparent',
              color: viewTab === 'voice' ? 'var(--text)' : 'var(--text-dim)',
              fontWeight: 600,
              padding: '6px 14px',
              borderRadius: 6,
              cursor: 'pointer'
            }}
            onClick={() => setViewTab('voice')}
          >
            🎙️ Voice Transcripts ({voiceRecordings.length})
          </button>
        )}
      </div>

      {/* VIEW 1: Live Searches Stream */}
      {viewTab === 'stream' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 320px) 1fr', gap: 16 }}>
          {/* Left Sidebar: Quick User Filter Roster */}
          <div className="card" style={{ padding: 12, height: 'fit-content' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <strong style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-dim)' }}>
                Filter by User
              </strong>
              {selectedUser && (
                <button
                  style={{
                    fontSize: 11,
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                  onClick={() => setSelectedUser('')}
                >
                  Clear filter
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 600, overflowY: 'auto' }}>
              <div
                style={{
                  padding: '8px 10px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  background: !selectedUser ? 'var(--surface-2)' : 'transparent',
                  border: !selectedUser ? '1px solid var(--accent-line)' : '1px solid var(--line-soft)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
                onClick={() => setSelectedUser('')}
              >
                <span style={{ fontSize: 12, fontWeight: 600 }}>All Users ({users.length})</span>
                <span className="pill small">{searches.length} searches</span>
              </div>

              {users.map(u => {
                const isSelected = selectedUser === u.deviceId;
                return (
                  <div
                    key={u.deviceId}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      background: isSelected ? 'var(--surface-2)' : 'rgba(255,255,255,0.02)',
                      border: isSelected ? '1px solid var(--accent-line)' : '1px solid var(--line-soft)',
                      transition: 'all 0.15s ease'
                    }}
                    onClick={() => setSelectedUser(isSelected ? '' : u.deviceId)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontFamily: 'var(--mono)',
                          color: isSelected ? 'var(--accent)' : 'var(--text)',
                          fontWeight: 600,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: 180
                        }}
                        title={u.email || u.deviceId}
                      >
                        {u.email || (u.deviceId.length > 20 ? `${u.deviceId.slice(0, 16)}…` : u.deviceId)}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          padding: '1px 5px',
                          borderRadius: 4,
                          background:
                            u.usageFrequency === 'High Frequency'
                              ? 'rgba(63, 191, 127, 0.15)'
                              : u.usageFrequency === 'Moderate'
                              ? 'rgba(56, 189, 248, 0.15)'
                              : 'rgba(148, 163, 184, 0.15)',
                          color:
                            u.usageFrequency === 'High Frequency'
                              ? '#4ade80'
                              : u.usageFrequency === 'Moderate'
                              ? '#38bdf8'
                              : '#94a3b8',
                          fontWeight: 600
                        }}
                      >
                        {u.totalSearches} queries
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-faint)' }}>
                      <span>{u.platform}</span>
                      <span>·</span>
                      <span>🎤 {u.voiceSearches}</span>
                      <span>·</span>
                      <span>⌨️ {u.textSearches}</span>
                      <span>·</span>
                      <span>{u.lastSearch ? ago(u.lastSearch) : 'never'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Main Column: Feed with Filter Toolbar */}
          <div>
            {/* Filter toolbar */}
            <div
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'center',
                marginBottom: 12,
                flexWrap: 'wrap'
              }}
            >
              <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search in questions, topics, or devices…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    background: 'var(--surface)',
                    border: '1px solid var(--line)',
                    color: 'var(--text)',
                    fontSize: 13
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-dim)',
                      cursor: 'pointer'
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Mode segmented filter */}
              <div className="seg">
                <button
                  aria-pressed={modeFilter === 'all'}
                  onClick={() => setModeFilter('all')}
                  style={{ fontSize: 12 }}
                >
                  All ({searches.length})
                </button>
                <button
                  aria-pressed={modeFilter === 'voice'}
                  onClick={() => setModeFilter('voice')}
                  style={{ fontSize: 12, color: modeFilter === 'voice' ? '#c084fc' : undefined }}
                >
                  🎤 Voice ({summary?.voiceSearches || 0})
                </button>
                <button
                  aria-pressed={modeFilter === 'text'}
                  onClick={() => setModeFilter('text')}
                  style={{ fontSize: 12, color: modeFilter === 'text' ? '#38bdf8' : undefined }}
                >
                  ⌨️ Text ({summary?.textSearches || 0})
                </button>
              </div>
            </div>

            {/* Selected user notification banner */}
            {activeUserObj && (
              <div
                style={{
                  background: 'rgba(109, 143, 255, 0.08)',
                  border: '1px solid var(--accent-line)',
                  borderRadius: 8,
                  padding: '10px 14px',
                  marginBottom: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    Showing queries for:{' '}
                    <span style={{ fontFamily: 'var(--mono)', color: 'var(--accent)' }}>
                      {activeUserObj.email || activeUserObj.deviceId}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                    {activeUserObj.platform} · {activeUserObj.appVersion} · {activeUserObj.totalSearches} total searches (🎤 {activeUserObj.voiceSearches} voice, ⌨️ {activeUserObj.textSearches} text) · Last active {activeUserObj.lastSearch ? ago(activeUserObj.lastSearch) : 'recently'}
                  </div>
                </div>
                <button className="btn small" onClick={() => setSelectedUser('')}>
                  Show All Users
                </button>
              </div>
            )}

            {/* Searches Feed */}
            {loading && !searches.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="card" style={{ padding: 14 }}>
                    <div className="skeleton" style={{ width: '60%', height: 16, marginBottom: 8 }} />
                    <div className="skeleton" style={{ width: '40%', height: 12 }} />
                  </div>
                ))}
              </div>
            ) : filteredSearches.length === 0 ? (
              <Empty title="No searches match the selected filters.">
                Try switching the mode filter or clearing the search query.
              </Empty>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filteredSearches.map(item => {
                  const isExpanded = expandedId === item.id;
                  return (
                    <div
                      key={item.id}
                      className="card"
                      style={{
                        padding: '12px 16px',
                        background: 'var(--surface)',
                        border: '1px solid var(--line)',
                        borderRadius: 8,
                        transition: 'border-color 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4, wordBreak: 'break-word' }}>
                            {item.question}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                          {item.hasVoice ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '2px 8px',
                                borderRadius: 4,
                                background: 'rgba(139, 92, 246, 0.18)',
                                border: '1px solid rgba(139, 92, 246, 0.4)',
                                color: '#c084fc',
                                fontSize: 11,
                                fontWeight: 600
                              }}
                            >
                              🎤 Voice
                            </span>
                          ) : (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '2px 8px',
                                borderRadius: 4,
                                background: 'rgba(6, 182, 212, 0.12)',
                                border: '1px solid rgba(6, 182, 212, 0.35)',
                                color: '#38bdf8',
                                fontSize: 11,
                                fontWeight: 600
                              }}
                            >
                              ⌨️ Text
                            </span>
                          )}

                          {item.ms > 0 && (
                            <span className="pill small" title={`Latency: ${item.ms}ms`}>
                              {(item.ms / 1000).toFixed(1)}s
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Metadata bar */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-faint)', flexWrap: 'wrap' }}>
                        <span
                          style={{ cursor: 'pointer', color: 'var(--text-dim)', textDecoration: 'underline' }}
                          onClick={() => setSelectedUser(item.deviceId)}
                          title="Click to filter by this user"
                        >
                          👤 {item.email || (item.deviceId.length > 24 ? `${item.deviceId.slice(0, 18)}…` : item.deviceId)}
                        </span>
                        <span>·</span>
                        <span>{item.createdAt ? ago(item.createdAt) : 'recently'}</span>
                        {item.surface && (
                          <>
                            <span>·</span>
                            <span className="pill small">{item.surface}</span>
                          </>
                        )}
                        {item.status && (
                          <>
                            <span>·</span>
                            <span className={`pill small ${item.status === 'completed' || item.status === 'ok' ? 'ok' : 'bad'}`}>
                              {item.status}
                            </span>
                          </>
                        )}

                        <div style={{ marginLeft: 'auto' }}>
                          <button
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--accent)',
                              fontSize: 11,
                              cursor: 'pointer',
                              padding: '2px 6px'
                            }}
                            onClick={() => setExpandedId(isExpanded ? null : item.id)}
                          >
                            {isExpanded ? 'Hide Details ▲' : 'View Answer ▼'}
                          </button>
                        </div>
                      </div>

                      {/* Expanded answer content */}
                      {isExpanded && (
                        <div
                          style={{
                            marginTop: 10,
                            paddingTop: 10,
                            borderTop: '1px solid var(--line-soft)',
                            fontSize: 12,
                            lineHeight: 1.5
                          }}
                        >
                          {item.answer ? (
                            <div style={{ background: 'var(--surface-2)', padding: 10, borderRadius: 6, marginBottom: 8 }}>
                              <strong style={{ display: 'block', marginBottom: 4, color: 'var(--text-dim)', fontSize: 11 }}>
                                ANSWER GENERATED:
                              </strong>
                              <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{item.answer}</p>
                            </div>
                          ) : (
                            <div style={{ color: 'var(--text-faint)', fontStyle: 'italic', marginBottom: 8 }}>
                              No detailed answer stored in question record.
                            </div>
                          )}

                          <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-faint)' }}>
                            <span>Device ID: <code>{item.deviceId}</code></span>
                            {item.transcribeProvider && <span>Provider: {item.transcribeProvider}</span>}
                            {item.transcribeMs && <span>Transcribe: {item.transcribeMs}ms</span>}
                            <span>Recorded at: {item.createdAt ? new Date(item.createdAt).toLocaleString() : '—'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: All Users Directory */}
      {viewTab === 'users' && (
        <div className="card">
          <div className="card-head">
            <div>
              <h2>Quick Search Users & Usage Frequency</h2>
              <p>Every device that has made searches with how often they search, voice ratio, and platform identity.</p>
            </div>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>User / Device</th>
                  <th>Frequency</th>
                  <th>Total Searches</th>
                  <th>Voice vs Text</th>
                  <th>Searches (24h / 7d)</th>
                  <th>Platform / Version</th>
                  <th>Last Active</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: 24 }}>
                      No search users recorded yet.
                    </td>
                  </tr>
                ) : (
                  users.map(u => (
                    <tr key={u.deviceId}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>
                          {u.email || u.name || 'Anonymous User'}
                        </div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-faint)' }}>
                          {u.deviceId}
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600,
                            background:
                              u.usageFrequency === 'High Frequency'
                                ? 'rgba(63, 191, 127, 0.15)'
                                : u.usageFrequency === 'Moderate'
                                ? 'rgba(56, 189, 248, 0.15)'
                                : 'rgba(148, 163, 184, 0.12)',
                            color:
                              u.usageFrequency === 'High Frequency'
                                ? '#4ade80'
                                : u.usageFrequency === 'Moderate'
                                ? '#38bdf8'
                                : '#94a3b8'
                          }}
                        >
                          {u.usageFrequency}
                        </span>
                      </td>
                      <td>
                        <strong style={{ fontSize: 14 }}>{u.totalSearches}</strong>
                        <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>queries</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                          <span style={{ color: '#c084fc' }}>🎤 {u.voiceSearches}</span>
                          <span style={{ color: 'var(--text-faint)' }}>/</span>
                          <span style={{ color: '#38bdf8' }}>⌨️ {u.textSearches}</span>
                        </div>
                        {u.totalSearches > 0 && (
                          <div
                            style={{
                              width: 80,
                              height: 4,
                              background: '#38bdf8',
                              borderRadius: 2,
                              marginTop: 4,
                              overflow: 'hidden',
                              display: 'flex'
                            }}
                          >
                            <div
                              style={{
                                width: `${Math.round((u.voiceSearches / u.totalSearches) * 100)}%`,
                                height: '100%',
                                background: '#c084fc'
                              }}
                            />
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: 12 }}>
                          {u.searchesToday} today · {u.searches7d} in 7d
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>
                          First: {u.firstSearch ? ago(u.firstSearch) : '—'}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: 12 }}>{u.platform || 'windows'}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>v{u.appVersion}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: 12 }}>{u.lastSearch ? ago(u.lastSearch) : 'recently'}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>
                          {u.lastSearch ? new Date(u.lastSearch).toLocaleDateString() : '—'}
                        </div>
                      </td>
                      <td>
                        <button
                          className="btn small"
                          onClick={() => {
                            setSelectedUser(u.deviceId);
                            setViewTab('stream');
                          }}
                        >
                          View Queries
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: Spoken Voice Search Transcriptions */}
      {viewTab === 'voice' && (
        <div className="card">
          <div className="card-head">
            <div>
              <h2>Spoken Voice Search Recordings & Transcripts</h2>
              <p>Direct speech transcripts from Gemini / Deepgram with confidence and duration.</p>
            </div>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Spoken Query Transcript</th>
                  <th>Provider</th>
                  <th>Audio Duration</th>
                  <th>Confidence</th>
                  <th>Device</th>
                  <th>Recorded At</th>
                </tr>
              </thead>
              <tbody>
                {voiceRecordings.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: 24 }}>
                      No spoken recordings found.
                    </td>
                  </tr>
                ) : (
                  voiceRecordings.map(v => (
                    <tr key={v.id}>
                      <td style={{ maxWidth: 380 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ color: '#c084fc' }}>🎤</span>
                          <strong style={{ color: 'var(--text)', wordBreak: 'break-word' }}>
                            &ldquo;{v.transcript}&rdquo;
                          </strong>
                        </div>
                      </td>
                      <td>
                        <span className="pill small">{v.provider}</span>
                      </td>
                      <td>{v.durationSec ? `${v.durationSec.toFixed(1)}s` : '—'}</td>
                      <td>{v.confidence != null ? `${Math.round(v.confidence * 100)}%` : '100%'}</td>
                      <td>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-faint)' }}>
                          {v.deviceId.length > 20 ? `${v.deviceId.slice(0, 16)}…` : v.deviceId}
                        </span>
                      </td>
                      <td>{v.createdAt ? ago(v.createdAt) : 'recently'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
