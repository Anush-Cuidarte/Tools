import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from './api';

// ── localStorage keys ──
const LS_CALCS = 'anush_demo_calcs';
const LS_EXPORTS = 'anush_demo_exports';

// ── Limits ──
const MAX_CALCS = 50;
const MAX_EXPORTS = 2;

// ── Helpers ──

function lsRead(key, fallback = 0) {
  try {
    const v = parseInt(localStorage.getItem(key), 10);
    return Number.isFinite(v) ? v : fallback;
  } catch {
    return fallback;
  }
}

function lsWrite(key, value) {
  try {
    localStorage.setItem(key, String(value));
  } catch { /* quota — ignore */ }
}

/**
 * Generate a deterministic device fingerprint from stable browser properties.
 *
 * Based on: userAgent, screen dimensions, language, timezone.
 * This fingerprint stays the SAME in incognito/private windows on the same
 * browser, preventing users from bypassing demo limits by clearing storage.
 */
async function generateDeviceFingerprint() {
  const parts = [
    navigator.userAgent,
    screen.width,
    screen.height,
    navigator.language,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  ];
  const input = parts.join('||');

  try {
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    // Fallback for older browsers — FNV-1a-ish
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = ((hash << 5) - hash) + input.charCodeAt(i);
      hash |= 0;
    }
    return 'fp_' + Math.abs(hash).toString(36).padStart(8, '0');
  }
}

// ── Context ──

export const DemoContext = createContext(null);

export function DemoProvider({ children }) {
  const [deviceId, setDeviceId] = useState(null);
  const [calcsUsed, setCalcsUsed]   = useState(0);
  const [exportsUsed, setExportsUsed] = useState(0);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [blockedAction, setBlockedAction] = useState(null);
  const [initialized, setInitialized] = useState(false);

  // ── Bootstrap: fingerprint + backend sync ──
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const fp = await generateDeviceFingerprint();
      if (cancelled) return;

      setDeviceId(fp);

      // 1. Read local cache
      let localCalcs = lsRead(LS_CALCS);
      let localExports = lsRead(LS_EXPORTS);

      // 2. Fetch backend as source of truth
      try {
        const backend = await api.demoEstado(fp);
        if (cancelled) return;

        // Backend is authoritative — overwrite local if backend has higher counts
        if (backend.calcs_used > localCalcs) {
          localCalcs = backend.calcs_used;
          lsWrite(LS_CALCS, localCalcs);
        }
        if (backend.exports_used > localExports) {
          localExports = backend.exports_used;
          lsWrite(LS_EXPORTS, localExports);
        }
      } catch {
        // Backend offline — keep local values as-is
      }

      if (cancelled) return;
      setCalcsUsed(localCalcs);
      setExportsUsed(localExports);
      setInitialized(true);
    })();

    return () => { cancelled = true; };
  }, []);

  // ── Refs to avoid stale closures ──
  const calcsRef = useRef(calcsUsed);
  const exportsRef = useRef(exportsUsed);
  useEffect(() => { calcsRef.current = calcsUsed; }, [calcsUsed]);
  useEffect(() => { exportsRef.current = exportsUsed; }, [exportsUsed]);

  // ── Sync helper: fire-and-forget POST to backend ──
  const syncToBackend = useCallback(async (tipo, toolSlug) => {
    try {
      const result = await api.demoConsumir(deviceId, tipo, toolSlug);
      if (!result.allow) {
        // Edge case: backend rejected (race condition across tabs)
        // Force-sync counts from backend
        setCalcsUsed(result.calcs_used);
        setExportsUsed(result.exports_used);
        lsWrite(LS_CALCS, result.calcs_used);
        lsWrite(LS_EXPORTS, result.exports_used);
      }
    } catch {
      // Backend offline — local state is the fallback
    }
  }, [deviceId]);

  // ── Public actions ──

  const consumeCalculation = useCallback((toolSlug) => {
    const current = calcsRef.current;
    if (current >= MAX_CALCS) {
      setBlockedAction('calc');
      setShowUpgrade(true);
      return false;
    }

    const next = current + 1;
    calcsRef.current = next;
    setCalcsUsed(next);
    lsWrite(LS_CALCS, next);

    if (next >= MAX_CALCS) {
      setBlockedAction('calc');
      setShowUpgrade(true);
    }

    // Background sync
    syncToBackend('calc', toolSlug);
    return true;
  }, [syncToBackend]);

  const consumeExport = useCallback((toolSlug) => {
    const current = exportsRef.current;
    if (current >= MAX_EXPORTS) {
      setBlockedAction('export');
      setShowUpgrade(true);
      return false;
    }

    const next = current + 1;
    exportsRef.current = next;
    setExportsUsed(next);
    lsWrite(LS_EXPORTS, next);

    if (next >= MAX_EXPORTS) {
      setBlockedAction('export');
      setShowUpgrade(true);
    }

    // Background sync
    syncToBackend('export', toolSlug);
    return true;
  }, [syncToBackend]);

  const resetDemo = useCallback(() => {
    setCalcsUsed(0);
    setExportsUsed(0);
    setShowUpgrade(false);
    setBlockedAction(null);
    lsWrite(LS_CALCS, 0);
    lsWrite(LS_EXPORTS, 0);
  }, []);

  const value = {
    isDemo: true,
    deviceId,
    calcsUsed,
    exportsUsed,
    maxCalcs: MAX_CALCS,
    maxExports: MAX_EXPORTS,
    calcsRemaining: Math.max(0, MAX_CALCS - calcsUsed),
    exportsRemaining: Math.max(0, MAX_EXPORTS - exportsUsed),
    consumeCalculation,
    consumeExport,
    showUpgrade,
    blockedAction,
    setShowUpgrade,
    resetDemo,
  };

  return (
    <DemoContext.Provider value={value}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) {
    throw new Error('useDemo must be used within a <DemoProvider>');
  }
  return ctx;
}
