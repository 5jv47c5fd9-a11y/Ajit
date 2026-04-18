import { v4 as uuid } from 'uuid';

const byUser = new Map(); // userId -> [{ id, company, addedAt, lastSnapshot }]

export const watchlistService = {
  list(userId) {
    return byUser.get(userId) ?? [];
  },
  add(userId, company) {
    const arr = byUser.get(userId) ?? [];
    if (arr.find((c) => c.company.toLowerCase() === company.toLowerCase())) return arr;
    arr.push({ id: uuid(), company, addedAt: new Date().toISOString(), lastSnapshot: null });
    byUser.set(userId, arr);
    return arr;
  },
  remove(userId, id) {
    const arr = (byUser.get(userId) ?? []).filter((c) => c.id !== id);
    byUser.set(userId, arr);
    return arr;
  },
  updateSnapshot(userId, company, snapshot) {
    const arr = byUser.get(userId) ?? [];
    const entry = arr.find((c) => c.company.toLowerCase() === company.toLowerCase());
    if (entry) entry.lastSnapshot = { capturedAt: Date.now(), ...snapshot };
  },
  allUsersAndCompanies() {
    const out = [];
    for (const [userId, entries] of byUser.entries()) {
      for (const e of entries) out.push({ userId, company: e.company });
    }
    return out;
  },
};
