// data.js — Sushi Rush: recipes, ingredients, layout and tuning constants.

export const VIEW_W = 1280;
export const VIEW_H = 720;
export const SHIFT_SECONDS = 150;
export const MAX_ORDERS = 3;
export const ORDER_SECONDS = 55;
export const ORDER_SPAWN_START = 13;
export const ORDER_SPAWN_MIN = 8;
export const MAX_MISSED = 3;

// Ingredient catalogue. kind: 'raw' (from a bin), 'sliced' needs the board.
export const INGREDIENTS = {
  rice: { id: 'rice', name: 'Rice', short: 'RICE', color: '#f5efe0', dark: '#d8cdb2', slice: false },
  salmon: { id: 'salmon', name: 'Salmon', short: 'SALMON', color: '#ff8c5a', dark: '#e56a35', slice: true },
  tuna: { id: 'tuna', name: 'Tuna', short: 'TUNA', color: '#c9405e', dark: '#9e2c46', slice: true },
  shrimp: { id: 'shrimp', name: 'Shrimp', short: 'SHRIMP', color: '#ff9d8a', dark: '#e5705c', slice: true },
  nori: { id: 'nori', name: 'Nori', short: 'NORI', color: '#2e4d2a', dark: '#1d3319', slice: false },
  avocado: { id: 'avocado', name: 'Avocado', short: 'AVOCADO', color: '#8fbf4d', dark: '#5d8a2e', slice: false },
  cucumber: { id: 'cucumber', name: 'Cucumber', short: 'CUCUMBER', color: '#7cc46a', dark: '#4d9440', slice: false },
  tamago: { id: 'tamago', name: 'Tamago', short: 'TAMAGO', color: '#f7c948', dark: '#d9a41f', slice: false },
};

export const BIN_ORDER = ['rice', 'salmon', 'tuna', 'shrimp', 'nori', 'avocado', 'cucumber', 'tamago'];

// A recipe part: { ingredient, state } where state is 'raw' | 'cooked' | 'sliced'.
export const RECIPE_LIST = [
  {
    id: 'salmon-nigiri', name: 'Salmon Nigiri', kind: 'nigiri', price: 100,
    parts: [
      { ingredient: 'rice', state: 'cooked' },
      { ingredient: 'salmon', state: 'sliced' },
    ],
  },
  {
    id: 'tuna-nigiri', name: 'Tuna Nigiri', kind: 'nigiri', price: 100,
    parts: [
      { ingredient: 'rice', state: 'cooked' },
      { ingredient: 'tuna', state: 'sliced' },
    ],
  },
  {
    id: 'tamago-nigiri', name: 'Tamago Nigiri', kind: 'nigiri', price: 90,
    parts: [
      { ingredient: 'rice', state: 'cooked' },
      { ingredient: 'tamago', state: 'raw' },
    ],
  },
  {
    id: 'avocado-maki', name: 'Avocado Maki', kind: 'maki', price: 110,
    parts: [
      { ingredient: 'rice', state: 'cooked' },
      { ingredient: 'nori', state: 'raw' },
      { ingredient: 'avocado', state: 'raw' },
    ],
  },
  {
    id: 'cucumber-maki', name: 'Cucumber Maki', kind: 'maki', price: 110,
    parts: [
      { ingredient: 'rice', state: 'cooked' },
      { ingredient: 'nori', state: 'raw' },
      { ingredient: 'cucumber', state: 'raw' },
    ],
  },
  {
    id: 'shrimp-roll', name: 'Shrimp Roll', kind: 'maki', price: 120,
    parts: [
      { ingredient: 'rice', state: 'cooked' },
      { ingredient: 'nori', state: 'raw' },
      { ingredient: 'shrimp', state: 'sliced' },
    ],
  },
  {
    id: 'dragon-roll', name: 'Dragon Roll', kind: 'maki', price: 150,
    parts: [
      { ingredient: 'rice', state: 'cooked' },
      { ingredient: 'nori', state: 'raw' },
      { ingredient: 'shrimp', state: 'sliced' },
      { ingredient: 'avocado', state: 'raw' },
    ],
  },
];

export function recipeById(id) {
  return RECIPE_LIST.find((r) => r.id === id) || null;
}

// Cooking times (seconds).
export const COOK_RICE_SECONDS = 4;
export const RICE_FRESH_SECONDS = 10;
export const SLICE_SECONDS = 3;
export const ROLL_SECONDS = 3;

// Layout (logical 1280x720 canvas).
export const LAYOUT = {
  hud: { x: 0, y: 0, w: 1280, h: 58 },
  board: { x: 12, y: 66, w: 220, h: 642 },
  belt: { x: 244, y: 66, w: 856, h: 46 },
  serve: { x: 1112, y: 66, w: 156, h: 130 },
  bins: { x: 244, y: 124, w: 1024, h: 72 },
  floor: { x: 244, y: 210, w: 1024, h: 498 },
  stations: {
    cooker: { x: 252, y: 300, w: 190, h: 170, label: 'RICE COOKER' },
    board: { x: 458, y: 300, w: 190, h: 170, label: 'CUTTING BOARD' },
    mat: { x: 664, y: 300, w: 190, h: 170, label: 'ROLLING MAT' },
    plating: { x: 870, y: 300, w: 190, h: 170, label: 'PLATING' },
    trash: { x: 1076, y: 330, w: 186, h: 140, label: 'TRASH' },
  },
};

export const CHEF_SPEED = 270;
export const CHEF_RADIUS = 24;
export const INTERACT_RANGE = 84;

export const PALETTE = {
  wall: '#3a2a22',
  floor: '#8a5a3b',
  floorLight: '#9c6b47',
  counterTop: '#e8d5b0',
  counterSide: '#b98d5f',
  board: '#2b1d16',
  boardEdge: '#4a3226',
  ticket: '#fdf6e3',
  ticketEdge: '#d9c48f',
  red: '#c0392b',
  redDark: '#96281b',
  gold: '#f2b705',
  teal: '#1f7a6d',
  cream: '#fdf6e3',
  ink: '#2b1d16',
  muted: '#7a6a58',
};
