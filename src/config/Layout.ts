export const DESIGN_WIDTH = 720;
export const DESIGN_HEIGHT = 1280;

export const GRID_CELL = 88;
export const GRID_COLS_DEFAULT = 6;
export const GRID_ROWS_DEFAULT = 4;

export const COLORS = {
  bg: 0x0f0a06,
  bgPanel: 0x1a1410,
  wood: 0x4a2f1c,
  woodLight: 0x6b4423,
  parchment: 0xf3e6c9,
  parchmentDim: 0xc9b489,
  accent: 0xd4a13a,
  accentDark: 0x8a6420,
  danger: 0xb83a2a,
  hp: 0xc23a2a,
  hpBg: 0x3a1a14,
  armor: 0x8aa0c0,
  gridCell: 0x2a1d12,
  gridCellLight: 0x3a2918,
  gridOk: 0x4a8a3a,
  gridBad: 0xb83a2a,
} as const;

export const COLORS_HEX = {
  parchment: '#f3e6c9',
  parchmentDim: '#c9b489',
  accent: '#d4a13a',
  danger: '#b83a2a',
  bg: '#0f0a06',
} as const;
