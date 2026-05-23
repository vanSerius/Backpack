import type { ItemDef, PlacedItem } from '../../types/Item';
import { forEachOccupiedCell, rotateShape, type Rotation } from './ItemShape';

export interface PlaceResult {
  ok: boolean;
  reason?: 'out_of_bounds' | 'collision';
}

export class BackpackGrid {
  readonly width: number;
  readonly height: number;
  /** cells[y][x] = instanceId or null */
  private cells: (string | null)[][];
  private items: Map<string, PlacedItem> = new Map();
  private nextInstanceId = 1;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.cells = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => null as string | null),
    );
  }

  newInstanceId(): string {
    return `i${this.nextInstanceId++}`;
  }

  canPlace(def: ItemDef, x: number, y: number, rotation: Rotation, ignoreId?: string): PlaceResult {
    const shape = rotateShape(def.shape, rotation);
    let ok = true;
    let reason: PlaceResult['reason'];
    forEachOccupiedCell(shape, (dx, dy) => {
      const cx = x + dx;
      const cy = y + dy;
      if (cx < 0 || cy < 0 || cx >= this.width || cy >= this.height) {
        ok = false;
        reason = 'out_of_bounds';
        return;
      }
      const occupant = this.cells[cy][cx];
      if (occupant && occupant !== ignoreId) {
        ok = false;
        reason = 'collision';
      }
    });
    return ok ? { ok: true } : { ok: false, reason };
  }

  place(def: ItemDef, x: number, y: number, rotation: Rotation, instanceId?: string): string | null {
    const result = this.canPlace(def, x, y, rotation);
    if (!result.ok) return null;
    const id = instanceId ?? this.newInstanceId();
    const shape = rotateShape(def.shape, rotation);
    forEachOccupiedCell(shape, (dx, dy) => {
      this.cells[y + dy][x + dx] = id;
    });
    this.items.set(id, { instanceId: id, def, x, y, rotation });
    return id;
  }

  remove(instanceId: string): PlacedItem | null {
    const placed = this.items.get(instanceId);
    if (!placed) return null;
    const shape = rotateShape(placed.def.shape, placed.rotation);
    forEachOccupiedCell(shape, (dx, dy) => {
      this.cells[placed.y + dy][placed.x + dx] = null;
    });
    this.items.delete(instanceId);
    return placed;
  }

  move(instanceId: string, x: number, y: number, rotation: Rotation): boolean {
    const placed = this.items.get(instanceId);
    if (!placed) return false;
    const check = this.canPlace(placed.def, x, y, rotation, instanceId);
    if (!check.ok) return false;
    this.remove(instanceId);
    this.place(placed.def, x, y, rotation, instanceId);
    return true;
  }

  getItem(instanceId: string): PlacedItem | undefined {
    return this.items.get(instanceId);
  }

  allItems(): PlacedItem[] {
    return Array.from(this.items.values());
  }

  cellAt(x: number, y: number): string | null {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return null;
    return this.cells[y][x];
  }

  findFreeSpot(def: ItemDef): { x: number; y: number; rotation: Rotation } | null {
    for (const rot of [0, 1, 2, 3] as Rotation[]) {
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          if (this.canPlace(def, x, y, rot).ok) {
            return { x, y, rotation: rot };
          }
        }
      }
    }
    return null;
  }

  serialize(): { width: number; height: number; items: Array<{ instanceId: string; itemId: string; x: number; y: number; rotation: Rotation }> } {
    return {
      width: this.width,
      height: this.height,
      items: this.allItems().map((it) => ({
        instanceId: it.instanceId,
        itemId: it.def.id,
        x: it.x,
        y: it.y,
        rotation: it.rotation,
      })),
    };
  }
}
