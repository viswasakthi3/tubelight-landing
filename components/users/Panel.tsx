'use client';

import { useCallback, useEffect, useState } from 'react';
import OverviewTab from './OverviewTab';
import QuickSearchTab from './QuickSearchTab';
import UsersTab from './UsersTab';
import WaitlistTab from './WaitlistTab';
import ItemsTab from './ItemsTab';
import VideosTab from './VideosTab';
import TrackingTab from './TrackingTab';
import DevTab from './DevTab';
import AuditTab from './AuditTab';
import ChatTab from './ChatTab';
import UserDrawer from './UserDrawer';
import { get, signOut } from '@/lib/client';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'quicksearch', label: 'Quick Search' },
  { id: 'users', label: 'Users' },
  { id: 'videos', label: 'Video titles' },
  { id: 'tracking', label: 'Tracking' },
  { id: 'chat', label: 'Chat' },
  { id: 'waitlist', label: 'Waitlist' },
  { id: 'items', label: 'Saved Items' },
  { id: 'dev', label: 'Dev Mode' },
  { id: 'audit', label: 'Changes' }
];

const TAB_KEY = 't2u.panel.tab';

interface PanelProps {
  username: string;
  backendReady: boolean;
}

export default function Panel({ username, backendReady }: PanelProps) {
  const [tab, setTab] = useState<string>('overview');
  const [selected, setSelected] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [theme, setTheme] = useState<string>('dark');
  const [chatUnreadTotal, setChatUnreadTotal] = useState<number>(0);

  useEffect(() => {
    try {
      const urlTab = new URLSearchParams(window.location.search).get('tab');
      if (urlTab && TABS.some(t => t.id === urlTab)) {
        setTab(urlTab);
      } else {
        const storedTab = localStorage.getItem(TAB_KEY);
        if (storedTab && TABS.some(t => t.id === storedTab)) setTab(storedTab);
      }
      const urlDevice = new URLSearchParams(window.location.search).get('device');
      if (urlDevice) {
        setSelected({ deviceId: urlDevice });
      }
    } catch {}
    setTheme(document.documentElement.getAttribute('data-theme') || 'dark');
  }, []);

  const pickTab = useCallback((next: string) => {
    setTab(next);
    try {
      localStorage.setItem(TAB_KEY, next);
    } catch {}
  }, []);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('t2u.panel.theme', next);
    } catch {}
  }

  const select = useCallback((user: any, openDrawer: boolean = true) => {
    setSelected(user);
    if (openDrawer) setDrawerOpen(true);
  }, []);

  const updateSelected = useCallback((user: any) => {
    setSelected((prev: any) => prev?.deviceId === user?.deviceId ? { ...prev, ...user } : prev);
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setDrawerOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    let live = true;
    async function checkChatUnread() {
      try {
        const res = await get('chat/conversations?limit=100');
        if (!live) return;
        const total = (res?.conversations || []).reduce(
          (acc: number, c: any) => acc + (Number(c.unreadCount) || 0),
          0
        );
        setChatUnreadTotal(total);
      } catch {}
    }
    checkChatUnread();

    // Fetch IP
    fetch('https://api.ipify.org?format=json')
      .then(r => r.json())
      .then(d => {
        const el = document.querySelector('.topbar-meta span:nth-child(2)');
        if (el) el.textContent = `IP: ${d.ip}`;
      })
      .catch(() => {});

    const timer = setInterval(checkChatUnread, 10000);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          <span>Tubelight</span>
          <small>operator panel</small>
        </div>

        <span className="live-dot">live · nothing stored here</span>

        <div className="topbar-spacer" />

        <div className="topbar-meta">
          <span className="cell-faint">{username}</span>
          <span className="cell-faint" style={{ marginLeft: 10 }}>IP: ...</span>
          <button className="btn small ghost" onClick={toggleTheme} title="Switch theme" aria-label={`Use ${theme === 'dark' ? 'light' : 'dark'} theme`}>
            {theme === 'dark' ? '☀' : '☾'}
          </button>
          <button className="btn small" onClick={signOut}>
            Sign out
          </button>
        </div>
      </header>

      <main className="main">
        {!backendReady && (
          <div className="notice bad">
            <span>
              <strong>No backend credential configured.</strong> Every tab will be empty until{' '}
              <code>PANEL_ADMIN_TOKEN</code> — or <code>PANEL_ADMIN_USERNAME</code> and{' '}
              <code>PANEL_ADMIN_PASSWORD</code> — is set in <code>users/.env.local</code>. Run{' '}
              <code>npm run setup</code> and restart the panel.
            </span>
          </div>
        )}

        <div className="tabs" role="tablist">
          {TABS.map(t => (
            <button
              key={t.id}
              role="tab"
              className="tab"
              aria-selected={tab === t.id}
              onClick={() => pickTab(t.id)}
            >
              {t.label}
              {t.id === 'chat' && chatUnreadTotal > 0 && (
                <span className="chat-unread-badge" style={{ marginLeft: 6 }}>
                  {chatUnreadTotal}
                </span>
              )}
              {t.id === 'items' && selected && (
                <span className="tab-count">{selected.name || selected.email || 'selected'}</span>
              )}
            </button>
          ))}
        </div>

        {tab === 'overview' && <OverviewTab onPickDevice={select} />}
        {tab === 'quicksearch' && <QuickSearchTab onPickDevice={select} />}
        {tab === 'users' && <UsersTab selected={selected} onSelect={select} />}
        {tab === 'videos' && <VideosTab onSelect={select} />}
        {tab === 'tracking' && <TrackingTab />}
        {tab === 'chat' && <ChatTab selectedUser={selected} onSelectUser={select} />}
        {tab === 'waitlist' && <WaitlistTab />}
        {tab === 'items' && <ItemsTab selected={selected} onSelect={select} />}
        {tab === 'dev' && <DevTab onSelect={select} />}
        {tab === 'audit' && <AuditTab />}
      </main>

      {drawerOpen && selected && (
        <UserDrawer
          deviceId={selected.deviceId}
          onClose={() => setDrawerOpen(false)}
          onChanged={updateSelected}
          onSeeItems={() => {
            setDrawerOpen(false);
            pickTab('items');
          }}
          onChatUser={() => {
            setDrawerOpen(false);
            pickTab('chat');
          }}
        />
      )}
    </div>
  );
}
