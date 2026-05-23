import { BackpackGrid } from '../grid/BackpackGrid';
import { getHero } from '../../data/heroes';
import { getItem } from '../../data/items';
import { STAGE_ORDER } from '../../data/enemies';
import { randomSeed } from '../rng/Rng';
import { SaveManager } from './SaveManager';
import type { MetaSaveV1, RunSaveV1 } from '../../types/Save';
import type { HeroDef } from '../../types/Hero';

export interface RunState {
  seed: number;
  hero: HeroDef;
  hp: number;
  maxHp: number;
  stage: number;
  backpack: BackpackGrid;
}

class GameStateClass {
  meta: MetaSaveV1;
  run: RunState | null = null;

  constructor() {
    this.meta = SaveManager.loadMeta();
  }

  startRun(heroId: string): RunState {
    const hero = getHero(heroId);
    const backpack = new BackpackGrid(hero.gridCols, hero.gridRows);
    for (const itemId of hero.startingItems) {
      const def = getItem(itemId);
      const spot = backpack.findFreeSpot(def);
      if (spot) backpack.place(def, spot.x, spot.y, spot.rotation);
    }
    this.run = {
      seed: randomSeed(),
      hero,
      hp: hero.maxHp,
      maxHp: hero.maxHp,
      stage: 0,
      backpack,
    };
    this.saveRun();
    return this.run;
  }

  resumeRun(): RunState | null {
    const data = SaveManager.loadRun();
    if (!data) return null;
    try {
      const hero = getHero(data.heroId);
      const backpack = new BackpackGrid(data.backpack.width, data.backpack.height);
      for (const it of data.backpack.items) {
        const def = getItem(it.itemId);
        backpack.place(def, it.x, it.y, it.rotation, it.instanceId);
      }
      this.run = {
        seed: data.seed,
        hero,
        hp: data.hp,
        maxHp: data.maxHp,
        stage: data.stage,
        backpack,
      };
      return this.run;
    } catch (e) {
      console.warn('Konnte Run nicht laden:', e);
      SaveManager.clearRun();
      return null;
    }
  }

  saveRun(): void {
    if (!this.run) return;
    const r = this.run;
    const data: RunSaveV1 = {
      version: 1,
      seed: r.seed,
      heroId: r.hero.id,
      hp: r.hp,
      maxHp: r.maxHp,
      stage: r.stage,
      backpack: r.backpack.serialize(),
    };
    SaveManager.saveRun(data);
  }

  advanceStage(): void {
    if (!this.run) return;
    this.run.stage++;
    this.meta.stats.enemiesDefeated++;
    if (this.run.stage > STAGE_ORDER.length - 1) {
      // last enemy was boss
      this.meta.stats.bossesDefeated++;
    }
    this.saveRun();
    SaveManager.saveMeta(this.meta);
  }

  endRun(won: boolean): void {
    this.meta.stats.runsTotal++;
    if (won) this.meta.stats.runsWon++;
    SaveManager.saveMeta(this.meta);
    SaveManager.clearRun();
    this.run = null;
  }

  currentEnemyId(): string | null {
    if (!this.run) return null;
    if (this.run.stage >= STAGE_ORDER.length) return null;
    return STAGE_ORDER[this.run.stage];
  }
}

export const gameState = new GameStateClass();
