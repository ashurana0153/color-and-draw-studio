// Saved paintings live in IndexedDB (a coloured 1600px picture is too big for localStorage).
// Small things (progress, sound) stay in localStorage. If IndexedDB is unavailable the picture simply isn't kept.
const DB = 'calm-colors', ST = 'paint';
let dbp = null;
const open = () => dbp || (dbp = new Promise((res, rej) => {
  try {
    const q = indexedDB.open(DB, 1);
    q.onupgradeneeded = () => q.result.createObjectStore(ST);
    q.onsuccess = () => res(q.result);
    q.onerror = () => rej(q.error);
  } catch (e) { rej(e); }
}));
const run = async (mode, fn) => {
  const d = await open();
  return new Promise((res, rej) => {
    const t = d.transaction(ST, mode); let req;
    try { req = fn(t.objectStore(ST)); } catch (e) { rej(e); return; }
    t.oncomplete = () => res(req && req.result);
    t.onerror = t.onabort = () => rej(t.error);
  });
};

export const paint = {
  async get(id) { try { return (await run('readonly', (s) => s.get(id))) || null; } catch (e) { return null; } },
  async set(id, blob) { try { await run('readwrite', (s) => s.put(blob, id)); return true; } catch (e) { return false; } },
  async del(id) { try { await run('readwrite', (s) => s.delete(id)); } catch (e) { /* ignore */ } },
  // run fn with a temporary URL for the saved picture, or null when there isn't one
  async withUrl(id, fn) {
    const b = await this.get(id);
    if (!b) return fn(null);
    const url = URL.createObjectURL(b);
    try { return await fn(url); } finally { setTimeout(() => URL.revokeObjectURL(url), 2000); }
  },
};
