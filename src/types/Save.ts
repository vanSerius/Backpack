export interface MetaSaveV1 {
  version: 1;
  unlocks: {
    heroes: string[];
    items: string[];
  };
  stats: {
    runsTotal: number;
    runsWon: number;
    enemiesDefeated: number;
    bossesDefeated: number;
  };
  settings: {
    battleSpeed: 1 | 2 | 4;
  };
}

export interface RunSaveItem {
  instanceId: string;
  itemId: string;
  x: number;
  y: number;
  rotation: 0 | 1 | 2 | 3;
}

export interface RunSaveV1 {
  version: 1;
  seed: number;
  heroId: string;
  hp: number;
  maxHp: number;
  stage: number;
  backpack: {
    width: number;
    height: number;
    items: RunSaveItem[];
  };
}
