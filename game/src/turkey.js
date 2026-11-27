// Turkey Run — Turkey: the player. Movement, dashing, hiding in hay,
// taking hits, and the turkey's own vector-art drawing.

import { ARENA, TURKEY, clamp, distanceBetween } from './config.js';

export class Turkey {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = 150;
    this.y = ARENA.height - 120;
    this.vx = 0;
    this.vy = 0;
    this.facing = 0;
    this.moving = false;
    this.lives = TURKEY.startLives;
    this.invulnerable = 0;
    this.dashTimeLeft = 0;
    this.dashCooldownLeft = 0;
    this.hidden = false;
    this.hideTime = 0;
    this.waddlePhase = 0;
    this.distanceRun = 0;
  }

  update(dt, input, world) {
    const move = input.moveVector();
    this.moving = move.x !== 0 || move.y !== 0;
    if (this.moving) this.facing = Math.atan2(move.y, move.x);

    // Dashing: a short burst in the direction of movement, or toward the
    // mouse when the player clicks instead of steering with keys.
    if (this.dashCooldownLeft > 0) this.dashCooldownLeft -= dt;
    if (this.dashTimeLeft > 0) this.dashTimeLeft -= dt;
    if (input.dashRequested() && this.dashCooldownLeft <= 0 && this.dashTimeLeft <= 0) {
      this.startDash(move, input);
    }
    const speed = this.dashTimeLeft > 0 ? TURKEY.dashSpeed : TURKEY.runSpeed;
    this.vx = move.x * speed;
    this.vy = move.y * speed;
    const nextX = clamp(this.x + this.vx * dt, TURKEY.radius, ARENA.width - TURKEY.radius);
    const nextY = clamp(this.y + this.vy * dt, TURKEY.radius + 46, ARENA.height - TURKEY.radius);
    const moved = distanceBetween(this.x, this.y, nextX, nextY);
    this.distanceRun += moved;
    this.x = nextX;
    this.y = nextY;
    if (this.moving) this.waddlePhase += dt * 11;

    if (this.invulnerable > 0) this.invulnerable -= dt;

    // Hiding: stand still inside a haystack and hold H. Moving, or the
    // farmer bumping the hay, breaks the cover. A hidden turkey still
    // counts its distance as zero — you cannot win by camping.
    const hay = world.haystackAt(this.x, this.y);
    const wantsHide = input.hideHeld() && hay !== null && !this.moving;
    if (wantsHide && !this.hidden) this.hideTime = 0;
    this.hidden = wantsHide;
    if (this.hidden) this.hideTime += dt;

    return hay;
  }

  startDash(move, input) {
    this.dashTimeLeft = TURKEY.dashTime;
    this.dashCooldownLeft = TURKEY.dashCooldown;
    if (move.x === 0 && move.y === 0) {
      // No keys held: dash toward the mouse cursor instead.
      const dx = input.mouseX - this.x;
      const dy = input.mouseY - this.y;
      const length = Math.hypot(dx, dy) || 1;
      this.vx = (dx / length) * TURKEY.dashSpeed;
      this.vy = (dy / length) * TURKEY.dashSpeed;
      this.facing = Math.atan2(dy, dx);
    }
  }

  // A hit costs a life and throws the turkey away from the danger, with a
  // short grace period so one mistake is never two hits at once.
  takeHit(fromX, fromY) {
    if (this.invulnerable > 0) return false;
    this.lives -= 1;
    this.invulnerable = TURKEY.invulnerableTime;
    const angle = Math.atan2(this.y - fromY, this.x - fromX);
    this.x = clamp(this.x + Math.cos(angle) * 70, TURKEY.radius, ARENA.width - TURKEY.radius);
    this.y = clamp(this.y + Math.sin(angle) * 70, TURKEY.radius + 46, ARENA.height - TURKEY.radius);
    return true;
  }

  get dashReady() {
    return this.dashCooldownLeft <= 0;
  }

  get dashFraction() {
    return 1 - clamp(this.dashCooldownLeft / TURKEY.dashCooldown, 0, 1);
  }

  draw(ctx) {
    if (this.invulnerable > 0 && Math.floor(this.invulnerable * 12) % 2 === 0) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.hidden) ctx.globalAlpha = 0.45;
    const bob = this.moving ? Math.sin(this.waddlePhase) * 2 : Math.sin(performance.now() / 500) * 1;
    ctx.translate(0, bob);
    ctx.rotate(this.facing + Math.PI / 2);

    // Tail fan: five autumn feathers fanning behind the body.
    const featherColors = ['#c96a1e', '#e08a2e', '#8a4a12', '#d9a441', '#b4551d'];
    for (let i = -2; i <= 2; i++) {
      ctx.save();
      ctx.rotate((i * Math.PI) / 9);
      ctx.fillStyle = featherColors[i + 2];
      ctx.beginPath();
      ctx.ellipse(0, -24, 7, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f3d9a4';
      ctx.beginPath();
      ctx.ellipse(0, -30, 3, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Body: a plump brown oval with a lighter breast.
    ctx.fillStyle = '#7a4a21';
    ctx.beginPath();
    ctx.ellipse(0, 0, 15, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#a8763e';
    ctx.beginPath();
    ctx.ellipse(0, 5, 10, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head, beak and wattle at the front.
    ctx.fillStyle = '#8a5a2e';
    ctx.beginPath();
    ctx.arc(0, -20, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8a13a';
    ctx.beginPath();
    ctx.moveTo(-4, -24);
    ctx.lineTo(5, -20);
    ctx.lineTo(-4, -16);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.ellipse(2, -13, 2.5, 5, 0.2, 0, Math.PI * 2);
    ctx.fill();
    // Bright eyes, looking where the turkey runs.
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-3.5, -22, 2.2, 0, Math.PI * 2);
    ctx.arc(3.5, -22, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(-3.5, -22, 1.1, 0, Math.PI * 2);
    ctx.arc(3.5, -22, 1.1, 0, Math.PI * 2);
    ctx.fill();

    // Little orange feet, waddling in step.
    const step = this.moving ? Math.sin(this.waddlePhase) * 4 : 0;
    ctx.fillStyle = '#e08a2e';
    ctx.beginPath();
    ctx.ellipse(-6, 17 + step * 0.4, 4, 2.5, 0, 0, Math.PI * 2);
    ctx.ellipse(6, 17 - step * 0.4, 4, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
