import Phaser from 'phaser';
import { DESIGN_WIDTH, DESIGN_HEIGHT, COLORS, COLORS_HEX } from '../config/Layout';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload(): void {
    const cx = DESIGN_WIDTH / 2;
    const cy = DESIGN_HEIGHT / 2;
    const title = this.add.text(cx, cy - 80, 'Backpack Bayern', {
      fontSize: '52px',
      color: COLORS_HEX.parchment,
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);
    const sub = this.add.text(cx, cy - 20, 'Lädt…', {
      fontSize: '28px',
      color: COLORS_HEX.parchmentDim,
    });
    sub.setOrigin(0.5);

    const barW = 480;
    const barH = 22;
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.wood, 1);
    bg.fillRoundedRect(cx - barW / 2, cy + 30, barW, barH, 6);

    const fill = this.add.graphics();

    this.load.on('progress', (p: number) => {
      fill.clear();
      fill.fillStyle(COLORS.accent, 1);
      fill.fillRoundedRect(cx - barW / 2 + 2, cy + 32, (barW - 4) * p, barH - 4, 4);
    });
  }

  create(): void {
    this.scene.start('MainMenu');
  }
}
