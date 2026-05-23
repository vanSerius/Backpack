import Phaser from 'phaser';
import { COLORS, COLORS_HEX } from '../config/Layout';

export interface ButtonOpts {
  width: number;
  height: number;
  label: string;
  onClick: () => void;
  primary?: boolean;
  fontSize?: number;
}

export function makeButton(scene: Phaser.Scene, x: number, y: number, opts: ButtonOpts): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  const fillColor = opts.primary ? COLORS.accent : COLORS.wood;
  const strokeColor = opts.primary ? COLORS.accentDark : COLORS.woodLight;
  const w = opts.width;
  const h = opts.height;
  g.fillStyle(fillColor, 1);
  g.fillRoundedRect(-w / 2, -h / 2, w, h, 14);
  g.lineStyle(3, strokeColor, 1);
  g.strokeRoundedRect(-w / 2, -h / 2, w, h, 14);
  c.add(g);

  const txt = scene.add.text(0, 0, opts.label, {
    fontSize: `${opts.fontSize ?? 32}px`,
    color: opts.primary ? '#1a1410' : COLORS_HEX.parchment,
    fontStyle: 'bold',
  });
  txt.setOrigin(0.5);
  c.add(txt);

  const hit = new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h);
  c.setInteractive(hit, Phaser.Geom.Rectangle.Contains);
  c.on('pointerdown', () => {
    scene.tweens.add({ targets: c, scale: 0.96, duration: 80, yoyo: true });
  });
  c.on('pointerup', () => opts.onClick());
  return c;
}
