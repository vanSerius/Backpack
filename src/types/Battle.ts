export type Side = 'player' | 'enemy';

export type BattleEvent =
  | { type: 'battle_start'; t: number; playerHp: number; enemyHp: number; playerMaxHp: number; enemyMaxHp: number }
  | { type: 'turn_start'; t: number; turn: number }
  | { type: 'turn_end'; t: number; turn: number }
  | { type: 'attack'; t: number; source: Side; sourceItem?: string; sourceInstanceId?: string; target: Side; rawDamage: number; finalDamage: number; blocked: boolean }
  | { type: 'heal'; t: number; target: Side; amount: number; sourceItem?: string; sourceInstanceId?: string }
  | { type: 'status'; t: number; target: Side; status: 'stun' | 'shield' | 'poison'; stacks: number; sourceItem?: string; sourceInstanceId?: string }
  | { type: 'item_proc'; t: number; side: Side; itemId: string; instanceId?: string; effect: string }
  | { type: 'hp_change'; t: number; target: Side; hp: number; maxHp: number }
  | { type: 'death'; t: number; target: Side }
  | { type: 'battle_end'; t: number; winner: Side | 'draw' };

export interface EnemyDef {
  id: string;
  name: string;
  maxHp: number;
  attack: number;
  cooldown: number;
  armor: number;
  special?: 'bell_stun' | 'taunt';
  glyph: string;
  color: string;
}
