'use strict';
const ITEMS = {
  // === WAFFEN (Feuer) ===
  fire_dagger: {
    id: 'fire_dagger', name: 'Feuer­dolch', emoji: '🗡️',
    element: 'fire', type: 'weapon',
    w: 1, h: 2,
    atk: 8, hp: 0, speed: 2,
    cost: 3, sellValue: 1,
    desc: 'Schneller Angriff. Feuer-Adjacency: +3 Schaden.',
    onActivate(state, owner) {
      let dmg = this.atk + getAdjBonus(state, owner, 'fire', 3);
      dealDamage(state, owner, dmg);
    }
  },
  fire_axe: {
    id: 'fire_axe', name: 'Lava­beil', emoji: '🪓',
    element: 'fire', type: 'weapon',
    w: 1, h: 2,
    atk: 14, hp: 0, speed: 4,
    cost: 5, sellValue: 2,
    desc: 'Schwerer Schlag. Feuer-Adjacency: zündet Gegner (2/Runde).',
    onActivate(state, owner) {
      let dmg = this.atk;
      const bonus = getAdjBonus(state, owner, 'fire', 0);
      dealDamage(state, owner, dmg);
      if (bonus > 0) applyBurn(state, owner, 2);
    }
  },
  ember_staff: {
    id: 'ember_staff', name: 'Glut­stab', emoji: '🔥',
    element: 'fire', type: 'weapon',
    w: 1, h: 2,
    atk: 6, hp: 0, speed: 3,
    cost: 4, sellValue: 2,
    desc: 'Trifft 2× pro Aktivierung. Je Feuer-Nachbar +1 Schlag.',
    onActivate(state, owner) {
      const hits = 2 + getAdjCount(state, owner, 'fire');
      for (let i = 0; i < hits; i++) dealDamage(state, owner, this.atk);
    }
  },

  // === WAFFEN (Eis) ===
  ice_sword: {
    id: 'ice_sword', name: 'Frost­klinge', emoji: '🧊',
    element: 'ice', type: 'weapon',
    w: 1, h: 2,
    atk: 10, hp: 0, speed: 3,
    cost: 4, sellValue: 2,
    desc: 'Verlangsamt Gegner für 1 Runde (-1 Aktivierung).',
    onActivate(state, owner) {
      dealDamage(state, owner, this.atk);
      applyFreeze(state, owner, 1);
    }
  },
  blizzard_bow: {
    id: 'blizzard_bow', name: 'Blizzard­bogen', emoji: '🏹',
    element: 'ice', type: 'weapon',
    w: 2, h: 1,
    atk: 7, hp: 0, speed: 2,
    cost: 5, sellValue: 2,
    desc: 'Schnell. Eis-Adjacency: trifft alle Gegner-Items gleichzeitig.',
    onActivate(state, owner) {
      const bonus = getAdjCount(state, owner, 'ice');
      if (bonus > 0) dealDamageAll(state, owner, this.atk);
      else dealDamage(state, owner, this.atk);
    }
  },

  // === WAFFEN (Natur) ===
  vine_whip: {
    id: 'vine_whip', name: 'Reben­peitsche', emoji: '🌿',
    element: 'nature', type: 'weapon',
    w: 2, h: 1,
    atk: 9, hp: 0, speed: 3,
    cost: 4, sellValue: 2,
    desc: 'Angriff + heilt Besitzer um 3 HP.',
    onActivate(state, owner) {
      dealDamage(state, owner, this.atk);
      healOwner(state, owner, 3 + getAdjBonus(state, owner, 'nature', 2));
    }
  },
  thorn_blade: {
    id: 'thorn_blade', name: 'Dornen­klinge', emoji: '🌵',
    element: 'nature', type: 'weapon',
    w: 1, h: 2,
    atk: 12, hp: 0, speed: 4,
    cost: 5, sellValue: 2,
    desc: 'Natur-Adjacency: reflektiert 30% des Schadens zurück.',
    onActivate(state, owner) {
      const dmg = this.atk;
      const reflected = getAdjCount(state, owner, 'nature') > 0 ? Math.floor(dmg * 0.3) : 0;
      dealDamage(state, owner, dmg);
      if (reflected > 0) dealDamageReverse(state, owner, reflected);
    }
  },

  // === WAFFEN (Schatten) ===
  shadow_fang: {
    id: 'shadow_fang', name: 'Schattenreißer', emoji: '🦷',
    element: 'shadow', type: 'weapon',
    w: 1, h: 1,
    atk: 6, hp: 0, speed: 2,
    cost: 3, sellValue: 1,
    desc: 'Lebensraub: 50% des Schadens als HP zurück.',
    onActivate(state, owner) {
      const dmg = this.atk + getAdjBonus(state, owner, 'shadow', 2);
      const healed = dealDamage(state, owner, dmg);
      healOwner(state, owner, Math.floor(healed * 0.5));
    }
  },
  void_blade: {
    id: 'void_blade', name: 'Leere­klinge', emoji: '⚫',
    element: 'shadow', type: 'weapon',
    w: 1, h: 2,
    atk: 16, hp: 0, speed: 5,
    cost: 6, sellValue: 3,
    desc: 'Massiver Schaden. Kostet 4 eigene HP pro Schlag.',
    onActivate(state, owner) {
      selfDamage(state, owner, 4);
      dealDamage(state, owner, this.atk + getAdjBonus(state, owner, 'shadow', 4));
    }
  },

  // === RÜSTUNGEN ===
  iron_shield: {
    id: 'iron_shield', name: 'Eisenschild', emoji: '🛡️',
    element: 'none', type: 'armor',
    w: 1, h: 2,
    atk: 0, hp: 20, speed: 0,
    cost: 4, sellValue: 2,
    desc: 'Passiv: +20 HP. Blockt 2 Schaden pro Treffer.',
    block: 2,
    onActivate: null
  },
  frost_armor: {
    id: 'frost_armor', name: 'Frostpanzer', emoji: '🧊',
    element: 'ice', type: 'armor',
    w: 2, h: 2,
    atk: 0, hp: 30, speed: 0,
    cost: 7, sellValue: 3,
    desc: 'Passiv: +30 HP, +3 Block. Eis-Adjacency: +2 Block.',
    get block() { return 3; },
    onActivate: null
  },
  bark_vest: {
    id: 'bark_vest', name: 'Rinden­weste', emoji: '🌲',
    element: 'nature', type: 'armor',
    w: 2, h: 1,
    atk: 0, hp: 15, speed: 0,
    cost: 3, sellValue: 1,
    desc: 'Passiv: +15 HP. Regeneriert 2 HP pro Runde.',
    regen: 2,
    onActivate: null
  },
  shadow_cloak: {
    id: 'shadow_cloak', name: 'Schatten­umhang', emoji: '🧣',
    element: 'shadow', type: 'armor',
    w: 2, h: 1,
    atk: 0, hp: 10, speed: 0,
    cost: 4, sellValue: 2,
    desc: 'Passiv: +10 HP. 20% Chance, Angriffe zu dodgen.',
    dodge: 0.2,
    onActivate: null
  },

  // === TRÄNKE ===
  health_potion: {
    id: 'health_potion', name: 'Heiltrank', emoji: '🧪',
    element: 'nature', type: 'potion',
    w: 1, h: 1,
    atk: 0, hp: 0, speed: 3,
    cost: 2, sellValue: 1,
    charges: 1,
    desc: 'Einmalig: Heilt 25 HP im Kampf.',
    onActivate(state, owner) {
      if (this._charges > 0) { healOwner(state, owner, 25); this._charges--; }
    }
  },
  rage_brew: {
    id: 'rage_brew', name: 'Wut­gebräu', emoji: '🍺',
    element: 'fire', type: 'potion',
    w: 1, h: 1,
    atk: 0, hp: 0, speed: 2,
    cost: 3, sellValue: 1,
    charges: 1,
    desc: 'Einmalig: Nächster Angriff macht ×2 Schaden.',
    onActivate(state, owner) {
      if (this._charges > 0) { state[owner].rage = true; this._charges--; logEffect(state, '🍺 Wut aktiv! Nächster Angriff ×2!'); }
    }
  },
  mana_flask: {
    id: 'mana_flask', name: 'Mana­flasche', emoji: '💧',
    element: 'ice', type: 'potion',
    w: 1, h: 1,
    atk: 0, hp: 0, speed: 4,
    cost: 3, sellValue: 1,
    charges: 2,
    desc: 'Einmalig (2×): Verdoppelt Geschwindigkeit für 1 Aktivierung.',
    onActivate(state, owner) {
      if (this._charges > 0) { state[owner].speedBoost = true; this._charges--; logEffect(state, '💧 Geschwindigkeit verdoppelt!'); }
    }
  },

  // === RELIKTE ===
  lucky_charm: {
    id: 'lucky_charm', name: 'Glücksbringer', emoji: '🍀',
    element: 'nature', type: 'relic',
    w: 1, h: 1,
    atk: 0, hp: 5, speed: 0,
    cost: 4, sellValue: 2,
    desc: 'Passiv: 15% Crit-Chance auf alle Angriffe (+50% Schaden).',
    crit: 0.15,
    onActivate: null
  },
  fire_gem: {
    id: 'fire_gem', name: 'Feuer­stein', emoji: '💎',
    element: 'fire', type: 'relic',
    w: 1, h: 1,
    atk: 3, hp: 0, speed: 0,
    cost: 3, sellValue: 1,
    desc: 'Passiv: Alle Feuer-Items bekommen +3 Schaden.',
    onActivate: null
  },
  shadow_gem: {
    id: 'shadow_gem', name: 'Schatten­stein', emoji: '🔮',
    element: 'shadow', type: 'relic',
    w: 1, h: 1,
    atk: 0, hp: 0, speed: 0,
    cost: 3, sellValue: 1,
    desc: 'Passiv: Alle Schatten-Items haben +10% Lebensraub.',
    onActivate: null
  },
  ice_crystal: {
    id: 'ice_crystal', name: 'Eiskristall', emoji: '🌀',
    element: 'ice', type: 'relic',
    w: 1, h: 1,
    atk: 0, hp: 0, speed: 0,
    cost: 3, sellValue: 1,
    desc: 'Passiv: Freeze-Effekte halten 1 Runde länger.',
    onActivate: null
  },
  ancient_coin: {
    id: 'ancient_coin', name: 'Alte Münze', emoji: '🪙',
    element: 'none', type: 'relic',
    w: 1, h: 1,
    atk: 0, hp: 0, speed: 0,
    cost: 2, sellValue: 1,
    desc: 'Passiv: +1 Gold nach jedem gewonnenen Kampf.',
    onActivate: null
  }
};

// Pool für den Shop (welche Items können angeboten werden, nach Runde)
const ITEM_POOL_BY_ROUND = [
  ['fire_dagger','ice_sword','vine_whip','shadow_fang','health_potion','iron_shield','bark_vest','lucky_charm','ancient_coin'],
  ['fire_dagger','ice_sword','vine_whip','shadow_fang','ember_staff','blizzard_bow','thorn_blade','health_potion','iron_shield','bark_vest','shadow_cloak','lucky_charm','rage_brew','mana_flask','fire_gem','shadow_gem'],
  ['fire_axe','ice_sword','ember_staff','blizzard_bow','vine_whip','thorn_blade','void_blade','shadow_fang','frost_armor','iron_shield','shadow_cloak','health_potion','rage_brew','mana_flask','lucky_charm','fire_gem','shadow_gem','ice_crystal'],
  ['fire_axe','ember_staff','blizzard_bow','thorn_blade','void_blade','frost_armor','shadow_cloak','rage_brew','mana_flask','lucky_charm','fire_gem','shadow_gem','ice_crystal','ancient_coin'],
];

function getItemPool(round) {
  const idx = Math.min(Math.floor((round - 1) / 2), ITEM_POOL_BY_ROUND.length - 1);
  return ITEM_POOL_BY_ROUND[idx];
}

function cloneItem(id) {
  const src = ITEMS[id];
  const obj = Object.assign(Object.create(Object.getPrototypeOf(src)), src);
  obj._charges = src.charges ?? 99;
  obj._uid = Math.random().toString(36).slice(2);
  return obj;
}

// ===== COMBAT HELPERS (used by onActivate) =====
function getAdjCount(state, owner, element) {
  const pack = state[owner].pack;
  const item = state[owner].activeItem;
  if (!item) return 0;
  let count = 0;
  for (const other of pack.placedItems) {
    if (other === item) continue;
    if (other.element === element && isAdjacent(item, other)) count++;
  }
  return count;
}

function getAdjBonus(state, owner, element, bonusPerAdj) {
  return getAdjCount(state, owner, element) * bonusPerAdj;
}

function isAdjacent(a, b) {
  const ar = a.row, ac = a.col, aw = a.w, ah = a.h;
  const br = b.row, bc = b.col, bw = b.w, bh = b.h;
  const aRight = ac + aw, aBottom = ar + ah;
  const bRight = bc + bw, bBottom = br + bh;
  const horizAdj = (aRight === bc || bRight === ac) && !(ar >= bBottom || br >= aBottom);
  const vertAdj  = (aBottom === br || bBottom === ar) && !(ac >= bRight || bc >= aRight);
  return horizAdj || vertAdj;
}

function getRelics(state, owner, relicId) {
  return state[owner].pack.placedItems.filter(i => i.id === relicId);
}

function dealDamage(state, owner, dmgRaw) {
  const target = owner === 'player' ? 'enemy' : 'player';
  let dmg = dmgRaw;

  // Relic: fire_gem boosts fire damage
  if (state[owner].activeItem?.element === 'fire') {
    const gems = getRelics(state, owner, 'fire_gem');
    dmg += gems.length * ITEMS['fire_gem'].atk;
  }

  // Rage
  if (state[owner].rage) { dmg *= 2; state[owner].rage = false; }

  // Crit (lucky_charm)
  const charms = getRelics(state, owner, 'lucky_charm');
  if (charms.length > 0 && Math.random() < charms.length * 0.15) {
    dmg = Math.floor(dmg * 1.5);
    logEffect(state, '✨ Kritischer Treffer!');
  }

  // Enemy dodge / block
  const tEnemy = state[target];
  if (tEnemy.dodge && Math.random() < tEnemy.dodge) {
    logEffect(state, `${target === 'player' ? 'Du' : 'Gegner'} dodgt!`);
    return 0;
  }
  dmg = Math.max(0, dmg - (tEnemy.block || 0));
  tEnemy.hp = Math.max(0, tEnemy.hp - dmg);
  logDmg(state, `${owner === 'player' ? '⚔️ Du' : '👹 Gegner'} trifft für ${dmg} Schaden!`);
  return dmg;
}

function dealDamageAll(state, owner, dmgRaw) {
  dealDamage(state, owner, dmgRaw);
}

function dealDamageReverse(state, owner, dmg) {
  const self = state[owner];
  self.hp = Math.max(0, self.hp - dmg);
  logDmg(state, `💢 Rückstoß: ${dmg} Schaden!`);
}

function selfDamage(state, owner, dmg) {
  state[owner].hp = Math.max(0, state[owner].hp - dmg);
  logDmg(state, `🩸 ${dmg} Selbst­schaden`);
}

function healOwner(state, owner, amount) {
  const s = state[owner];
  const maxHp = s.maxHp;
  s.hp = Math.min(maxHp, s.hp + amount);
  logHeal(state, `💚 +${amount} HP`);
  return amount;
}

function applyBurn(state, owner, dmgPerRound) {
  const target = owner === 'player' ? 'enemy' : 'player';
  state[target].burn = (state[target].burn || 0) + dmgPerRound;
  logEffect(state, `🔥 Brennt für ${dmgPerRound}/Runde`);
}

function applyFreeze(state, owner, rounds) {
  const target = owner === 'player' ? 'enemy' : 'player';
  // ice_crystal extends freeze
  const crystals = getRelics(state, owner, 'ice_crystal');
  const total = rounds + crystals.length;
  state[target].frozen = (state[target].frozen || 0) + total;
  logEffect(state, `❄️ Gegner eingefroren (${total} Runden)`);
}

function logDmg(state, msg) { state.log.push({ type: 'dmg', msg }); }
function logHeal(state, msg) { state.log.push({ type: 'heal', msg }); }
function logEffect(state, msg) { state.log.push({ type: 'effect', msg }); }
