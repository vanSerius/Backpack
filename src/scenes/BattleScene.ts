import Phaser from 'phaser';
import { DESIGN_WIDTH, COLORS, COLORS_HEX } from '../config/Layout';
import { makeButton } from '../ui/Button';
import { gameState } from '../systems/state/GameState';
import { getEnemy } from '../data/enemies';
import { simulateBattle, type BattleResult } from '../systems/battle/BattleSimulator';
import type { BattleEvent, Side } from '../types/Battle';

const COMBATANT_Y_PLAYER = 950;
const COMBATANT_Y_ENEMY = 360;

export class BattleScene extends Phaser.Scene {
  private result!: BattleResult;
  private playerHpBar!: { fill: Phaser.GameObjects.Graphics; text: Phaser.GameObjects.Text; hp: number; maxHp: number };
  private enemyHpBar!: { fill: Phaser.GameObjects.Graphics; text: Phaser.GameObjects.Text; hp: number; maxHp: number };
  private playerSprite!: Phaser.GameObjects.Container;
  private enemySprite!: Phaser.GameObjects.Container;
  private logText!: Phaser.GameObjects.Text;
  private speed: 1 | 2 | 4 = 1;
  private eventIndex = 0;
  private finished = false;

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

    this.result = simulateBattle({
      seed: run.seed ^ run.stage,
      playerItems: run.backpack.allItems(),
      playerHp: run.hp,
      playerMaxHp: run.maxHp,
      enemy: enemyDef,
    });

    const cx = DESIGN_WIDTH / 2;

    this.add.text(cx, 60, `Runde ${run.stage + 1} · Kampf`, {
      fontSize: '32px',
      color: COLORS_HEX.parchment,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // enemy
    this.enemySprite = this.makeCombatantSprite(cx, COMBATANT_Y_ENEMY, enemyDef.glyph, enemyDef.color);
    this.add.text(cx, COMBATANT_Y_ENEMY + 110, enemyDef.name, {
      fontSize: '28px',
      color: COLORS_HEX.parchment,
    }).setOrigin(0.5);
    this.enemyHpBar = this.makeHpBar(cx, COMBATANT_Y_ENEMY + 160, enemyDef.maxHp, enemyDef.maxHp);

    // separator
    const sep = this.add.graphics();
    sep.lineStyle(2, COLORS.woodLight, 0.5);
    sep.lineBetween(80, 620, DESIGN_WIDTH - 80, 620);

    // player
    this.playerSprite = this.makeCombatantSprite(cx, COMBATANT_Y_PLAYER, run.hero.glyph, run.hero.color);
    this.add.text(cx, COMBATANT_Y_PLAYER + 110, run.hero.name, {
      fontSize: '28px',
      color: COLORS_HEX.parchment,
    }).setOrigin(0.5);
    this.playerHpBar = this.makeHpBar(cx, COMBATANT_Y_PLAYER + 160, run.hp, run.maxHp);

    // log
    this.logText = this.add.text(cx, 720, '', {
      fontSize: '22px',
      color: COLORS_HEX.parchmentDim,
      align: 'center',
      wordWrap: { width: DESIGN_WIDTH - 80 },
    }).setOrigin(0.5);

    // speed toggle
    makeButton(this, DESIGN_WIDTH - 100, 60, {
      width: 140, height: 70, label: `${this.speed}×`, fontSize: 26,
      onClick: () => {
        this.speed = this.speed === 1 ? 2 : this.speed === 2 ? 4 : 1;
        gameState.meta.settings.battleSpeed = this.speed;
        // trigger save via stats unchanged path
        this.scene.restart();
      },
    });

    this.processNextEvent();
  }

  private makeCombatantSprite(x: number, y: number, glyph: string, color: string): Phaser.GameObjects.Container {
    const c = this.add.container(x, y);
    const g = this.add.graphics();
    const colorNum = Phaser.Display.Color.HexStringToColor(color).color;
    g.fillStyle(colorNum, 1);
    g.fillRoundedRect(-90, -90, 180, 180, 24);
    g.lineStyle(4, COLORS.woodLight, 1);
    g.strokeRoundedRect(-90, -90, 180, 180, 24);
    c.add(g);
    const t = this.add.text(0, 0, glyph, { fontSize: '120px' });
    t.setOrigin(0.5);
    c.add(t);
    return c;
  }

  private makeHpBar(x: number, y: number, hp: number, maxHp: number): { fill: Phaser.GameObjects.Graphics; text: Phaser.GameObjects.Text; hp: number; maxHp: number } {
    const w = 440;
    const h = 36;
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.hpBg, 1);
    bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 8);
    bg.lineStyle(2, COLORS.woodLight, 1);
    bg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 8);

    const fill = this.add.graphics();
    const text = this.add.text(x, y, `${hp}/${maxHp}`, {
      fontSize: '22px',
      color: COLORS_HEX.parchment,
      fontStyle: 'bold',
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
    const bar = side === 'player' ? this.playerHpBar : this.enemyHpBar;
    bar.hp = hp;
    bar.maxHp = maxHp;
    const y = side === 'player' ? COMBATANT_Y_PLAYER + 160 : COMBATANT_Y_ENEMY + 160;
    this.redrawHpBar(bar, DESIGN_WIDTH / 2, y, 440, 36);
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
        this.flashText('Kampf beginnt!');
        break;
      case 'turn_start':
        this.logText.setText(`Runde ${ev.turn}`);
        break;
      case 'attack': {
        this.attackAnimation(ev.source);
        if (ev.blocked) {
          this.floatText(ev.target, 'BLOCK', '#8aa0c0');
        } else {
          this.floatText(ev.target, `-${ev.finalDamage}`, '#ff6a4a');
        }
        break;
      }
      case 'heal':
        if (ev.amount > 0) this.floatText(ev.target, `+${ev.amount}`, '#7ad06a');
        break;
      case 'status':
        if (ev.status === 'stun') this.floatText(ev.target, '💫 Stun', '#d4a13a');
        break;
      case 'item_proc':
        // ignore visually, logged in console for debug
        break;
      case 'hp_change':
        this.updateHp(ev.target, ev.hp, ev.maxHp);
        break;
      case 'death':
        this.tweens.add({
          targets: ev.target === 'player' ? this.playerSprite : this.enemySprite,
          alpha: 0.3,
          duration: 400,
        });
        break;
      case 'battle_end':
        // handled in onBattleFinished
        break;
      case 'turn_end':
        break;
    }
    this.time.delayedCall(delay, () => this.processNextEvent());
  }

  private baseDelay(ev: BattleEvent): number {
    switch (ev.type) {
      case 'battle_start': return 700;
      case 'turn_start': return 400;
      case 'attack': return 350;
      case 'heal': return 250;
      case 'status': return 300;
      case 'hp_change': return 80;
      case 'item_proc': return 150;
      case 'death': return 500;
      case 'turn_end': return 100;
      case 'battle_end': return 50;
    }
  }

  private attackAnimation(source: Side): void {
    const sprite = source === 'player' ? this.playerSprite : this.enemySprite;
    const target = source === 'player' ? this.enemySprite : this.playerSprite;
    const dx = (target.x - sprite.x) * 0.15;
    const dy = (target.y - sprite.y) * 0.15;
    this.tweens.add({
      targets: sprite,
      x: sprite.x + dx,
      y: sprite.y + dy,
      duration: 100 / this.speed,
      yoyo: true,
      ease: 'Cubic.easeOut',
    });
  }

  private floatText(side: Side, text: string, color: string): void {
    const baseY = side === 'player' ? COMBATANT_Y_PLAYER : COMBATANT_Y_ENEMY;
    const t = this.add.text(DESIGN_WIDTH / 2, baseY, text, {
      fontSize: '40px',
      color,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.tweens.add({
      targets: t,
      y: baseY - 80,
      alpha: 0,
      duration: 700 / this.speed,
      ease: 'Cubic.easeOut',
      onComplete: () => t.destroy(),
    });
  }

  private flashText(msg: string): void {
    this.logText.setText(msg);
  }

  private onBattleFinished(): void {
    this.finished = true;
    this.scene.start('Result', { winner: this.result.winner, finalPlayerHp: this.result.finalPlayerHp });
  }
}
