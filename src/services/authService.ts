import type { Session } from '@supabase/supabase-js';
import { getSupabase } from './supabaseClient';

const CLOCK_SKEW_TOLERANCE_SECONDS = 300;
const EXPIRY_BUFFER_SECONDS = 60;

export interface JwtPayload {
  iat?: number;
  exp?: number;
  [key: string]: unknown;
}

export type SessionCheckResult =
  | { session: Session; reason: null }
  | { session: null; reason: 'no-session' | 'refresh-failed' | 'clock-skew' };

function decodeBase64Url(value: string): string {
  const padding = value.length % 4 === 0 ? '' : '='.repeat(4 - (value.length % 4));
  const normalized = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(normalized);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function decodeJwtPayload(token: string | null | undefined): JwtPayload | null {
  if (!token) return null;

  const parts = token.split('.');
  if (parts.length < 2) return null;

  try {
    const parsed = JSON.parse(decodeBase64Url(parts[1]));
    return parsed && typeof parsed === 'object' ? (parsed as JwtPayload) : null;
  } catch {
    return null;
  }
}

export function isTokenIssuedInFuture(
  token: string | null | undefined,
  toleranceSeconds = CLOCK_SKEW_TOLERANCE_SECONDS,
): boolean {
  const payload = decodeJwtPayload(token);
  if (typeof payload?.iat !== 'number') return false;

  return payload.iat > Date.now() / 1000 + toleranceSeconds;
}

function isTokenExpiringSoon(
  token: string | null | undefined,
  bufferSeconds = EXPIRY_BUFFER_SECONDS,
): boolean {
  const payload = decodeJwtPayload(token);
  if (typeof payload?.exp !== 'number') return false;

  return payload.exp <= Date.now() / 1000 + bufferSeconds;
}

export function logTokenDiagnostics(context: string, token?: string | null): void {
  const payload = decodeJwtPayload(token);
  if (!payload) {
    console.warn(`[auth:${context}] No se pudo decodificar el access token.`);
    return;
  }

  const now = Math.floor(Date.now() / 1000);
  const iat = typeof payload.iat === 'number' ? payload.iat : null;
  const exp = typeof payload.exp === 'number' ? payload.exp : null;

  console.warn(`[auth:${context}] Diagnóstico del token`, {
    now: new Date(now * 1000).toISOString(),
    iat: iat !== null ? new Date(iat * 1000).toISOString() : null,
    exp: exp !== null ? new Date(exp * 1000).toISOString() : null,
    iatDeltaSeconds: iat !== null ? iat - now : null,
    expDeltaSeconds: exp !== null ? exp - now : null,
  });
}

function isJwtFutureError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const { code, message } = error as { code?: unknown; message?: unknown };
  if (code === 'PGRST303') return true;

  return typeof message === 'string' && /jwt issued at future/i.test(message);
}

async function clearLocalSession(): Promise<void> {
  try {
    await getSupabase().auth.signOut({ scope: 'local' });
  } catch (error) {
    console.warn('[auth] No se pudo cerrar la sesión local', error);
  }

  try {
    if (typeof localStorage === 'undefined') return;

    const keys: string[] = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key && key.startsWith('sb-') && key.includes('-auth-token')) {
        keys.push(key);
      }
    }
    keys.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.warn('[auth] No se pudo limpiar el storage local', error);
  }
}

function redirectToLogin(reason: 'session' | 'clock-skew'): void {
  if (typeof window === 'undefined') return;
  if (!window.location.pathname.startsWith('/admin')) return;

  const params = new URLSearchParams({ reauth: reason });
  window.location.assign(`/login?${params.toString()}`);
}

type RecoveryResult = 'retry' | 'stop';

async function recoverSession(): Promise<RecoveryResult> {
  const supabase = getSupabase();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return 'stop';

  logTokenDiagnostics('pgrst303', session.access_token);

  const { data, error } = await supabase.auth.refreshSession();
  if (error || !data.session) {
    console.warn('[auth] No se pudo refrescar la sesión', error);
    await clearLocalSession();
    redirectToLogin('session');
    return 'retry';
  }

  if (isTokenIssuedInFuture(data.session.access_token)) {
    logTokenDiagnostics('pgrst303-refresh', data.session.access_token);
    await clearLocalSession();
    redirectToLogin('clock-skew');
    return 'retry';
  }

  return 'retry';
}

export async function withAuthRetry<T>(operation: () => PromiseLike<T>): Promise<T> {
  try {
    const result = await operation();
    const error = (result as { error?: unknown } | null | undefined)?.error;

    if (!isJwtFutureError(error)) return result;

    const recovery = await recoverSession();
    if (recovery === 'stop') return result;

    return await operation();
  } catch (error) {
    if (!isJwtFutureError(error)) throw error;

    const recovery = await recoverSession();
    if (recovery === 'stop') throw error;

    return await operation();
  }
}

export async function ensureFreshSession(): Promise<SessionCheckResult> {
  try {
    const supabase = getSupabase();
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) return { session: null, reason: 'refresh-failed' };
    if (!session) return { session: null, reason: 'no-session' };

    const futureIat = isTokenIssuedInFuture(session.access_token);
    const expiringSoon = isTokenExpiringSoon(session.access_token);

    if (!futureIat && !expiringSoon) {
      return { session, reason: null };
    }

    if (futureIat) {
      logTokenDiagnostics('future-iat', session.access_token);
    }

    const { data, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError || !data.session) {
      if (futureIat) {
        console.warn('[auth] No se pudo recuperar la sesión con iat futuro', refreshError);
        await clearLocalSession();
        return { session: null, reason: 'refresh-failed' };
      }
      return { session, reason: null };
    }

    if (isTokenIssuedInFuture(data.session.access_token)) {
      logTokenDiagnostics('future-iat-after-refresh', data.session.access_token);
      await clearLocalSession();
      return { session: null, reason: 'clock-skew' };
    }

    return { session: data.session, reason: null };
  } catch (error) {
    console.warn('[auth] Error verificando la sesión', error);
    return { session: null, reason: 'refresh-failed' };
  }
}
