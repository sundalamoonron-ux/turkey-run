// Turkey Run — Shots: deterministic staging for the maker's screenshots.
// ?shot=title | play | kitchen | end poses a real scene of this game —
// the same draw code the player sees, frozen mid-action so the frame is
// stable — and then the game plays on normally when the player takes over.

import { STAGES, stageForDistance } from './config.js';

function forceStage(game, index) {
  const { stage } = stageForDistance(STAGES[index].until - 1);
  game.stageIndex = index;
  game.stage = stage;
  game.world.stageIndex = index;
  game.world.layoutForStage(index);
  game.world.spawnCorn(STAGES[index].cornTarget);
}

export function stageShotScene(game, startRun, endRun) {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  if (!shot) return;

  if (shot === 'title') {
    // The title screen is the game's default state: nothing to stage.
    document.title = 'Turkey Run — title';
    return;
  }

  if (shot === 'play') {
    startRun();
    // A chase in full flight: the turkey mid-dash with the farmer on its
    // tail, corn ahead, a thrown knife in the air, HUD full of numbers.
    game.turkey.x = 360;
    game.turkey.y = 330;
    game.turkey.facing = -0.4;
    game.turkey.dashTimeLeft = 0.12;
    game.farmer.x = 600;
    game.farmer.y = 210;
    game.farmer.state = 'chase';
    game.farmer.lastSeenX = game.turkey.x;
    game.farmer.lastSeenY = game.turkey.y;
    game.farmer.spottedFlash = 0.8;
    game.score = 120;
    game.turkey.distanceRun = 342 * 50;
    game.distance = 342;
    game.world.addThrownKnife({ x: 520, y: 260, angle: Math.PI * 0.85, speed: 390 });
    game.world.corn.push({ x: 300, y: 430, bob: 0 });
    game.world.corn.push({ x: 480, y: 420, bob: 1 });
    game.world.feathers.push({ x: 700, y: 420, life: 8 });
    game.posed = true;
    document.title = 'Turkey Run — gameplay';
    return;
  }

  if (shot === 'kitchen') {
    startRun();
    // Deep in the run: the kitchen stage, ovens glowing, a knife raining
    // down, the gate almost in reach.
    forceStage(game, 2);
    game.turkey.x = 430;
    game.turkey.y = 350;
    game.turkey.facing = 0.3;
    game.turkey.lives = 2;
    game.farmer.x = 640;
    game.farmer.y = 220;
    game.farmer.state = 'chase';
    game.farmer.lastSeenX = game.turkey.x;
    game.farmer.lastSeenY = game.turkey.y;
    game.score = 410;
    game.turkey.distanceRun = 985 * 50;
    game.distance = 985;
    game.world.fallingKnives.push({ x: 520, y: 120, warn: 0, life: 3 });
    game.world.addThrownKnife({ x: 580, y: 280, angle: Math.PI * 0.9, speed: 390 });
    game.posed = true;
    document.title = 'Turkey Run — kitchen';
    return;
  }

  if (shot === 'end') {
    startRun();
    // A run that ended in the barn: caught, one life gone, score on the
    // board, the end screen over the frozen field.
    forceStage(game, 1);
    game.turkey.x = 430;
    game.turkey.y = 330;
    game.turkey.lives = 0;
    game.farmer.x = 470;
    game.farmer.y = 330;
    game.score = 480;
    game.turkey.distanceRun = 812 * 50;
    game.distance = 812;
    game.posed = true;
    endRun(false);
    document.title = 'Turkey Run — caught';
  }
}
