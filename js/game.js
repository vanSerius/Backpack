'use strict';
const Game = {
  round: 1,
  gold: 10,
  pack: null,
  _lastBattleWon: false,

  startNewGame() {
    this.round = 1;
    this.gold = 10;
    this.pack = new Pack();

    // Give player 1 starter item
    const starter = cloneItem('fire_dagger');
    this.pack.place(starter, 0, 0);

    this.showScreen('shop');
    Shop.open(this.round, this.gold, this.pack);
  },

  showScreen(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(`screen-${name}`).classList.add('active');
  },

  showHowToPlay() {
    this.showScreen('how-to-play');
  },

  startBattle() {
    const enemy = ENEMIES[this.round - 1];
    if (!enemy) { this.showScreen('victory'); return; }

    // Update gold from shop
    this.gold = Game.gold;

    document.getElementById('battle-round-label').textContent = `Runde ${this.round} · Gegner ${this.round}`;
    document.getElementById('battle-enemy-name').textContent = `${enemy.emoji} ${enemy.name}`;

    this.showScreen('battle');
    Battle.setup(this.pack, enemy);
  },

  showResult(won, playerHp, enemyHp) {
    this._lastBattleWon = won;
    const enemy = ENEMIES[this.round - 1];

    const icon  = document.getElementById('result-icon');
    const title = document.getElementById('result-title');
    const msg   = document.getElementById('result-message');
    const rew   = document.getElementById('result-rewards');
    const btn   = document.getElementById('btn-result-continue');

    if (won) {
      icon.textContent  = '🎉';
      title.textContent = 'Sieg!';
      msg.textContent   = `Du hast ${enemy.emoji} ${enemy.name} besiegt!`;

      let goldReward = enemy.gold;
      // ancient_coin bonus
      const coins = this.pack.placedItems.filter(i => i.id === 'ancient_coin').length;
      goldReward += coins;

      this.gold += goldReward;
      rew.innerHTML = `<div class="reward-chip">🪙 +${goldReward} Gold</div>`;
      btn.textContent = this.round >= 8 ? '🏆 Weiter' : '🛒 Shop';
    } else {
      icon.textContent  = '💀';
      title.textContent = 'Niederlage';
      msg.textContent   = `${enemy.emoji} ${enemy.name} hat dich besiegt. Du hattest noch ${Math.max(0, enemyHp)} HP übrig.`;
      rew.innerHTML     = '';
      btn.textContent   = '💀 Game Over';
    }
    this.showScreen('result');
  },

  afterBattle() {
    if (!this._lastBattleWon) {
      document.getElementById('go-message').textContent =
        `Du bist in Runde ${this.round} gefallen. Versuch es nochmal!`;
      this.showScreen('game-over');
      return;
    }
    this.round++;
    if (this.round > 8) {
      this.showScreen('victory');
      return;
    }
    this.showScreen('shop');
    Shop.open(this.round, this.gold, this.pack);
  }
};

// Init on load
window.addEventListener('DOMContentLoaded', () => {
  Game.showScreen('main-menu');
});
