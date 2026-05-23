import Phaser from 'phaser';
import { DESIGN_WIDTH, DESIGN_HEIGHT, COLORS_HEX } from '../config/Layout';
import { makeButton } from '../ui/Button';
import { gameState } from '../systems/state/GameState';
import { STAGE_ORDER } from '../data/enemies';
import type { Side } from '../types/Battle';

interface ResultData {
  winner: Side | 'draw';
  finalPlayerHp: number;
}

export class ResultScene extends Phaser.Scene {
  constructor() {
    super('Result');
  }

  init(data: ResultData): void {
    this.data.set('winner', data.winner);
    this.data.set('finalPlayerHp', data.finalPlayerHp);
  }

  create(): void {
    const cx = DESIGN_WIDTH / 2;
    const winner = this.data.get('winner') as Side | 'draw';
    const finalHp = this.data.get('finalPlayerHp') as number;

    const run = gameState.run;
    if (!run) {
      this.scene.start('MainMenu');
      return;
    }

    const playerWon = winner === 'player';
    const wasLastStage = run.stage >= STAGE_ORDER.length - 1;
    const runComplete = playerWon && wasLastStage;

    let title: string;
    let titleColor: string;
    if (runComplete) {
      title = 'RUN BESIEGT!';
      titleColor = COLORS_HEX.accent;
    } else if (playerWon) {
      title = 'Sieg!';
      titleColor = COLORS_HEX.accent;
    } else {
      title = 'Niederlage';
      titleColor = COLORS_HEX.danger;
    }

    this.add.text(cx, 350, title, {
      fontSize: '72px',
      color: titleColor,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    if (playerWon) {
      this.add.text(cx, 460, `Verbleibend: ${Math.max(0, finalHp)} HP`, {
        fontSize: '32px',
        color: COLORS_HEX.parchment,
      }).setOrigin(0.5);
    }

    if (runComplete) {
      this.add.text(cx, 540, 'Krampus wurde besiegt.\nDanke fürs Spielen — Phase 2 kommt bald!', {
        fontSize: '24px',
        color: COLORS_HEX.parchmentDim,
        align: 'center',
      }).setOrigin(0.5);
    }

    const btnY = DESIGN_HEIGHT - 200;
    if (runComplete) {
      // run won
      makeButton(this, cx, btnY, {
        width: 480, height: 100, label: '🎉 Zum Hauptmenü', primary: true,
        onClick: () => {
          gameState.endRun(true);
          this.scene.start('MainMenu');
        },
      });
    } else if (playerWon) {
      // proceed to next stage
      run.hp = Math.max(1, finalHp);
      gameState.advanceStage();
      makeButton(this, cx, btnY, {
        width: 480, height: 100, label: 'Nächste Runde →', primary: true,
        onClick: () => this.scene.start('Backpack'),
      });
    } else {
      // lost
      makeButton(this, cx, btnY, {
        width: 480, height: 100, label: 'Zurück zum Menü', primary: true,
        onClick: () => {
          gameState.endRun(false);
          this.scene.start('MainMenu');
        },
      });
    }
  }
}
