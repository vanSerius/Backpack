import Phaser from 'phaser';
import { DESIGN_WIDTH, DESIGN_HEIGHT, COLORS, COLORS_HEX, GRID_CELL } from '../config/Layout';
import { makeButton } from '../ui/Button';
import { gameState, REROLL_COST, SHOP_SLOTS } from '../systems/state/GameState';
import { ITEMS } from '../data/items';
import { Rng } from '../systems/rng/Rng';
import { drawItemGraphic } from '../ui/ItemSprite';
import type { ItemDef } from '../types/Item';

interface ShopSlot {
  def: ItemDef | null;
  container: Phaser.GameObjects.Container;
  costText: Phaser.GameObjects.Text;
}

const SHOP_PREVIEW_CELL = 56;

export class ShopScene extends Phaser.Scene {
  private rng!: Rng;
  private shopRoll = 0;
  private slots: ShopSlot[] = [];
  private goldText!: Phaser.GameObjects.Text;
  private message: Phaser.GameObjects.Text | null = null;

  constructor() {
    super('Shop');
  }

  create(): void {
    const run = gameState.run;
    if (!run) {
      this.scene.start('MainMenu');
      return;
    }

    const cx = DESIGN_WIDTH / 2;

    this.add.text(cx, 60, '🛒 Marktplatz', {
      fontSize: '44px',
      color: COLORS_HEX.parchment,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const stageLabel = run.stage >= 3 ? 'Run-Ende' : `Vor Runde ${run.stage + 1}`;
    this.add.text(cx, 110, stageLabel, {
      fontSize: '22px',
      color: COLORS_HEX.parchmentDim,
    }).setOrigin(0.5);

    this.goldText = this.add.text(cx, 160, '', {
      fontSize: '34px',
      color: COLORS_HEX.accent,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.updateGoldText();

    this.rng = new Rng(run.seed ^ 0x5170 ^ (run.stage * 17));
    this.shopRoll = 0;
    this.layoutSlots();
    this.rollSlots();

    const btnY = DESIGN_HEIGHT - 240;
    makeButton(this, cx - 180, btnY, {
      width: 280, height: 80, label: `🎲 Reroll (${REROLL_COST}G)`,
      fontSize: 26,
      onClick: () => this.doReroll(),
    });
    makeButton(this, cx + 180, btnY, {
      width: 280, height: 80, label: 'Weiter →',
      primary: true,
      onClick: () => {
        gameState.clearPendingShop();
        this.scene.start('Backpack');
      },
    });

    this.add.text(cx, DESIGN_HEIGHT - 120, 'Items werden automatisch im Backpack platziert.\nIm Backpack kannst du sie neu anordnen.', {
      fontSize: '18px',
      color: COLORS_HEX.parchmentDim,
      align: 'center',
    }).setOrigin(0.5);
  }

  private layoutSlots(): void {
    const cx = DESIGN_WIDTH / 2;
    const startY = 280;
    const cardW = 300;
    const cardH = 200;
    const gapX = 20;
    const gapY = 20;
    const totalW = cardW * 2 + gapX;

    for (let i = 0; i < SHOP_SLOTS; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = cx - totalW / 2 + col * (cardW + gapX) + cardW / 2;
      const y = startY + row * (cardH + gapY);
      const container = this.add.container(x, y);
      const g = this.add.graphics();
      g.fillStyle(COLORS.bgPanel, 1);
      g.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 14);
      g.lineStyle(2, COLORS.woodLight, 1);
      g.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 14);
      container.add(g);

      const costText = this.add.text(cardW / 2 - 16, -cardH / 2 + 16, '', {
        fontSize: '24px',
        color: COLORS_HEX.accent,
        fontStyle: 'bold',
      }).setOrigin(1, 0);
      container.add(costText);

      const hit = new Phaser.Geom.Rectangle(-cardW / 2, -cardH / 2, cardW, cardH);
      container.setInteractive(hit, Phaser.Geom.Rectangle.Contains);
      const slotIdx = i;
      container.on('pointerup', () => this.tryBuy(slotIdx));

      this.slots.push({ def: null, container, costText });
    }
  }

  private rollSlots(): void {
    this.shopRoll++;
    const seedRng = this.rng.fork(this.shopRoll);
    const pool = [...ITEMS];
    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[i];
      while (slot.container.list.length > 2) {
        const last = slot.container.list[slot.container.list.length - 1];
        slot.container.remove(last, true);
      }
      if (pool.length === 0) {
        slot.def = null;
        slot.costText.setText('');
        continue;
      }
      const idx = seedRng.int(pool.length);
      const def = pool.splice(idx, 1)[0];
      slot.def = def;
      slot.costText.setText(`${def.cost}G`);
      this.renderSlotItem(slot, def);
    }
  }

  private renderSlotItem(slot: ShopSlot, def: ItemDef): void {
    const itemContainer = this.add.container(-90, 0);
    const g = this.add.graphics();
    drawItemGraphic(g, def, 0);
    const scale = SHOP_PREVIEW_CELL / GRID_CELL;
    g.setScale(scale);
    g.setPosition(-(def.shape.width * GRID_CELL * scale) / 2, -(def.shape.height * GRID_CELL * scale) / 2);
    itemContainer.add(g);
    const glyph = this.add.text(0, 0, def.glyph, { fontSize: '40px' }).setOrigin(0.5);
    glyph.setPosition(
      g.x + (def.shape.width * GRID_CELL * scale) / 2,
      g.y + (def.shape.height * GRID_CELL * scale) / 2,
    );
    itemContainer.add(glyph);
    slot.container.add(itemContainer);

    const name = this.add.text(20, -30, def.name, {
      fontSize: '22px',
      color: COLORS_HEX.parchment,
      fontStyle: 'bold',
      wordWrap: { width: 180 },
    });
    slot.container.add(name);

    const desc = this.add.text(20, 5, def.description, {
      fontSize: '15px',
      color: COLORS_HEX.parchmentDim,
      wordWrap: { width: 180 },
    });
    slot.container.add(desc);
  }

  private tryBuy(slotIdx: number): void {
    const run = gameState.run;
    if (!run) return;
    const slot = this.slots[slotIdx];
    if (!slot.def) return;
    if (run.gold < slot.def.cost) {
      this.flashMessage('Nicht genug Gold!');
      return;
    }
    const spot = run.backpack.findFreeSpot(slot.def);
    if (!spot) {
      this.flashMessage('Backpack ist voll!');
      return;
    }
    gameState.spendGold(slot.def.cost);
    run.backpack.place(slot.def, spot.x, spot.y, spot.rotation);
    gameState.saveRun();
    slot.def = null;
    slot.costText.setText('✓');
    while (slot.container.list.length > 2) {
      const last = slot.container.list[slot.container.list.length - 1];
      slot.container.remove(last, true);
    }
    this.updateGoldText();
  }

  private doReroll(): void {
    const run = gameState.run;
    if (!run) return;
    if (!gameState.spendGold(REROLL_COST)) {
      this.flashMessage('Nicht genug Gold!');
      return;
    }
    this.rollSlots();
    this.updateGoldText();
  }

  private updateGoldText(): void {
    if (!gameState.run) return;
    this.goldText.setText(`💰 ${gameState.run.gold} Gold`);
  }

  private flashMessage(msg: string): void {
    if (this.message) this.message.destroy();
    this.message = this.add.text(DESIGN_WIDTH / 2, DESIGN_HEIGHT - 320, msg, {
      fontSize: '24px',
      color: COLORS_HEX.danger,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.tweens.add({
      targets: this.message,
      alpha: 0,
      duration: 1400,
      delay: 600,
      onComplete: () => {
        this.message?.destroy();
        this.message = null;
      },
    });
  }
}
