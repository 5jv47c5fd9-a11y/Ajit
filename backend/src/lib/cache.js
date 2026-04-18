const store = new Map();

export const cache = {
  get(key) {
    const entry = store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      store.delete(key);
      return null;
    }
    return entry.value;
  },
  set(key, value, ttlMs = 10 * 60 * 1000) {
    store.set(key, { value, expiresAt: ttlMs ? Date.now() + ttlMs : null });
    return value;
  },
  delete(key) {
    store.delete(key);
  },
  clear() {
    store.clear();
  },
};
