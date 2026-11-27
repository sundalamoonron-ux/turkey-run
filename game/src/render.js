// Turkey Run — Render: everything the eye sees. The farmyard, barn and
// kitchen backdrops, the oven, haystacks, corn, knives, the escape gate,
// the HUD (score, distance, lives, stage, dash) and the alert banners.
// All art is drawn with canvas paths — no image files at all.

import { ARENA, ESCAPE_DISTANCE, TURKEY } from './config.js';

function drawFence(ctx, palette, y) {
  ctx.fillStyle = palette.fence;
  for (let x = 20; x < ARENA.width; x += 46) {
    ctx.fillRect(x, y, 6, 34);
  }
  ctx.fillRect(0, y + 6, ARENA.width, 5);
  ctx.fillRect(0, y + 22, ARENA.width, 5);
}

function drawHaystack(ctx, hay) {
  ctx.save();
  ctx.translate(hay.x, hay.y);
  ctx.fillStyle = '#d9a441';
  ctx.beginPath();
  ctx.ellipse(0, 4, hay.radius, hay.radius * 0.62, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8bc55';
  ctx.beginPath();
  ctx.ellipse(-6, -2, hay.radius * 0.7, hay.radius * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#b57f22';
  ctx.lineWidth = 2;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 10, -14 - Math.abs(i) * 2);
    ctx.lineTo(i * 12, 12);
    ctx.stroke();
  }
  ctx.restore();
}

function drawOven(ctx, oven, time) {
  ctx.save();
  // Heat shimmer: a pulsing orange glow around the oven mouth.
  const glow = ctx.createRadialGradient(
    oven.x + oven.width / 2, oven.y + oven.height / 2, 6,
    oven.x + oven.width / 2, oven.y + oven.height / 2, 90,
  );
  const pulse = 0.16 + Math.sin(time * 4) * 0.05;
  glow.addColorStop(0, `rgba(255, 120, 30, ${pulse + 0.14})`);
  glow.addColorStop(1, 'rgba(255, 120, 30, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(oven.x - 80, oven.y - 80, oven.width + 160, oven.height + 160);

  // The oven body and its dark, fiery mouth.
  ctx.fillStyle = '#4a4a52';
  ctx.fillRect(oven.x, oven.y, oven.width, oven.height);
  ctx.fillStyle = '#2c2c33';
  ctx.fillRect(oven.x + 6, oven.y + 10, oven.width - 12, oven.height - 20);
  ctx.fillStyle = '#ff7a1e';
  ctx.beginPath();
  ctx.moveTo(oven.x + 10, oven.y + oven.height - 14);
  ctx.quadraticCurveTo(oven.x + oven.width / 2, oven.y + 26 + Math.sin(time * 6) * 4, oven.x + oven.width - 10, oven.y + oven.height - 14);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffd24a';
  ctx.beginPath();
  ctx.moveTo(oven.x + 14, oven.y + oven.height - 14);
  ctx.quadraticCurveTo(oven.x + oven.width / 2, oven.y + 40, oven.x + oven.width - 14, oven.y + oven.height - 14);
  ctx.closePath();
  ctx.fill();
  // A warning sign above the oven mouth.
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('HOT!', oven.x + oven.width / 2, oven.y - 8);
  ctx.restore();
}

function drawCorn(ctx, cob, time) {
  const bob = Math.sin(cob.bob + time) * 2;
  ctx.save();
  ctx.translate(cob.x, cob.y + bob);
  ctx.rotate(-0.5);
  ctx.fillStyle = '#ffd24a';
  ctx.beginPath();
  ctx.ellipse(0, 0, 6, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8a13a';
  for (let row = -2; row <= 2; row++) {
    for (let col = -1; col <= 1; col++) {
      ctx.beginPath();
      ctx.arc(col * 3.4, row * 4.4, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.fillStyle = '#6d9c42';
  ctx.beginPath();
  ctx.ellipse(-5, 8, 3, 7, 0.5, 0, Math.PI * 2);
  ctx.ellipse(5, 8, 3, 7, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawGoldenFeather(ctx, feather, time) {
  ctx.save();
  ctx.translate(feather.x, feather.y + Math.sin(time * 2) * 3);
  ctx.rotate(Math.sin(time * 1.4) * 0.4);
  ctx.fillStyle = '#fff2b0';
  ctx.beginPath();
  ctx.ellipse(0, 0, 5, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d9a441';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, -12);
  ctx.lineTo(0, 14);
  ctx.stroke();
  ctx.restore();
}

function drawThrownKnife(ctx, knife) {
  ctx.save();
  ctx.translate(knife.x, knife.y);
  ctx.rotate(knife.angle);
  ctx.fillStyle = '#c8ccd4';
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.lineTo(-6, -4);
  ctx.lineTo(-10, 0);
  ctx.lineTo(-6, 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#5a3a1a';
  ctx.fillRect(-16, -3, 8, 6);
  ctx.restore();
}

function drawFallingKnife(ctx, knife) {
  if (knife.warn > 0) {
    // Telegraph: a red shadow where the knife is about to land.
    ctx.save();
    ctx.globalAlpha = 0.35 + Math.sin(performance.now() / 60) * 0.15;
    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.ellipse(knife.x, 600 - 30, 16, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }
  ctx.save();
  ctx.translate(knife.x, knife.y);
  ctx.rotate(Math.PI / 2);
  ctx.fillStyle = '#c8ccd4';
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.lineTo(-6, -4);
  ctx.lineTo(-10, 0);
  ctx.lineTo(-6, 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#5a3a1a';
  ctx.fillRect(-16, -3, 8, 6);
  ctx.restore();
}

export function drawBackdrop(ctx, stage, time) {
  const palette = stage.palette;
  ctx.fillStyle = palette.grass;
  ctx.fillRect(0, 0, ARENA.width, ARENA.height);
  // Mown stripes across the yard, darker every other band.
  ctx.fillStyle = palette.grassDark;
  for (let y = 60; y < ARENA.height; y += 72) {
    ctx.fillRect(0, y, ARENA.width, 36);
  }
  // Scattered autumn leaves.
  ctx.fillStyle = 'rgba(217, 122, 31, 0.5)';
  for (let i = 0; i < 26; i++) {
    const x = (i * 173 + 40) % ARENA.width;
    const y = 70 + ((i * 97) % (ARENA.height - 100));
    ctx.beginPath();
    ctx.ellipse(x, y, 5, 3, (i % 5) * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
  if (stage.id === 'kitchen') {
    // The kitchen: checkerboard tiles over the yard.
    ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
    for (let ty = 46; ty < ARENA.height; ty += 48) {
      for (let tx = 0; tx < ARENA.width; tx += 48) {
        if (((tx + ty) / 48) % 2 === 0) ctx.fillRect(tx, ty, 48, 48);
      }
    }
    // A kitchen table with a pumpkin pie, waiting for a turkey.
    ctx.fillStyle = '#7a4a21';
    ctx.fillRect(390, 90, 180, 16);
    ctx.fillStyle = '#5a3416';
    ctx.fillRect(400, 106, 10, 34);
    ctx.fillRect(550, 106, 10, 34);
    ctx.fillStyle = '#e08a2e';
    ctx.beginPath();
    ctx.ellipse(480, 86, 34, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c96a1e';
    ctx.beginPath();
    ctx.ellipse(480, 82, 26, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (stage.id === 'barn') {
    // The barn: wooden planks along the top wall and a hay loft door.
    ctx.fillStyle = '#8a5a28';
    ctx.fillRect(0, 46, ARENA.width, 26);
    ctx.fillStyle = '#6e4520';
    for (let x = 0; x < ARENA.width; x += 34) ctx.fillRect(x, 46, 3, 26);
    ctx.fillStyle = '#4a2e12';
    ctx.fillRect(430, 46, 100, 60);
    ctx.strokeStyle = '#d9a441';
    ctx.lineWidth = 3;
    ctx.strokeRect(430, 46, 100, 60);
  }
  // Fences along the north and south edges (the gate replaces a fence
  // panel on the east side when it opens).
  drawFence(ctx, palette, 52);
  drawFence(ctx, palette, ARENA.height - 40);
}

export function drawWorld(ctx, world, stage, time) {
  for (const hay of world.haystacks) drawHaystack(ctx, hay);
  for (const oven of world.ovens) drawOven(ctx, oven, time);
  for (const cob of world.corn) drawCorn(ctx, cob, time);
  for (const feather of world.feathers) drawGoldenFeather(ctx, feather, time);

  // The escape gate: a glowing gap in the east fence once the run is long
  // enough, with an arrow pointing the turkey home.
  if (world.gateOpen) {
    const gate = world.gate;
    const pulse = 0.55 + Math.sin(time * 5) * 0.2;
    ctx.save();
    ctx.fillStyle = `rgba(120, 220, 120, ${pulse})`;
    ctx.fillRect(gate.x, gate.y - gate.height / 2, gate.width, gate.height);
    ctx.fillStyle = '#2e7d32';
    ctx.font = 'bold 15px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.save();
    ctx.translate(gate.x + 11, gate.y);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('ESCAPE!', 0, 4);
    ctx.restore();
    ctx.restore();
    ctx.fillStyle = '#2e7d32';
    ctx.beginPath();
    ctx.moveTo(gate.x - 34, gate.y);
    ctx.lineTo(gate.x - 14, gate.y - 10);
    ctx.lineTo(gate.x - 14, gate.y + 10);
    ctx.closePath();
    ctx.fill();
  }

  for (const knife of world.knives) drawThrownKnife(ctx, knife);
  for (const knife of world.fallingKnives) drawFallingKnife(ctx, knife);

  // Particles: feather bursts, corn sparkles, dash dust.
  for (const p of world.particles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Floating score popups.
  ctx.save();
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'center';
  for (const popup of world.popups) {
    ctx.globalAlpha = Math.min(1, popup.life);
    ctx.fillStyle = popup.color;
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 3;
    ctx.strokeText(popup.text, popup.x, popup.y);
    ctx.fillText(popup.text, popup.x, popup.y);
  }
  ctx.restore();
}

export function drawHud(ctx, game) {
  // Top bar: score, distance, lives, stage and the run to the gate.
  ctx.save();
  ctx.fillStyle = 'rgba(43, 26, 16, 0.85)';
  ctx.fillRect(0, 0, ARENA.width, 46);
  ctx.fillStyle = '#c98a3d';
  ctx.fillRect(0, 46, ARENA.width, 3);

  ctx.font = 'bold 17px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffd27a';
  ctx.fillText(`SCORE ${game.score}`, 16, 30);
  ctx.fillStyle = '#fff';
  ctx.fillText(`DISTANCE ${Math.floor(game.distance)} m`, 210, 30);
  ctx.fillStyle = '#f3d9a4';
  ctx.fillText(game.stage.name, 430, 30);

  // Lives as little red hearts.
  for (let i = 0; i < TURKEY.startLives; i++) {
    const x = 620 + i * 30;
    const y = 24;
    ctx.fillStyle = i < game.turkey.lives ? '#e74c3c' : 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    ctx.moveTo(x, y + 7);
    ctx.bezierCurveTo(x - 11, y - 3, x - 6, y - 11, x, y - 4);
    ctx.bezierCurveTo(x + 6, y - 11, x + 11, y - 3, x, y + 7);
    ctx.fill();
  }

  // Dash cooldown pip.
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(720, 14, 70, 10);
  ctx.fillStyle = game.turkey.dashReady ? '#7fd07f' : '#ffd27a';
  ctx.fillRect(720, 14, 70 * game.turkey.dashFraction, 10);
  ctx.fillStyle = '#fff';
  ctx.font = '12px Georgia, serif';
  ctx.fillText('DASH', 720, 40);

  // Progress bar to the escape gate.
  const progress = Math.min(1, game.distance / ESCAPE_DISTANCE);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(810, 14, 130, 10);
  ctx.fillStyle = '#7fd07f';
  ctx.fillRect(810, 14, 130 * progress, 10);
  ctx.fillStyle = '#fff';
  ctx.fillText('GATE', 810, 40);
  ctx.restore();

  // Alert banners, centred under the HUD.
  ctx.save();
  ctx.font = 'bold 22px Georgia, serif';
  ctx.textAlign = 'center';
  if (game.farmer.state === 'chase' && !game.turkey.hidden) {
    ctx.fillStyle = '#c0392b';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 5;
    ctx.strokeText('SPOTTED! RUN!', ARENA.width / 2, 86);
    ctx.fillText('SPOTTED! RUN!', ARENA.width / 2, 86);
  } else if (game.turkey.hidden) {
    ctx.fillStyle = '#2e7d32';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 5;
    ctx.strokeText('HIDDEN IN THE HAY…', ARENA.width / 2, 86);
    ctx.fillText('HIDDEN IN THE HAY…', ARENA.width / 2, 86);
  } else if (game.farmer.state === 'search') {
    ctx.fillStyle = '#d98a1e';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 5;
    ctx.strokeText('THE FARMER IS SEARCHING…', ARENA.width / 2, 86);
    ctx.fillText('THE FARMER IS SEARCHING…', ARENA.width / 2, 86);
  }
  ctx.restore();
}
