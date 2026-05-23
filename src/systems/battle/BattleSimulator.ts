import type { BattleEvent, EnemyDef, Side } from '../../types/Battle';
import type { ItemDef, PlacedItem } from '../../types/Item';
import { Rng } from '../rng/Rng';

const MAX_TURNS = 200;

interface Combatant {
  side: Side;
  hp: number;
  maxHp: number;
  baseArmor: number;
  // attack-source items (player) or weapon-stats (enemy)
  weapons: WeaponState[];
  passives: PassiveState[];
  stunTurns: number;
  shieldHits: number;
  blockNextHitsThisTurn: number;
  attackBuff: number;
  log: BattleEvent[];
  rng: Rng;
}

interface WeaponState {
  instanceId: string;
  itemId: string;
  attack: number;
  cooldown: number;
  pierce: boolean;
  initiative: number;
  cdRemaining: number;
  // for stun-on-attack from items
  stunChance: number;
  stunAmount: number;
}

interface PassiveState {
  itemId: string;
  effects: ItemDef['effects'];
  oneShotDone: boolean[];
}

function makePlayerCombatant(items: PlacedItem[], maxHp: number, seed: number): Combatant {
  const weapons: WeaponState[] = [];
  const passives: PassiveState[] = [];
  let baseArmor = 0;
  let initiative = 0;
  for (const placed of items) {
    const d = placed.def;
    baseArmor += d.stats.armor ?? 0;
    if (d.stats.attack && d.stats.attack > 0 && d.stats.cooldown && d.stats.cooldown > 0) {
      weapons.push({
        instanceId: placed.instanceId,
        itemId: d.id,
        attack: d.stats.attack,
        cooldown: d.stats.cooldown,
        pierce: d.stats.pierce ?? false,
        initiative: initiative++,
        cdRemaining: 0,
        stunChance: 0,
        stunAmount: 0,
      });
    }
    // attach stun-on-attack from item effects to its own weapon (if any)
    for (const eff of d.effects) {
      if (eff.event === 'on_attack' && eff.kind === 'stun') {
        const w = weapons[weapons.length - 1];
        if (w && w.itemId === d.id) {
          w.stunChance = eff.chance ?? 1;
          w.stunAmount = eff.amount ?? 1;
        }
      }
    }
    if (d.effects.length > 0) {
      passives.push({ itemId: d.id, effects: d.effects, oneShotDone: d.effects.map(() => false) });
    }
  }
  return {
    side: 'player',
    hp: maxHp,
    maxHp,
    baseArmor,
    weapons,
    passives,
    stunTurns: 0,
    shieldHits: 0,
    blockNextHitsThisTurn: 0,
    attackBuff: 0,
    log: [],
    rng: new Rng(seed),
  };
}

function makeEnemyCombatant(def: EnemyDef, seed: number): Combatant {
  const weapon: WeaponState = {
    instanceId: 'enemy_weapon',
    itemId: def.id,
    attack: def.attack,
    cooldown: def.cooldown,
    pierce: false,
    initiative: 0,
    cdRemaining: 0,
    stunChance: 0,
    stunAmount: 0,
  };
  const passives: PassiveState[] = [];
  if (def.special === 'bell_stun') {
    passives.push({
      itemId: 'bell_stun',
      effects: [{ event: 'on_turn_start', kind: 'stun', amount: 1, every: 3, target: 'enemy' }],
      oneShotDone: [false],
    });
  }
  return {
    side: 'enemy',
    hp: def.maxHp,
    maxHp: def.maxHp,
    baseArmor: def.armor,
    weapons: [weapon],
    passives,
    stunTurns: 0,
    shieldHits: 0,
    blockNextHitsThisTurn: 0,
    attackBuff: 0,
    log: [],
    rng: new Rng(seed ^ 0xa55a),
  };
}

function blocksFirstHitPerTurn(items: PlacedItem[]): boolean {
  return items.some((i) => i.def.stats.blockFirstHitPerTurn === true);
}

function emit(p: Combatant, e: Combatant, evt: BattleEvent, log: BattleEvent[]): void {
  log.push(evt);
  void p;
  void e;
}

function applyDamage(
  attacker: Combatant,
  defender: Combatant,
  rawDamage: number,
  pierce: boolean,
  sourceItem: string | undefined,
  sourceInstanceId: string | undefined,
  t: number,
  log: BattleEvent[],
): void {
  // shield item (first hit per turn)
  if (defender.blockNextHitsThisTurn > 0) {
    defender.blockNextHitsThisTurn--;
    emit(attacker, defender, {
      type: 'attack',
      t,
      source: attacker.side,
      sourceItem,
      sourceInstanceId,
      target: defender.side,
      rawDamage,
      finalDamage: 0,
      blocked: true,
    }, log);
    return;
  }
  let finalDamage = rawDamage;
  if (!pierce) {
    finalDamage = Math.max(0, rawDamage - defender.baseArmor);
  }
  defender.hp = Math.max(0, defender.hp - finalDamage);
  emit(attacker, defender, {
    type: 'attack',
    t,
    source: attacker.side,
    sourceItem,
    sourceInstanceId,
    target: defender.side,
    rawDamage,
    finalDamage,
    blocked: false,
  }, log);
  emit(attacker, defender, {
    type: 'hp_change',
    t,
    target: defender.side,
    hp: defender.hp,
    maxHp: defender.maxHp,
  }, log);

  // on_hit_taken triggers (reflect)
  for (const p of defender.passives) {
    for (let i = 0; i < p.effects.length; i++) {
      const eff = p.effects[i];
      if (eff.event !== 'on_hit_taken') continue;
      if (eff.kind === 'reflect') {
        const chance = eff.chance ?? 1;
        if (defender.rng.chance(chance)) {
          const reflectAmt = eff.amount ?? 1;
          emit(attacker, defender, {
            type: 'item_proc',
            t,
            side: defender.side,
            itemId: p.itemId,
            effect: `reflect ${reflectAmt}`,
          }, log);
          attacker.hp = Math.max(0, attacker.hp - reflectAmt);
          emit(attacker, defender, {
            type: 'hp_change',
            t,
            target: attacker.side,
            hp: attacker.hp,
            maxHp: attacker.maxHp,
          }, log);
        }
      }
    }
  }
}

function applyHeal(c: Combatant, amount: number, sourceItem: string | undefined, t: number, log: BattleEvent[]): void {
  if (c.hp >= c.maxHp) return;
  const healed = Math.min(amount, c.maxHp - c.hp);
  c.hp += healed;
  log.push({ type: 'heal', t, target: c.side, amount: healed, sourceItem });
  log.push({ type: 'hp_change', t, target: c.side, hp: c.hp, maxHp: c.maxHp });
}

function applyStun(c: Combatant, turns: number, sourceItem: string | undefined, t: number, log: BattleEvent[]): void {
  c.stunTurns = Math.max(c.stunTurns, turns);
  log.push({ type: 'status', t, target: c.side, status: 'stun', stacks: turns, sourceItem });
}

function fireTriggers(
  self: Combatant,
  other: Combatant,
  event: 'on_battle_start' | 'on_turn_start' | 'on_turn_end',
  turn: number,
  t: number,
  log: BattleEvent[],
): void {
  for (const p of self.passives) {
    for (let i = 0; i < p.effects.length; i++) {
      const eff = p.effects[i];
      if (eff.event !== event) continue;
      if (eff.oneShot && p.oneShotDone[i]) continue;
      if (eff.every && turn > 0 && turn % eff.every !== 0) continue;
      // mark proc
      log.push({ type: 'item_proc', t, side: self.side, itemId: p.itemId, effect: `${eff.kind}${eff.amount ? ' ' + eff.amount : ''}` });
      switch (eff.kind) {
        case 'heal':
          applyHeal(self, eff.amount ?? 0, p.itemId, t, log);
          break;
        case 'buff_attack': {
          const buff = eff.amount ?? 1;
          self.attackBuff += buff;
          for (const w of self.weapons) {
            w.attack += buff;
          }
          break;
        }
        case 'stun':
          applyStun(other, eff.amount ?? 1, p.itemId, t, log);
          break;
        case 'shield':
          self.shieldHits = Math.max(self.shieldHits, eff.amount ?? 1);
          break;
        case 'damage':
          applyDamage(self, other, eff.amount ?? 0, false, p.itemId, undefined, t, log);
          break;
        default:
          break;
      }
      if (eff.oneShot) p.oneShotDone[i] = true;
    }
  }
}

export interface BattleInput {
  seed: number;
  playerItems: PlacedItem[];
  playerHp: number;
  playerMaxHp: number;
  enemy: EnemyDef;
}

export interface BattleResult {
  events: BattleEvent[];
  winner: Side | 'draw';
  finalPlayerHp: number;
  finalEnemyHp: number;
}

export function simulateBattle(input: BattleInput): BattleResult {
  const log: BattleEvent[] = [];
  const player = makePlayerCombatant(input.playerItems, input.playerMaxHp, input.seed);
  player.hp = input.playerHp;
  const enemy = makeEnemyCombatant(input.enemy, input.seed);
  const playerBlocksFirst = blocksFirstHitPerTurn(input.playerItems);

  let t = 0;
  log.push({
    type: 'battle_start',
    t: t++,
    playerHp: player.hp,
    enemyHp: enemy.hp,
    playerMaxHp: player.maxHp,
    enemyMaxHp: enemy.maxHp,
  });

  fireTriggers(player, enemy, 'on_battle_start', 0, t++, log);
  fireTriggers(enemy, player, 'on_battle_start', 0, t++, log);

  for (let turn = 1; turn <= MAX_TURNS; turn++) {
    if (player.hp <= 0 || enemy.hp <= 0) break;
    log.push({ type: 'turn_start', t: t++, turn });

    // reset per-turn shields
    player.blockNextHitsThisTurn = playerBlocksFirst ? 1 : 0;
    enemy.blockNextHitsThisTurn = 0;

    fireTriggers(player, enemy, 'on_turn_start', turn, t++, log);
    fireTriggers(enemy, player, 'on_turn_start', turn, t++, log);

    // gather attackers in initiative order, alternating sides (player first within same initiative)
    type AtkEntry = { c: Combatant; o: Combatant; w: WeaponState };
    const attackers: AtkEntry[] = [];
    for (const w of player.weapons) attackers.push({ c: player, o: enemy, w });
    for (const w of enemy.weapons) attackers.push({ c: enemy, o: player, w });

    for (const { c, o, w } of attackers) {
      if (c.hp <= 0 || o.hp <= 0) break;
      if (c.stunTurns > 0) continue;
      w.cdRemaining--;
      if (w.cdRemaining > 0) continue;
      w.cdRemaining = w.cooldown;
      const dmg = w.attack;
      const srcItem = c.side === 'player' ? w.itemId : undefined;
      const srcInstance = c.side === 'player' ? w.instanceId : undefined;
      applyDamage(c, o, dmg, w.pierce, srcItem, srcInstance, t++, log);
      if (w.stunChance > 0 && c.rng.chance(w.stunChance)) {
        applyStun(o, w.stunAmount, srcItem, t++, log);
      }
    }

    if (player.hp <= 0 || enemy.hp <= 0) {
      if (player.hp <= 0) log.push({ type: 'death', t: t++, target: 'player' });
      if (enemy.hp <= 0) log.push({ type: 'death', t: t++, target: 'enemy' });
      break;
    }

    fireTriggers(player, enemy, 'on_turn_end', turn, t++, log);
    fireTriggers(enemy, player, 'on_turn_end', turn, t++, log);

    if (player.stunTurns > 0) player.stunTurns--;
    if (enemy.stunTurns > 0) enemy.stunTurns--;

    log.push({ type: 'turn_end', t: t++, turn });
  }

  let winner: Side | 'draw';
  if (player.hp <= 0 && enemy.hp <= 0) winner = 'draw';
  else if (player.hp <= 0) winner = 'enemy';
  else if (enemy.hp <= 0) winner = 'player';
  else winner = enemy.hp < player.hp ? 'player' : 'enemy';

  log.push({ type: 'battle_end', t: t, winner });
  return { events: log, winner, finalPlayerHp: player.hp, finalEnemyHp: enemy.hp };
}
