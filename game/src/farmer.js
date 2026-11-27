// Turkey Run — Farmer: the hunter. A small state machine — patrol, chase,
// search, corner — so the farmer feels like he is thinking, not just
// sliding toward the player at a fixed speed.

import { ARENA, FARMER, clamp, distanceBetween, angleTo, randomInRange } from './config.js';

export const FARMER_STATE = {
  PATROL: 'patrol',
  CHASE: 'chase',
  SEARCH: 'search',
};

export class Farmer {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = ARENA.width - 140;
    this.y = 120;
    this.state = FARMER_STATE.PATROL;
    this.speed = FARMER.patrolSpeed;
    this.facing = Math.PI;
    this.patrolIndex = 0;
    this.patrolPoints = [
      { x: 820, y: 120 },
      { x: 820, y: 480 },
      { x: 480, y: 480 },
      { x: 480, y: 120 },
    ];
    this.searchTimeLeft = 0;
    this.lastSeenX = 0;
    this.lastSeenY = 0;
    this.throwCooldownLeft = 1.5;
    this.cornered = false;
    this.walkPhase = 0;
    this.spottedFlash = 0;
  }

  canSeeTurkey(turkey, world) {
    if (turkey.hidden) return false;
    const dist = distanceBetween(this.x, this.y, turkey.x, turkey.y);
    if (dist > FARMER.sightRange) return false;
    // Haystacks block the farmer's line of sight, so the turkey can break
    // a chase by ducking behind one.
    return !world.blocksSight(this.x, this.y, turkey.x, turkey.y);
  }

  update(dt, turkey, world, stageIndex) {
    const dist = distanceBetween(this.x, this.y, turkey.x, turkey.y);
    const seesTurkey = this.canSeeTurkey(turkey, world);
    if (this.spottedFlash > 0) this.spottedFlash -= dt;
    if (this.throwCooldownLeft > 0) this.throwCooldownLeft -= dt;

    // Cornering: when the turkey is pressed against a wall or an oven,
    // the farmer smells dinner and runs faster.
    const nearEdge = turkey.x < 90 || turkey.x > ARENA.width - 90 || turkey.y < 130 || turkey.y > ARENA.height - 90;
    const nearOven = world.ovenNear(turkey.x, turkey.y, 60);
    this.cornered = (nearEdge || nearOven) && dist < 240;

    if (seesTurkey) {
      if (this.state !== FARMER_STATE.CHASE) {
        this.state = FARMER_STATE.CHASE;
        this.spottedFlash = 0.8;
      }
      this.lastSeenX = turkey.x;
      this.lastSeenY = turkey.y;
    } else if (this.state === FARMER_STATE.CHASE) {
      this.state = FARMER_STATE.SEARCH;
      this.searchTimeLeft = FARMER.searchTime;
    } else if (this.state === FARMER_STATE.SEARCH) {
      this.searchTimeLeft -= dt;
      if (this.searchTimeLeft <= 0) this.state = FARMER_STATE.PATROL;
    }

    let targetX = this.x;
    let targetY = this.y;
    let speed = FARMER.patrolSpeed + stageIndex * 7;
    if (this.state === FARMER_STATE.PATROL) {
      const point = this.patrolPoints[this.patrolIndex];
      targetX = point.x;
      targetY = point.y;
      if (distanceBetween(this.x, this.y, point.x, point.y) < 24) {
        this.patrolIndex = (this.patrolIndex + 1) % this.patrolPoints.length;
      }
    } else if (this.state === FARMER_STATE.CHASE) {
      targetX = turkey.x;
      targetY = turkey.y;
      speed = FARMER.chaseSpeed + stageIndex * 7;
      if (this.cornered) speed += FARMER.cornerBoost;
    } else {
      // Searching: walk to where the turkey was last seen, then sniff
      // around it in a widening circle.
      const arrived = distanceBetween(this.x, this.y, this.lastSeenX, this.lastSeenY) < 30;
      if (arrived) {
        const wander = this.searchTimeLeft * 1.6;
        targetX = this.lastSeenX + Math.cos(wander) * 70;
        targetY = this.lastSeenY + Math.sin(wander * 1.3) * 55;
      } else {
        targetX = this.lastSeenX;
        targetY = this.lastSeenY;
      }
      speed = FARMER.patrolSpeed + 26;
    }

    const angle = angleTo(this.x, this.y, targetX, targetY);
    const step = speed * dt;
    if (distanceBetween(this.x, this.y, targetX, targetY) > 4) {
      this.x = clamp(this.x + Math.cos(angle) * step, FARMER.radius, ARENA.width - FARMER.radius);
      this.y = clamp(this.y + Math.sin(angle) * step, FARMER.radius + 46, ARENA.height - FARMER.radius);
      this.facing = angle;
      this.walkPhase += dt * 9;
    }

    // The farmer throws a carving knife when he has a clear chase and the
    // turkey is far enough to be worth throwing at. He never throws while
    // searching — he needs to see dinner first.
    let threwKnife = null;
    if (this.state === FARMER_STATE.CHASE && dist > 130 && this.throwCooldownLeft <= 0) {
      this.throwCooldownLeft = FARMER.throwCooldown;
      threwKnife = { x: this.x, y: this.y, angle: angleTo(this.x, this.y, turkey.x, turkey.y), speed: FARMER.throwSpeed };
    }
    return threwKnife;
  }

  catches(turkey) {
    return distanceBetween(this.x, this.y, turkey.x, turkey.y) < FARMER.catchRadius + 8;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    const bob = Math.sin(this.walkPhase) * 2;
    ctx.translate(0, bob);
    ctx.rotate(this.facing + Math.PI / 2);

    // Overalls and a red checked shirt.
    ctx.fillStyle = '#3a5a8c';
    ctx.beginPath();
    ctx.ellipse(0, 2, 17, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#b03a2e';
    ctx.beginPath();
    ctx.ellipse(0, -6, 15, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e8d8b0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-12, -10);
    ctx.lineTo(12, -2);
    ctx.moveTo(12, -10);
    ctx.lineTo(-12, -2);
    ctx.stroke();

    // Head with a straw hat and a moustache.
    ctx.fillStyle = '#e8b98a';
    ctx.beginPath();
    ctx.arc(0, -22, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d9a441';
    ctx.beginPath();
    ctx.ellipse(0, -28, 15, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, -30, 8, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5a3a1a';
    ctx.beginPath();
    ctx.ellipse(0, -17, 5, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(-4, -24, 1.4, 0, Math.PI * 2);
    ctx.arc(4, -24, 1.4, 0, Math.PI * 2);
    ctx.fill();

    // Arms reaching forward, ready to grab.
    const reach = this.state === FARMER_STATE.CHASE ? 6 : 0;
    ctx.fillStyle = '#b03a2e';
    ctx.beginPath();
    ctx.ellipse(-14, -12 - reach, 5, 9, 0.5, 0, Math.PI * 2);
    ctx.ellipse(14, -12 - reach, 5, 9, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // "!" alert bubble while the farmer has just spotted the turkey.
    if (this.spottedFlash > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, this.spottedFlash * 2);
      ctx.font = 'bold 26px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#c0392b';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 4;
      ctx.strokeText('!', this.x, this.y - 46);
      ctx.fillText('!', this.x, this.y - 46);
      ctx.restore();
    }
  }
}
