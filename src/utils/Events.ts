import Phaser from 'phaser';

export const gameEvents = new Phaser.Events.EventEmitter();

export const EV = {
  RUN_STARTED: 'run:started',
  RUN_ENDED: 'run:ended',
  STAGE_CHANGED: 'stage:changed',
  HP_CHANGED: 'hp:changed',
  SETTINGS_CHANGED: 'settings:changed',
} as const;
