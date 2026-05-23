import Phaser from 'phaser';
import { DESIGN_WIDTH, DESIGN_HEIGHT, COLORS_HEX } from '../config/Layout';
import { makeButton } from '../ui/Button';
import { gameState } from '../systems/state/GameState';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenu');
  }

  create(): void {
    const cx = DESIGN_WIDTH / 2;

    const title = this.add.text(cx, 220, 'Backpack', {
      fontSize: '92px',
      color: COLORS_HEX.parchment,
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

    const sub = this.add.text(cx, 320, 'Bayern-Edition', {
      fontSize: '44px',
      color: COLORS_HEX.accent,
      fontStyle: 'italic',
    });
    sub.setOrigin(0.5);

    const tagline = this.add.text(cx, 400, 'Brezeln, Maßkrüge & Krampus.', {
      fontSize: '26px',
      color: COLORS_HEX.parchmentDim,
    });
    tagline.setOrigin(0.5);

    const resumedRun = gameState.resumeRun();
    const hasResume = !!resumedRun;

    let y = 620;
    const gap = 130;

    makeButton(this, cx, y, {
      width: 480,
      height: 100,
      label: hasResume ? 'Run fortsetzen' : 'Neuer Run',
      primary: true,
      onClick: () => {
        if (hasResume && resumedRun) {
          this.scene.start(resumedRun.pendingShop ? 'Shop' : 'Backpack');
        } else {
          this.scene.start('HeroSelect');
        }
      },
    });
    y += gap;

    if (hasResume) {
      makeButton(this, cx, y, {
        width: 480,
        height: 90,
        label: 'Neu starten',
        onClick: () => {
          gameState.endRun(false);
          this.scene.restart();
        },
      });
      y += gap;
    }

    makeButton(this, cx, y, {
      width: 480,
      height: 90,
      label: `Statistik (${gameState.meta.stats.runsWon}/${gameState.meta.stats.runsTotal})`,
      onClick: () => {
        // simple alert overlay
        this.showStats();
      },
    });

    const footer = this.add.text(DESIGN_WIDTH / 2, DESIGN_HEIGHT - 40, 'Phase 1 · v0.1', {
      fontSize: '22px',
      color: COLORS_HEX.parchmentDim,
    });
    footer.setOrigin(0.5);
  }

  private showStats(): void {
    const s = gameState.meta.stats;
    const overlay = this.add.container(0, 0);
    const bg = this.add.rectangle(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2, DESIGN_WIDTH, DESIGN_HEIGHT, 0x000000, 0.75);
    bg.setInteractive();
    overlay.add(bg);
    const text = this.add.text(
      DESIGN_WIDTH / 2,
      DESIGN_HEIGHT / 2 - 80,
      `Runs gesamt: ${s.runsTotal}\nSiege: ${s.runsWon}\nGegner besiegt: ${s.enemiesDefeated}\nBosse besiegt: ${s.bossesDefeated}`,
      { fontSize: '32px', color: COLORS_HEX.parchment, align: 'center' },
    );
    text.setOrigin(0.5);
    overlay.add(text);
    const close = makeButton(this, DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2 + 120, {
      width: 360, height: 80, label: 'Schließen', onClick: () => overlay.destroy(),
    });
    overlay.add(close);
  }
}
