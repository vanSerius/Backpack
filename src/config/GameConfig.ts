import Phaser from 'phaser';
import { DESIGN_WIDTH, DESIGN_HEIGHT, COLORS } from './Layout';
import { BootScene } from '../scenes/BootScene';
import { PreloadScene } from '../scenes/PreloadScene';
import { MainMenuScene } from '../scenes/MainMenuScene';
import { HeroSelectScene } from '../scenes/HeroSelectScene';
import { BackpackScene } from '../scenes/BackpackScene';
import { ShopScene } from '../scenes/ShopScene';
import { BattleScene } from '../scenes/BattleScene';
import { ResultScene } from '../scenes/ResultScene';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: COLORS.bg,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: DESIGN_WIDTH,
    height: DESIGN_HEIGHT,
  },
  render: {
    antialias: true,
    pixelArt: false,
  },
  input: {
    activePointers: 2,
  },
  scene: [BootScene, PreloadScene, MainMenuScene, HeroSelectScene, ShopScene, BackpackScene, BattleScene, ResultScene],
};
