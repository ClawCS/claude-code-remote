"use client";

import { useCallback, useEffect, useState, useSyncExternalStore, type SetStateAction } from "react";

type Store<T> = { snapshot: () => T[]; subscribe: (listener: () => void) => () => void; initialize: (read: () => T[], persist: (items: T[]) => void) => void; update: (action: SetStateAction<T[]>, persist: (items: T[]) => void) => void };
const empty: never[] = [];
const browserStores = new Map<string, Store<unknown>>();
function createStore<T>(): Store<T> {
  let value: T[] = [], initialized = false;
  const listeners = new Set<() => void>();
  return { snapshot: () => value,
    subscribe: listener => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    initialize: (read, persist) => {
      if (initialized) return;
      initialized = true;
      try { value = read(); } catch { /* Reject malformed persisted data. */ }
      persist(value);
      listeners.forEach(listener => listener());
    },
    update: (action, persist) => {
      value = typeof action === "function" ? action(value) : action;
      persist(value);
      listeners.forEach(listener => listener());
    },
  };
}

/** Same-tab memory survives route-provider remounts when optional storage fails.
 * Server renders never register, read or mutate a shared customer store. */
export function useSessionList<T>(key: "trinkgut-cart" | "trinkgut-wishlist", parse: (value: unknown) => T[]) {
  const [store] = useState(() => {
    if (typeof window === "undefined") return createStore<T>();
    if (!browserStores.has(key)) browserStores.set(key, createStore<unknown>());
    return browserStores.get(key)! as Store<T>;
  });
  const persist = useCallback((value: T[]) => {
    try { if (value.length) sessionStorage.setItem(key, JSON.stringify(value)); else sessionStorage.removeItem(key); }
    catch { /* Same-tab memory remains available in private/quota-limited browsers. */ }
  }, [key]);
  useEffect(() => {
    store.initialize(() => {
      let stored: string | null = null;
      try { stored = sessionStorage.getItem(key); } catch { /* Optional storage. */ }
      if (stored === null) { try { stored = localStorage.getItem(key); } catch { /* Optional legacy storage. */ } }
      const parsed = parse(stored ? JSON.parse(stored) : []);
      try { localStorage.removeItem(key); } catch { /* Never retain a new permanent copy. */ }
      return parsed;
    }, persist);
  }, [key, parse, persist, store]);
  const items = useSyncExternalStore(store.subscribe, store.snapshot, () => empty);
  const setItems = useCallback((action: SetStateAction<T[]>) => {
    store.update(action, persist);
  }, [persist, store]);
  return [items, setItems] as const;
}
