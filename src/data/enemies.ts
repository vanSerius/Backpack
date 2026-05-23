import type { EnemyDef } from '../types/Battle';

export const ENEMIES: EnemyDef[] = [
  {
    id: 'wildschwein',
    name: 'Wildes Wildschwein',
    maxHp: 25,
    attack: 4,
    cooldown: 2,
    armor: 1,
    glyph: '🐗',
    color: '#5a3a20',
  },
  {
    id: 'wirt',
    name: 'Wirt mit Keule',
    maxHp: 40,
    attack: 6,
    cooldown: 2,
    armor: 2,
    special: 'taunt',
    glyph: '🦹',
    color: '#8a4030',
  },
  {
    id: 'krampus',
    name: 'Der Krampus',
    maxHp: 80,
    attack: 5,
    cooldown: 1,
    armor: 3,
    special: 'bell_stun',
    glyph: '👹',
    color: '#a01818',
  },
];

export const ENEMY_INDEX: Map<string, EnemyDef> = new Map(ENEMIES.map((e) => [e.id, e]));

export function getEnemy(id: string): EnemyDef {
  const def = ENEMY_INDEX.get(id);
  if (!def) throw new Error(`Unknown enemy id: ${id}`);
  return def;
}

export const STAGE_ORDER: string[] = ['wildschwein', 'wirt', 'krampus'];
