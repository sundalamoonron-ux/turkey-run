// Turkey Run — Main: boot, the fixed-step loop, the screen state machine
// (title → playing → caught / escaped), scoring, and the title and end
// screens. This is the file the page loads; every other file does one job.

import { ARENA, SCORE, ESCAPE_DISTANCE, stageForDistance } from './config.js';
import { SoundEngine } from './audio.js';
import { Input } from './input.js';
import { Turkey } from './turkey.js';
import { Farmer } from './farmer.js';
import { World } from './world.js';
import { drawBackdrop, drawWorld, drawHud } from './render.js';
import { stageShotScene } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const sounds = new SoundEngine();
const input = new Input(canvas);
const turkey = new Turkey();
const farmer = new Farmer();
const world = new World();

const GAME_STATE = { TITLE: 'title', PLAYING: 'playing', CAUGHT: 'caught', ESCAPED: 'escaped', PAUSED: 'paused' };

const game = {
  state: GAME_STATE.TITLE,
  score: 0,
  distance: 0,
  stage: stageForDistance(0).stage,
  stageIndex: 0,
  bestScore: 0,
  time: 0,
  stageFlash: 0,
  stageFlashText: '',
  message: '',
  messageTime: 0,
  muted: false,
  posed: false,
  turkey,
  farmer,
  world,
};

try {
  game.bestScore = Number(window.localStorage.getItem('turkey-run-best') || 0) || 0;
} catch {
  game.bestScore = 0;
}

function saveBest() {
  if (game.score > game.bestScore) {
    game.bestScore = game.score;
    try {
      window.localStorage.setItem('turkey-run-best', String(game.bestScore));
    } catch {
      // Private browsing or file://: the best score just lives in memory.
    }
  }
}

function startRun() {
  turkey.reset();
  farmer.reset();
  world.reset(0);
  game.score = 0;
  game.distance = 0;
  game.stage = stageForDistance(0).stage;
  game.stageIndex = 0;
  game.stageFlash = 0;
  game.message = '';
  game.state = GAME_STATE.PLAYING;
  sounds.ensureContext();
  sounds.startMusic();
  sounds.gobble();
  showMessage('RUN! THE FARMER IS COMING!', 2.2);
}

function endRun(escaped) {
  game.state = escaped ? GAME_STATE.ESCAPED : GAME_STATE.CAUGHT;
  if (escaped) game.score += SCORE.escape;
  saveBest();
  sounds.stopMusic();
  if (escaped) sounds.escapeFanfare();
  else sounds.caughtFanfare();
}

function showMessage(text, seconds) {
  game.message = text;
  game.messageTime = seconds;
}

// World events feed back into the score and the sounds here, in one place.
world.onCornEaten = () => {
  game.score += SCORE.corn;
  sounds.chirp();
};
world.onFeatherEaten = () => {
  game.score += SCORE.feather;
  sounds.chirp();
  sounds.gobble();
};
world.onNearMiss = () => {
  game.score += SCORE.nearMiss;
};
world.onKnifeHit = (knife) => {
  if (turkey.takeHit(knife.x, knife.y)) {
    world.burst(turkey.x, turkey.y, '#fff2b0', 16, 220);
    sounds.thud();
    if (turkey.lives <= 0) endRun(false);
  }
};
world.onOvenBurn = () => {
  if (turkey.takeHit(turkey.x, turkey.y - 40)) {
    world.burst(turkey.x, turkey.y, '#ff7a1e', 16, 200);
    showMessage('TOO HOT! THE OVEN BURNS!', 1.6);
    if (turkey.lives <= 0) endRun(false);
  }
};

function updatePlaying(dt) {
  const hay = turkey.update(dt, input, world);
  const thrown = farmer.update(dt, turkey, world, game.stageIndex);
  if (thrown) {
    world.addThrownKnife(thrown);
    sounds.knifeWhizz();
  }
  world.update(dt, turkey, game.stage, sounds);

  // Distance is the run's own odometer: one metre per 50 pixels run.
  game.distance = turkey.distanceRun / 50;
  game.score += 0; // Score changes only on events, never by idling.
  const { stage, index } = stageForDistance(game.distance);
  if (index !== game.stageIndex) {
    game.stageIndex = index;
    game.stage = stage;
    game.stageFlash = 2.4;
    game.stageFlashText = `— ${stage.name} —`;
    showMessage(stage.id === 'kitchen' ? 'THE KITCHEN! MIND THE OVEN!' : 'THE BARN! THE FARMER IS FASTER!', 2.2);
    sounds.spottedSting();
  }

  if (farmer.catches(turkey) && turkey.invulnerable <= 0) {
    if (turkey.takeHit(farmer.x, farmer.y)) {
      world.burst(turkey.x, turkey.y, '#fff2b0', 18, 240);
      sounds.thud();
      sounds.gobble();
      farmer.state = 'patrol';
      farmer.x = ARENA.width - 140;
      farmer.y = 120;
      if (turkey.lives <= 0) endRun(false);
    }
  }

  if (world.turkeyAtGate(turkey)) endRun(true);
  if (game.messageTime > 0) game.messageTime -= dt;
  if (game.stageFlash > 0) game.stageFlash -= dt;
}

// ---- screens ---------------------------------------------------------------

function buttonRect(label) {
  // Buttons are centred; the label picks the width.
  const width = label.length * 13 + 44;
  return { x: ARENA.width / 2 - width / 2, y: 452, width, height: 52 };
}

function drawButton(rect, label, hovered) {
  ctx.save();
  ctx.fillStyle = hovered ? '#e8a13a' : '#c96a1e';
  ctx.strokeStyle = '#fff2b0';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(rect.x, rect.y, rect.width, rect.height, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#2b1a10';
  ctx.font = 'bold 22px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, rect.x + rect.width / 2, rect.y + 35);
  ctx.restore();
}

function clickInside(rect) {
  return input.mouseX >= rect.x && input.mouseX <= rect.x + rect.width
    && input.mouseY >= rect.y && input.mouseY <= rect.y + rect.height;
}

function drawTitle() {
  ctx.save();
  // A soft dusk sky over the farmyard, drawn behind the title text.
  const sky = ctx.createLinearGradient(0, 0, 0, ARENA.height);
  sky.addColorStop(0, '#e08a2e');
  sky.addColorStop(0.55, '#c96a1e');
  sky.addColorStop(1, '#7a4a21');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, ARENA.width, ARENA.height);
  // A low sun and a few drifting leaves set the Thanksgiving mood.
  ctx.fillStyle = '#ffd24a';
  ctx.beginPath();
  ctx.arc(800, 110, 42, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 210, 122, 0.35)';
  ctx.beginPath();
  ctx.arc(800, 110, 62, 0, Math.PI * 2);
  ctx.fill();
  drawBackdrop(ctx, game.stage, game.time);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff2b0';
  ctx.font = 'bold 64px Georgia, serif';
  ctx.strokeStyle = '#5a3416';
  ctx.lineWidth = 8;
  ctx.strokeText('TURKEY RUN', ARENA.width / 2, 168);
  ctx.fillText('TURKEY RUN', ARENA.width / 2, 168);
  ctx.font = 'italic 26px Georgia, serif';
  ctx.fillStyle = '#ffe9b0';
  ctx.fillText('The Great Thanksgiving Escape', ARENA.width / 2, 208);

  ctx.font = '18px Georgia, serif';
  ctx.fillStyle = '#fff';
  ctx.fillText('Thanksgiving is coming — and you are the main course.', ARENA.width / 2, 268);
  ctx.fillText('Outrun the farmer, dodge the oven and the carving knife,', ARENA.width / 2, 296);
  ctx.fillText('and reach the forest gate. Corn is points. Hay is hiding.', ARENA.width / 2, 324);

  ctx.font = '16px Georgia, serif';
  ctx.fillStyle = '#ffd27a';
  ctx.fillText('WASD / arrows — run      Space / click — dash      H — hide in hay', ARENA.width / 2, 372);
  ctx.fillText('P — pause      M — mute      R — restart', ARENA.width / 2, 398);
  if (game.bestScore > 0) {
    ctx.fillStyle = '#fff2b0';
    ctx.fillText(`Best score so far: ${game.bestScore}`, ARENA.width / 2, 428);
  }

  const rect = buttonRect('START THE RUN');
  drawButton(rect, 'START THE RUN', input.mouseInside && clickInside(rect));
  ctx.restore();
}

function drawEndScreen(escaped) {
  ctx.save();
  ctx.fillStyle = escaped ? 'rgba(46, 125, 50, 0.82)' : 'rgba(90, 20, 10, 0.85)';
  ctx.fillRect(0, 0, ARENA.width, ARENA.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff2b0';
  ctx.font = 'bold 58px Georgia, serif';
  ctx.strokeStyle = '#2b1a10';
  ctx.lineWidth = 7;
  const title = escaped ? 'ESCAPED!' : 'CAUGHT!';
  ctx.strokeText(title, ARENA.width / 2, 190);
  ctx.fillText(title, ARENA.width / 2, 190);
  ctx.font = '20px Georgia, serif';
  ctx.fillStyle = '#fff';
  if (escaped) {
    ctx.fillText('You slipped past the farmer, the oven and every knife —', ARENA.width / 2, 244);
    ctx.fillText('and waddled free into the forest. Happy Thanksgiving, turkey!', ARENA.width / 2, 272);
  } else {
    ctx.fillText('The farmer got you… this time. The oven was already warm.', ARENA.width / 2, 244);
    ctx.fillText('Shake your feathers and run it back — dinner is not destiny.', ARENA.width / 2, 272);
  }
  ctx.font = 'bold 26px Georgia, serif';
  ctx.fillStyle = '#ffd27a';
  ctx.fillText(`Score ${game.score}   •   Distance ${Math.floor(game.distance)} m   •   Best ${game.bestScore}`, ARENA.width / 2, 336);
  ctx.font = '17px Georgia, serif';
  ctx.fillStyle = '#fff';
  ctx.fillText(`You reached the ${game.stage.name} — ${Math.floor(game.distance)} of ${ESCAPE_DISTANCE} metres to the gate.`, ARENA.width / 2, 372);

  const rect = buttonRect('RUN AGAIN');
  drawButton(rect, 'RUN AGAIN', input.mouseInside && clickInside(rect));
  ctx.restore();
}

function drawPaused() {
  ctx.save();
  ctx.fillStyle = 'rgba(43, 26, 16, 0.72)';
  ctx.fillRect(0, 0, ARENA.width, ARENA.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff2b0';
  ctx.font = 'bold 46px Georgia, serif';
  ctx.fillText('PAUSED', ARENA.width / 2, 280);
  ctx.font = '18px Georgia, serif';
  ctx.fillStyle = '#fff';
  ctx.fillText('Press P or click to keep running.', ARENA.width / 2, 320);
  ctx.restore();
}

// ---- the loop ---------------------------------------------------------------

let lastTime = performance.now();

function frame(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  game.time += dt;

  const click = input.consumeClick();
  if (input.wasPressed('m')) {
    game.muted = !game.muted;
    sounds.setMuted(game.muted);
  }

  if (game.state === GAME_STATE.TITLE) {
    const rect = buttonRect('START THE RUN');
    if ((click && clickInside(rect)) || input.wasPressed('enter') || input.wasPressed(' ')) {
      sounds.ensureContext();
      startRun();
    }
    drawTitle();
  } else if (game.state === GAME_STATE.PLAYING) {
    if (input.wasPressed('p')) {
      game.state = GAME_STATE.PAUSED;
    } else if (!game.posed) {
      // Posed screenshot scenes freeze the simulation but keep drawing,
      // so the frame the maker captures is the frame the game drew.
      updatePlaying(dt);
    }
    drawBackdrop(ctx, game.stage, game.time);
    drawWorld(ctx, world, game.stage, game.time);
    farmer.draw(ctx);
    turkey.draw(ctx);
    drawHud(ctx, game);
    if (game.stageFlash > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, game.stageFlash);
      ctx.font = 'bold 40px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff2b0';
      ctx.strokeStyle = '#5a3416';
      ctx.lineWidth = 6;
      ctx.strokeText(game.stageFlashText, ARENA.width / 2, 300);
      ctx.fillText(game.stageFlashText, ARENA.width / 2, 300);
      ctx.restore();
    }
    if (game.messageTime > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, game.messageTime);
      ctx.font = 'bold 20px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#5a3416';
      ctx.lineWidth = 5;
      ctx.strokeText(game.message, ARENA.width / 2, 540);
      ctx.fillText(game.message, ARENA.width / 2, 540);
      ctx.restore();
    }
  } else if (game.state === GAME_STATE.PAUSED) {
    if (input.wasPressed('p') || click) game.state = GAME_STATE.PLAYING;
    drawBackdrop(ctx, game.stage, game.time);
    drawWorld(ctx, world, game.stage, game.time);
    farmer.draw(ctx);
    turkey.draw(ctx);
    drawHud(ctx, game);
    drawPaused();
  } else {
    // Caught or escaped: the field freezes behind the end screen.
    drawBackdrop(ctx, game.stage, game.time);
    drawWorld(ctx, world, game.stage, game.time);
    farmer.draw(ctx);
    turkey.draw(ctx);
    drawHud(ctx, game);
    drawEndScreen(game.state === GAME_STATE.ESCAPED);
    const rect = buttonRect('RUN AGAIN');
    if ((click && clickInside(rect)) || input.wasPressed('r') || input.wasPressed('enter')) {
      startRun();
    }
  }

  input.endFrame();
  requestAnimationFrame(frame);
}

// A screenshot hook (?shot=title|play|kitchen|end) stages a real scene of
// this game for the maker's screenshots, then the game plays on normally.
stageShotScene(game, startRun, endRun);
requestAnimationFrame(frame);
