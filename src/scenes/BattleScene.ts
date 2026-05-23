import Phaser from 'phaser';
import { DESIGN_WIDTH, COLORS, COLORS_HEX, GRID_CELL } from '../config/Layout';
import { makeButton } from '../ui/Button';
import { gameState } from '../systems/state/GameState';
import { getEnemy } from '../data/enemies';
import { simulateBattle, type BattleResult } from '../systems/battle/BattleSimulator';
import type { BattleEvent, Side } from '../types/Battle';
import { makeItemSprite, type ItemSprite } from '../ui/ItemSprite';

const ENEMY_Y = 240;
const PLAYER_HP_Y = 480;
const BATTLE_LOG_Y = 380;
const BACKPACK_CELL = 72;
const BACKPACK_TOP = 580;
const HP_BAR_W = 460;
const HP_BAR_H = 32;

function projectileGlyphFor(itemId: string | undefined): { glyph: string; color: string; size: number } {
  switch (itemId) {
    case 'pfeil': return { glyph: '➤', color: '#e8c98a', size: 44 };
    case 'bierkrug': return { glyph: '🍺', color: '#d4a13a', size: 38 };
    case 'jagdhorn': return { glyph: '♪', color: '#b88340', size: 44 };
    case 'kraeutertrank': return { glyph: '✨', color: '#7ad06a', size: 42 };
    case 'kuckucksuhr': return { glyph: '⏰', color: '#d4a13a', size: 38 };
    case 'brezel':
    case 'wurst': return { glyph: '✨', color: '#7ad06a', size: 38 };
    case 'gartenzwerg': return { glyph: '✦', color: '#a04050', size: 38 };
    default: return { glyph: '✦', color: '#f3e6c9', size: 36 };
  }
}

export class BattleScene extends Phaser.Scene {
  private result!: BattleResult;
  private playerHpBar!: { fill: Phaser.GameObjects.Graphics; text: Phaser.GameObjects.Text; hp: number; maxHp: number };
  private enemyHpBar!: { fill: Phaser.GameObjects.Graphics; text: Phaser.GameObjects.Text; hp: number; maxHp: number };
  private enemySprite!: Phaser.GameObjects.Container;
  private logText!: Phaser.GameObjects.Text;
  private speed: 1 | 2 | 4 = 1;
  private eventIndex = 0;
  private finished = false;
  private itemSprites: Map<string, ItemSprite> = new Map();
  private itemSpritesByDef: Map<string, ItemSprite[]> = new Map();
  private gridOriginX = 0;
  private gridOriginY = 0;
  private gridCols = 0;
  private gridRows = 0;

  constructor() {
    super('Battle');
  }

  create(): void {
    const run = gameState.run;
    const enemyId = gameState.currentEnemyId();
    if (!run || !enemyId) {
      this.scene.start('MainMenu');
      return;
    }
    const enemyDef = getEnemy(enemyId);

    this.speed = gameState.meta.settings.battleSpeed;
    this.eventIndex = 0;
    this.finished = false;
    this.itemSprites.clear();
    this.itemSpritesByDef.clear();

    this.result = simulateBattle({
      seed: run.seed ^ run.stage,
      playerItems: run.backpack.allItems(),
      playerHp: run.hp,
      playerMaxHp: run.maxHp,
      enemy: enemyDef,
    });

    const cx = DESIGN_WIDTH / 2;

    // header
    this.add.text(cx, 48, `Runde ${run.stage + 1} · Kampf`, {
      fontSize: '28px',
      color: COLORS_HEX.parchment,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    makeButton(this, DESIGN_WIDTH - 80, 48, {
      width: 110, height: 56, label: `${this.speed}×`, fontSize: 24,
      onClick: () => {
        this.speed = this.speed === 1 ? 2 : this.speed === 2 ? 4 : 1;
        gameState.meta.settings.battleSpeed = this.speed;
        this.scene.restart();
      },
    });

    // enemy avatar
    this.enemySprite = this.makeAvatar(cx, ENEMY_Y, enemyDef.glyph, enemyDef.color, 140);
    this.add.text(cx, ENEMY_Y + 90, enemyDef.name, {
      fontSize: '24px', color: COLORS_HEX.parchment, fontStyle: 'bold',
    }).setOrigin(0.5);
    this.enemyHpBar = this.makeHpBar(cx, ENEMY_Y + 130, enemyDef.maxHp, enemyDef.maxHp);

    // battle log (small bar in middle)
    this.logText = this.add.text(cx, BATTLE_LOG_Y, '', {
      fontSize: '22px',
      color: COLORS_HEX.parchmentDim,
      align: 'center',
    }).setOrigin(0.5);

    // player HP + hero label
    this.add.text(cx, PLAYER_HP_Y - 28, `${run.hero.glyph} ${run.hero.name}`, {
      fontSize: '22px', color: COLORS_HEX.parchment,
    }).setOrigin(0.5);
    this.playerHpBar = this.makeHpBar(cx, PLAYER_HP_Y + 8, run.hp, run.maxHp);

    // backpack grid
    this.gridCols = run.backpack.width;
    this.gridRows = run.backpack.height;
    const gridPxW = this.gridCols * BACKPACK_CELL;
    const gridPxH = this.gridRows * BACKPACK_CELL;
    this.gridOriginX = (DESIGN_WIDTH - gridPxW) / 2;
    this.gridOriginY = BACKPACK_TOP;

    this.drawBackpackGrid();

    // place item sprites scaled to BACKPACK_CELL
    const scale = BACKPACK_CELL / GRID_CELL;
    for (const placed of run.backpack.allItems()) {
      const sprite = makeItemSprite(this, placed.def, placed.rotation);
      sprite.container.setScale(scale);
      sprite.container.setPosition(
        this.gridOriginX + placed.x * BACKPACK_CELL,
        this.gridOriginY + placed.y * BACKPACK_CELL,
      );
      this.itemSprites.set(placed.instanceId, sprite);
      const list = this.itemSpritesByDef.get(placed.def.id) ?? [];
      list.push(sprite);
      this.itemSpritesByDef.set(placed.def.id, list);
    }

    // backpack label
    this.add.text(cx, BACKPACK_TOP + gridPxH + 30, '🎒 Dein Backpack', {
      fontSize: '20px', color: COLORS_HEX.parchmentDim,
    }).setOrigin(0.5);

    // start processing
    this.processNextEvent();
  }

  private drawBackpackGrid(): void {
    const g = this.add.graphics();
    for (let y = 0; y < this.gridRows; y++) {
      for (let x = 0; x < this.gridCols; x++) {
        const px = this.gridOriginX + x * BACKPACK_CELL;
        const py = this.gridOriginY + y * BACKPACK_CELL;
        const fill = (x + y) % 2 === 0 ? COLORS.gridCell : COLORS.gridCellLight;
        g.fillStyle(fill, 1);
        g.fillRoundedRect(px + 2, py + 2, BACKPACK_CELL - 4, BACKPACK_CELL - 4, 5);
      }
    }
    g.lineStyle(3, COLORS.wood, 1);
    g.strokeRoundedRect(
      this.gridOriginX - 6, this.gridOriginY - 6,
      this.gridCols * BACKPACK_CELL + 12, this.gridRows * BACKPACK_CELL + 12, 12,
    );
  }

  private makeAvatar(x: number, y: number, glyph: string, color: string, size: number): Phaser.GameObjects.Container {
    const c = this.add.container(x, y);
    const g = this.add.graphics();
    const colorNum = Phaser.Display.Color.HexStringToColor(color).color;
    const half = size / 2;
    g.fillStyle(colorNum, 1);
    g.fillRoundedRect(-half, -half, size, size, 20);
    g.lineStyle(4, COLORS.woodLight, 1);
    g.strokeRoundedRect(-half, -half, size, size, 20);
    c.add(g);
    const t = this.add.text(0, 0, glyph, { fontSize: `${Math.floor(size * 0.7)}px` });
    t.setOrigin(0.5);
    c.add(t);
    return c;
  }

  private makeHpBar(x: number, y: number, hp: number, maxHp: number) {
    const w = HP_BAR_W; const h = HP_BAR_H;
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.hpBg, 1);
    bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 8);
    bg.lineStyle(2, COLORS.woodLight, 1);
    bg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 8);
    const fill = this.add.graphics();
    const text = this.add.text(x, y, `${hp}/${maxHp}`, {
      fontSize: '20px', color: COLORS_HEX.parchment, fontStyle: 'bold',
    }).setOrigin(0.5);
    const obj = { fill, text, hp, maxHp };
    this.redrawHpBar(obj, x, y, w, h);
    return obj;
  }

  private redrawHpBar(bar: { fill: Phaser.GameObjects.Graphics; text: Phaser.GameObjects.Text; hp: number; maxHp: number }, x: number, y: number, w: number, h: number): void {
    bar.fill.clear();
    const pct = Math.max(0, bar.hp / bar.maxHp);
    bar.fill.fillStyle(COLORS.hp, 1);
    bar.fill.fillRoundedRect(x - w / 2 + 2, y - h / 2 + 2, (w - 4) * pct, h - 4, 6);
    bar.text.setText(`${bar.hp}/${bar.maxHp}`);
  }

  private updateHp(side: Side, hp: number, maxHp: number): void {
    if (side === 'player') {
      this.playerHpBar.hp = hp; this.playerHpBar.maxHp = maxHp;
      this.redrawHpBar(this.playerHpBar, DESIGN_WIDTH / 2, PLAYER_HP_Y + 8, HP_BAR_W, HP_BAR_H);
    } else {
      this.enemyHpBar.hp = hp; this.enemyHpBar.maxHp = maxHp;
      this.redrawHpBar(this.enemyHpBar, DESIGN_WIDTH / 2, ENEMY_Y + 130, HP_BAR_W, HP_BAR_H);
    }
  }

  private processNextEvent(): void {
    if (this.finished) return;
    if (this.eventIndex >= this.result.events.length) {
      this.onBattleFinished();
      return;
    }
    const ev = this.result.events[this.eventIndex++];
    this.applyEvent(ev);
  }

  private applyEvent(ev: BattleEvent): void {
    const delay = this.baseDelay(ev) / this.speed;
    switch (ev.type) {
      case 'battle_start':
        this.flashLog('Kampf beginnt!');
        break;
      case 'turn_start':
        this.flashLog(`Runde ${ev.turn}`);
        break;
      case 'attack': {
        if (ev.source === 'player' && ev.sourceInstanceId) {
          this.itemAttackAnimation(ev.sourceInstanceId, ev.target, ev.finalDamage, ev.blocked);
        } else {
          this.enemyAttackAnimation(ev.target, ev.finalDamage, ev.blocked);
        }
        break;
      }
      case 'heal':
        if (ev.amount > 0) {
          if (ev.sourceItem) this.glowItemByDef(ev.sourceItem);
          this.floatText(ev.target, `+${ev.amount}`, '#7ad06a');
        }
        break;
      case 'status':
        if (ev.status === 'stun') {
          if (ev.sourceItem) this.glowItemByDef(ev.sourceItem);
          this.floatText(ev.target, '💫 Stun', '#d4a13a');
        }
        break;
      case 'item_proc':
        if (ev.side === 'player' && ev.itemId) this.glowItemByDef(ev.itemId);
        break;
      case 'hp_change':
        this.updateHp(ev.target, ev.hp, ev.maxHp);
        break;
      case 'death':
        this.tweens.add({
          targets: ev.target === 'enemy' ? this.enemySprite : undefined,
          alpha: 0.3,
          duration: 400 / this.speed,
        });
        if (ev.target === 'player') {
          for (const sp of this.itemSprites.values()) {
            this.tweens.add({ targets: sp.container, alpha: 0.4, duration: 400 / this.speed });
          }
        }
        break;
      case 'battle_end':
      case 'turn_end':
        break;
    }
    this.time.delayedCall(delay, () => this.processNextEvent());
  }

  private baseDelay(ev: BattleEvent): number {
    switch (ev.type) {
      case 'battle_start': return 700;
      case 'turn_start': return 400;
      case 'attack': return 480;
      case 'heal': return 320;
      case 'status': return 280;
      case 'hp_change': return 60;
      case 'item_proc': return 80;
      case 'death': return 500;
      case 'turn_end': return 80;
      case 'battle_end': return 50;
    }
  }

  private glowItem(sprite: ItemSprite): void {
    this.tweens.add({
      targets: sprite.container,
      scale: { from: sprite.container.scale, to: sprite.container.scale * 1.18 },
      duration: 90 / this.speed,
      yoyo: true,
      ease: 'Quad.easeOut',
    });
  }

  private glowItemByDef(defId: string): void {
    const list = this.itemSpritesByDef.get(defId);
    if (!list || list.length === 0) return;
    this.glowItem(list[0]);
  }

  private itemCenter(sprite: ItemSprite): { x: number; y: number } {
    const c = sprite.container;
    const baseScale = c.scale;
    const w = c.width * baseScale;
    const h = c.height * baseScale;
    return { x: c.x + w / 2, y: c.y + h / 2 };
  }

  private itemAttackAnimation(instanceId: string, target: Side, finalDamage: number, blocked: boolean): void {
    const sprite = this.itemSprites.get(instanceId);
    if (!sprite) {
      this.enemyAttackAnimation(target, finalDamage, blocked);
      return;
    }
    this.glowItem(sprite);
    const from = this.itemCenter(sprite);
    const targetObj = target === 'enemy' ? this.enemySprite : null;
    const tx = targetObj ? targetObj.x : DESIGN_WIDTH / 2;
    const ty = targetObj ? targetObj.y : PLAYER_HP_Y;

    const proj = projectileGlyphFor(sprite.def.id);
    const projectile = this.add.text(from.x, from.y, proj.glyph, {
      fontSize: `${proj.size}px`,
      color: proj.color,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    projectile.setDepth(50);

    // rotate arrow-type projectiles to point toward target
    if (proj.glyph === '➤') {
      const angle = Phaser.Math.Angle.Between(from.x, from.y, tx, ty);
      projectile.setRotation(angle);
    }

    this.tweens.add({
      targets: projectile,
      x: tx,
      y: ty,
      duration: 280 / this.speed,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        projectile.destroy();
        if (blocked) {
          this.floatText(target, 'BLOCK', '#8aa0c0');
        } else {
          this.floatText(target, `-${finalDamage}`, '#ff6a4a');
          this.shake(targetObj);
        }
      },
    });
  }

  private enemyAttackAnimation(target: Side, finalDamage: number, blocked: boolean): void {
    this.tweens.add({
      targets: this.enemySprite,
      y: this.enemySprite.y + 20,
      duration: 80 / this.speed,
      yoyo: true,
      ease: 'Quad.easeOut',
    });

    const from = { x: this.enemySprite.x, y: this.enemySprite.y };
    const tx = DESIGN_WIDTH / 2;
    const ty = PLAYER_HP_Y;

    const projectile = this.add.text(from.x, from.y, '✦', {
      fontSize: '36px',
      color: '#ff8a4a',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    projectile.setDepth(50);

    this.tweens.add({
      targets: projectile,
      x: tx,
      y: ty,
      duration: 280 / this.speed,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        projectile.destroy();
        if (blocked) {
          this.floatText(target, 'BLOCK', '#8aa0c0');
        } else {
          this.floatText(target, `-${finalDamage}`, '#ff6a4a');
        }
      },
    });
  }

  private shake(obj: Phaser.GameObjects.Container | null): void {
    if (!obj) return;
    const baseX = obj.x;
    this.tweens.add({
      targets: obj,
      x: baseX + 8,
      duration: 50 / this.speed,
      yoyo: true,
      repeat: 1,
      ease: 'Linear',
      onComplete: () => obj.setX(baseX),
    });
  }

  private floatText(side: Side, text: string, color: string): void {
    const x = DESIGN_WIDTH / 2;
    const y = side === 'enemy' ? ENEMY_Y - 20 : PLAYER_HP_Y - 20;
    const t = this.add.text(x, y, text, {
      fontSize: '38px', color, fontStyle: 'bold',
    }).setOrigin(0.5);
    t.setDepth(60);
    this.tweens.add({
      targets: t,
      y: y - 60,
      alpha: 0,
      duration: 700 / this.speed,
      ease: 'Cubic.easeOut',
      onComplete: () => t.destroy(),
    });
  }

  private flashLog(msg: string): void {
    this.logText.setText(msg);
  }

  private onBattleFinished(): void {
    this.finished = true;
    this.scene.start('Result', { winner: this.result.winner, finalPlayerHp: this.result.finalPlayerHp });
  }
}
