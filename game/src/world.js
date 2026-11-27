// Turkey Run — World: the place the chase happens in. Stage layouts,
// ovens, carving knives (thrown and falling), corn, golden feathers,
// haystacks, the escape gate, and the little particles that sell a hit.

import { ARENA, STAGES, KNIFE, OVEN, stageForDistance, clamp, distanceBetween, randomInRange } from './config.js';

export class World {
  constructor() {
    this.reset(0);
  }

  reset(distance) {
    this.distance = distance;
    this.corn = [];
    this.knives = [];
    this.fallingKnives = [];
    this.feathers = [];
    this.particles = [];
    this.popups = [];
    this.fallTimer = 1.5;
    this.featherTimer = 9;
    this.gateOpen = false;
    this.stageIndex = 0;
    this.ovenExposure = 0;
    this.layoutForStage(0);
    this.spawnCorn(STAGES[0].cornTarget);
  }

  layoutForStage(index) {
    // Haystacks move with the stage, so hiding spots never sit in the
    // same place twice in a run.
    const spots = [
      [{ x: 130, y: 170 }, { x: 830, y: 430 }, { x: 430, y: 120 }],
      [{ x: 850, y: 160 }, { x: 120, y: 450 }, { x: 500, y: 500 }],
      [{ x: 140, y: 480 }, { x: 820, y: 180 }, { x: 480, y: 300 }],
    ];
    this.haystacks = spots[index % spots.length].map((spot) => ({ ...spot, radius: 36 }));
    // Ovens: one in the barn, two in the kitchen, always against a wall.
    this.ovens = [];
    if (index >= 1) this.ovens.push({ x: 60, y: 300, width: 46, height: 96 });
    if (index >= 2) this.ovens.push({ x: ARENA.width - 106, y: 300, width: 46, height: 96 });
    this.gate = { x: ARENA.width - 26, y: ARENA.height / 2, width: 22, height: 110 };
  }

  spawnCorn(count) {
    for (let i = 0; i < count; i++) {
      this.corn.push(this.freeSpot(60, ARENA.width - 60, 110, ARENA.height - 60));
    }
  }

  freeSpot(minX, maxX, minY, maxY) {
    for (let tries = 0; tries < 20; tries++) {
      const x = randomInRange(minX, maxX);
      const y = randomInRange(minY, maxY);
      const insideOven = this.ovens.some((o) => x > o.x - 20 && x < o.x + o.width + 20 && y > o.y - 20 && y < o.y + o.height + 20);
      const insideHay = this.haystacks.some((h) => distanceBetween(x, y, h.x, h.y) < h.radius + 14);
      if (!insideOven && !insideHay) return { x, y, bob: Math.random() * Math.PI * 2 };
    }
    return { x: (minX + maxX) / 2, y: (minY + maxY) / 2, bob: 0 };
  }

  haystackAt(x, y) {
    return this.haystacks.find((h) => distanceBetween(x, y, h.x, h.y) < h.radius) ?? null;
  }

  blocksSight(x1, y1, x2, y2) {
    // A haystack between the farmer and the turkey blocks the sight line.
    return this.haystacks.some((h) => {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const lengthSquared = dx * dx + dy * dy;
      if (lengthSquared === 0) return false;
      let t = ((h.x - x1) * dx + (h.y - y1) * dy) / lengthSquared;
      t = clamp(t, 0, 1);
      const closestX = x1 + t * dx;
      const closestY = y1 + t * dy;
      return distanceBetween(closestX, closestY, h.x, h.y) < h.radius * 0.8;
    });
  }

  ovenNear(x, y, margin) {
    return this.ovens.some((o) => x > o.x - margin && x < o.x + o.width + margin && y > o.y - margin && y < o.y + o.height + margin);
  }

  turkeyInOven(turkey) {
    return this.ovens.some((o) => turkey.x > o.x && turkey.x < o.x + o.width && turkey.y > o.y && turkey.y < o.y + o.height);
  }

  addThrownKnife(throwData) {
    this.knives.push({
      x: throwData.x,
      y: throwData.y,
      vx: Math.cos(throwData.angle) * throwData.speed,
      vy: Math.sin(throwData.angle) * throwData.speed,
      angle: throwData.angle,
      life: 2.4,
      spin: 0,
      nearMissed: false,
    });
  }

  burst(x, y, color, count, speed = 160) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const power = randomInRange(speed * 0.3, speed);
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * power,
        vy: Math.sin(angle) * power,
        life: randomInRange(0.35, 0.8),
        maxLife: 0.8,
        color,
        size: randomInRange(2, 5),
      });
    }
  }

  popup(x, y, text, color = '#fff') {
    this.popups.push({ x, y, text, color, life: 1.1 });
  }

  update(dt, turkey, stage, sounds) {
    this.distance = turkey.distanceRun / 50;
    const { index } = stageForDistance(this.distance);
    if (index !== this.stageIndex) {
      this.stageIndex = index;
      this.layoutForStage(index);
      this.spawnCorn(STAGES[index].cornTarget);
    }
    this.gateOpen = this.distance >= 1200;

    // Corn bobbing and pickup.
    for (const cob of this.corn) cob.bob += dt * 3;
    for (let i = this.corn.length - 1; i >= 0; i--) {
      const cob = this.corn[i];
      if (distanceBetween(cob.x, cob.y, turkey.x, turkey.y) < 30) {
        this.corn.splice(i, 1);
        this.burst(cob.x, cob.y, '#ffd24a', 8, 120);
        this.popup(cob.x, cob.y - 14, '+10', '#ffd24a');
        this.onCornEaten?.(cob);
      }
    }
    if (this.corn.length < 3) this.spawnCorn(2);

    // Golden feather: rare, worth fifty, drifts across the yard.
    this.featherTimer -= dt;
    if (this.featherTimer <= 0) {
      this.featherTimer = randomInRange(11, 16);
      const spot = this.freeSpot(80, ARENA.width - 80, 120, ARENA.height - 80);
      this.feathers.push({ ...spot, life: 8 });
    }
    for (let i = this.feathers.length - 1; i >= 0; i--) {
      const feather = this.feathers[i];
      feather.life -= dt;
      feather.y += Math.sin(feather.life * 3) * 12 * dt;
      if (feather.life <= 0) this.feathers.splice(i, 1);
      else if (distanceBetween(feather.x, feather.y, turkey.x, turkey.y) < 30) {
        this.feathers.splice(i, 1);
        this.burst(feather.x, feather.y, '#fff2b0', 14, 180);
        this.popup(feather.x, feather.y - 14, '+50 GOLDEN FEATHER!', '#fff2b0');
        this.onFeatherEaten?.(feather);
      }
    }

    // Thrown knives fly straight, spin, and vanish at the fence.
    for (let i = this.knives.length - 1; i >= 0; i--) {
      const knife = this.knives[i];
      knife.x += knife.vx * dt;
      knife.y += knife.vy * dt;
      knife.angle += dt * 14;
      knife.spin += dt;
      knife.life -= dt;
      const dist = distanceBetween(knife.x, knife.y, turkey.x, turkey.y);
      if (!knife.nearMissed && dist < 46 && dist > KNIFE.radius + 16) {
        knife.nearMissed = true;
        this.popup(turkey.x, turkey.y - 26, 'CLOSE! +5', '#9fd8ff');
        this.onNearMiss?.();
      }
      if (dist < KNIFE.radius + 14 && turkey.invulnerable <= 0) {
        this.knives.splice(i, 1);
        this.onKnifeHit?.(knife);
        continue;
      }
      if (knife.life <= 0 || knife.x < 0 || knife.x > ARENA.width || knife.y < 46 || knife.y > ARENA.height) {
        this.knives.splice(i, 1);
      }
    }

    // Kitchen stage: knives rain from above, telegraphed by a shadow.
    if (stage.knifeRain) {
      this.fallTimer -= dt;
      if (this.fallTimer <= 0) {
        this.fallTimer = randomInRange(KNIFE.fallInterval * 0.7, KNIFE.fallInterval * 1.3);
        this.fallingKnives.push({
          x: randomInRange(50, ARENA.width - 50),
          y: -30,
          warn: 0.55,
          life: 3,
        });
      }
    }
    for (let i = this.fallingKnives.length - 1; i >= 0; i--) {
      const knife = this.fallingKnives[i];
      if (knife.warn > 0) {
        knife.warn -= dt;
        continue;
      }
      knife.y += KNIFE.fallSpeed * dt;
      knife.life -= dt;
      if (distanceBetween(knife.x, knife.y, turkey.x, turkey.y) < KNIFE.radius + 14 && turkey.invulnerable <= 0) {
        this.fallingKnives.splice(i, 1);
        this.onKnifeHit?.(knife);
        continue;
      }
      if (knife.y > ARENA.height + 20 || knife.life <= 0) this.fallingKnives.splice(i, 1);
    }

    // The oven burns: standing in it for a moment costs a life.
    if (this.turkeyInOven(turkey)) {
      this.ovenExposure = (this.ovenExposure || 0) + dt;
      if (this.ovenExposure > OVEN.burnGrace && turkey.invulnerable <= 0) {
        this.ovenExposure = 0;
        this.onOvenBurn?.();
        sounds.sizzle();
      }
    } else {
      this.ovenExposure = 0;
    }

    // Particles and popups age out.
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.94;
      p.vy *= 0.94;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
    for (let i = this.popups.length - 1; i >= 0; i--) {
      const popup = this.popups[i];
      popup.y -= 26 * dt;
      popup.life -= dt;
      if (popup.life <= 0) this.popups.splice(i, 1);
    }
  }

  turkeyAtGate(turkey) {
    if (!this.gateOpen) return false;
    return turkey.x > this.gate.x - 10 && Math.abs(turkey.y - this.gate.y) < this.gate.height / 2;
  }
}
