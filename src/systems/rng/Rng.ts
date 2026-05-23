export class Rng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
    if (this.state === 0) this.state = 0x9e3779b9;
  }

  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  int(maxExclusive: number): number {
    return Math.floor(this.next() * maxExclusive);
  }

  range(min: number, maxExclusive: number): number {
    return min + this.int(maxExclusive - min);
  }

  chance(probability: number): boolean {
    return this.next() < probability;
  }

  pick<T>(arr: readonly T[]): T {
    return arr[this.int(arr.length)];
  }

  fork(salt: number): Rng {
    return new Rng((this.state ^ salt) >>> 0);
  }
}

export function randomSeed(): number {
  return (Math.random() * 0x7fffffff) >>> 0;
}
