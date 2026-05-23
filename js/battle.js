'use strict';
const Battle = {
  _state: null,
  _autoTimer: null,
  _stepQueue: [],
  _done: false,

  setup(playerPack, enemy) {
    this._done = false;
    const pStats = playerPack.getTotalStats();
    const eStats = this._buildEnemyStats(enemy);

    this._state = {
      player: {
        hp: 50 + pStats.hp,
        maxHp: 50 + pStats.hp,
        block: pStats.block,
        regen: pStats.regen,
        dodge: pStats.dodge,
        burn: 0, frozen: 0, rage: false, speedBoost: false,
        pack: playerPack,
        activeItem: null,
      },
      enemy: {
        hp: enemy.hp + eStats.hp,
        maxHp: enemy.hp + eStats.hp,
        block: eStats.block,
        regen: eStats.regen,
        dodge: eStats.dodge,
        burn: 0, frozen: 0, rage: false, speedBoost: false,
        pack: this._buildEnemyPack(enemy),
        activeItem: null,
      },
      log: [],
      round: 0,
    };

    // Reset potion charges
    for (const it of playerPack.placedItems) it._charges = it.charges ?? 99;
    for (const it of this._state.enemy.pack.placedItems) it._charges = it.charges ?? 99;

    this._buildStepQueue();
    this._renderBattle(enemy);
    document.getElementById('btn-battle-action').textContent = '▶ Start';
    document.getElementById('btn-battle-auto').textContent = '⚡ Auto';
    document.getElementById('battle-log').innerHTML = '<span style="color:#666">Bereit zum Kampf...</span>';
  },

  _buildEnemyPack(enemy) {
    const pack = new Pack();
    for (const slot of enemy.items) {
      const item = cloneItem(slot.id);
      pack.place(item, slot.row, slot.col);
    }
    return pack;
  },

  _buildEnemyStats(enemy) {
    let hp = 0, block = 0, regen = 0, dodge = 0;
    for (const slot of enemy.items) {
      const def = ITEMS[slot.id];
      hp += def.hp || 0;
      if (def.block) block += def.block;
      if (def.regen) regen += def.regen;
      if (def.dodge) dodge = Math.min(0.8, dodge + def.dodge);
    }
    return { hp, block, regen, dodge };
  },

  _buildStepQueue() {
    // Interleave player and enemy activations by speed
    const pItems = this._state.player.pack.getActivationOrder();
    const eItems = this._state.enemy.pack.getActivationOrder();
    const queue = [];
    const maxLen = Math.max(pItems.length, eItems.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < pItems.length) queue.push({ owner: 'player', item: pItems[i] });
      if (i < eItems.length) queue.push({ owner: 'enemy',  item: eItems[i] });
    }
    this._stepQueue = queue;
    this._stepIdx = 0;
  },

  step() {
    if (this._done) return;
    const state = this._state;
    if (this._stepIdx >= this._stepQueue.length) {
      // End of round: apply DOT/regen
      this._endOfRound();
      if (state.player.hp <= 0 || state.enemy.hp <= 0) {
        this._finish();
        return;
      }
      // New round
      state.round++;
      if (state.round > 30) { this._finish(); return; } // safety
      this._buildStepQueue();
      this._appendLog(`--- Runde ${state.round + 1} ---`, 'effect');
    }

    const step = this._stepQueue[this._stepIdx++];
    const { owner, item } = step;
    const side = this._state[owner];

    if (side.frozen > 0) {
      this._appendLog(`❄️ ${owner === 'player' ? 'Du' : 'Gegner'} ist eingefroren!`, 'effect');
    } else {
      state[owner].activeItem = item;
      item.onActivate(state, owner);
      state[owner].activeItem = null;
      this._flashItem(owner, item);
    }

    // Flush log
    for (const entry of state.log) this._appendLog(entry.msg, entry.type);
    state.log = [];

    this._updateHPBars();
    if (state.player.hp <= 0 || state.enemy.hp <= 0) {
      this._finish();
    }
  },

  _endOfRound() {
    const state = this._state;
    for (const side of ['player', 'enemy']) {
      const s = state[side];
      if (s.burn > 0) {
        s.hp = Math.max(0, s.hp - s.burn);
        this._appendLog(`🔥 ${side === 'player' ? 'Du' : 'Gegner'} brennt: -${s.burn} HP`, 'dmg');
      }
      if (s.regen > 0) {
        s.hp = Math.min(s.maxHp, s.hp + s.regen);
        this._appendLog(`💚 ${side === 'player' ? 'Du' : 'Gegner'} regeneriert +${s.regen} HP`, 'heal');
      }
      if (s.frozen > 0) s.frozen--;
    }
  },

  _finish() {
    this._done = true;
    if (this._autoTimer) { clearInterval(this._autoTimer); this._autoTimer = null; }
    const won = this._state.player.hp > 0;
    document.getElementById('btn-battle-action').textContent = won ? '🏆 Sieg!' : '💀 Verloren';
    setTimeout(() => Game.showResult(won, this._state.player.hp, this._state.enemy.hp), 600);
  },

  toggleAuto() {
    if (this._autoTimer) {
      clearInterval(this._autoTimer);
      this._autoTimer = null;
      document.getElementById('btn-battle-auto').textContent = '⚡ Auto';
    } else {
      document.getElementById('btn-battle-auto').textContent = '⏸ Stop';
      this._autoTimer = setInterval(() => {
        if (this._done) { clearInterval(this._autoTimer); this._autoTimer = null; return; }
        this.step();
      }, 500);
    }
  },

  _renderBattle(enemy) {
    // Player pack
    const pPack = document.getElementById('player-battle-pack');
    pPack.innerHTML = this._packToHTML(this._state.player.pack);
    const ePack = document.getElementById('enemy-battle-pack');
    ePack.innerHTML = this._packToHTML(this._state.enemy.pack);
    document.getElementById('enemy-name-label').textContent = `${enemy.emoji} ${enemy.name}`;
    this._updateHPBars();
  },

  _packToHTML(pack) {
    if (!pack.placedItems.length) return '<span style="color:#666;font-size:0.8rem">Leer</span>';
    return pack.placedItems.map(item =>
      `<div class="bp-item el-${item.element}" data-uid="${item._uid}" title="${item.name}">${item.emoji}</div>`
    ).join('');
  },

  _flashItem(owner, item) {
    const containerId = owner === 'player' ? 'player-battle-pack' : 'enemy-battle-pack';
    const el = document.querySelector(`#${containerId} .bp-item[data-uid="${item._uid}"]`);
    if (!el) return;
    el.classList.add('activating');
    setTimeout(() => el.classList.remove('activating'), 350);
  },

  _updateHPBars() {
    const ps = this._state.player;
    const es = this._state.enemy;
    const pPct = Math.max(0, (ps.hp / ps.maxHp) * 100);
    const ePct = Math.max(0, (es.hp / es.maxHp) * 100);
    document.getElementById('player-hp-bar').style.width = pPct + '%';
    document.getElementById('enemy-hp-bar').style.width  = ePct + '%';
    document.getElementById('player-hp-text').textContent = `${Math.max(0,ps.hp)} / ${ps.maxHp} HP`;
    document.getElementById('enemy-hp-text').textContent  = `${Math.max(0,es.hp)} / ${es.maxHp} HP`;
  },

  _appendLog(msg, type) {
    const log = document.getElementById('battle-log');
    const span = document.createElement('span');
    span.className = type === 'dmg' ? 'log-dmg' : type === 'heal' ? 'log-heal' : 'log-effect';
    span.textContent = msg;
    log.appendChild(span);
    log.appendChild(document.createElement('br'));
    log.scrollTop = log.scrollHeight;
  }
};
