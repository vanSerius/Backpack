'use strict';
const Shop = {
  _currentOffers: [],
  _selectedShopItem: null,

  open(round, gold, pack) {
    this._round = round;
    this._gold = gold;
    this._pack = pack;
    this._selectedShopItem = null;
    PackUI.selectedItem = null;
    this._generateOffers();
    this._render();
    document.getElementById('shop-round-num').textContent = round;
    document.getElementById('shop-gold').textContent = gold;
    PackUI.render(pack, document.getElementById('backpack-grid'));
    PackUI.updateStats(pack);
  },

  _generateOffers() {
    const pool = getItemPool(this._round);
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    this._currentOffers = shuffled.slice(0, 3).map(id => cloneItem(id));
  },

  _render() {
    const container = document.getElementById('shop-items');
    container.innerHTML = '';
    this._currentOffers.forEach((item, i) => {
      const card = document.createElement('div');
      card.className = `shop-item-card ${item.cost <= this._gold ? 'affordable' : 'too-expensive'}`;
      if (this._selectedShopItem === item) card.classList.add('selected');
      card.innerHTML = `
        <span class="item-el-badge el-badge-${item.element}">${this._elLabel(item.element)}</span>
        <span class="item-emoji">${item.emoji}</span>
        <span class="item-name">${item.name}</span>
        <span class="item-cost">🪙 ${item.cost}</span>
      `;
      card.addEventListener('click', () => this._selectShopItem(item, card));
      card.addEventListener('dblclick', () => this._buyItem(item));
      container.appendChild(card);
    });
    document.getElementById('shop-gold').textContent = this._gold;
    document.getElementById('reroll-cost').textContent = `(${this._rerollCost()}🪙)`;
    document.getElementById('btn-reroll').disabled = this._gold < this._rerollCost();
  },

  _elLabel(el) {
    return { fire: '🔥', ice: '❄️', nature: '🌿', shadow: '💀', none: '' }[el] || '';
  },

  _rerollCost() { return 2; },

  _selectShopItem(item, cardEl) {
    this._selectedShopItem = (this._selectedShopItem === item) ? null : item;
    PackUI.selectedItem = null;
    this._render();
    PackUI.render(this._pack, document.getElementById('backpack-grid'));
    this._showTooltip(this._selectedShopItem);
  },

  _showTooltip(item) {
    const tt = document.getElementById('item-tooltip');
    if (!item) { tt.classList.add('hidden'); return; }
    tt.innerHTML = `
      <div class="tt-name">${item.emoji} ${item.name}</div>
      <div class="tt-stats">
        ${item.atk ? `⚔️ ${item.atk}  ` : ''}${item.hp ? `❤️ ${item.hp}  ` : ''}
        ${item.speed ? `⚡ Speed ${item.speed}` : ''}
        ${item.block ? `🛡️ Block ${item.block}` : ''}
        ${item.regen ? `💚 Regen ${item.regen}` : ''}
      </div>
      <div class="tt-desc">${item.desc}</div>
    `;
    tt.classList.remove('hidden');
  },

  _buyItem(item) {
    if (!item || item.cost > this._gold) { this._shake(); return; }
    // Find a free spot
    let placed = false;
    outer: for (let r = 0; r < GRID_ROWS; r++)
      for (let c = 0; c < GRID_COLS; c++)
        if (this._pack.place(item, r, c)) { placed = true; break outer; }
    if (!placed) { alert('Kein Platz im Rucksack!'); return; }
    this._gold -= item.cost;
    Game.gold = this._gold;
    this._currentOffers = this._currentOffers.filter(i => i !== item);
    this._selectedShopItem = null;
    this._render();
    PackUI.render(this._pack, document.getElementById('backpack-grid'));
    PackUI.updateStats(this._pack);
  },

  reroll() {
    const cost = this._rerollCost();
    if (this._gold < cost) return;
    this._gold -= cost;
    Game.gold = this._gold;
    this._generateOffers();
    this._render();
  },

  sellSelected() {
    const item = PackUI.selectedItem || this._selectedShopItem;
    if (!item) return;
    const sellVal = item.sellValue || 1;
    if (this._pack.placedItems.includes(item)) {
      this._pack.removeAndDelete(item);
    } else {
      this._currentOffers = this._currentOffers.filter(i => i !== item);
    }
    this._gold += sellVal;
    Game.gold = this._gold;
    PackUI.selectedItem = null;
    this._selectedShopItem = null;
    this._render();
    PackUI.render(this._pack, document.getElementById('backpack-grid'));
    PackUI.updateStats(this._pack);
  },

  updateSelectedInfo() {
    this._showTooltip(PackUI.selectedItem);
    this._render();
  },

  _shake() {
    const el = document.getElementById('shop-gold');
    el.classList.add('shaking');
    setTimeout(() => el.classList.remove('shaking'), 400);
  }
};
