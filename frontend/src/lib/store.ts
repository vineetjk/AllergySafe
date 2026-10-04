import { useSyncExternalStore } from "react";

/**
 * A tiny value store backed by localStorage, read with useSyncExternalStore so
 * the server render uses a fixed value and the browser picks up saved data
 * without setting state inside effects.
 */
export interface LocalStore<T> {
  get: () => T;
  getServer: () => T;
  set: (value: T) => void;
  clear: () => void;
  subscribe: (listener: () => void) => () => void;
}

export function createLocalStore<T>(
  key: string,
  serverValue: T,
  options: { clientDefault?: () => T; validate?: (value: unknown) => value is T } = {},
): LocalStore<T> {
  let cache: { value: T } | null = null;
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((l) => l());
  const clientDefault = () => (options.clientDefault ? options.clientDefault() : serverValue);

  const get = (): T => {
    if (cache) return cache.value;
    let value = clientDefault();
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) {
        const parsed: unknown = JSON.parse(raw);
        if (!options.validate || options.validate(parsed)) value = parsed as T;
      }
    } catch {
      // Storage blocked (private mode) or corrupt data: use the default.
    }
    cache = { value };
    return value;
  };

  return {
    get,
    getServer: () => serverValue,
    set(value: T) {
      cache = { value };
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // Keep the value for this session only.
      }
      notify();
    },
    clear() {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // Ignore.
      }
      cache = null;
      notify();
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export function useLocalStore<T>(store: LocalStore<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, store.getServer);
}

const noopSubscribe = () => () => {};

/** Read a browser-only value; returns serverValue during server rendering. */
export function useClientValue<T>(getValue: () => T, serverValue: T): T {
  return useSyncExternalStore(noopSubscribe, getValue, () => serverValue);
}
