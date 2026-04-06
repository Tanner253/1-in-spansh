/**
 * Public site URL for invite links (set VITE_SITE_URL in production, e.g. https://playsoluno.vercel.app).
 */
export function getSiteUrl() {
  const env = import.meta.env.VITE_SITE_URL;
  if (env && typeof env === 'string') return env.replace(/\/$/, '');
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}

/** Full shareable URL for a lobby (uses ?lobby=CODE). */
export function getLobbyJoinUrl(code) {
  const base = getSiteUrl();
  const c = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
  if (!base || !c) return base || '';
  const u = new URL(base);
  u.searchParams.set('lobby', c);
  u.searchParams.delete('join');
  return u.toString();
}

/** Read lobby code from ?lobby= or legacy ?join=. */
export function getLobbyCodeFromSearch(search) {
  try {
    const q = typeof search === 'string' ? search : window.location.search;
    const params = new URLSearchParams(q.startsWith('?') ? q : `?${q}`);
    const raw = params.get('lobby') || params.get('join');
    if (!raw) return null;
    return raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  } catch (_) {
    return null;
  }
}

/** Put ?lobby=CODE in the address bar (no reload). */
export function syncLobbyToUrl(code) {
  try {
    const c = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    if (!c) return;
    const u = new URL(window.location.href);
    u.searchParams.set('lobby', c);
    u.searchParams.delete('join');
    const next = u.pathname + u.search + (u.hash || '');
    window.history.replaceState({}, '', next);
  } catch (_) {}
}

/** Remove ?lobby / ?join from the address bar. */
export function stripLobbyParamsFromUrl() {
  try {
    const u = new URL(window.location.href);
    if (!u.searchParams.has('lobby') && !u.searchParams.has('join')) return;
    u.searchParams.delete('lobby');
    u.searchParams.delete('join');
    const next = u.pathname + (u.search || '') + (u.hash || '');
    window.history.replaceState({}, '', next);
  } catch (_) {}
}

/**
 * Bullish one-click X post — $SUNO + @osknyo_dev + dynamic lobby stats.
 */
export function buildLobbyShareTweet(lobby, joinUrl) {
  const n = lobby?.players?.length ?? 0;
  const max = lobby?.maxPlayers ?? 8;
  let hostName = lobby?.players?.find((p) => p.id === lobby?.hostId)?.name ?? 'Host';
  if (hostName.length > 18) hostName = `${hostName.slice(0, 16)}…`;
  let mode = 'Free game';
  if (lobby?.wager?.amount != null) {
    mode = `${lobby.wager.amount} ${lobby.wager.token || 'SOL'} wager`;
  }
  const privateTag = lobby?.isPrivate ? ' · Private' : '';

  let siteHost = '';
  try {
    siteHost = new URL(joinUrl || getSiteUrl()).hostname;
  } catch (_) {}

  const lines = [
    `🃏 SOLUNO lobby LIVE — ${n}/${max} players · ${mode}${privateTag} · LFG! 🚀`,
    `Host: ${hostName}${siteHost ? ` · ${siteHost}` : ''}`,
    '',
    'Tap to join 👇 $SUNO',
    '',
    '@osknyo_dev',
  ];

  return { text: lines.join('\n'), url: joinUrl };
}

export function openTwitterIntent({ text, url }) {
  const intent = new URL('https://twitter.com/intent/tweet');
  intent.searchParams.set('text', text);
  if (url) intent.searchParams.set('url', url);
  window.open(intent.toString(), '_blank', 'noopener,noreferrer');
}
