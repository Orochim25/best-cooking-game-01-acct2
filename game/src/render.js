// render.js — every pixel of Sushi Rush, plus the no-overflow text system.
//
// TEXT RULE: no string is ever drawn without a max width. fitFont() shrinks the
// font until the string fits its box; drawText() always passes a max width.

import { INGREDIENTS, LAYOUT, MAX_ORDERS, PALETTE, VIEW_H, VIEW_W, recipeById } from './data.js';
import { drawDish, drawIngredientIcon, drawMakiPiece, drawPlate } from './food.js';
import { recipeForPlate } from './orders.js';

const FONT = "'Trebuchet MS', 'Segoe UI', Verdana, sans-serif";

// Shrink the font until text fits maxWidth (never below minSize). Returns the size used.
export function fitFont(ctx, text, maxWidth, size, weight = 'bold', minSize = 8) {
  let s = size;
  ctx.font = `${weight} ${s}px ${FONT}`;
  while (s > minSize && ctx.measureText(text).width > maxWidth) {
    s -= 1;
    ctx.font = `${weight} ${s}px ${FONT}`;
  }
  return s;
}

export function drawText(ctx, text, x, y, maxWidth, size, color, align = 'center', weight = 'bold') {
  const s = fitFont(ctx, text, maxWidth, size, weight);
  ctx.font = `${weight} ${s}px ${FONT}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  return s;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function bar(ctx, x, y, w, h, frac, color, bg = 'rgba(0,0,0,0.25)') {
  ctx.fillStyle = bg;
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fill();
  if (frac > 0) {
    ctx.fillStyle = color;
    roundRect(ctx, x, y, Math.max(h, w * Math.min(1, frac)), h, h / 2);
    ctx.fill();
  }
}

function steam(ctx, x, y, t, n = 3) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const ph = (t * 0.7 + i * 0.35) % 1;
    const yy = y - ph * 26;
    const xx = x + Math.sin(ph * 6 + i * 2) * 4;
    ctx.globalAlpha = 0.7 * (1 - ph);
    ctx.beginPath();
    ctx.moveTo(xx, yy);
    ctx.quadraticCurveTo(xx + 5, yy - 6, xx - 2, yy - 12);
    ctx.stroke();
  }
  ctx.restore();
}

export function render(ctx, S) {
  const { game, chef, stations, orders } = S;
  drawRoom(ctx, S.time);
  drawBelt(ctx, S.time);
  drawServeWindow(ctx, stations, S.highlight, S.time);
  drawBins(ctx, S.highlight);
  drawStations(ctx, stations, S.highlight, S.time);
  drawChef(ctx, chef, S.time);
  drawTickets(ctx, orders, S.time);
  drawHud(ctx, game, orders);
  drawPopups(ctx, orders);
  if (S.hint) drawHint(ctx, S.hint);
  drawControlsLine(ctx);
  if (game.mode === 'title') drawTitle(ctx, S.time);
  if (game.mode === 'over') drawResults(ctx, game, orders);
}

function drawRoom(ctx, t) {
  // Wall.
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // Warm wall glow.
  const g = ctx.createLinearGradient(0, 0, 0, 220);
  g.addColorStop(0, 'rgba(255,190,120,0.16)');
  g.addColorStop(1, 'rgba(255,190,120,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, 220);
  // Wood floor.
  ctx.fillStyle = PALETTE.floor;
  ctx.fillRect(244, 210, 1024, 498);
  ctx.fillStyle = PALETTE.floorLight;
  for (let y = 240; y < 708; y += 56) {
    ctx.fillRect(244, y, 1024, 3);
  }
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  for (let x = 300; x < 1268; x += 96) {
    ctx.fillRect(x, 210, 2, 498);
  }
  drawFloorDecor(ctx, t);
  // Floor props: a runner rug, a barrel, a plant and crates — the floor reads as a kitchen.
function drawFloorDecor(ctx, t) {
  // Red runner rug under the work area.
  ctx.fillStyle = '#8e2f23';
  roundRect(ctx, 280, 500, 950, 140, 8);
  ctx.fill();
  ctx.strokeStyle = '#f2b705';
  ctx.lineWidth = 3;
  roundRect(ctx, 288, 508, 934, 124, 6);
  ctx.stroke();
  ctx.fillStyle = 'rgba(242,183,5,0.25)';
  for (let x = 320; x < 1210; x += 74) {
    ctx.beginPath();
    ctx.arc(x, 570, 9, 0, Math.PI * 2);
    ctx.fill();
  }
  // Wooden barrel, bottom left.
  ctx.fillStyle = '#7a5230';
  ctx.beginPath();
  ctx.ellipse(310, 668, 26, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#935f36';
  ctx.beginPath();
  ctx.ellipse(310, 660, 26, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#3d3d46';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(310, 652, 24, 8, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(310, 672, 25, 8, 0, 0, Math.PI * 2);
  ctx.stroke();
  // Potted plant, bottom right.
  ctx.fillStyle = '#b5502e';
  ctx.beginPath();
  ctx.moveTo(1196, 656);
  ctx.lineTo(1236, 656);
  ctx.lineTo(1230, 690);
  ctx.lineTo(1202, 690);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#2e7d32';
  for (const [lx, ly, lr] of [[1206, 644, 12], [1226, 640, 13], [1216, 628, 12]]) {
    ctx.beginPath();
    ctx.ellipse(lx, ly, lr * 0.6, lr, 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  // Crate stack with bottles, left edge under the cooker.
  ctx.fillStyle = '#a87c3f';
  roundRect(ctx, 258, 596, 52, 44, 4);
  ctx.fill();
  ctx.strokeStyle = '#7a5230';
  ctx.lineWidth = 2;
  roundRect(ctx, 258, 596, 52, 44, 4);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(258, 618);
  ctx.lineTo(310, 618);
  ctx.stroke();
  ctx.fillStyle = '#1f7a6d';
  ctx.fillRect(268, 578, 10, 20);
  ctx.fillStyle = '#c0392b';
  ctx.fillRect(286, 574, 10, 24);
  ctx.fillStyle = '#f2b705';
  ctx.fillRect(302, 580, 8, 18);
}

// Order board backdrop.
  ctx.fillStyle = PALETTE.board;
  ctx.fillRect(12, 66, 220, 642);
  ctx.strokeStyle = PALETTE.boardEdge;
  ctx.lineWidth = 3;
  ctx.strokeRect(12, 66, 220, 642);
  drawText(ctx, 'ORDER BOARD', 122, 88, 196, 19, '#f2b705');
}

function drawBelt(ctx, t) {
  const b = LAYOUT.belt;
  ctx.fillStyle = '#2c2c34';
  roundRect(ctx, b.x, b.y, b.w, b.h, 12);
  ctx.fill();
  ctx.fillStyle = '#3a3a44';
  roundRect(ctx, b.x + 4, b.y + 6, b.w - 8, b.h - 12, 8);
  ctx.fill();
  // Moving plates on the belt.
  for (let i = 0; i < 4; i++) {
    const px = b.x + 60 + (((t * 46 + i * 210) % (b.w - 40)) + (b.w - 40)) % (b.w - 40);
    drawPlate(ctx, px, b.y + b.h / 2 + 2, 26, 9);
    drawIngredientIcon(ctx, ['salmon', 'tuna', 'shrimp', 'avocado'][i], px, b.y + b.h / 2 - 4, 26);
  }
  ctx.fillStyle = '#f2b705';
  ctx.font = `bold 12px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
}

function drawServeWindow(ctx, stations, highlight, t) {
  const s = LAYOUT.serve;
  const hot = highlight && highlight.kind === 'serve';
  const glow = 0.5 + 0.5 * Math.sin(t * 3);
  ctx.save();
  if (hot) {
    ctx.shadowColor = '#f2b705';
    ctx.shadowBlur = 18 + glow * 10;
  }
  ctx.fillStyle = '#7a1f16';
  roundRect(ctx, s.x, s.y, s.w, s.h, 10);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#a93226';
  roundRect(ctx, s.x + 6, s.y + 6, s.w - 12, 62, 8);
  ctx.fill();
  drawText(ctx, 'SERVE', s.x + s.w / 2, s.y + 24, s.w - 20, 20, '#ffe9a8');
  drawText(ctx, 'WINDOW', s.x + s.w / 2, s.y + 48, s.w - 20, 13, '#ffd98a');
  // Bell.
  ctx.fillStyle = '#f2b705';
  ctx.beginPath();
  ctx.arc(s.x + s.w / 2, s.y + 96, 16, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(s.x + s.w / 2 - 20, s.y + 94, 40, 5);
  ctx.fillStyle = '#d9a41f';
  ctx.beginPath();
  ctx.arc(s.x + s.w / 2, s.y + 104, 4, 0, Math.PI * 2);
  ctx.fill();
  // Stack of clean plates.
  for (let i = 0; i < 3; i++) {
    drawPlate(ctx, s.x + 26, s.y + 112 + i * 5, 18, 6);
  }
  if (hot) {
    ctx.strokeStyle = '#f2b705';
    ctx.lineWidth = 3;
    roundRect(ctx, s.x - 3, s.y - 3, s.w + 6, s.h + 6, 12);
    ctx.stroke();
    drawKeyBubble(ctx, s.x + s.w / 2, s.y + s.h + 16, 'E — SERVE');
  }
}

function drawBins(ctx, highlight) {
  const bins = LAYOUT.bins;
  const n = 8;
  const w = bins.w / n;
  const ids = ['rice', 'salmon', 'tuna', 'shrimp', 'nori', 'avocado', 'cucumber', 'tamago'];
  ids.forEach((id, i) => {
    const x = bins.x + i * w;
    const hot = highlight && highlight.kind === 'bin' && highlight.index === i;
    ctx.fillStyle = hot ? '#ffe9a8' : PALETTE.counterTop;
    roundRect(ctx, x + 3, bins.y + 3, w - 6, bins.h - 6, 8);
    ctx.fill();
    ctx.strokeStyle = hot ? '#f2b705' : '#b98d5f';
    ctx.lineWidth = hot ? 3 : 2;
    roundRect(ctx, x + 3, bins.y + 3, w - 6, bins.h - 6, 8);
    ctx.stroke();
    drawIngredientIcon(ctx, id, x + w / 2, bins.y + 28, 34);
    drawText(ctx, INGREDIENTS[id].short, x + w / 2, bins.y + 58, w - 12, 12, PALETTE.ink);
    if (hot) drawKeyBubble(ctx, x + w / 2, bins.y + bins.h + 14, 'E — TAKE');
  });
}

function drawKeyBubble(ctx, x, y, label) {
  const w = 92;
  ctx.fillStyle = 'rgba(20,12,8,0.88)';
  roundRect(ctx, x - w / 2, y - 11, w, 22, 11);
  ctx.fill();
  ctx.strokeStyle = '#f2b705';
  ctx.lineWidth = 1.5;
  roundRect(ctx, x - w / 2, y - 11, w, 22, 11);
  ctx.stroke();
  drawText(ctx, label, x, y + 1, w - 8, 11, '#ffe9a8');
}

function stationShell(ctx, s, hot, title) {
  ctx.fillStyle = '#5d3a24';
  roundRect(ctx, s.x - 4, s.y - 34, s.w + 8, s.h + 38, 10);
  ctx.fill();
  ctx.fillStyle = PALETTE.counterTop;
  roundRect(ctx, s.x, s.y, s.w, s.h, 8);
  ctx.fill();
  ctx.strokeStyle = hot ? '#f2b705' : '#8a6a45';
  ctx.lineWidth = hot ? 3 : 2;
  roundRect(ctx, s.x, s.y, s.w, s.h, 8);
  ctx.stroke();
  drawText(ctx, title, s.x + s.w / 2, s.y - 18, s.w - 8, 15, hot ? '#ffe9a8' : '#e8d5b0');
}

function drawStations(ctx, stations, highlight, t) {
  const L = LAYOUT.stations;
  const hotId = highlight && highlight.kind === 'station' ? highlight.id : null;

  // Rice cooker.
  {
    const s = L.cooker;
    const hot = hotId === 'cooker';
    stationShell(ctx, s, hot, s.label);
    const cx = s.x + s.w / 2;
    const cy = s.y + 78;
    const st = stations.cooker;
    // Pot body.
    ctx.fillStyle = '#3d3d46';
    roundRect(ctx, cx - 58, cy - 18, 116, 62, 12);
    ctx.fill();
    ctx.fillStyle = '#565664';
    roundRect(ctx, cx - 58, cy - 18, 116, 16, 8);
    ctx.fill();
    if (st.state === 'cooking') {
      const frac = st.t / 4;
      steam(ctx, cx, cy - 22, t);
      // Rice mound rising inside the pot.
      ctx.fillStyle = '#f5efe0';
      ctx.beginPath();
      ctx.ellipse(cx, cy - 12, 12 + 28 * frac, 7 + 7 * frac, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fffdf4';
      ctx.beginPath();
      ctx.ellipse(cx, cy - 16, 8 + 18 * frac, 5 + 4 * frac, 0, 0, Math.PI * 2);
      ctx.fill();
      bar(ctx, cx - 44, cy + 56, 88, 10, frac, '#f2b705');
      drawText(ctx, 'COOKING…', cx, cy + 78, s.w - 16, 12, PALETTE.ink);
    } else if (st.state === 'ready') {
      steam(ctx, cx, cy - 22, t);
      ctx.fillStyle = '#fffdf4';
      ctx.beginPath();
      ctx.ellipse(cx, cy - 12, 40, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2ecc71';
      roundRect(ctx, cx - 40, cy + 52, 80, 22, 11);
      ctx.fill();
      drawText(ctx, 'READY!', cx, cy + 63, 76, 13, '#ffffff');
    } else if (st.state === 'burnt') {
      ctx.fillStyle = '#2b2b2b';
      ctx.beginPath();
      ctx.ellipse(cx, cy - 12, 40, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c0392b';
      roundRect(ctx, cx - 40, cy + 52, 80, 22, 11);
      ctx.fill();
      drawText(ctx, 'BURNT!', cx, cy + 63, 76, 13, '#ffffff');
    } else {
      drawText(ctx, 'Put rice in', cx, cy + 62, s.w - 16, 13, PALETTE.muted);
    }
    if (hot) drawKeyBubble(ctx, cx, s.y + s.h + 16, 'E — USE');
  }

  // Cutting board.
  {
    const s = L.board;
    const hot = hotId === 'board';
    stationShell(ctx, s, hot, s.label);
    const cx = s.x + s.w / 2;
    const cy = s.y + 82;
    const st = stations.board;
    ctx.fillStyle = '#c89b6a';
    roundRect(ctx, cx - 70, cy - 34, 140, 76, 8);
    ctx.fill();
    ctx.strokeStyle = '#8a6a45';
    ctx.lineWidth = 2;
    roundRect(ctx, cx - 70, cy - 34, 140, 76, 8);
    ctx.stroke();
    if (st.state === 'slicing') {
      const frac = st.t / 3;
      drawIngredientIcon(ctx, st.item, cx - 18, cy + 2, 44);
      // Animated knife.
      const ky = cy - 30 + Math.sin(t * 14) * 10;
      ctx.save();
      ctx.translate(cx + 38, ky);
      ctx.rotate(0.5);
      ctx.fillStyle = '#dfe6ee';
      ctx.beginPath();
      ctx.roundRect(-6, -26, 12, 34, 3);
      ctx.fill();
      ctx.fillStyle = '#2b1d16';
      ctx.beginPath();
      ctx.roundRect(-5, 8, 10, 16, 3);
      ctx.fill();
      ctx.restore();
      bar(ctx, cx - 44, cy + 56, 88, 10, frac, '#e4572e');
      drawText(ctx, 'SLICING…', cx, cy + 78, s.w - 16, 12, PALETTE.ink);
    } else if (st.state === 'ready') {
      drawIngredientIcon(ctx, st.item, cx, cy + 2, 52);
      ctx.fillStyle = '#2ecc71';
      roundRect(ctx, cx - 40, cy + 52, 80, 22, 11);
      ctx.fill();
      drawText(ctx, 'SLICED!', cx, cy + 63, 76, 13, '#ffffff');
    } else {
      drawText(ctx, 'Put fish here', cx, cy + 62, s.w - 16, 13, PALETTE.muted);
    }
    if (hot) drawKeyBubble(ctx, cx, s.y + s.h + 16, 'E — USE');
  }

  // Rolling mat.
  {
    const s = L.mat;
    const hot = hotId === 'mat';
    stationShell(ctx, s, hot, s.label);
    const cx = s.x + s.w / 2;
    const cy = s.y + 82;
    const st = stations.mat;
    // Bamboo mat stripes.
    ctx.fillStyle = '#d9b06a';
    roundRect(ctx, cx - 70, cy - 30, 140, 66, 8);
    ctx.fill();
    ctx.strokeStyle = '#a87c3f';
    ctx.lineWidth = 2;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + i * 20, cy - 30);
      ctx.lineTo(cx + i * 20, cy + 36);
      ctx.stroke();
    }
    const has = (ing) => st.items.some((i) => i.ingredient === ing);
    if (st.state === 'rolling') {
      const frac = st.t / 3;
      const rx = cx + Math.sin(t * 10) * 3;
      drawMakiPiece(ctx, rx - 22, cy + 2, 13, st.items[2] ? st.items[2].ingredient : 'avocado');
      drawMakiPiece(ctx, rx + 22, cy + 2, 13, st.items[2] ? st.items[2].ingredient : 'avocado');
      bar(ctx, cx - 44, cy + 56, 88, 10, frac, '#e4572e');
      drawText(ctx, 'ROLLING…', cx, cy + 78, s.w - 16, 12, PALETTE.ink);
    } else if (st.state === 'done' && st.recipe) {
      drawDish(ctx, st.recipe, cx, cy + 4, 56);
      ctx.fillStyle = '#2ecc71';
      roundRect(ctx, cx - 40, cy + 52, 80, 22, 11);
      ctx.fill();
      drawText(ctx, 'ROLLED!', cx, cy + 63, 76, 13, '#ffffff');
    } else if (st.items.length === 0) {
      drawText(ctx, 'Rice, nori, filling', cx, cy + 62, s.w - 16, 12, PALETTE.muted);
    } else {
      // Show what is on the mat so far.
      let ix = cx - (st.items.length - 1) * 26;
      for (const item of st.items) {
        drawIngredientIcon(ctx, item.ingredient, ix, cy + 2, 40);
        ix += 52;
      }
      const next = !has('rice') ? 'Needs rice' : !has('nori') ? 'Needs nori'
        : recipeForPlate(st.items) ? 'Press E to roll!' : 'Add a filling';
      drawText(ctx, next, cx, cy + 62, s.w - 16, 12, recipeForPlate(st.items) ? '#1f7a6d' : PALETTE.ink);
    }
    if (hot) drawKeyBubble(ctx, cx, s.y + s.h + 16, 'E — USE');
  }

  // Plating.
  {
    const s = L.plating;
    const hot = hotId === 'plating';
    stationShell(ctx, s, hot, s.label);
    const cx = s.x + s.w / 2;
    const cy = s.y + 82;
    const st = stations.plating;
    if (!st.plate) {
      drawPlate(ctx, cx, cy + 6, 62, 20);
      drawText(ctx, 'Empty plate', cx, cy + 62, s.w - 16, 13, PALETTE.muted);
    } else {
      const recipe = recipeForPlate(st.plate.contents);
      drawPlate(ctx, cx, cy + 14, 62, 20);
      if (recipe) {
        drawDish(ctx, recipe, cx, cy - 2, 56);
        const pulse = 0.6 + 0.4 * Math.sin(t * 5);
        ctx.fillStyle = `rgba(46,204,113,${0.75 + pulse * 0.25})`;
        roundRect(ctx, cx - 62, cy + 52, 124, 24, 12);
        ctx.fill();
        drawText(ctx, 'READY TO SERVE', cx, cy + 64, 120, 12, '#ffffff');
      } else {
        // Partial plate: show its parts.
        let ix = cx - (st.plate.contents.length - 1) * 24;
        for (const c of st.plate.contents) {
          drawIngredientIcon(ctx, c.ingredient, ix, cy - 2, 40);
          ix += 48;
        }
        drawText(ctx, 'Building…', cx, cy + 62, s.w - 16, 12, PALETTE.ink);
      }
    }
    if (hot) drawKeyBubble(ctx, cx, s.y + s.h + 16, 'E — USE');
  }

  // Trash.
  {
    const s = L.trash;
    const hot = hotId === 'trash';
    stationShell(ctx, s, hot, s.label);
    const cx = s.x + s.w / 2;
    const cy = s.y + 62;
    ctx.fillStyle = '#4a4a55';
    roundRect(ctx, cx - 34, cy - 26, 68, 62, 8);
    ctx.fill();
    ctx.fillStyle = '#33333c';
    roundRect(ctx, cx - 40, cy - 34, 80, 14, 6);
    ctx.fill();
    drawText(ctx, 'Drop it here', cx, cy + 56, s.w - 16, 12, PALETTE.muted);
    if (hot) drawKeyBubble(ctx, cx, s.y + s.h + 16, 'E — TRASH');
  }
}

function drawChef(ctx, chef, t) {
  const bob = chef.moving ? Math.sin(t * 12) * 3 : Math.sin(t * 2) * 1.5;
  const x = chef.x;
  const y = chef.y + bob * 0.4;
  ctx.save();
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(x, chef.y + 34, 26, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body (white coat + red apron).
  ctx.fillStyle = '#fdfdfd';
  roundRect(ctx, x - 20, y - 8, 40, 42, 12);
  ctx.fill();
  ctx.fillStyle = '#c0392b';
  roundRect(ctx, x - 14, y + 6, 28, 28, 8);
  ctx.fill();
  // Arms.
  ctx.fillStyle = '#fdfdfd';
  ctx.beginPath();
  ctx.arc(x - 22, y + 8, 8, 0, Math.PI * 2);
  ctx.arc(x + 22, y + 8, 8, 0, Math.PI * 2);
  ctx.fill();
  // Head.
  ctx.fillStyle = '#f2c89b';
  ctx.beginPath();
  ctx.arc(x, y - 20, 15, 0, Math.PI * 2);
  ctx.fill();
  // Chef hat.
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, x - 16, y - 44, 32, 14, 6);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x - 8, y - 44, 9, Math.PI, 0);
  ctx.arc(x + 8, y - 44, 9, Math.PI, 0);
  ctx.fill();
  // Face.
  ctx.fillStyle = '#2b1d16';
  ctx.beginPath();
  ctx.arc(x - 5 + chef.dir * 1, y - 21, 1.8, 0, Math.PI * 2);
  ctx.arc(x + 5 + chef.dir * 1, y - 21, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2b1d16';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x + chef.dir * 1, y - 14, 4, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  // Held item: above the head normally; to the side when the chef is up
  // against the bins row, so it never covers a bin label.
  const h = chef.holding;
  if (h) {
    const hx = chef.y < 320 ? x + 46 : x;
    const hy = chef.y < 320 ? y - 30 : y - 62;
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.beginPath();
    ctx.arc(hx, hy, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d9c48f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(hx, hy, 24, 0, Math.PI * 2);
    ctx.stroke();
    if (h.type === 'plate') {
      const recipe = recipeForPlate(h.contents);
      drawPlate(ctx, hx, hy + 4, 20, 7);
      if (recipe) drawDish(ctx, recipe, hx, hy - 4, 34);
    } else if (h.type === 'roll' && h.recipe) {
      drawDish(ctx, h.recipe, hx, hy, 36);
    } else if (h.type === 'cooked') {
      drawIngredientIcon(ctx, 'rice', hx, hy, 34);
    } else if (h.type === 'sliced') {
      drawIngredientIcon(ctx, h.id, hx, hy, 34);
    } else if (h.type === 'raw') {
      drawIngredientIcon(ctx, h.id, hx, hy, 34);
    }
  }
  ctx.restore();
}

function drawTickets(ctx, orders, t) {
  const b = LAYOUT.board;
  const slotH = 196;
  const gap = 10;
  orders.list.forEach((o, i) => {
    const y = b.y + 34 + i * (slotH + gap);
    const x = b.x + 10;
    const w = b.w - 20;
    const urgent = o.timeLeft < 12;
    const flash = urgent ? 0.5 + 0.5 * Math.sin(t * 6) : 0;
    ctx.fillStyle = PALETTE.ticket;
    roundRect(ctx, x, y, w, slotH, 10);
    ctx.fill();
    ctx.strokeStyle = urgent ? `rgba(192,57,43,${0.5 + flash * 0.5})` : PALETTE.ticketEdge;
    ctx.lineWidth = urgent ? 3 : 2;
    roundRect(ctx, x, y, w, slotH, 10);
    ctx.stroke();
    // Header stripe.
    ctx.fillStyle = '#c0392b';
    roundRect(ctx, x, y, w, 30, 10);
    ctx.fill();
    ctx.fillRect(x, y + 20, w, 10);
    drawText(ctx, `#${o.id}`, x + 10, y + 16, 44, 14, '#ffe9a8', 'left');
    drawText(ctx, `${Math.ceil(o.timeLeft)}s`, x + w - 10, y + 16, 52, 15, '#ffffff', 'right');
    // Recipe name — fitted, never overflows the ticket.
    drawText(ctx, o.recipe.name, x + w / 2, y + 52, w - 16, 18, PALETTE.ink);
    drawText(ctx, o.recipe.kind === 'nigiri' ? 'NIGIRI' : 'MAKI ROLL', x + w / 2, y + 74, w - 16, 11, PALETTE.muted, 'center', 'normal');
    // Parts as icons.
    const parts = o.recipe.parts;
    const iw = Math.min(46, (w - 24) / parts.length - 4);
    let px = x + w / 2 - ((parts.length - 1) * (iw + 4)) / 2;
    for (const p of parts) {
      drawIngredientIcon(ctx, p.ingredient, px, y + 112, iw);
      px += iw + 4;
    }
    // Timer bar.
    const frac = o.timeLeft / o.total;
    const color = frac > 0.5 ? '#2ecc71' : frac > 0.25 ? '#f2b705' : '#c0392b';
    bar(ctx, x + 12, y + slotH - 26, w - 24, 12, frac, color);
    drawText(ctx, frac > 0.25 ? 'FRESH' : 'HURRY!', x + w / 2, y + slotH - 8, w - 24, 10, urgent ? '#c0392b' : PALETTE.muted);
  });
  // Empty slots.
  for (let i = orders.list.length; i < MAX_ORDERS; i++) {
    const y = b.y + 34 + i * (slotH + gap);
    const x = b.x + 10;
    const w = b.w - 20;
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    roundRect(ctx, x, y, w, slotH, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 2;
    roundRect(ctx, x, y, w, slotH, 10);
    ctx.stroke();
    ctx.setLineDash([]);
    drawText(ctx, 'WAITING…', x + w / 2, y + slotH / 2, w - 20, 14, 'rgba(255,255,255,0.4)');
  }
}

function drawHud(ctx, game, orders) {
  const h = LAYOUT.hud;
  ctx.fillStyle = '#1d130c';
  ctx.fillRect(h.x, h.y, h.w, h.h);
  ctx.fillStyle = '#c0392b';
  ctx.fillRect(0, h.h - 4, VIEW_W, 4);
  drawText(ctx, 'SUSHI RUSH', 16, h.h / 2, 190, 26, '#f2b705', 'left');
  drawText(ctx, 'OMAKASE BAR', 210, h.h / 2 + 2, 130, 12, '#e8d5b0', 'left', 'normal');
  // Score block.
  drawText(ctx, 'SCORE', 400, 16, 90, 11, '#b8a88f');
  drawText(ctx, `${orders.score}`, 400, 38, 110, 22, '#ffffff');
  drawText(ctx, 'COMBO', 510, 16, 90, 11, '#b8a88f');
  drawText(ctx, orders.combo > 1 ? `x${orders.combo}` : '—', 510, 38, 90, 22, orders.combo > 1 ? '#f2b705' : '#ffffff');
  drawText(ctx, 'SERVED', 610, 16, 90, 11, '#b8a88f');
  drawText(ctx, `${orders.served}`, 610, 38, 90, 22, '#2ecc71');
  drawText(ctx, 'MISSED', 700, 16, 90, 11, '#b8a88f');
  drawText(ctx, `${orders.missed} / 3`, 700, 38, 90, 22, orders.missed > 0 ? '#e74c3c' : '#ffffff');
  // Shift timer.
  const left = Math.max(0, game.timeLeft);
  const mm = Math.floor(left / 60);
  const ss = Math.floor(left % 60).toString().padStart(2, '0');
  const frac = left / game.shiftSeconds;
  bar(ctx, 800, 14, 220, 12, frac, frac > 0.3 ? '#2ecc71' : '#e74c3c', 'rgba(255,255,255,0.15)');
  drawText(ctx, `SHIFT  ${mm}:${ss}`, 910, 40, 220, 17, frac > 0.3 ? '#ffffff' : '#ff9d8a');
  drawText(ctx, 'M — SOUND', 1060, h.h / 2, 110, 11, '#b8a88f', 'left', 'normal');
  drawText(ctx, 'E — USE', 1170, h.h / 2, 90, 11, '#b8a88f', 'left', 'normal');
}

function drawPopups(ctx, orders) {
  for (const p of orders.popups) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, p.t);
    drawText(ctx, p.text, p.x, p.y, 220, p.big ? 26 : 17, p.color);
    ctx.restore();
  }
}

function drawHint(ctx, hint) {
  const w = 460;
  const x = VIEW_W / 2;
  const y = VIEW_H - 26;
  ctx.fillStyle = 'rgba(20,12,8,0.85)';
  roundRect(ctx, x - w / 2, y - 16, w, 32, 16);
  ctx.fill();
  ctx.strokeStyle = '#f2b705';
  ctx.lineWidth = 1.5;
  roundRect(ctx, x - w / 2, y - 16, w, 32, 16);
  ctx.stroke();
  drawText(ctx, hint.text, x, y + 1, w - 20, 14, hint.error ? '#ff9d8a' : '#ffe9a8');
}

function drawControlsLine(ctx) {
  // Text centre 16px above the canvas bottom: the whole line (11px font,
  // 'middle' baseline) stays inside the canvas with clear padding.
  drawText(ctx, 'WASD / ARROWS — move    •    E — use station    •    M — mute', VIEW_W / 2 + 120, VIEW_H - 16, 640, 11, 'rgba(255,255,255,0.45)', 'center', 'normal');
}

function drawTitle(ctx, t) {
  ctx.fillStyle = 'rgba(15,8,5,0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // Title card.
  const cx = VIEW_W / 2;
  ctx.fillStyle = '#fdf6e3';
  roundRect(ctx, cx - 330, 108, 660, 500, 18);
  ctx.fill();
  ctx.strokeStyle = '#c0392b';
  ctx.lineWidth = 4;
  roundRect(ctx, cx - 330, 108, 660, 500, 18);
  ctx.stroke();
  drawText(ctx, 'SUSHI RUSH', cx, 168, 620, 64, '#c0392b');
  drawText(ctx, '— OMAKASE BAR —', cx, 214, 400, 20, '#7a6a58', 'center', 'normal');
  // Mini food row.
  drawDish(ctx, recipeById('salmon-nigiri'), cx - 150, 268, 52);
  drawDish(ctx, recipeById('dragon-roll'), cx, 268, 52);
  drawDish(ctx, recipeById('avocado-maki'), cx + 150, 268, 52);
  const lines = [
    'Run the sushi bar: cook rice, slice fish, roll maki,',
    'plate the dish and serve it before the ticket expires.',
    'Three missed orders end the shift.',
  ];
  lines.forEach((line, i) => {
    drawText(ctx, line, cx, 322 + i * 26, 600, 16, PALETTE.ink, 'center', 'normal');
  });
  drawText(ctx, 'WASD / ARROWS — move   •   E — use station', cx, 428, 600, 15, PALETTE.ink);
  drawText(ctx, 'Click a station to use it too   •   M — mute', cx, 454, 600, 15, PALETTE.ink);
  const pulse = 0.6 + 0.4 * Math.sin(t * 4);
  ctx.fillStyle = `rgba(192,57,43,${0.7 + pulse * 0.3})`;
  roundRect(ctx, cx - 150, 500, 300, 52, 26);
  ctx.fill();
  drawText(ctx, 'PRESS ENTER TO START', cx, 527, 280, 18, '#ffffff');
  drawText(ctx, '150-second shift  •  7 recipes  •  Combo pays extra', cx, 580, 560, 13, PALETTE.muted, 'center', 'normal');
}

function drawResults(ctx, game, orders) {
  ctx.fillStyle = 'rgba(15,8,5,0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const cx = VIEW_W / 2;
  ctx.fillStyle = '#fdf6e3';
  roundRect(ctx, cx - 300, 130, 600, 460, 18);
  ctx.fill();
  ctx.strokeStyle = '#c0392b';
  ctx.lineWidth = 4;
  roundRect(ctx, cx - 300, 130, 600, 460, 18);
  ctx.stroke();
  const ok = orders.missed < 3;
  drawText(ctx, ok ? 'SHIFT COMPLETE!' : 'SHIFT OVER', cx, 190, 560, 44, ok ? '#1f7a6d' : '#c0392b');
  drawText(ctx, ok ? 'The bar is closed — great service, chef!' : 'Three orders missed — the rush won today.', cx, 232, 540, 15, PALETTE.muted, 'center', 'normal');
  const rows = [
    ['DISHES SERVED', `${orders.served}`],
    ['ORDERS MISSED', `${orders.missed}`],
    ['BEST COMBO', orders.bestCombo > 1 ? `x${orders.bestCombo}` : '—'],
    ['FINAL SCORE', `${orders.score}`],
  ];
  rows.forEach(([label, value], i) => {
    const y = 300 + i * 46;
    drawText(ctx, label, cx - 190, y, 260, 17, PALETTE.muted, 'left', 'normal');
    drawText(ctx, value, cx + 190, y, 220, 22, PALETTE.ink, 'right');
    if (i < rows.length - 1) {
      ctx.strokeStyle = '#e8dcc0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - 260, y + 22);
      ctx.lineTo(cx + 260, y + 22);
      ctx.stroke();
    }
  });
  const pulse = 0.6 + 0.4 * Math.sin(game.time * 4);
  ctx.fillStyle = `rgba(192,57,43,${0.7 + pulse * 0.3})`;
  roundRect(ctx, cx - 150, 500, 300, 52, 26);
  ctx.fill();
  drawText(ctx, 'PRESS ENTER — PLAY AGAIN', cx, 527, 280, 17, '#ffffff');
}
