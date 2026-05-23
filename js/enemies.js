'use strict';
const ENEMIES = [
  {
    name: 'Räuber Rolf',
    emoji: '🧟',
    hp: 50,
    items: [
      { id: 'fire_dagger', row: 0, col: 0 },
      { id: 'bark_vest',   row: 0, col: 1 },
    ],
    gold: 4,
  },
  {
    name: 'Frost­hexe',
    emoji: '🧙‍♀️',
    hp: 65,
    items: [
      { id: 'ice_sword',   row: 0, col: 0 },
      { id: 'ice_crystal', row: 2, col: 0 },
      { id: 'health_potion', row: 0, col: 1 },
    ],
    gold: 5,
  },
  {
    name: 'Natur­druide',
    emoji: '🌳',
    hp: 80,
    items: [
      { id: 'vine_whip',   row: 0, col: 0 },
      { id: 'thorn_blade', row: 0, col: 2 },
      { id: 'bark_vest',   row: 0, col: 4 },
    ],
    gold: 6,
  },
  {
    name: 'Schatten­dieb',
    emoji: '🥷',
    hp: 70,
    items: [
      { id: 'shadow_fang', row: 0, col: 0 },
      { id: 'shadow_fang', row: 0, col: 1 },
      { id: 'shadow_cloak', row: 0, col: 2 },
      { id: 'shadow_gem',  row: 0, col: 4 },
    ],
    gold: 7,
  },
  {
    name: 'Lava­golem',
    emoji: '🌋',
    hp: 100,
    items: [
      { id: 'fire_axe',   row: 0, col: 0 },
      { id: 'ember_staff', row: 0, col: 2 },
      { id: 'fire_gem',   row: 2, col: 0 },
      { id: 'iron_shield', row: 2, col: 1 },
    ],
    gold: 8,
  },
  {
    name: 'Blizzard­ritter',
    emoji: '🏔️',
    hp: 110,
    items: [
      { id: 'blizzard_bow', row: 0, col: 0 },
      { id: 'frost_armor',  row: 2, col: 0 },
      { id: 'mana_flask',   row: 0, col: 2 },
      { id: 'ice_crystal',  row: 0, col: 3 },
    ],
    gold: 9,
  },
  {
    name: 'Chaos­magier',
    emoji: '🧙',
    hp: 95,
    items: [
      { id: 'void_blade',  row: 0, col: 0 },
      { id: 'rage_brew',   row: 0, col: 2 },
      { id: 'lucky_charm', row: 0, col: 3 },
      { id: 'shadow_gem',  row: 2, col: 0 },
      { id: 'fire_gem',    row: 2, col: 1 },
    ],
    gold: 10,
  },
  {
    name: '⚠️ ENDBOSS: Packmaster',
    emoji: '👑',
    hp: 150,
    items: [
      { id: 'fire_axe',    row: 0, col: 0 },
      { id: 'frost_armor', row: 0, col: 2 },
      { id: 'void_blade',  row: 2, col: 0 },
      { id: 'lucky_charm', row: 2, col: 2 },
      { id: 'shadow_gem',  row: 2, col: 3 },
      { id: 'fire_gem',    row: 3, col: 0 },
    ],
    gold: 15,
  }
];
