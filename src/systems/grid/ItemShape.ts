import type { ItemShape } from '../../types/Item';

export type Rotation = 0 | 1 | 2 | 3;

export function rotateShape(shape: ItemShape, rotation: Rotation): ItemShape {
  let { width, height, mask } = shape;
  for (let r = 0; r < rotation; r++) {
    const newMask: number[][] = [];
    for (let x = 0; x < width; x++) {
      const row: number[] = [];
      for (let y = height - 1; y >= 0; y--) {
        row.push(mask[y][x]);
      }
      newMask.push(row);
    }
    mask = newMask;
    [width, height] = [height, width];
  }
  return { width, height, mask };
}

export function forEachOccupiedCell(
  shape: ItemShape,
  cb: (dx: number, dy: number) => void,
): void {
  for (let y = 0; y < shape.height; y++) {
    for (let x = 0; x < shape.width; x++) {
      if (shape.mask[y][x] === 1) cb(x, y);
    }
  }
}
