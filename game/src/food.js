// food.js — all food art, drawn in canvas: nigiri, maki rolls, ingredients.

import { INGREDIENTS } from './data.js';

function circle(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function ellipse(ctx, x, y, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

// A single ingredient icon, centred at (x, y) inside a box of size s.
export function drawIngredientIcon(ctx, id, x, y, s) {
  const ing = INGREDIENTS[id];
  if (!ing) return;
  ctx.save();
  ctx.translate(x, y);
  const u = s / 48;
  if (id === 'rice') {
    ellipse(ctx, 0, 6 * u, 17 * u, 9 * u, '#f5efe0');
    ellipse(ctx, 0, 2 * u, 14 * u, 7 * u, '#fffdf4');
    ctx.fillStyle = '#d8cdb2';
    for (const [gx, gy] of [[-8, 4], [2, 7], [9, 2], [-2, -1], [6, 5]]) {
      circle(ctx, gx * u, gy * u, 1.6 * u, '#d8cdb2');
    }
    // steam
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 1.6 * u;
    ctx.beginPath();
    ctx.moveTo(-6 * u, -8 * u);
    ctx.quadraticCurveTo(-9 * u, -14 * u, -5 * u, -19 * u);
    ctx.moveTo(5 * u, -8 * u);
    ctx.quadraticCurveTo(8 * u, -14 * u, 4 * u, -19 * u);
    ctx.stroke();
  } else if (id === 'salmon' || id === 'tuna') {
    ctx.rotate(-0.35);
    ellipse(ctx, 0, 0, 19 * u, 9 * u, ing.color);
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 1.8 * u;
    for (const off of [-9, -3, 3, 9]) {
      ctx.beginPath();
      ctx.moveTo(off * u, -7 * u);
      ctx.lineTo((off + 4) * u, 7 * u);
      ctx.stroke();
    }
    ellipse(ctx, -6 * u, -3 * u, 6 * u, 3 * u, 'rgba(255,255,255,0.35)');
  } else if (id === 'shrimp') {
    ctx.strokeStyle = ing.color;
    ctx.lineWidth = 6 * u;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, 2 * u, 12 * u, Math.PI * 0.15, Math.PI * 1.15);
    ctx.stroke();
    ctx.strokeStyle = ing.dark;
    ctx.lineWidth = 1.6 * u;
    for (const a of [0.4, 0.7, 1.0]) {
      ctx.beginPath();
      ctx.moveTo(Math.cos(a * Math.PI) * 12 * u, 2 * u + Math.sin(a * Math.PI) * 12 * u);
      ctx.lineTo(Math.cos(a * Math.PI) * 6 * u, 2 * u + Math.sin(a * Math.PI) * 6 * u);
      ctx.stroke();
    }
    circle(ctx, 12 * u, -6 * u, 3 * u, ing.color);
  } else if (id === 'nori') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.roundRect(-16 * u, -12 * u, 32 * u, 24 * u, 3 * u);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1.2 * u;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo((i * 6) * u, -12 * u);
      ctx.lineTo((i * 6) * u, 12 * u);
      ctx.stroke();
    }
  } else if (id === 'avocado') {
    ellipse(ctx, 0, 2 * u, 13 * u, 16 * u, ing.color);
    ellipse(ctx, 0, 2 * u, 9 * u, 12 * u, '#c9e39a');
    circle(ctx, 0, 5 * u, 5.5 * u, '#7a5a2e');
    circle(ctx, 0, 5 * u, 3 * u, '#5d4220');
  } else if (id === 'cucumber') {
    for (const [cx, cy] of [[-8, -4], [8, -4], [0, 8]]) {
      circle(ctx, cx * u, cy * u, 8 * u, '#5da24e');
      circle(ctx, cx * u, cy * u, 5.5 * u, '#b8e6a0');
      ctx.fillStyle = '#e9f7d9';
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2;
        circle(ctx, cx * u + Math.cos(a) * 2.6 * u, cy * u + Math.sin(a) * 2.6 * u, 0.9 * u, '#e9f7d9');
      }
    }
  } else if (id === 'tamago') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.roundRect(-17 * u, -9 * u, 34 * u, 18 * u, 4 * u);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.roundRect(-17 * u, -9 * u, 34 * u, 6 * u, 4 * u);
    ctx.fill();
    ctx.strokeStyle = ing.dark;
    ctx.lineWidth = 1.4 * u;
    ctx.beginPath();
    ctx.moveTo(-6 * u, -9 * u);
    ctx.lineTo(-6 * u, 9 * u);
    ctx.moveTo(6 * u, -9 * u);
    ctx.lineTo(6 * u, 9 * u);
    ctx.stroke();
  }
  ctx.restore();
}

// One maki roll piece (cross-section): nori ring, rice, filling centre.
export function drawMakiPiece(ctx, x, y, r, fillingId) {
  circle(ctx, x, y, r, '#223d1e');
  circle(ctx, x, y, r * 0.78, '#f5efe0');
  const f = INGREDIENTS[fillingId];
  if (f) {
    if (fillingId === 'avocado') {
      circle(ctx, x, y, r * 0.34, '#8fbf4d');
      circle(ctx, x, y, r * 0.16, '#5d8a2e');
    } else if (fillingId === 'cucumber') {
      circle(ctx, x, y, r * 0.34, '#7cc46a');
      circle(ctx, x, y, r * 0.2, '#d9f2c0');
    } else if (fillingId === 'shrimp') {
      circle(ctx, x, y, r * 0.34, '#ff9d8a');
      circle(ctx, x, y, r * 0.16, '#e5705c');
    } else {
      circle(ctx, x, y, r * 0.3, f.color);
    }
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
}

// A finished dish on a plate, centred at (x, y), drawn at scale s (48 = standard).
export function drawDish(ctx, recipe, x, y, s) {
  const u = s / 48;
  ctx.save();
  ctx.translate(x, y);
  if (recipe.kind === 'nigiri') {
    // Rice mound.
    ellipse(ctx, 0, 8 * u, 20 * u, 9 * u, '#f5efe0');
    ellipse(ctx, 0, 4 * u, 16 * u, 7 * u, '#fffdf4');
    // Fish on top.
    const fishId = recipe.parts.find((p) => p.ingredient !== 'rice').ingredient;
    const ing = INGREDIENTS[fishId];
    if (fishId === 'tamago') {
      ctx.fillStyle = '#f7c948';
      ctx.beginPath();
      ctx.roundRect(-19 * u, -6 * u, 38 * u, 12 * u, 4 * u);
      ctx.fill();
      ctx.fillStyle = '#2e4d2a';
      ctx.fillRect(-3 * u, -6 * u, 6 * u, 12 * u);
    } else {
      ctx.save();
      ctx.rotate(-0.12);
      ellipse(ctx, 0, -2 * u, 21 * u, 9 * u, ing.color);
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = 1.8 * u;
      for (const off of [-11, -4, 3, 10]) {
        ctx.beginPath();
        ctx.moveTo(off * u, -9 * u);
        ctx.lineTo((off + 4) * u, 5 * u);
        ctx.stroke();
      }
      ctx.restore();
    }
  } else {
    // Maki: a row of three pieces + one standing piece.
    drawMakiPiece(ctx, -16 * u, 6 * u, 11 * u, recipe.parts[2] ? recipe.parts[2].ingredient : 'avocado');
    drawMakiPiece(ctx, 0, 6 * u, 11 * u, recipe.parts[2] ? recipe.parts[2].ingredient : 'avocado');
    drawMakiPiece(ctx, 16 * u, 6 * u, 11 * u, recipe.parts[2] ? recipe.parts[2].ingredient : 'avocado');
    if (recipe.id === 'dragon-roll') {
      // Avocado fan on top.
      ctx.fillStyle = '#8fbf4d';
      for (let i = 0; i < 4; i++) {
        ellipse(ctx, (-12 + i * 8) * u, -6 * u, 5 * u, 8 * u, '#8fbf4d');
      }
    }
  }
  ctx.restore();
}

// A white plate ellipse under a dish.
export function drawPlate(ctx, x, y, rx, ry) {
  ellipse(ctx, x, y, rx, ry, '#ffffff');
  ellipse(ctx, x, y, rx * 0.72, ry * 0.72, '#eef1f5');
  ctx.strokeStyle = '#c9d2dc';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
}
