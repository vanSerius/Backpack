import type { MetaSaveV1, RunSaveV1 } from '../../types/Save';

const META_KEY = 'bp:meta:v1';
const RUN_KEY = 'bp:run:active';

export const DEFAULT_META: MetaSaveV1 = {
  version: 1,
  unlocks: { heroes: ['brauer'], items: [] },
  stats: { runsTotal: 0, runsWon: 0, enemiesDefeated: 0, bossesDefeated: 0 },
  settings: { battleSpeed: 1 },
};

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export const SaveManager = {
  loadMeta(): MetaSaveV1 {
    const data = safeParse<MetaSaveV1>(localStorage.getItem(META_KEY));
    if (!data || data.version !== 1) {
      return structuredClone(DEFAULT_META);
    }
    return { ...structuredClone(DEFAULT_META), ...data };
  },

  saveMeta(meta: MetaSaveV1): void {
    try {
      localStorage.setItem(META_KEY, JSON.stringify(meta));
    } catch (e) {
      console.warn('Konnte Speicherstand nicht schreiben:', e);
    }
  },

  loadRun(): RunSaveV1 | null {
    const data = safeParse<RunSaveV1>(localStorage.getItem(RUN_KEY));
    if (!data || data.version !== 1) return null;
    return data;
  },

  saveRun(run: RunSaveV1): void {
    try {
      localStorage.setItem(RUN_KEY, JSON.stringify(run));
    } catch (e) {
      console.warn('Konnte Run nicht speichern:', e);
    }
  },

  clearRun(): void {
    localStorage.removeItem(RUN_KEY);
  },
};
