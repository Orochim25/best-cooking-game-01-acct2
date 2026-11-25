// kitchen.js — the sushi bar floor: chef movement, station timers, interactions.

import {
  CHEF_RADIUS, CHEF_SPEED, COOK_RICE_SECONDS, INTERACT_RANGE, LAYOUT,
  RICE_FRESH_SECONDS, ROLL_SECONDS, SLICE_SECONDS,
} from './data.js';
import { recipeForPlate } from './orders.js';

export function createChef() {
  return {
    x: 640, y: 600, dir: 1, moving: false,
    // holding: null | { type: 'raw'|'cooked'|'sliced'|'roll'|'plate', id?, contents? }
    holding: null,
  };
}

export function createStations() {
  return {
    cooker: { id: 'cooker', state: 'empty', t: 0 }, // empty | cooking | ready | burnt
    board: { id: 'board', state: 'empty', item: null, t: 0 }, // empty | slicing | ready
    mat: { id: 'mat', items: [], state: 'empty', t: 0, recipe: null }, // empty | filling | rolling | done
    plating: { id: 'plating', plate: null }, // plate: { contents: [{ingredient, state}] } | null
    trash: { id: 'trash' },
    serve: { id: 'serve' },
  };
}

function rectOf(target) {
  if (target.kind === 'bin') {
    const bins = LAYOUT.bins;
    const n = 8;
    const w = bins.w / n;
    return { x: bins.x + target.index * w, y: bins.y, w, h: bins.h };
  }
  if (target.kind === 'station') {
    const s = LAYOUT.stations[target.id];
    return { x: s.x, y: s.y, w: s.w, h: s.h };
  }
  const s = LAYOUT.serve;
  return { x: s.x, y: s.y, w: s.w, h: s.h };
}

function distToRect(x, y, r) {
  const cx = Math.max(r.x, Math.min(x, r.x + r.w));
  const cy = Math.max(r.y, Math.min(y, r.y + r.h));
  return Math.hypot(x - cx, y - cy);
}

// All solid obstacles the chef cannot walk through.
function solids() {
  const out = [];
  out.push({ x: LAYOUT.belt.x, y: LAYOUT.belt.y, w: LAYOUT.belt.w, h: LAYOUT.belt.h });
  out.push({ x: LAYOUT.serve.x, y: LAYOUT.serve.y, w: LAYOUT.serve.w, h: LAYOUT.serve.h });
  out.push({ x: LAYOUT.bins.x, y: LAYOUT.bins.y, w: LAYOUT.bins.w, h: LAYOUT.bins.h });
  for (const key of Object.keys(LAYOUT.stations)) {
    const s = LAYOUT.stations[key];
    out.push({ x: s.x, y: s.y, w: s.w, h: s.h });
  }
  return out;
}

export function moveChef(chef, axis, dt) {
  chef.moving = axis.x !== 0 || axis.y !== 0;
  if (axis.x !== 0) chef.dir = axis.x > 0 ? 1 : -1;
  if (!chef.moving) return;
  const nx = chef.x + axis.x * CHEF_SPEED * dt;
  const ny = chef.y + axis.y * CHEF_SPEED * dt;
  const floor = LAYOUT.floor;
  chef.x = Math.max(floor.x + CHEF_RADIUS, Math.min(floor.x + floor.w - CHEF_RADIUS, nx));
  chef.y = Math.max(floor.y + CHEF_RADIUS, Math.min(floor.y + floor.h - CHEF_RADIUS, ny));
  // Push out of solid counters (axis-separated, so the chef slides along them).
  for (const r of solids()) {
    if (chef.x + CHEF_RADIUS > r.x && chef.x - CHEF_RADIUS < r.x + r.w
      && chef.y + CHEF_RADIUS > r.y && chef.y - CHEF_RADIUS < r.y + r.h) {
      const pushLeft = (chef.x + CHEF_RADIUS) - r.x;
      const pushRight = (r.x + r.w) - (chef.x - CHEF_RADIUS);
      const pushUp = (chef.y + CHEF_RADIUS) - r.y;
      const pushDown = (r.y + r.h) - (chef.y - CHEF_RADIUS);
      const m = Math.min(pushLeft, pushRight, pushUp, pushDown);
      if (m === pushLeft) chef.x = r.x - CHEF_RADIUS;
      else if (m === pushRight) chef.x = r.x + r.w + CHEF_RADIUS;
      else if (m === pushUp) chef.y = r.y - CHEF_RADIUS;
      else chef.y = r.y + r.h + CHEF_RADIUS;
    }
  }
}

// Nearest usable target in range, or null. The serve window wins ties: a chef
// standing under it wants to serve, not to grab the bin above.
export function nearestTarget(chef, binIds) {
  const candidates = [{ kind: 'serve' }];
  for (const key of Object.keys(LAYOUT.stations)) {
    candidates.push({ kind: 'station', id: key });
  }
  binIds.forEach((id, i) => candidates.push({ kind: 'bin', id, index: i }));
  let best = null;
  let bestD = INTERACT_RANGE;
  for (const c of candidates) {
    const d = distToRect(chef.x, chef.y, rectOf(c));
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}

function holdingLabel(holding) {
  if (!holding) return 'EMPTY HANDS';
  if (holding.type === 'raw') return holding.id.toUpperCase();
  if (holding.type === 'cooked') return 'COOKED RICE';
  if (holding.type === 'sliced') return `SLICED ${holding.id.toUpperCase()}`;
  if (holding.type === 'roll') return holding.recipe ? holding.recipe.name.toUpperCase() : 'ROLL';
  if (holding.type === 'plate') {
    const r = recipeForPlate(holding.contents);
    return r ? r.name.toUpperCase() : 'PLATE';
  }
  return '';
}

export function interact(chef, stations, target, sfx) {
  const held = chef.holding;
  if (!target) return { result: 'none', message: '' };

  if (target.kind === 'bin') {
    if (held) return { result: 'error', message: 'Hands full!' };
    chef.holding = { type: 'raw', id: target.id };
    sfx.pickup();
    return { result: 'ok', message: `${target.id.toUpperCase()} picked up` };
  }

  if (target.kind === 'serve') {
    if (!held || held.type !== 'plate') {
      return { result: 'error', message: 'Bring a finished plate!' };
    }
    return { result: 'serve', message: '' };
  }

  const st = stations[target.id];

  if (target.id === 'trash') {
    if (!held) return { result: 'error', message: 'Nothing to throw away' };
    chef.holding = null;
    sfx.place();
    return { result: 'ok', message: 'Thrown away' };
  }

  if (target.id === 'cooker') {
    if (st.state === 'empty') {
      if (held && held.type === 'raw' && held.id === 'rice') {
        chef.holding = null;
        st.state = 'cooking';
        st.t = 0;
        sfx.sizzle();
        return { result: 'ok', message: 'Rice is cooking…' };
      }
      return { result: 'error', message: 'Needs raw rice' };
    }
    if (st.state === 'cooking') return { result: 'error', message: 'Still cooking…' };
    if (st.state === 'ready') {
      if (held) return { result: 'error', message: 'Hands full!' };
      chef.holding = { type: 'cooked', id: 'rice' };
      st.state = 'empty';
      st.t = 0;
      sfx.pickup();
      return { result: 'ok', message: 'Cooked rice ready' };
    }
    // burnt
    if (held) return { result: 'error', message: 'Hands full!' };
    st.state = 'empty';
    st.t = 0;
    sfx.place();
    return { result: 'ok', message: 'Burnt rice cleared' };
  }

  if (target.id === 'board') {
    if (st.state === 'empty') {
      if (held && held.type === 'raw' && ['salmon', 'tuna', 'shrimp'].includes(held.id)) {
        chef.holding = null;
        st.state = 'slicing';
        st.item = held.id;
        st.t = 0;
        sfx.chop();
        return { result: 'ok', message: `Slicing ${held.id}…` };
      }
      return { result: 'error', message: 'Needs fish to slice' };
    }
    if (st.state === 'slicing') return { result: 'error', message: 'Still slicing…' };
    if (held) return { result: 'error', message: 'Hands full!' };
    chef.holding = { type: 'sliced', id: st.item };
    st.state = 'empty';
    st.item = null;
    st.t = 0;
    sfx.pickup();
    return { result: 'ok', message: 'Sliced fish ready' };
  }

  if (target.id === 'mat') {
    if (st.state === 'rolling') return { result: 'error', message: 'Rolling…' };
    if (st.state === 'done') {
      if (held) return { result: 'error', message: 'Hands full!' };
      chef.holding = { type: 'roll', recipe: st.recipe };
      st.state = 'empty';
      st.items = [];
      st.recipe = null;
      st.t = 0;
      sfx.pickup();
      return { result: 'ok', message: `${chef.holding.recipe.name} rolled!` };
    }
    // filling stage: rice, then nori, then up to 2 fillings.
    const has = (ing) => st.items.some((i) => i.ingredient === ing);
    if (!has('rice')) {
      if (held && held.type === 'cooked') {
        chef.holding = null;
        st.items.push({ ingredient: 'rice', state: 'cooked' });
        sfx.place();
        return { result: 'ok', message: 'Rice on the mat' };
      }
      return { result: 'error', message: 'Needs cooked rice first' };
    }
    if (!has('nori')) {
      if (held && held.type === 'raw' && held.id === 'nori') {
        chef.holding = null;
        st.items.push({ ingredient: 'nori', state: 'raw' });
        sfx.place();
        return { result: 'ok', message: 'Nori laid out' };
      }
      return { result: 'error', message: 'Needs nori next' };
    }
    const fillings = st.items.filter((i) => i.ingredient !== 'rice' && i.ingredient !== 'nori');
    const canAdd = (id) => {
      if (held && held.type === 'raw' && (held.id === 'avocado' || held.id === 'cucumber')) return held.id === id;
      if (held && held.type === 'sliced' && held.id === 'shrimp') return id === 'shrimp';
      return false;
    };
    // Empty hands + a complete recipe on the mat: start rolling it.
    if (!held) {
      const r = recipeForPlate(st.items);
      if (r) {
        st.state = 'rolling';
        st.recipe = r;
        st.t = 0;
        sfx.chop();
        return { result: 'ok', message: `Rolling ${r.name}…` };
      }
      return { result: 'error', message: fillings.length === 0 ? 'Needs a filling' : 'Add a filling' };
    }
    // Hands hold a filling: add it (up to 2 — the second filling makes a Dragon Roll).
    if (fillings.length < 2 && (canAdd('avocado') || canAdd('cucumber') || canAdd('shrimp'))) {
      const filling = { ingredient: held.id, state: held.type === 'sliced' ? 'sliced' : 'raw' };
      chef.holding = null;
      st.items.push(filling);
      sfx.place();
      const r = recipeForPlate(st.items);
      return { result: 'ok', message: r ? `${r.name} ready — press E to roll!` : 'Filling added' };
    }
    if (fillings.length === 0) return { result: 'error', message: 'Needs a filling' };
    return { result: 'error', message: 'Roll is full — press E to roll it' };
  }

  if (target.id === 'plating') {
    if (!st.plate) {
      if (held && held.type === 'cooked') {
        chef.holding = null;
        st.plate = { contents: [{ ingredient: 'rice', state: 'cooked' }] };
        sfx.place();
        return { result: 'ok', message: 'Rice on the plate' };
      }
      if (held && held.type === 'roll') {
        chef.holding = null;
        st.plate = { contents: held.recipe.parts.map((p) => ({ ...p })) };
        sfx.place();
        sfx.ding();
        return { result: 'ok', message: `${held.recipe.name} plated — READY!` };
      }
      return { result: 'error', message: 'Needs rice or a finished roll' };
    }
    // Plate exists: add sliced fish / tamago, or pick it up.
    const contents = st.plate.contents;
    const hasRice = contents.some((c) => c.ingredient === 'rice');
    if (hasRice && contents.length === 1 && held
      && ((held.type === 'sliced' && ['salmon', 'tuna'].includes(held.id))
        || (held.type === 'raw' && held.id === 'tamago'))) {
      chef.holding = null;
      contents.push({ ingredient: held.id, state: held.type === 'sliced' ? 'sliced' : 'raw' });
      sfx.place();
      const r = recipeForPlate(contents);
      if (r) sfx.ding();
      return { result: 'ok', message: r ? `${r.name} ready — SERVE IT!` : 'Added to plate' };
    }
    if (!held) {
      chef.holding = { type: 'plate', contents: st.plate.contents };
      st.plate = null;
      sfx.pickup();
      return { result: 'ok', message: 'Plate picked up' };
    }
    return { result: 'error', message: 'Plate is busy' };
  }

  return { result: 'none', message: '' };
}

export function updateStations(stations, dt, sfx) {
  const events = [];
  const cooker = stations.cooker;
  if (cooker.state === 'cooking') {
    cooker.t += dt;
    if (cooker.t >= COOK_RICE_SECONDS) {
      cooker.state = 'ready';
      cooker.t = 0;
      events.push('ding');
    }
  } else if (cooker.state === 'ready') {
    cooker.t += dt;
    if (cooker.t >= RICE_FRESH_SECONDS) {
      cooker.state = 'burnt';
      cooker.t = 0;
      events.push('burnt');
    }
  }
  const board = stations.board;
  if (board.state === 'slicing') {
    board.t += dt;
    if (board.t >= SLICE_SECONDS) {
      board.state = 'ready';
      board.t = 0;
      events.push('ding');
    }
  }
  const mat = stations.mat;
  if (mat.state === 'rolling') {
    mat.t += dt;
    if (mat.t >= ROLL_SECONDS) {
      mat.state = 'done';
      mat.t = 0;
      events.push('ding');
    }
  }
  for (const e of events) {
    if (e === 'ding') sfx.ding();
    if (e === 'burnt') sfx.error();
  }
  return events;
}

export { holdingLabel };
