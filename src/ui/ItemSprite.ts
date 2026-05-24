import Phaser from 'phaser';
import type { ItemDef } from '../types/Item';
import { GRID_CELL, COLORS } from '../config/Layout';
import { rotateShape, forEachOccupiedCell } from '../systems/grid/ItemShape';
import type { Rotation } from '../systems/grid/ItemShape';

const CELL_PAD = 4;
const SPRITE_PAD = 6;

export function drawItemGraphic(g: Phaser.GameObjects.Graphics, def: ItemDef, rotation: Rotation): void {
  g.clear();
  const shape = rotateShape(def.shape, rotation);
  const colorNum = Phaser.Display.Color.HexStringToColor(def.color).color;
  forEachOccupiedCell(shape, (dx, dy) => {
    const x = dx * GRID_CELL + CELL_PAD;
    const y = dy * GRID_CELL + CELL_PAD;
    const w = GRID_CELL - CELL_PAD * 2;
    const h = GRID_CELL - CELL_PAD * 2;
    g.fillStyle(colorNum, 0.5);
    g.fillRoundedRect(x, y, w, h, 10);
    g.lineStyle(3, COLORS.bgPanel, 0.85);
    g.strokeRoundedRect(x, y, w, h, 10);
  });
}

export interface ItemSprite {
  container: Phaser.GameObjects.Container;
  graphics: Phaser.GameObjects.Graphics;
  /** Either an Image (when an SVG sprite is loaded) or a Text emoji fallback. */
  visual: Phaser.GameObjects.Image | Phaser.GameObjects.Text;
  def: ItemDef;
  rotation: Rotation;
}

function hasSprite(scene: Phaser.Scene, def: ItemDef): boolean {
  return scene.textures.exists(`item:${def.id}`);
}

/** Apply non-uniform scale + rotation to an Image so it fills the rotated item's bounding box. */
function fitImageToShape(img: Phaser.GameObjects.Image, def: ItemDef, rotation: Rotation): void {
  const shape = rotateShape(def.shape, rotation);
  const targetW = shape.width * GRID_CELL - SPRITE_PAD * 2;
  const targetH = shape.height * GRID_CELL - SPRITE_PAD * 2;
  const tex = img.texture.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
  const srcW = tex.width || img.width || 1;
  const srcH = tex.height || img.height || 1;
  // When sprite is rotated 90°/270°, swap so that pre-rotation scaleX matches post-rotation height
  const swap = rotation % 2 === 1;
  const scaleX = (swap ? targetH : targetW) / srcW;
  const scaleY = (swap ? targetW : targetH) / srcH;
  img.setScale(scaleX, scaleY);
  img.setRotation((rotation * Math.PI) / 2);
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

  let visual: Phaser.GameObjects.Image | Phaser.GameObjects.Text;
  if (hasSprite(scene, def)) {
    const img = scene.add.image(cx, cy, `item:${def.id}`);
    fitImageToShape(img, def, rotation);
    visual = img;
  } else {
    const txt = scene.add.text(cx, cy, def.glyph, {
      fontSize: `${Math.floor(GRID_CELL * 0.7)}px`,
      color: '#ffffff',
    });
    txt.setOrigin(0.5);
    visual = txt;
  }
  container.add(visual);

  container.setSize(shape.width * GRID_CELL, shape.height * GRID_CELL);
  return { container, graphics, visual, def, rotation };
}

export function setItemRotation(sprite: ItemSprite, rotation: Rotation): void {
  sprite.rotation = rotation;
  drawItemGraphic(sprite.graphics, sprite.def, rotation);
  const shape = rotateShape(sprite.def.shape, rotation);
  const cx = (shape.width * GRID_CELL) / 2;
  const cy = (shape.height * GRID_CELL) / 2;
  sprite.visual.setPosition(cx, cy);
  if (sprite.visual instanceof Phaser.GameObjects.Image) {
    fitImageToShape(sprite.visual, sprite.def, rotation);
  }
  sprite.container.setSize(shape.width * GRID_CELL, shape.height * GRID_CELL);
}
