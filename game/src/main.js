// main.js — Sushi Rush: game loop, state machine, scenes and boot.

import { BIN_ORDER, MAX_MISSED, SHIFT_SECONDS, VIEW_H, VIEW_W, recipeById } from './data.js';
import { SoundFX } from './audio.js';
import { Input } from './input.js';
import { createChef, createStations, interact, moveChef, nearestTarget, updateStations } from './kitchen.js';
import { createOrders, servePlate, updateOrders, updatePopups } from './orders.js';
import { render } from './render.js';

export function createGame() {
  return {
    mode: 'title', // title | playing | over
    time: 0,
    elapsed: 0,
    timeLeft: SHIFT_SECONDS,
    shiftSeconds: SHIFT_SECONDS,
  };
}

export function resetShift(game, chef, stations, orders) {
  game.mode = 'playing';
  game.elapsed = 0;
  game.timeLeft = SHIFT_SECONDS;
  const freshChef = createChef();
  chef.x = freshChef.x;
  chef.y = freshChef.y;
  chef.dir = 1;
  chef.holding = null;
  chef.moving = false;
  const freshStations = createStations();
  stations.cooker = freshStations.cooker;
  stations.board = freshStations.board;
  stations.mat = freshStations.mat;
  stations.plating = freshStations.plating;
  stations.trash = freshStations.trash;
  stations.serve = freshStations.serve;
  const freshOrders = createOrders();
  orders.list = freshOrders.list;
  orders.nextId = freshOrders.nextId;
  orders.spawnIn = freshOrders.spawnIn;
  orders.served = 0;
  orders.missed = 0;
  orders.score = 0;
  orders.combo = 0;
  orders.bestCombo = 0;
  orders.earned = 0;
  orders.popups = [];
}

// Pre-staged states for screenshots: real game state, built with the same objects.
export function seedScene(game, chef, stations, orders, name) {
  resetShift(game, chef, stations, orders);
  if (name === 'title') {
    game.mode = 'title';
    return;
  }
  if (name === 'chop') {
    game.elapsed = 25;
    game.timeLeft = 125;
    orders.list.push(
      { id: 1, recipe: recipeById('tuna-nigiri'), timeLeft: 38, total: 55, born: 10 },
      { id: 2, recipe: recipeById('avocado-maki'), timeLeft: 47, total: 55, born: 22 },
    );
    orders.nextId = 3;
    orders.score = 320;
    orders.served = 2;
    stations.cooker.state = 'cooking';
    stations.cooker.t = 2.4;
    stations.board.state = 'slicing';
    stations.board.item = 'tuna';
    stations.board.t = 1.6;
    chef.x = 553;
    chef.y = 560;
    return;
  }
  if (name === 'serve') {
    game.elapsed = 88;
    game.timeLeft = 62;
    orders.list.push(
      { id: 4, recipe: recipeById('dragon-roll'), timeLeft: 24, total: 55, born: 70 },
      { id: 5, recipe: recipeById('salmon-nigiri'), timeLeft: 41, total: 55, born: 80 },
    );
    orders.nextId = 6;
    orders.score = 980;
    orders.combo = 2;
    orders.served = 6;
    chef.holding = { type: 'plate', contents: recipeById('dragon-roll').parts.map((p) => ({ ...p })) };
    chef.x = 1190;
    chef.y = 240;
    chef.dir = 1;
    orders.popups.push({ text: '+215', x: 1040, y: 250, t: 1.6, color: '#f2b705', big: true });
    return;
  }
  // cover: the busiest, most complete moment.
  game.elapsed = 46;
  game.timeLeft = 104;
  orders.list.push(
    { id: 1, recipe: recipeById('salmon-nigiri'), timeLeft: 32, total: 55, born: 20 },
    { id: 2, recipe: recipeById('dragon-roll'), timeLeft: 18, total: 55, born: 30 },
    { id: 3, recipe: recipeById('avocado-maki'), timeLeft: 41, total: 55, born: 38 },
  );
  orders.nextId = 4;
  orders.score = 1240;
  orders.combo = 3;
  orders.bestCombo = 3;
  orders.served = 5;
  stations.cooker.state = 'ready';
  stations.cooker.t = 3;
  stations.board.state = 'slicing';
  stations.board.item = 'salmon';
  stations.board.t = 1.2;
  stations.mat.items = [
    { ingredient: 'rice', state: 'cooked' },
    { ingredient: 'nori', state: 'raw' },
    { ingredient: 'avocado', state: 'raw' },
  ];
  stations.mat.state = 'rolling';
  stations.mat.recipe = recipeById('avocado-maki');
  stations.mat.t = 1.5;
  stations.plating.plate = { contents: recipeById('salmon-nigiri').parts.map((p) => ({ ...p })) };
  chef.x = 553;
  chef.y = 560;
  chef.dir = 1;
  orders.popups.push({ text: 'SERVED!', x: 1190, y: 266, t: 1.6, color: '#2ecc71', big: false });
}

function boot() {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const sfx = new SoundFX();
  const input = new Input(canvas);
  const game = createGame();
  const chef = createChef();
  const stations = createStations();
  const orders = createOrders();
  let highlight = null;
  let hint = null;
  let hintUntil = 0;
  let lastTickSecond = -1;

  const params = new URLSearchParams(window.location.search);
  const scene = params.get('scene');
  if (scene) {
    seedScene(game, chef, stations, orders, scene);
  } else {
    // A lively kitchen behind the title screen.
    seedScene(game, chef, stations, orders, 'cover');
    game.mode = 'title';
  }

  function showHint(text, error = false, seconds = 2.2) {
    hint = { text, error };
    hintUntil = game.time + seconds;
  }

  function useStation() {
    if (!highlight) return;
    const res = interact(chef, stations, highlight, sfx);
    if (res.result === 'serve') {
      const served = servePlate(orders, chef.holding.contents);
      if (served.result === 'ok') {
        chef.holding = null;
        sfx.serve();
      } else {
        sfx.error();
        showHint('No ticket wants this dish!', true);
      }
      return;
    }
    if (res.result === 'error') {
      sfx.error();
      showHint(res.message, true);
    } else if (res.result === 'ok' && res.message) {
      showHint(res.message, false, 1.4);
    }
  }

  function update(dt) {
    game.time += dt;
    if (hint && game.time > hintUntil) hint = null;

    if (game.mode === 'title') {
      if (input.consumeEnter() || input.consumeClick()) {
        sfx.ensure();
        resetShift(game, chef, stations, orders);
      }
      updateStations(stations, dt, sfx);
      updatePopups(orders, dt);
      return;
    }

    if (game.mode === 'over') {
      if (input.consumeEnter()) {
        sfx.ensure();
        resetShift(game, chef, stations, orders);
      }
      return;
    }

    // playing
    game.elapsed += dt;
    game.timeLeft = Math.max(0, SHIFT_SECONDS - game.elapsed);
    const sec = Math.ceil(game.timeLeft);
    if (sec !== lastTickSecond) {
      lastTickSecond = sec;
      if (sec <= 10 && sec > 0) sfx.tick();
    }

    moveChef(chef, input.axis(), dt);
    highlight = nearestTarget(chef, BIN_ORDER);

    if (input.consumeAction()) useStation();
    const click = input.consumeClick();
    if (click) {
      // Click a nearby bin/station to use it; otherwise walk toward the click.
      // Serve window first: it overlaps the tamago bin's corner.
      const cands = [{ kind: 'serve' }];
      for (const key of Object.keys(stations)) cands.push({ kind: 'station', id: key });
      BIN_ORDER.forEach((id, i) => cands.push({ kind: 'bin', id, index: i }));
      let clicked = null;
      for (const c of cands) {
        let r;
        if (c.kind === 'bin') {
          const w = 1024 / 8;
          r = { x: 244 + c.index * w, y: 124, w, h: 72 };
        } else if (c.kind === 'serve') {
          r = { x: 1112, y: 66, w: 156, h: 130 };
        } else {
          const s = { cooker: [252, 300, 190, 170], board: [458, 300, 190, 170], mat: [664, 300, 190, 170], plating: [870, 300, 190, 170], trash: [1076, 330, 186, 140] }[c.id];
          r = { x: s[0], y: s[1], w: s[2], h: s[3] };
        }
        if (click.x >= r.x && click.x <= r.x + r.w && click.y >= r.y && click.y <= r.y + r.h) {
          clicked = c;
          break;
        }
      }
      if (clicked) {
        highlight = clicked;
        useStation();
      } else {
        // Nudge the chef toward the clicked floor spot.
        const dx = click.x - chef.x;
        const dy = click.y - chef.y;
        const d = Math.hypot(dx, dy);
        if (d > 10) {
          chef.x += (dx / d) * Math.min(d, 60);
          chef.y += (dy / d) * Math.min(d, 60);
        }
      }
    }
    if (input.consumeMute()) {
      sfx.ensure();
      const muted = sfx.toggleMute();
      showHint(muted ? 'Sound OFF' : 'Sound ON', false, 1.2);
    }

    updateStations(stations, dt, sfx);
    const event = updateOrders(orders, dt, game.elapsed);
    if (event === 'orderIn') sfx.orderIn();
    if (event === 'missed') {
      sfx.error();
      showHint('Order missed!', true);
    }
    updatePopups(orders, dt);

    if (orders.missed >= MAX_MISSED || game.timeLeft <= 0) {
      game.mode = 'over';
      sfx.gameOver();
    }
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    update(dt);
    render(ctx, { game, chef, stations, orders, highlight, hint, time: game.time });
    input.endFrame();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

document.addEventListener('DOMContentLoaded', boot);
