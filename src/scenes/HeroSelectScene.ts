import Phaser from 'phaser';
import { DESIGN_WIDTH, DESIGN_HEIGHT, COLORS, COLORS_HEX } from '../config/Layout';
import { makeButton } from '../ui/Button';
import { HEROES } from '../data/heroes';
import { gameState } from '../systems/state/GameState';

export class HeroSelectScene extends Phaser.Scene {
  constructor() {
    super('HeroSelect');
  }

  create(): void {
    const cx = DESIGN_WIDTH / 2;

    const title = this.add.text(cx, 100, 'Wähle deinen Helden', {
      fontSize: '44px',
      color: COLORS_HEX.parchment,
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

    const cardW = 580;
    const cardH = 220;
    const startY = 260;
    const gap = 250;

    HEROES.forEach((hero, idx) => {
      const y = startY + idx * gap;
      const isLocked = !gameState.meta.unlocks.heroes.includes(hero.id);
      const c = this.add.container(cx, y);
      const g = this.add.graphics();
      const cardColor = isLocked ? COLORS.gridCell : COLORS.bgPanel;
      g.fillStyle(cardColor, 1);
      g.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 18);
      g.lineStyle(3, COLORS.woodLight, 1);
      g.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 18);
      c.add(g);

      const heroColor = Phaser.Display.Color.HexStringToColor(hero.color).color;
      const orb = this.add.graphics();
      orb.fillStyle(heroColor, isLocked ? 0.3 : 1);
      orb.fillCircle(-cardW / 2 + 90, 0, 60);
      c.add(orb);

      const glyph = this.add.text(-cardW / 2 + 90, 0, hero.glyph, { fontSize: '64px' });
      glyph.setOrigin(0.5);
      glyph.setAlpha(isLocked ? 0.5 : 1);
      c.add(glyph);

      const name = this.add.text(-cardW / 2 + 180, -60, hero.name, {
        fontSize: '32px',
        color: isLocked ? COLORS_HEX.parchmentDim : COLORS_HEX.parchment,
        fontStyle: 'bold',
      });
      c.add(name);
      const subtitle = this.add.text(-cardW / 2 + 180, -25, hero.title, {
        fontSize: '20px',
        color: COLORS_HEX.parchmentDim,
        fontStyle: 'italic',
      });
      c.add(subtitle);

      const stats = this.add.text(
        -cardW / 2 + 180,
        15,
        `HP ${hero.maxHp} · Backpack ${hero.gridCols}×${hero.gridRows}`,
        { fontSize: '22px', color: COLORS_HEX.parchment },
      );
      c.add(stats);

      const passive = this.add.text(-cardW / 2 + 180, 50, hero.passive, {
        fontSize: '20px',
        color: COLORS_HEX.accent,
      });
      c.add(passive);

      if (isLocked) {
        const lockText = this.add.text(cardW / 2 - 30, -cardH / 2 + 30, '🔒', { fontSize: '36px' });
        lockText.setOrigin(1, 0);
        c.add(lockText);
      } else {
        const hit = new Phaser.Geom.Rectangle(-cardW / 2, -cardH / 2, cardW, cardH);
        c.setInteractive(hit, Phaser.Geom.Rectangle.Contains);
        c.on('pointerup', () => {
          gameState.startRun(hero.id);
          this.scene.start('Shop');
        });
      }
    });

    makeButton(this, cx, DESIGN_HEIGHT - 80, {
      width: 280, height: 70, label: '← Zurück', onClick: () => this.scene.start('MainMenu'),
    });
  }
}
