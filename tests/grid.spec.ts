import { describe, it, expect } from 'vitest';
import { BackpackGrid } from '../src/systems/grid/BackpackGrid';
import { rotateShape } from '../src/systems/grid/ItemShape';
import { getItem } from '../src/data/items';

describe('ItemShape rotation', () => {
  it('rotates a 1x3 vertical shape to 3x1 horizontal', () => {
    const shape = { width: 1, height: 3, mask: [[1], [1], [1]] };
    const rotated = rotateShape(shape, 1);
    expect(rotated.width).toBe(3);
    expect(rotated.height).toBe(1);
    expect(rotated.mask).toEqual([[1, 1, 1]]);
  });

  it('rotation 4 returns original shape', () => {
    const shape = { width: 2, height: 2, mask: [[1, 1], [1, 0]] };
    const rotated = rotateShape(shape, 0);
    expect(rotated.mask).toEqual(shape.mask);
  });

  it('rotates an L-shape twice = flipped', () => {
    const shape = { width: 2, height: 2, mask: [[1, 1], [1, 0]] };
    const r2 = rotateShape(shape, 2);
    expect(r2.mask).toEqual([[0, 1], [1, 1]]);
  });
});

describe('BackpackGrid', () => {
  it('places an item and detects collision', () => {
    const grid = new BackpackGrid(4, 4);
    const brezel = getItem('brezel');
    const id1 = grid.place(brezel, 0, 0, 0);
    expect(id1).not.toBeNull();
    expect(grid.cellAt(0, 0)).toBe(id1);

    const id2 = grid.place(brezel, 0, 0, 0);
    expect(id2).toBeNull();
  });

  it('rejects out of bounds', () => {
    const grid = new BackpackGrid(4, 4);
    const lederhose = getItem('lederhose');
    const result = grid.canPlace(lederhose, 3, 3, 0);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('out_of_bounds');
  });

  it('removes an item and frees cells', () => {
    const grid = new BackpackGrid(4, 4);
    const def = getItem('holzschild');
    const id = grid.place(def, 0, 0, 0)!;
    grid.remove(id);
    expect(grid.cellAt(0, 0)).toBeNull();
    expect(grid.place(def, 0, 0, 0)).not.toBeNull();
  });

  it('moves an item to a new valid position', () => {
    const grid = new BackpackGrid(6, 4);
    const def = getItem('holzschild');
    const id = grid.place(def, 0, 0, 0)!;
    const ok = grid.move(id, 2, 1, 0);
    expect(ok).toBe(true);
    expect(grid.cellAt(0, 0)).toBeNull();
    expect(grid.cellAt(2, 1)).toBe(id);
  });

  it('findFreeSpot finds rotation when straight placement fails', () => {
    const grid = new BackpackGrid(3, 1);
    const def = getItem('jagdhorn');
    const spot = grid.findFreeSpot(def);
    expect(spot).not.toBeNull();
    expect(spot!.rotation).toBe(1);
  });

  it('serializes and contains placed items', () => {
    const grid = new BackpackGrid(6, 4);
    grid.place(getItem('brezel'), 0, 0, 0);
    grid.place(getItem('pfeil'), 5, 3, 0);
    const data = grid.serialize();
    expect(data.items.length).toBe(2);
    expect(data.width).toBe(6);
    expect(data.height).toBe(4);
  });
});
