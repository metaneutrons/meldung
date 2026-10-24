import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The store persists through window.localStorage, which the node test
// environment lacks. A small in-memory stand-in lets the real persist
// middleware run.
function stubBrowserStorage() {
  const data = new Map<string, string>();
  const localStorage = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  };
  vi.stubGlobal('window', { localStorage });
  vi.stubGlobal('localStorage', localStorage);
  return data;
}

async function loadStore() {
  vi.resetModules();
  return (await import('./form-store')).useFormStore;
}

describe('form store', () => {
  let storage: Map<string, string>;

  beforeEach(() => {
    storage = stubBrowserStorage();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('update merges fields and stamps the save time', async () => {
    const store = await loadStore();
    store.getState().update({ description: 'Laptop lost' });
    expect(store.getState().description).toBe('Laptop lost');
    expect(store.getState()._savedAt).not.toBe('');
  });

  it('reset returns to the empty form', async () => {
    const store = await loadStore();
    store.getState().update({ description: 'Laptop lost' });
    store.getState().reset();
    expect(store.getState().description).toBe('');
  });

  it('persists the data fields but not the actions', async () => {
    const store = await loadStore();
    store.getState().update({ description: 'Laptop lost' });
    const saved = JSON.parse(storage.get('meldung-draft') ?? '{}');
    expect(saved.state.description).toBe('Laptop lost');
    expect(saved.state).not.toHaveProperty('update');
    expect(saved.state).not.toHaveProperty('reset');
    expect(saved.state).not.toHaveProperty('clearDraft');
  });

  it('clearDraft empties the form and removes the stored draft', async () => {
    const store = await loadStore();
    store.getState().update({ description: 'Laptop lost' });
    expect(storage.has('meldung-draft')).toBe(true);
    store.getState().clearDraft();
    expect(store.getState().description).toBe('');
    // set() inside clearDraft re-persists the empty state first, then the
    // explicit removeItem runs; the draft must be gone afterwards.
    expect(storage.has('meldung-draft')).toBe(false);
  });
});
