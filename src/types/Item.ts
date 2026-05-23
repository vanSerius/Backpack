export type TriggerEvent =
  | 'on_battle_start'
  | 'on_turn_start'
  | 'on_turn_end'
  | 'on_attack'
  | 'on_hit_taken';

export type EffectKind =
  | 'heal'
  | 'damage'
  | 'attack'
  | 'stun'
  | 'reflect'
  | 'shield'
  | 'buff_attack';

export interface ItemEffect {
  event: TriggerEvent;
  kind: EffectKind;
  amount?: number;
  chance?: number;
  every?: number;
  oneShot?: boolean;
  target?: 'self' | 'enemy';
}

export interface ItemStats {
  attack?: number;
  cooldown?: number;
  armor?: number;
  pierce?: boolean;
  blockFirstHitPerTurn?: boolean;
}

export interface ItemShape {
  width: number;
  height: number;
  mask: number[][];
}

export interface ItemDef {
  id: string;
  name: string;
  tier: number;
  shape: ItemShape;
  tags: string[];
  stats: ItemStats;
  effects: ItemEffect[];
  cost: number;
  description: string;
  glyph: string;
  color: string;
}

export interface PlacedItem {
  instanceId: string;
  def: ItemDef;
  x: number;
  y: number;
  rotation: 0 | 1 | 2 | 3;
}
