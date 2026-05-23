import Phaser from 'phaser';
import type { ItemDef } from '../types/Item';
import { GRID_CELL, COLORS } from '../config/Layout';
import { rotateShape, forEachOccupiedCell } from '../systems/grid/ItemShape';
import type { Rotation } from '../systems/grid/ItemShape';

const CELL_PAD = 4;

export function drawItemGraphic(g: Phaser.GameObjects.Graphics, def: ItemDef, rotation: Rotation): void {
  g.clear();
  const shape = rotateShape(def.shape, rotation);
  const colorNum = Phaser.Display.Color.HexStringToColor(def.color).color;
  forEachOccupiedCell(shape, (dx, dy) => {
    const x = dx * GRID_CELL + CELL_PAD;
    const y = dy * GRID_CELL + CELL_PAD;
    const w = GRID_CELL - CELL_PAD * 2;
    const h = GRID_CELL - CELL_PAD * 2;
    g.fillStyle(colorNum, 1);
    g.fillRoundedRect(x, y, w, h, 10);
    g.lineStyle(3, COLORS.bgPanel, 0.85);
    g.strokeRoundedRect(x, y, w, h, 10);
  });
}

export interface ItemSprite {
  container: Phaser.GameObjects.Container;
  graphics: Phaser.GameObjects.Graphics;
  glyph: Phaser.GameObjects.Text;
  def: ItemDef;
  rotation: Rotation;
}

export function makeItemSprite(
  scene: Phaser.Scene,
  def: ItemDef,
  rotation: Rotation,
): ItemSprite {
  const container = scene.add.container(0, 0);
  const graphics = scene.add.graphics();
  drawItemGraphic(graphics, def, rotation);
  container.add(graphics);

  const shape = rotateShape(def.shape, rotation);
  const cx = (shape.width * GRID_CELL) / 2;
  const cy = (shape.height * GRID_CELL) / 2;
  const glyph = scene.add.text(cx, cy, def.glyph, {
    fontSize: `${Math.floor(GRID_CELL * 0.7)}px`,
    color: '#ffffff',
  });
  glyph.setOrigin(0.5);
  container.add(glyph);

  container.setSize(shape.width * GRID_CELL, shape.height * GRID_CELL);
  return { container, graphics, glyph, def, rotation };
}

export function setItemRotation(sprite: ItemSprite, rotation: Rotation): void {
  sprite.rotation = rotation;
  drawItemGraphic(sprite.graphics, sprite.def, rotation);
  const shape = rotateShape(sprite.def.shape, rotation);
  sprite.glyph.setPosition((shape.width * GRID_CELL) / 2, (shape.height * GRID_CELL) / 2);
  sprite.container.setSize(shape.width * GRID_CELL, shape.height * GRID_CELL);
}
