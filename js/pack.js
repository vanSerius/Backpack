'use strict';
const GRID_COLS = 5;
const GRID_ROWS = 4;

class Pack {
  constructor() {
    this.placedItems = [];
    this._grid = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(null));
  }

  canPlace(item, row, col) {
    if (row < 0 || col < 0 || row + item.h > GRID_ROWS || col + item.w > GRID_COLS) return false;
    for (let r = row; r < row + item.h; r++)
      for (let c = col; c < col + item.w; c++)
        if (this._grid[r][c] && this._grid[r][c] !== item) return false;
    return true;
  }

  place(item, row, col) {
    if (!this.canPlace(item, row, col)) return false;
    this.remove(item);
    item.row = row; item.col = col;
    for (let r = row; r < row + item.h; r++)
      for (let c = col; c < col + item.w; c++)
        this._grid[r][c] = item;
    if (!this.placedItems.includes(item)) this.placedItems.push(item);
    return true;
  }

  remove(item) {
    if (item.row == null) return;
    for (let r = item.row; r < item.row + item.h; r++)
      for (let c = item.col; c < item.col + item.w; c++)
        if (this._grid[r][c] === item) this._grid[r][c] = null;
    item.row = null; item.col = null;
  }

  removeAndDelete(item) {
    this.remove(item);
    this.placedItems = this.placedItems.filter(i => i !== item);
  }

  getTotalStats() {
    let atk = 0, hp = 0, block = 0, regen = 0, dodge = 0;
    for (const it of this.placedItems) {
      atk += it.atk || 0;
      hp += it.hp || 0;
      if (it.block) block += it.block;
      if (it.regen) regen += it.regen;
      if (it.dodge) dodge = Math.min(0.8, dodge + it.dodge);
    }
    return { atk, hp, block, regen, dodge };
  }

  getActivationOrder() {
    // Sort by speed (lower = faster), then by grid position
    return [...this.placedItems]
      .filter(i => i.speed > 0 && typeof i.onActivate === 'function')
      .sort((a, b) => a.speed - b.speed || a.row - b.row || a.col - b.col);
  }
}

// ===== UI RENDERER =====
const PackUI = {
  selectedItem: null,
  dragItem: null,
  dragOffCol: 0,
  dragOffRow: 0,

  render(pack, container) {
    container.innerHTML = '';
    // Background cells
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.dataset.row = r;
        cell.dataset.col = c;
        container.appendChild(cell);
      }
    }
    // Items
    for (const item of pack.placedItems) {
      if (item.row == null) continue;
      const el = this._createItemEl(item, pack, container);
      container.appendChild(el);
    }
    this._setupGridDrop(pack, container);
  },

  _createItemEl(item, pack, container) {
    const el = document.createElement('div');
    el.className = `pack-item el-${item.element}`;
    if (item === this.selectedItem) el.classList.add('selected');
    const cell = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--cell'));
    const gap = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--gap'));
    const pad = 6;
    el.style.left = (pad + item.col * (cell + gap)) + 'px';
    el.style.top  = (pad + item.row * (cell + gap)) + 'px';
    el.style.width  = (item.w * cell + (item.w - 1) * gap) + 'px';
    el.style.height = (item.h * cell + (item.h - 1) * gap) + 'px';
    el.innerHTML = `<span class="pi-emoji">${item.emoji}</span><span class="pi-name">${item.name}</span>`;
    el.dataset.uid = item._uid;

    el.addEventListener('pointerdown', e => this._onPointerDown(e, item, pack, container));
    el.addEventListener('click', e => { e.stopPropagation(); this._selectItem(item, pack, container); });
    return el;
  },

  _selectItem(item, pack, container) {
    this.selectedItem = (this.selectedItem === item) ? null : item;
    this.render(pack, container);
    Shop.updateSelectedInfo();
  },

  _onPointerDown(e, item, pack, container) {
    if (e.button === 2) return;
    e.preventDefault();
    e.stopPropagation();

    const cell = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--cell'));
    const gap = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--gap'));
    const rect = container.getBoundingClientRect();
    const pad = 6;
    const relX = e.clientX - rect.left - pad;
    const relY = e.clientY - rect.top  - pad;
    this.dragOffCol = Math.floor(relX / (cell + gap)) - item.col;
    this.dragOffRow = Math.floor(relY / (cell + gap)) - item.row;
    this.dragOffCol = Math.max(0, Math.min(this.dragOffCol, item.w - 1));
    this.dragOffRow = Math.max(0, Math.min(this.dragOffRow, item.h - 1));

    this.dragItem = item;
    pack.remove(item);
    this.render(pack, container);

    const ghost = document.getElementById('drag-ghost');
    ghost.textContent = item.emoji;
    ghost.style.width  = (item.w * cell + (item.w - 1) * gap) + 'px';
    ghost.style.height = (item.h * cell + (item.h - 1) * gap) + 'px';
    ghost.style.fontSize = item.w > 1 || item.h > 1 ? '2rem' : '1.6rem';
    ghost.classList.remove('hidden');
    ghost.style.left = e.clientX + 'px';
    ghost.style.top  = e.clientY + 'px';

    const onMove = ev => {
      const cx = ev.touches ? ev.touches[0].clientX : ev.clientX;
      const cy = ev.touches ? ev.touches[0].clientY : ev.clientY;
      ghost.style.left = cx + 'px';
      ghost.style.top  = cy + 'px';
      this._highlightCells(cx, cy, item, pack, container);
    };
    const onUp = ev => {
      const cx = ev.changedTouches ? ev.changedTouches[0].clientX : ev.clientX;
      const cy = ev.changedTouches ? ev.changedTouches[0].clientY : ev.clientY;
      ghost.classList.add('hidden');
      this._drop(cx, cy, item, pack, container);
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
    };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  },

  _getCellCoords(clientX, clientY, item, container) {
    const cell = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--cell'));
    const gap = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--gap'));
    const rect = container.getBoundingClientRect();
    const pad = 6;
    const relX = clientX - rect.left - pad;
    const relY = clientY - rect.top  - pad;
    const col = Math.floor(relX / (cell + gap)) - this.dragOffCol;
    const row = Math.floor(relY / (cell + gap)) - this.dragOffRow;
    return { row, col };
  },

  _highlightCells(cx, cy, item, pack, container) {
    container.querySelectorAll('.grid-cell').forEach(c => c.classList.remove('highlight','highlight-bad'));
    const { row, col } = this._getCellCoords(cx, cy, item, container);
    const valid = pack.canPlace(item, row, col);
    for (let r = row; r < row + item.h; r++) {
      for (let c = col; c < col + item.w; c++) {
        const cell = container.querySelector(`.grid-cell[data-row="${r}"][data-col="${c}"]`);
        if (cell) cell.classList.add(valid ? 'highlight' : 'highlight-bad');
      }
    }
  },

  _drop(cx, cy, item, pack, container) {
    const { row, col } = this._getCellCoords(cx, cy, item, container);
    if (!pack.place(item, row, col)) {
      // Try to find nearest free spot
      let placed = false;
      outer: for (let r = 0; r < GRID_ROWS; r++)
        for (let c = 0; c < GRID_COLS; c++)
          if (pack.place(item, r, c)) { placed = true; break outer; }
      if (!placed) item.row = null; // dropped outside — remove from pack (should not happen)
    }
    this.dragItem = null;
    this.render(pack, container);
    PackUI.updateStats(pack);
    container.querySelectorAll('.grid-cell').forEach(c => c.classList.remove('highlight','highlight-bad'));
  },

  _setupGridDrop(pack, container) {
    container.addEventListener('contextmenu', e => e.preventDefault());
  },

  updateStats(pack) {
    const { atk, hp } = pack.getTotalStats();
    const atkEl = document.getElementById('pack-atk-display');
    const hpEl  = document.getElementById('pack-hp-display');
    if (atkEl) atkEl.textContent = `⚔️ ${atk}`;
    if (hpEl)  hpEl.textContent  = `❤️ ${hp}`;
  }
};
