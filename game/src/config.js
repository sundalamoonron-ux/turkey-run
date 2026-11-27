// Turkey Run — tuning constants and stage definitions.
// One clear job: every number the game balances on lives here, so a reader
// can retune the whole game without touching the logic files.

export const ARENA = { width: 960, height: 600 };

export const TURKEY = {
  radius: 16,
  runSpeed: 215,
  dashSpeed: 560,
  dashTime: 0.18,
  dashCooldown: 1.15,
  startLives: 3,
  invulnerableTime: 2.0,
  hideRadius: 34,
};

export const FARMER = {
  radius: 22,
  patrolSpeed: 118,
  chaseSpeed: 178,
  cornerBoost: 26,
  sightRange: 265,
  catchRadius: 30,
  searchTime: 4.5,
  throwCooldown: 2.6,
  throwSpeed: 390,
};

export const KNIFE = {
  radius: 9,
  fallSpeed: 330,
  fallInterval: 2.2,
  thrownLifetime: 2.4,
};

export const OVEN = {
  burnGrace: 0.55,
};

// Distance (metres) at which the run moves to the next stage, and the
// distance that opens the escape gate at the east fence.
export const STAGES = [
  {
    id: 'farmyard',
    name: 'FARMYARD',
    until: 400,
    farmerSpeed: 0,
    knifeRain: false,
    ovenCount: 0,
    cornTarget: 6,
    palette: { grass: '#7fae4e', grassDark: '#6d9c42', dirt: '#b98d54', fence: '#8a5a28' },
  },
  {
    id: 'barn',
    name: 'BARN',
    until: 900,
    farmerSpeed: 14,
    knifeRain: false,
    ovenCount: 1,
    cornTarget: 5,
    palette: { grass: '#a8874f', grassDark: '#96783f', dirt: '#8d6a3c', fence: '#6e4520' },
  },
  {
    id: 'kitchen',
    name: 'KITCHEN',
    until: 1200,
    farmerSpeed: 30,
    knifeRain: true,
    ovenCount: 2,
    cornTarget: 5,
    palette: { grass: '#c9b18a', grassDark: '#b39a72', dirt: '#9c7c50', fence: '#7a5a34' },
  },
];

export const ESCAPE_DISTANCE = 1200;
export const SCORE = { corn: 10, feather: 50, metre: 1, nearMiss: 5, escape: 250 };

export function stageForDistance(distance) {
  for (let i = 0; i < STAGES.length; i++) {
    if (distance < STAGES[i].until) return { stage: STAGES[i], index: i };
  }
  return { stage: STAGES[STAGES.length - 1], index: STAGES.length - 1 };
}

export function randomInRange(min, max) {
  return min + Math.random() * (max - min);
}

export function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}

export function distanceBetween(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}

export function angleTo(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}
