import type { HeroDef } from '../types/Hero';

export const HEROES: HeroDef[] = [
  {
    id: 'brauer',
    name: 'Der Brauer',
    title: 'Wirt aus München',
    maxHp: 40,
    gridCols: 6,
    gridRows: 4,
    startingItems: ['bierkrug', 'brezel', 'wurst', 'holzschild'],
    passive: '+1 Gold pro Kampf',
    glyph: '🍻',
    color: '#d4a13a',
  },
  {
    id: 'jaeger',
    name: 'Der Schwarzwald-Jäger',
    title: '(in Phase 2 spielbar)',
    maxHp: 35,
    gridCols: 5,
    gridRows: 5,
    startingItems: ['pfeil', 'jagdhorn', 'lederhose'],
    passive: 'Erste Attacke +50% Schaden',
    glyph: '🏹',
    color: '#5c8a3a',
  },
  {
    id: 'alchemist',
    name: 'Die Alchemistin',
    title: '(in Phase 2 spielbar)',
    maxHp: 30,
    gridCols: 6,
    gridRows: 4,
    startingItems: ['kraeutertrank', 'kraeutertrank', 'gartenzwerg'],
    passive: 'Tränke wirken doppelt',
    glyph: '🧪',
    color: '#3a8a5c',
  },
];

export const HERO_INDEX: Map<string, HeroDef> = new Map(HEROES.map((h) => [h.id, h]));

export function getHero(id: string): HeroDef {
  const def = HERO_INDEX.get(id);
  if (!def) throw new Error(`Unknown hero id: ${id}`);
  return def;
}
