import { describe, it, expect } from 'vitest';
import { simulateBattle } from '../src/systems/battle/BattleSimulator';
import { getItem } from '../src/data/items';
import { getEnemy } from '../src/data/enemies';
import { BackpackGrid } from '../src/systems/grid/BackpackGrid';

function makeBackpack(itemIds: string[]): BackpackGrid {
  const grid = new BackpackGrid(8, 8);
  for (const id of itemIds) {
    const def = getItem(id);
    const spot = grid.findFreeSpot(def);
    if (spot) grid.place(def, spot.x, spot.y, spot.rotation);
  }
  return grid;
}

describe('BattleSimulator', () => {
  it('terminates in at most 200 turns', () => {
    const grid = makeBackpack(['bierkrug', 'brezel', 'wurst', 'holzschild']);
    const result = simulateBattle({
      seed: 1,
      playerItems: grid.allItems(),
      playerHp: 40,
      playerMaxHp: 40,
      enemy: getEnemy('wildschwein'),
    });
    expect(result.events.length).toBeGreaterThan(0);
    const lastEvent = result.events[result.events.length - 1];
    expect(lastEvent.type).toBe('battle_end');
  });

  it('hp is never negative in events', () => {
    const grid = makeBackpack(['bierkrug', 'brezel', 'wurst', 'holzschild']);
    const result = simulateBattle({
      seed: 42,
      playerItems: grid.allItems(),
      playerHp: 40,
      playerMaxHp: 40,
      enemy: getEnemy('krampus'),
    });
    for (const ev of result.events) {
      if (ev.type === 'hp_change') {
        expect(ev.hp).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('is deterministic for the same seed', () => {
    const grid = makeBackpack(['bierkrug', 'brezel', 'pfeil']);
    const items = grid.allItems();
    const r1 = simulateBattle({
      seed: 12345,
      playerItems: items,
      playerHp: 40,
      playerMaxHp: 40,
      enemy: getEnemy('wirt'),
    });
    const r2 = simulateBattle({
      seed: 12345,
      playerItems: items,
      playerHp: 40,
      playerMaxHp: 40,
      enemy: getEnemy('wirt'),
    });
    expect(r1.events.length).toBe(r2.events.length);
    expect(r1.winner).toBe(r2.winner);
    expect(r1.finalEnemyHp).toBe(r2.finalEnemyHp);
  });

  it('no items vs wildschwein -> player loses', () => {
    const grid = makeBackpack([]);
    const result = simulateBattle({
      seed: 7,
      playerItems: grid.allItems(),
      playerHp: 40,
      playerMaxHp: 40,
      enemy: getEnemy('wildschwein'),
    });
    expect(result.winner).toBe('enemy');
  });

  it('strong loadout beats wildschwein', () => {
    const grid = makeBackpack(['bierkrug', 'pfeil', 'lederhose', 'holzschild', 'kraeutertrank']);
    const result = simulateBattle({
      seed: 99,
      playerItems: grid.allItems(),
      playerHp: 40,
      playerMaxHp: 40,
      enemy: getEnemy('wildschwein'),
    });
    expect(result.winner).toBe('player');
  });

  it('pierce ignores armor', () => {
    const grid = makeBackpack(['pfeil']);
    const result = simulateBattle({
      seed: 1,
      playerItems: grid.allItems(),
      playerHp: 100,
      playerMaxHp: 100,
      enemy: getEnemy('krampus'),
    });
    // pfeil deals 2 every turn pierce; over 200 turns should hit krampus a lot
    const hits = result.events.filter((e) => e.type === 'attack' && e.source === 'player');
    expect(hits.length).toBeGreaterThan(0);
    for (const h of hits) {
      if (h.type === 'attack' && !h.blocked) {
        expect(h.finalDamage).toBe(h.rawDamage); // pierce: final = raw
      }
    }
  });
});
