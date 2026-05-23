import Phaser from 'phaser';
import { DESIGN_WIDTH, COLORS, COLORS_HEX, GRID_CELL } from '../config/Layout';
import { makeButton } from '../ui/Button';
import { gameState } from '../systems/state/GameState';
import { makeItemSprite, setItemRotation, type ItemSprite } from '../ui/ItemSprite';
import { getEnemy } from '../data/enemies';
import { rotateShape, forEachOccupiedCell, type Rotation } from '../systems/grid/ItemShape';
import type { ItemDef } from '../types/Item';

interface DragState {
  instanceId: string;
  sprite: ItemSprite;
  originalX: number;
  originalY: number;
  originalRotation: Rotation;
  rotation: Rotation;
  pointerOffsetX: number;
  pointerOffsetY: number;
  rotateBtn: Phaser.GameObjects.Container;
}

export class BackpackScene extends Phaser.Scene {
  private gridOriginX = 0;
  private gridOriginY = 0;
  private gridGraphics!: Phaser.GameObjects.Graphics;
  private highlightGraphics!: Phaser.GameObjects.Graphics;
  private spritesByInstanceId: Map<string, ItemSprite> = new Map();
  private dragState: DragState | null = null;

  constructor() {
    super('Backpack');
  }

  create(): void {
    const run = gameState.run;
    if (!run) {
      this.scene.start('MainMenu');
      return;
    }

    const cx = DESIGN_WIDTH / 2;

    // header: stage + enemy preview
    this.add.text(cx, 60, `Runde ${run.stage + 1} / 3`, {
      fontSize: '28px',
      color: COLORS_HEX.parchmentDim,
    }).setOrigin(0.5);

    const enemyId = gameState.currentEnemyId();
    if (enemyId) {
      const enemyDef = getEnemy(enemyId);
      const enemyCard = this.add.container(cx, 170);
      const g = this.add.graphics();
      g.fillStyle(COLORS.bgPanel, 1);
      g.fillRoundedRect(-300, -70, 600, 140, 14);
      g.lineStyle(3, COLORS.danger, 1);
      g.strokeRoundedRect(-300, -70, 600, 140, 14);
      enemyCard.add(g);
      const enemyColor = Phaser.Display.Color.HexStringToColor(enemyDef.color).color;
      const orb = this.add.graphics();
      orb.fillStyle(enemyColor, 1);
      orb.fillCircle(-240, 0, 45);
      enemyCard.add(orb);
      enemyCard.add(this.add.text(-240, 0, enemyDef.glyph, { fontSize: '54px' }).setOrigin(0.5));
      enemyCard.add(
        this.add.text(-170, -45, enemyDef.name, {
          fontSize: '28px',
          color: COLORS_HEX.parchment,
          fontStyle: 'bold',
        }),
      );
      enemyCard.add(
        this.add.text(-170, -10, `HP ${enemyDef.maxHp}  ATK ${enemyDef.attack}  ARM ${enemyDef.armor}`, {
          fontSize: '22px',
          color: COLORS_HEX.parchmentDim,
        }),
      );
      if (enemyDef.special) {
        const specialLabel = enemyDef.special === 'bell_stun' ? '🔔 Glocken-Stun alle 3 Runden' : '⚠ Verspottet';
        enemyCard.add(
          this.add.text(-170, 25, specialLabel, { fontSize: '20px', color: COLORS_HEX.danger }),
        );
      }
    }

    // player HP + gold
    this.add.text(cx - 100, 280, `Du: ${run.hero.name}  ❤ ${run.hp}/${run.maxHp}`, {
      fontSize: '24px',
      color: COLORS_HEX.parchment,
    }).setOrigin(0.5);
    this.add.text(cx + 200, 280, `💰 ${run.gold} G`, {
      fontSize: '24px',
      color: COLORS_HEX.accent,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // grid
    const cols = run.backpack.width;
    const rows = run.backpack.height;
    const gridPxW = cols * GRID_CELL;
    const gridPxH = rows * GRID_CELL;
    this.gridOriginX = (DESIGN_WIDTH - gridPxW) / 2;
    this.gridOriginY = 340;

    this.gridGraphics = this.add.graphics();
    this.drawGrid(cols, rows);

    this.highlightGraphics = this.add.graphics();

    // place existing items
    for (const placed of run.backpack.allItems()) {
      this.spawnItemSprite(placed.def, placed.x, placed.y, placed.rotation, placed.instanceId);
    }

    // bottom buttons
    const btnY = this.gridOriginY + gridPxH + 80;
    makeButton(this, cx - 180, btnY, {
      width: 300, height: 90, label: '← Shop', onClick: () => {
        if (!gameState.run) return;
        gameState.run.pendingShop = true;
        gameState.saveRun();
        this.scene.start('Shop');
      },
    });
    makeButton(this, cx + 180, btnY, {
      width: 300, height: 90, label: '⚔ Kämpfen', primary: true, onClick: () => this.scene.start('Battle'),
    });

    // hint
    this.add.text(cx, btnY + 90, 'Ziehe Items im Backpack · 🔄 Knopf zum Drehen', {
      fontSize: '20px',
      color: COLORS_HEX.parchmentDim,
    }).setOrigin(0.5);
  }

  private drawGrid(cols: number, rows: number): void {
    const g = this.gridGraphics;
    g.clear();
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const px = this.gridOriginX + x * GRID_CELL;
        const py = this.gridOriginY + y * GRID_CELL;
        const fill = (x + y) % 2 === 0 ? COLORS.gridCell : COLORS.gridCellLight;
        g.fillStyle(fill, 1);
        g.fillRoundedRect(px + 2, py + 2, GRID_CELL - 4, GRID_CELL - 4, 6);
      }
    }
    g.lineStyle(4, COLORS.wood, 1);
    g.strokeRoundedRect(this.gridOriginX - 6, this.gridOriginY - 6, cols * GRID_CELL + 12, rows * GRID_CELL + 12, 14);
  }

  private spawnItemSprite(def: ItemDef, x: number, y: number, rotation: Rotation, instanceId: string): void {
    const sprite = makeItemSprite(this, def, rotation);
    sprite.container.setPosition(this.gridOriginX + x * GRID_CELL, this.gridOriginY + y * GRID_CELL);
    this.spritesByInstanceId.set(instanceId, sprite);

    const shape = rotateShape(def.shape, rotation);
    const hit = new Phaser.Geom.Rectangle(0, 0, shape.width * GRID_CELL, shape.height * GRID_CELL);
    sprite.container.setInteractive(hit, Phaser.Geom.Rectangle.Contains);

    sprite.container.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.startDrag(instanceId, p);
    });
  }

  private startDrag(instanceId: string, p: Phaser.Input.Pointer): void {
    if (this.dragState) return;
    const run = gameState.run!;
    const placed = run.backpack.getItem(instanceId);
    if (!placed) return;
    const sprite = this.spritesByInstanceId.get(instanceId)!;
    sprite.container.setDepth(100);

    const offsetX = p.worldX - sprite.container.x;
    const offsetY = p.worldY - sprite.container.y;

    // remove from grid (will be re-placed on drop)
    run.backpack.remove(instanceId);

    const rotateBtn = makeButton(this, 0, 0, {
      width: 90, height: 90, label: '🔄', fontSize: 40, primary: true, onClick: () => {},
    });
    rotateBtn.setDepth(101);
    rotateBtn.removeAllListeners('pointerup');
    rotateBtn.on('pointerup', (ev: Phaser.Input.Pointer) => {
      ev.event.stopPropagation();
      this.rotateDragging();
    });

    this.dragState = {
      instanceId,
      sprite,
      originalX: placed.x,
      originalY: placed.y,
      originalRotation: placed.rotation,
      rotation: placed.rotation,
      pointerOffsetX: offsetX,
      pointerOffsetY: offsetY,
      rotateBtn,
    };

    this.updateRotateBtn(p.worldX, p.worldY);
    this.input.on('pointermove', this.onDragMove, this);
    this.input.on('pointerup', this.onDragEnd, this);
  }

  private onDragMove(p: Phaser.Input.Pointer): void {
    if (!this.dragState) return;
    const s = this.dragState;
    s.sprite.container.setPosition(p.worldX - s.pointerOffsetX, p.worldY - s.pointerOffsetY);
    this.updateRotateBtn(p.worldX, p.worldY);
    this.highlightTargetCells();
  }

  private updateRotateBtn(px: number, py: number): void {
    if (!this.dragState) return;
    const btn = this.dragState.rotateBtn;
    let bx = px + 100;
    let by = py - 100;
    if (bx > DESIGN_WIDTH - 50) bx = px - 100;
    if (by < 50) by = py + 100;
    btn.setPosition(bx, by);
  }

  private rotateDragging(): void {
    if (!this.dragState) return;
    const s = this.dragState;
    s.rotation = ((s.rotation + 1) % 4) as Rotation;
    setItemRotation(s.sprite, s.rotation);
    this.highlightTargetCells();
  }

  private highlightTargetCells(): void {
    this.highlightGraphics.clear();
    if (!this.dragState) return;
    const s = this.dragState;
    const cell = this.pointerToCell(s.sprite.container.x, s.sprite.container.y);
    if (!cell) return;
    const result = gameState.run!.backpack.canPlace(s.sprite.def, cell.x, cell.y, s.rotation);
    const shape = rotateShape(s.sprite.def.shape, s.rotation);
    const color = result.ok ? COLORS.gridOk : COLORS.gridBad;
    forEachOccupiedCell(shape, (dx, dy) => {
      const cx = cell.x + dx;
      const cy = cell.y + dy;
      if (cx < 0 || cy < 0 || cx >= gameState.run!.backpack.width || cy >= gameState.run!.backpack.height) return;
      const px = this.gridOriginX + cx * GRID_CELL;
      const py = this.gridOriginY + cy * GRID_CELL;
      this.highlightGraphics.fillStyle(color, 0.45);
      this.highlightGraphics.fillRoundedRect(px + 2, py + 2, GRID_CELL - 4, GRID_CELL - 4, 6);
    });
  }

  private pointerToCell(spriteX: number, spriteY: number): { x: number; y: number } | null {
    const x = Math.round((spriteX - this.gridOriginX) / GRID_CELL);
    const y = Math.round((spriteY - this.gridOriginY) / GRID_CELL);
    return { x, y };
  }

  private onDragEnd(): void {
    if (!this.dragState) return;
    const s = this.dragState;
    this.input.off('pointermove', this.onDragMove, this);
    this.input.off('pointerup', this.onDragEnd, this);
    this.highlightGraphics.clear();
    s.rotateBtn.destroy();

    const cell = this.pointerToCell(s.sprite.container.x, s.sprite.container.y);
    const run = gameState.run!;

    let placedOk = false;
    if (cell) {
      const newId = run.backpack.place(s.sprite.def, cell.x, cell.y, s.rotation, s.instanceId);
      if (newId) {
        s.sprite.container.setPosition(this.gridOriginX + cell.x * GRID_CELL, this.gridOriginY + cell.y * GRID_CELL);
        placedOk = true;
      }
    }

    if (!placedOk) {
      // snap back
      setItemRotation(s.sprite, s.originalRotation);
      run.backpack.place(s.sprite.def, s.originalX, s.originalY, s.originalRotation, s.instanceId);
      this.tweens.add({
        targets: s.sprite.container,
        x: this.gridOriginX + s.originalX * GRID_CELL,
        y: this.gridOriginY + s.originalY * GRID_CELL,
        duration: 180,
        ease: 'Cubic.easeOut',
      });
    }

    s.sprite.container.setDepth(0);
    this.dragState = null;
    gameState.saveRun();
  }
}
