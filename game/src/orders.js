// orders.js — order tickets: spawn, timers, plate matching, score and combo.

import {
  MAX_ORDERS, ORDER_SECONDS, ORDER_SPAWN_START, ORDER_SPAWN_MIN, RECIPE_LIST,
} from './data.js';

export function createOrders() {
  return {
    list: [], // { id, recipe, timeLeft, total, born }
    nextId: 1,
    spawnIn: 3,
    served: 0,
    missed: 0,
    score: 0,
    combo: 0,
    bestCombo: 0,
    earned: 0,
    popups: [], // { text, x, y, t, color, big }
  };
}

function pickRecipe(elapsed) {
  // Early shift: two-part recipes only; the full menu opens as the rush builds.
  const pool = elapsed < 40
    ? RECIPE_LIST.filter((r) => r.parts.length === 2)
    : RECIPE_LIST;
  return pool[Math.floor(Math.random() * pool.length)];
}

function spawnInterval(elapsed) {
  const t = Math.min(1, elapsed / 120);
  return ORDER_SPAWN_START + (ORDER_SPAWN_MIN - ORDER_SPAWN_START) * t;
}

export function updateOrders(orders, dt, elapsed) {
  orders.spawnIn -= dt;
  let arrived = null;
  if (orders.spawnIn <= 0 && orders.list.length < MAX_ORDERS) {
    const recipe = pickRecipe(elapsed);
    orders.list.push({
      id: orders.nextId++, recipe, timeLeft: ORDER_SECONDS, total: ORDER_SECONDS, born: elapsed,
    });
    orders.spawnIn = spawnInterval(elapsed);
    arrived = 'orderIn';
  }
  let missed = false;
  for (let i = orders.list.length - 1; i >= 0; i--) {
    const o = orders.list[i];
    o.timeLeft -= dt;
    if (o.timeLeft <= 0) {
      orders.list.splice(i, 1);
      orders.missed += 1;
      orders.combo = 0;
      missed = true;
    }
  }
  return missed ? 'missed' : arrived;
}

// Does the plate hold exactly this recipe's parts (any order)?
export function plateMatchesOrder(contents, recipe) {
  if (contents.length !== recipe.parts.length) return false;
  const key = (c) => `${c.ingredient}:${c.state}`;
  const have = contents.map(key).sort().join('|');
  const want = recipe.parts.map(key).sort().join('|');
  return have === want;
}

export function recipeForPlate(contents) {
  return RECIPE_LIST.find((r) => plateMatchesOrder(contents, r)) || null;
}

// Serve a plate: returns 'ok' + points, or 'wrong' when no ticket matches.
export function servePlate(orders, contents) {
  if (!contents || !Array.isArray(contents)) return { result: 'wrong', points: 0 };
  let best = null;
  let bestLeft = -1;
  for (const o of orders.list) {
    if (plateMatchesOrder(contents, o.recipe) && o.timeLeft > bestLeft) {
      best = o;
      bestLeft = o.timeLeft;
    }
  }
  if (!best) return { result: 'wrong', points: 0 };
  orders.list = orders.list.filter((o) => o !== best);
  const timeBonus = Math.round((best.timeLeft / best.total) * 50);
  const comboBonus = orders.combo * 15;
  const points = best.recipe.price + timeBonus + comboBonus;
  orders.score += points;
  orders.earned += points;
  orders.served += 1;
  orders.combo += 1;
  if (orders.combo > orders.bestCombo) orders.bestCombo = orders.combo;
  orders.popups.push({
    text: `+${points}`, x: 1190, y: 230, t: 1.6, color: '#f2b705', big: true,
  });
  orders.popups.push({
    text: 'SERVED!', x: 1190, y: 266, t: 1.6, color: '#2ecc71', big: false,
  });
  if (orders.combo >= 2) {
    orders.popups.push({
      text: `COMBO x${orders.combo}!`, x: 1190, y: 296, t: 1.6, color: '#e4572e', big: false,
    });
  }
  return { result: 'ok', points };
}

export function updatePopups(orders, dt) {
  for (let i = orders.popups.length - 1; i >= 0; i--) {
    const p = orders.popups[i];
    p.t -= dt;
    p.y -= 26 * dt;
    if (p.t <= 0) orders.popups.splice(i, 1);
  }
}
