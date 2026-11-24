import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { Pool } from 'pg';
import { CSRF_COOKIE, SESSION_COOKIE, csrfMatches, readSession } from '@/lib/auth/session';
import { BackendError, fetchAdmin, callAdmin } from '@/lib/backend';
import { loadVideoTitles } from '@/lib/video-backend';
import { readTrackingDiagnostics } from '@/lib/tracking-diagnostics';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

let pool: Pool | null = null;
function getPool(): Pool | null {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;
  if (!pool) {
    pool = new Pool({
      connectionString,
      max: 8,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000
    });
  }
  return pool;
}

const READABLE = [
  'quicksearch',
  'overview',
  'breakdowns',
  'user-list',
  'videos',
  'diagnostics',
  'waitlist',
  'dev-devices',
  'events',
  'settings',
  'chat/conversations',
  /^chat\/conversations\/[A-Za-z0-9._:-]{1,128}\/messages$/,
  /^chat\/attachments\/[A-Za-z0-9._:-]{1,128}$/,
  /^user\/[A-Za-z0-9._-]{1,128}$/,
  /^user\/[A-Za-z0-9._-]{1,128}\/items$/,
  /^user\/[A-Za-z0-9._-]{1,128}\/items\/[A-Za-z0-9._:-]{1,128}$/,
  /^user\/[A-Za-z0-9._-]{1,128}\/voice-searches$/,
  /^voice-searches\/[A-Za-z0-9._:-]{1,128}\/audio$/,
  'sarvam-budget'
];

const WRITABLE = [
  'device-limit',
  'reset-usage',
  'reset-sarvam-usage',
  'reset-daily-fast',
  'adjust-usage',
  'dev-revoke',
  'settings',
  'chat/upload',
  /^chat\/conversations\/[A-Za-z0-9._:-]{1,128}\/messages$/,
  /^chat\/conversations\/[A-Za-z0-9._:-]{1,128}\/read$/,
  /^preview-image\/[A-Za-z0-9._:-]{1,128}$/,
  'request-media-pull'
];

function allowed(list: any[], path: string) {
  return list.some(rule => (rule instanceof RegExp ? rule.test(path) : rule === path));
}

async function requireSession() {
  const cookieStore = await cookies();
  const session = readSession(cookieStore.get(SESSION_COOKIE)?.value);
  if (!session) {
    return {
      session: null,
      response: NextResponse.json({ error: 'Your session has expired. Sign in again.' }, { status: 401 })
    };
  }
  return { session, response: null };
}

function sealed(payload: any, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      Pragma: 'no-cache',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

/** Quick Search analytics and user searches directly from database */
async function handleQuickSearch(req: NextRequest) {
  const db = getPool();
  if (!db) {
    return sealed({ error: 'Database is not connected.' }, 503);
  }

  const url = new URL(req.url);
  const userFilter = url.searchParams.get('deviceId') || '';
  const modeFilter = url.searchParams.get('mode') || 'all';
  const querySearch = (url.searchParams.get('q') || '').trim();

  try {
    const [summaryRes, usersRes, questionsRes, voiceRes] = await Promise.all([
      db.query(`
        SELECT 
          count(*) AS total_searches,
          count(*) FILTER (WHERE has_voice = true OR input_mode = 'voice') AS voice_searches,
          count(*) FILTER (WHERE NOT (COALESCE(has_voice,false) OR input_mode = 'voice')) AS text_searches,
          count(DISTINCT device_id) AS total_users,
          count(DISTINCT device_id) FILTER (WHERE created_at > now() - interval '24 hours') AS active_today,
          count(DISTINCT device_id) FILTER (WHERE created_at > now() - interval '7 days') AS active_7d,
          round(avg(ms)) FILTER (WHERE ms > 0) AS avg_latency_ms
        FROM t2u_user_questions
      `),
      db.query(`
        SELECT 
          q.device_id,
          COALESCE(u.email, d.email) AS email,
          u.name AS user_name,
          d.platform,
          d.app_version,
          d.created_at AS install_created_at,
          d.last_seen_at,
          count(*) AS total_searches,
          count(*) FILTER (WHERE q.has_voice = true OR q.input_mode = 'voice') AS voice_searches,
          count(*) FILTER (WHERE NOT (COALESCE(q.has_voice,false) OR q.input_mode = 'voice')) AS text_searches,
          count(*) FILTER (WHERE q.created_at > now() - interval '24 hours') AS searches_today,
          count(*) FILTER (WHERE q.created_at > now() - interval '7 days') AS searches_7d,
          min(q.created_at) AS first_search,
          max(q.created_at) AS last_search
        FROM t2u_user_questions q
        LEFT JOIN t2u_devices d ON d.device_id = q.device_id
        LEFT JOIN t2u_users u ON u.id = d.user_id
        GROUP BY q.device_id, u.email, d.email, u.name, d.platform, d.app_version, d.created_at, d.last_seen_at
        ORDER BY total_searches DESC
      `),
      db.query(`
        SELECT 
          q.id,
          q.device_id,
          COALESCE(u.email, d.email) AS email,
          u.name AS user_name,
          q.question,
          q.answer,
          q.topic,
          q.input_mode,
          q.has_voice,
          q.has_image,
          q.surface,
          q.status,
          q.ms,
          q.transcribe_ms,
          q.transcribe_provider,
          q.voice_search_id,
          q.created_at,
          d.platform,
          d.app_version
        FROM t2u_user_questions q
        LEFT JOIN t2u_devices d ON d.device_id = q.device_id
        LEFT JOIN t2u_users u ON u.id = d.user_id
        ORDER BY q.created_at DESC
        LIMIT 200
      `),
      db.query(`
        SELECT id, device_id, provider, transcript, confidence, duration_sec, created_at
        FROM t2u_voice_searches
        ORDER BY created_at DESC
        LIMIT 50
      `).catch(() => ({ rows: [] }))
    ]);

    const sRow = summaryRes.rows[0] || {};
    const summary = {
      totalSearches: Number(sRow.total_searches || 0),
      voiceSearches: Number(sRow.voice_searches || 0),
      textSearches: Number(sRow.text_searches || 0),
      totalUsers: Number(sRow.total_users || 0),
      activeToday: Number(sRow.active_today || 0),
      active7d: Number(sRow.active_7d || 0),
      avgLatencyMs: Number(sRow.avg_latency_ms || 0)
    };

    const users = usersRes.rows.map(r => {
      const total = Number(r.total_searches || 0);
      let usageFrequency = 'Occasional';
      if (total >= 25) usageFrequency = 'High Frequency';
      else if (total >= 6) usageFrequency = 'Moderate';

      const isTest = /^(test|dev[_-]|t2u-probe|t2u-httpprobe|t2u-fresh-dev|t2u-dev-test|t2u-test)/i.test(r.device_id);

      return {
        deviceId: r.device_id,
        email: r.email || null,
        name: r.user_name || null,
        platform: r.platform || 'windows',
        appVersion: r.app_version || '1.0.0',
        totalSearches: total,
        voiceSearches: Number(r.voice_searches || 0),
        textSearches: Number(r.text_searches || 0),
        searchesToday: Number(r.searches_today || 0),
        searches7d: Number(r.searches_7d || 0),
        firstSearch: r.first_search ? new Date(r.first_search).toISOString() : null,
        lastSearch: r.last_search ? new Date(r.last_search).toISOString() : null,
        usageFrequency,
        isTest
      };
    });

    let searches = questionsRes.rows.map(q => {
      const isVoice = Boolean(q.has_voice || q.input_mode === 'voice');
      return {
        id: q.id,
        deviceId: q.device_id,
        email: q.email || null,
        userName: q.user_name || null,
        question: q.question || '',
        answer: q.answer || null,
        topic: q.topic || null,
        inputMode: isVoice ? 'voice' : (q.input_mode || 'text'),
        hasVoice: isVoice,
        hasImage: Boolean(q.has_image),
        surface: q.surface || 'quicksearch',
        status: q.status || 'completed',
        ms: Number(q.ms || 0),
        transcribeMs: q.transcribe_ms ? Number(q.transcribe_ms) : null,
        transcribeProvider: q.transcribe_provider || null,
        voiceSearchId: q.voice_search_id || null,
        createdAt: q.created_at ? new Date(q.created_at).toISOString() : null,
        platform: q.platform || null,
        appVersion: q.app_version || null
      };
    });

    if (userFilter) {
      searches = searches.filter(s => s.deviceId === userFilter);
    }
    if (modeFilter === 'voice') {
      searches = searches.filter(s => s.hasVoice);
    } else if (modeFilter === 'text') {
      searches = searches.filter(s => !s.hasVoice);
    }
    if (querySearch) {
      const qLower = querySearch.toLowerCase();
      searches = searches.filter(s =>
        s.question.toLowerCase().includes(qLower) ||
        (s.topic && s.topic.toLowerCase().includes(qLower)) ||
        (s.deviceId && s.deviceId.toLowerCase().includes(qLower)) ||
        (s.email && s.email.toLowerCase().includes(qLower))
      );
    }

    const voiceRecordings = (voiceRes.rows || []).map(v => ({
      id: v.id,
      deviceId: v.device_id,
      provider: v.provider,
      transcript: v.transcript || '',
      confidence: v.confidence != null ? Number(v.confidence) : null,
      durationSec: v.duration_sec != null ? Number(v.duration_sec) : null,
      createdAt: v.created_at ? new Date(v.created_at).toISOString() : null
    }));

    return sealed({
      ok: true,
      summary,
      users,
      searches,
      voiceRecordings
    });
  } catch (err: any) {
    console.error('[quicksearch-admin] query error:', err.message);
    return sealed({ error: 'Could not load search activity.' }, 500);
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { session, response } = await requireSession();
  if (response) return response;

  const resolvedParams = await params;
  const path = (resolvedParams.path || []).join('/');

  if (!allowed(READABLE, path)) {
    return sealed({ error: 'No such resource in the operator panel.' }, 404);
  }

  // Handle custom Quick Search analytics section
  if (path === 'quicksearch') {
    return handleQuickSearch(req);
  }

  const search = req.nextUrl.search;

  if (path === 'videos') {
    try {
      const result = await loadVideoTitles(search, {}, callAdmin);
      return sealed(result);
    } catch (err: any) {
      if (err instanceof BackendError) return sealed({ error: err.message }, err.status);
      return sealed({ error: 'Could not load videos.' }, 502);
    }
  }

  if (path === 'diagnostics') {
    try {
      const result = await readTrackingDiagnostics(callAdmin);
      return sealed(result);
    } catch (err: any) {
      if (err instanceof BackendError) return sealed({ error: err.message }, err.status);
      return sealed({ error: 'Could not read diagnostics.' }, 502);
    }
  }

  try {
    const upstream = await fetchAdmin(`${path}${search}`, { actor: session.username });
    const data = await upstream.json().catch(() => ({}));
    return sealed(data, upstream.status);
  } catch (err: any) {
    if (err instanceof BackendError) return sealed({ error: err.message }, err.status);
    return sealed({ error: 'Could not reach the backend.' }, 502);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { session, response } = await requireSession();
  if (response) return response;

  const cookieStore = await cookies();
  const cookieCsrf = cookieStore.get(CSRF_COOKIE)?.value;
  const headerCsrf = req.headers.get('x-csrf-token');
  if (!csrfMatches(cookieCsrf, headerCsrf)) {
    return sealed({ error: 'CSRF token mismatch. Reload the page.' }, 403);
  }

  const resolvedParams = await params;
  const path = (resolvedParams.path || []).join('/');

  if (!allowed(WRITABLE, path)) {
    return sealed({ error: 'No such mutation in the operator panel.' }, 404);
  }

  let body = null;
  try {
    body = await req.json();
  } catch {}

  try {
    const upstream = await fetchAdmin(path, {
      method: 'POST',
      body,
      actor: session.username
    });
    const data = await upstream.json().catch(() => ({}));
    return sealed(data, upstream.status);
  } catch (err: any) {
    if (err instanceof BackendError) return sealed({ error: err.message }, err.status);
    return sealed({ error: 'Mutation failed.' }, 502);
  }
}
