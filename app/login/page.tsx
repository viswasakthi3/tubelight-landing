'use client';

import { useEffect, useRef, useState } from 'react';
import '@/components/users/users.css';

const REMEMBER_USER_KEY = 'tubelight_saved_username';
const REMEMBER_PASS_KEY = 'tubelight_saved_password';
const STAY_SIGNED_IN_KEY = 'tubelight_stay_signed_in';
const LEGACY_REMEMBER_KEY = 'tubelight_remembered_username';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [lockedFor, setLockedFor] = useState(0);
  const userRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const err = params.get('error');
      if (err === 'rejected') setError('That username and password did not match.');
      if (err === 'locked') setError('Too many failed attempts. Try again later.');

      const savedUser = localStorage.getItem(REMEMBER_USER_KEY) || localStorage.getItem(LEGACY_REMEMBER_KEY) || '';
      const savedPass = localStorage.getItem(REMEMBER_PASS_KEY) || '';
      const staySaved = localStorage.getItem(STAY_SIGNED_IN_KEY) === 'true' || Boolean(savedUser && savedPass);

      if (savedUser) setUsername(savedUser);
      if (savedPass) setPassword(savedPass);
      if (staySaved || savedUser || savedPass) setRememberMe(true);

      if (savedUser && savedPass) {
        // Both credentials prefilled from localStorage
      } else if (savedUser) {
        passwordRef.current?.focus();
      } else {
        userRef.current?.focus();
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (lockedFor <= 0) return undefined;
    const id = setInterval(() => setLockedFor(n => Math.max(0, n - 1)), 1000);
    return () => clearInterval(id);
  }, [lockedFor]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || lockedFor > 0) return;

    const formData = new FormData(event.currentTarget);
    const submittedUsername = String(formData.get('username') || username || '').trim();
    const submittedPassword = String(formData.get('password') || password || '');

    setBusy(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: submittedUsername,
          password: submittedPassword,
          rememberMe
        })
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || 'That username and password did not match.');
        if (data.lockedFor) setLockedFor(data.lockedFor);
        setPassword('');
        return;
      }

      try {
        if (rememberMe) {
          localStorage.setItem(REMEMBER_USER_KEY, submittedUsername);
          localStorage.setItem(REMEMBER_PASS_KEY, submittedPassword);
          localStorage.setItem(STAY_SIGNED_IN_KEY, 'true');
          localStorage.setItem(LEGACY_REMEMBER_KEY, submittedUsername);
        } else {
          localStorage.removeItem(REMEMBER_USER_KEY);
          localStorage.removeItem(REMEMBER_PASS_KEY);
          localStorage.removeItem(STAY_SIGNED_IN_KEY);
          localStorage.removeItem(LEGACY_REMEMBER_KEY);
        }
      } catch {}

      window.location.replace('/users');
    } catch {
      setError('Could not reach the panel. Is it still running?');
    } finally {
      setBusy(false);
    }
  }

  const locked = lockedFor > 0;

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={submit} method="POST" action="/api/auth/login">
        <div className="brand" style={{ marginBottom: 16 }}>
          <span className="brand-dot" />
          <span>Tubelight</span>
          <small>operator panel</small>
        </div>

        <h1>Sign in</h1>
        <p className="sub">This panel reads live data. Nothing is stored here.</p>

        {error && (
          <div className={`notice ${locked ? 'warn' : 'bad'}`}>
            <span>
              {error}
              {locked && (
                <>
                  {' '}
                  <strong>
                    {Math.floor(lockedFor / 60)}:{String(lockedFor % 60).padStart(2, '0')}
                  </strong>{' '}
                  remaining.
                </>
              )}
            </span>
          </div>
        )}

        <div className="field">
          <label htmlFor="u">Username</label>
          <input
            id="u"
            name="username"
            ref={userRef}
            className="input"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoComplete="username"
            spellCheck={false}
            disabled={busy || locked}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="p">Password</label>
          <input
            id="p"
            name="password"
            ref={passwordRef}
            className="input"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            disabled={busy || locked}
            required
          />
        </div>

        <div className="remember-row">
          <label className="remember-label">
            <input
              type="checkbox"
              className="remember-check"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              disabled={busy || locked}
            />
            Stay signed in
          </label>
          <span className="remember-hint">
            {rememberMe ? 'Saved locally · 30 days active' : 'Click to save username & password in local storage'}
          </span>
        </div>

        <button className="btn primary" type="submit" disabled={busy || locked}>
          {busy ? <span className="spinner" /> : null}
          <span>{locked ? 'Locked' : busy ? 'Checking…' : 'Sign in'}</span>
        </button>

        <div className="login-foot">
          Five failed attempts locks this login for fifteen minutes. Forgotten the password? Run{' '}
          <code>npm run setup -- --force</code> in the <code>users/</code> folder.
        </div>
      </form>
    </div>
  );
}
